export class WeDoDriver {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.connected = false;
        
        // Constants
        // WeDo 2.0 Service UUIDs
        this.WEDO_SERVICE_UUID = "00001523-1212-efde-1523-785feabcd123"; 
        this.WEDO_IO_CHAR_UUID = "00001565-1212-efde-1523-785feabcd123"; // Input/Output
        
        // Powered Up / Boost Service UUIDs (Alternative)
        this.LPF2_SERVICE_UUID = "00001623-1212-efde-1523-785feabcd123";

        this.sensorData = {
            distance: 999,
            tilt: 0
        };
    }

    async connect() {
        if (!navigator.bluetooth) {
            throw new Error("Web Bluetooth API não suportada neste navegador.");
        }

        try {
            console.log("Solicitando dispositivo WeDo 2.0...");
            
            // Alterado para aceitar TODOS os dispositivos para depuração e garantir que apareça na lista.
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    this.WEDO_SERVICE_UUID, 
                    this.LPF2_SERVICE_UUID,
                    this.WEDO_IO_CHAR_UUID
                ]
            });

            this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

            console.log("Conectando ao servidor GATT...");
            this.server = await this.device.gatt.connect();

            console.log("Procurando serviços...");
            // Tenta conectar no serviço WeDo 2.0
            try {
                this.service = await this.server.getPrimaryService(this.WEDO_SERVICE_UUID);
                console.log("Serviço WeDo 2.0 encontrado!");
            } catch (e1) {
                console.warn("Serviço WeDo 2.0 não encontrado. Tentando LPF2...", e1);
                try {
                    this.service = await this.server.getPrimaryService(this.LPF2_SERVICE_UUID);
                    console.log("Serviço LPF2 encontrado!");
                } catch (e2) {
                    throw new Error("Serviço LEGO não encontrado no dispositivo. Verifique se é um WeDo 2.0 ou Hub compatível.");
                }
            }

            console.log("Obtendo característica de IO...");
            try {
                this.characteristic = await this.service.getCharacteristic(this.WEDO_IO_CHAR_UUID);
            } catch (e3) {
                // Se falhar, tenta listar todas as características para debug (no console) e lança erro
                console.error("Característica IO não encontrada.");
                throw new Error("Não foi possível acessar o controle do motor (IO Characteristic).");
            }
            
            // Start Notifications (Ignora erro se não suportado, para não bloquear conexão)
            try {
                await this.characteristic.startNotifications();
                this.characteristic.addEventListener('characteristicvaluechanged', this.handleNotification.bind(this));
            } catch (e4) {
                console.warn("Não foi possível iniciar notificações de sensores:", e4);
            }

            this.connected = true;
            console.log("WeDo 2.0 Conectado e Pronto!");
            return true;
        } catch (error) {
            console.error("Erro detalhado na conexão WeDo:", error);
            // Propaga o erro original para a UI mostrar a mensagem correta
            throw error; 
        }
    }

    handleNotification(event) {
        const value = event.target.value;
        const data = new Uint8Array(value.buffer);
        // WeDo 2.0 Sensor Protocol is complex. 
        // This is a simplified placeholder. Real WeDo requires setting input format first.
        // For MVP, we will simulate or log.
        // In a real app, you parse: [Port, Type, Value...]
        console.log("WeDo Data:", data);
        
        // Mocking values for demonstration if actual hardware isn't fully set up with input commands
        // If byte 0 is port ID:
        // Port 1 or 2 could be sensors.
    }

    onDisconnected() {
        console.log("WeDo 2.0 Desconectado.");
        this.connected = false;
    }

    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.connected = false;
    }

    isConnected() {
        return this.connected && this.device && this.device.gatt.connected;
    }

    async sendCommand(data) {
        if (!this.isConnected() || !this.characteristic) return;
        await this.characteristic.writeValue(new Uint8Array(data));
    }

    // --- Actions ---

    async motorOn(speed) {
        console.log(`WeDo: Motor ON ${speed}`);
        // Command format: [PortID, CommandID (1=Motor), Length (1), Speed]
        // We generally guess ports 1 (0x01) and 2 (0x02) for motors.
        // Speed: -100 to 100.
        
        // Send to Port 1
        await this.sendCommand([0x01, 0x01, 0x01, speed]);
        // Send to Port 2 (Just in case)
        await this.sendCommand([0x02, 0x01, 0x01, speed]);
    }

    async motorOff() {
        console.log("WeDo: Motor OFF");
        await this.sendCommand([0x01, 0x01, 0x01, 0]);
        await this.sendCommand([0x02, 0x01, 0x01, 0]);
    }

    async getDistance() {
        // Return cached or mock value
        // Note: Real WeDo needs "Input Format" command to start streaming sensor data
        return Math.floor(Math.random() * 50); // Mock for demo
    }

    async getTilt() {
        return Math.floor(Math.random() * 2); // Mock for demo
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async stopAll() {
        await this.motorOff();
    }
}
