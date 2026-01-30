export class ArduinoDriver {
    constructor() {
        this.port = null;
        this.writer = null;
        this.reader = null;
        this.connected = false;
        this.keepReading = false;
        this.readPromise = null;
        
        // Sensor values cache
        this.sensorData = {
            distance: 999,
            tilt: 0
        };
    }

    async connect() {
        if (!navigator.serial) {
            throw new Error("Web Serial API não suportada neste navegador.");
        }

        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 9600 });
            
            const textEncoder = new TextEncoderStream();
            const writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
            this.writer = textEncoder.writable.getWriter();

            this.keepReading = true;
            this.readPromise = this.readLoop();

            this.connected = true;
            console.log("Arduino conectado!");
            return true;
        } catch (error) {
            console.error("Erro ao conectar Arduino:", error);
            this.connected = false;
            return false;
        }
    }

    async readLoop() {
        while (this.port.readable && this.keepReading) {
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
            this.reader = textDecoder.readable.getReader();
            
            try {
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) {
                        // Reader has been canceled.
                        break;
                    }
                    if (value) {
                        this.handleSerialData(value);
                    }
                }
            } catch (error) {
                console.error("Erro na leitura serial:", error);
            } finally {
                this.reader.releaseLock();
            }
        }
    }

    handleSerialData(data) {
        // Simple line parser
        // Note: Real implementation needs buffering for partial lines
        const lines = data.split('\n');
        for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith("DIST:")) {
                this.sensorData.distance = parseInt(cleanLine.substring(5));
            } else if (cleanLine.startsWith("TILT:")) {
                this.sensorData.tilt = parseInt(cleanLine.substring(5));
            }
        }
    }

    async disconnect() {
        this.keepReading = false;
        if (this.reader) {
            await this.reader.cancel();
        }
        if (this.writer) {
            await this.writer.close();
            this.writer = null;
        }
        if (this.port) {
            await this.port.close();
            this.port = null;
        }
        this.connected = false;
    }

    isConnected() {
        return this.connected;
    }

    async sendCommand(command) {
        if (!this.connected || !this.writer) return;
        const data = command + '\n';
        await this.writer.write(data);
    }

    // --- Actions ---

    async motorOn(speed) {
        console.log(`Arduino: Motor ON ${speed}`);
        // Protocol: MOTOR:speed
        await this.sendCommand(`MOTOR:${parseInt(speed)}`);
    }

    async motorOff() {
        console.log("Arduino: Motor OFF");
        await this.sendCommand("MOTOR:0");
    }

    async getDistance() {
        // Request reading
        await this.sendCommand("READ:DIST");
        // Wait a bit for response (naive approach)
        await this.wait(50); 
        return this.sensorData.distance;
    }

    async getTilt() {
        await this.sendCommand("READ:TILT");
        await this.wait(50);
        return this.sensorData.tilt;
    }

    async wait(ms) {
        console.log(`Waiting ${ms}ms...`);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async stopAll() {
        await this.motorOff();
    }
}
