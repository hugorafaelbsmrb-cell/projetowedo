// js/drivers/wedo_driver.js
// LEGO WeDo 2.0 – Web Bluetooth LEGACY (VERSÃO DEFINITIVA)

export class WeDoDriver {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.queue = Promise.resolve();
        this.connected = false;

        this.SERVICE_UUID = "00001523-1212-efde-1523-785feabcd123";
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

        // 🚨 NÃO buscar por UUID fixo
        const characteristics = await this.service.getCharacteristics();

        // Escolhe a característica de escrita
        this.characteristic = characteristics.find(c =>
            c.properties.write || c.properties.writeWithoutResponse
        );

        if (!this.characteristic) {
            throw new Error("Nenhuma característica de escrita encontrada.");
        }

        this.connected = true;
        console.log("✅ WeDo 2.0 conectado (Legacy)");
        
        return true;
    }

    /* ===============================
       FILA DE COMANDOS
    =============================== */
    async send(bytes) {
        this.queue = this.queue.then(async () => {
            const data = new Uint8Array(bytes);
            console.log("➡️ Enviando:", data);

            if (this.characteristic.properties.writeWithoutResponse) {
                await this.characteristic.writeValueWithoutResponse(data);
            } else {
                await this.characteristic.writeValue(data);
            }

            await new Promise(r => setTimeout(r, 60));
        });

        return this.queue;
    }

    /* ===============================
       MOTORES
    =============================== */

    // Motor A – Porta 1
    async motorA(speed) {
        let s = Math.max(-100, Math.min(100, speed));
        let p = s < 0 ? 256 + s : s;

        // [Port, Command, Mode, Power]
        await this.send([0x01, 0x01, 0x01, p]);
    }

    // Motor B – Porta 2
    async motorB(speed) {
        let s = Math.max(-100, Math.min(100, speed));
        let p = s < 0 ? 256 + s : s;

        await this.send([0x02, 0x01, 0x01, p]);
    }

    async motorOff() {
        await this.motorA(0);
        await this.motorB(0);
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
        await this.send([0x06, 0x04, 0x01, colorIndex]);
    }

    /* ===============================
       ADAPTADORES DE INTERFACE (Necessários para UI)
    =============================== */
    isConnected() { return this.connected; }
    
    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.connected = false;
    }

    async wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    async stopAll() { await this.motorOff(); }
    async motorOn(speed) { await this.motorA(speed); await this.motorB(speed); }
    async getDistance() { return 0; }
    async getTilt() { return 0; }
}
