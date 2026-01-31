// js/drivers/wedo_driver.js
// Driver LEGO WeDo 2.0 – Web Bluetooth + LPF2 (Versão Substituída conforme Solicitado)

export class WeDoDriver {
    constructor() {
        this.device = null;
        this.server = null;
        this.characteristic = null;
        this.connected = false;
        this.commandQueue = Promise.resolve();

        // UUIDs oficiais LEGO
        this.LPF2_SERVICE_UUID = "00001623-1212-efde-1523-785feabcd123";
        this.LPF2_COMMAND_UUID = "00001624-1212-efde-1523-785feabcd123";
    }

    /* ===============================
       CONEXÃO
    =============================== */
    async connect() {
        if (!navigator.bluetooth) {
            alert("Web Bluetooth não suportado neste navegador.");
            return false;
        }

        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [this.LPF2_SERVICE_UUID] }],
                optionalServices: [this.LPF2_SERVICE_UUID]
            });

            this.device.addEventListener('gattserverdisconnected', () => {
                this.connected = false;
                console.log("WeDo desconectado");
            });

            this.server = await this.device.gatt.connect();
            const service = await this.server.getPrimaryService(this.LPF2_SERVICE_UUID);
            this.characteristic = await service.getCharacteristic(this.LPF2_COMMAND_UUID);

            this.connected = true;
            console.log("✅ WeDo 2.0 conectado");

            // Inicializa portas de motor
            await this.initMotor(1); // Motor A
            await this.initMotor(2); // Motor B
            
            return true;
        } catch (error) {
            console.error("Erro na conexão WeDo:", error);
            this.connected = false;
            return false;
        }
    }

    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.connected = false;
    }

    isConnected() {
        return this.connected;
    }

    /* ===============================
       FILA DE COMANDOS BLE
    =============================== */
    async sendCommand(bytes) {
        if (!this.characteristic) return;

        this.commandQueue = this.commandQueue.then(async () => {
            const data = new Uint8Array(bytes);
            console.log("➡️ Enviando:", data);
            await this.characteristic.writeValueWithoutResponse(data);
            await new Promise(r => setTimeout(r, 40));
        });

        return this.commandQueue;
    }

    /* ===============================
       INICIALIZA MOTOR (OBRIGATÓRIO)
    =============================== */
    async initMotor(port) {
        // Port Mode Setup: Power mode (0)
        await this.sendCommand([
            0x07,   // Length
            0x00,   // Hub ID
            0x41,   // Port Mode Setup
            port,   // Porta
            0x00,   // Mode = Power
            0x01    // Dataset count
        ]);
    }

    /* ===============================
       MOTOR A (PORTA 1)
    =============================== */
    async motorA(speed) {
        await this.setMotor(1, speed);
    }

    /* ===============================
       MOTOR B (PORTA 2)
    =============================== */
    async motorB(speed) {
        await this.setMotor(2, speed);
    }

    // Compatibilidade com blocos genéricos
    async motorOn(speed) {
        await this.motorA(speed);
        await this.motorB(speed);
    }

    /* ===============================
       CONTROLE DE MOTOR (LPF2 REAL)
    =============================== */
    async setMotor(port, speed) {
        let s = Math.max(-100, Math.min(100, parseInt(speed)));
        let power = s < 0 ? 256 + s : s;

        await this.sendCommand([
            0x08,   // Length
            0x00,   // Hub ID
            0x81,   // Port Output Command
            port,   // Porta
            0x11,   // Write Direct Mode Data
            0x00,   // Mode = Power
            power   // Potência
        ]);
    }

    /* ===============================
       PARAR TODOS OS MOTORES
    =============================== */
    async motorOff() {
        await this.motorA(0);
        await this.motorB(0);
    }

    async stopAll() {
        await this.motorOff();
    }

    /* ===============================
       LED DO HUB
    =============================== */
    async setLED(input) {
        let colorIndex = 0;

        // Mapeamento HEX para Index WeDo (Compatibilidade com Blockly)
        if (typeof input === 'string') {
            const colors = {
                "#000000": 0, // Off
                "#ffc0cb": 1, // Pink
                "#800080": 2, // Purple
                "#0000ff": 3, // Blue
                "#00ffff": 4, // Cyan
                "#008080": 5, // Teal
                "#00ff00": 6, // Green
                "#ffff00": 7, // Yellow
                "#ffa500": 8, // Orange
                "#ff0000": 9, // Red
                "#ffffff": 10 // White
            };
            const hex = input.toLowerCase();
            colorIndex = colors[hex] !== undefined ? colors[hex] : 0;
        } else {
            colorIndex = input;
        }

        // 0–10 (cores LEGO)
        await this.sendCommand([
            0x08,
            0x00,
            0x81,
            0x06,   // Porta do LED
            0x11,
            0x00,
            colorIndex
        ]);
    }

    /* ===============================
       UTILITÁRIOS (Compatibilidade)
    =============================== */
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getDistance() {
        // Placeholder: Retorna 0 para evitar erros no console se o bloco for usado
        // A implementação completa exigiria notificações BLE
        return 0;
    }

    async getTilt() {
        // Placeholder
        return 0;
    }
}
