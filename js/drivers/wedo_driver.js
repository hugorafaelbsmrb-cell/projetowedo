// js/drivers/wedo_driver.js
// LEGO WeDo 2.0 – LEGACY BLE (CORRETO)

export class WeDoDriver {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.connected = false;
        this.queue = Promise.resolve();

        // UUIDs LEGACY WeDo 2.0
        this.SERVICE_UUID = "00001523-1212-efde-1523-785feabcd123";
        this.CHAR_UUID    = "00001565-1212-efde-1523-785feabcd123";
    }

    /* ===============================
       CONEXÃO
    =============================== */
    async connect() {
        if (!navigator.bluetooth) {
            throw new Error("Web Bluetooth não suportado.");
        }

        this.device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [this.SERVICE_UUID]
        });

        this.server = await this.device.gatt.connect();
        this.service = await this.server.getPrimaryService(this.SERVICE_UUID);
        this.characteristic = await this.service.getCharacteristic(this.CHAR_UUID);

        this.connected = true;
        console.log("✅ WeDo 2.0 (Legacy) conectado");
        
        return true; // Retorno necessário para a interface
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
       FILA DE COMANDOS
    =============================== */
    async send(bytes) {
        this.queue = this.queue.then(async () => {
            const data = new Uint8Array(bytes);
            console.log("➡️", data);
            await this.characteristic.writeValue(data);
            await new Promise(r => setTimeout(r, 60));
        });
        return this.queue;
    }

    /* ===============================
       MOTORES
    =============================== */

    // Motor A → Porta 1
    async motorA(speed) {
        let s = Math.max(-100, Math.min(100, speed));
        let p = s < 0 ? 256 + s : s;

        // [Port, Command, Mode, Power]
        await this.send([0x01, 0x01, 0x01, p]);
    }

    // Motor B → Porta 2
    async motorB(speed) {
        let s = Math.max(-100, Math.min(100, speed));
        let p = s < 0 ? 256 + s : s;

        await this.send([0x02, 0x01, 0x01, p]);
    }

    async motorOff() {
        await this.motorA(0);
        await this.motorB(0);
    }

    // Compatibilidade com a interface
    async stopAll() {
        await this.motorOff();
    }

    // Compatibilidade com blocos
    async motorOn(speed) {
        await this.motorA(speed);
        await this.motorB(speed);
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

        // 0–10
        await this.send([0x06, 0x04, 0x01, colorIndex]);
    }

    /* ===============================
       UTILITÁRIOS
    =============================== */
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getDistance() { return 0; }
    async getTilt() { return 0; }
}
