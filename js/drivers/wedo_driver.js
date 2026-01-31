// js/drivers/wedo_driver.js
// LEGO WeDo 2.0 – Driver Nativo Otimizado (Final v2)
// Motivo: Ajuste para forçar WriteWithResponse e garantir envio de comandos.

export class WeDoDriver {
    constructor() {
        this.device = null;
        this.server = null;
        this.characteristic = null;
        this.connected = false;
        this.queue = Promise.resolve();
        
        // UUID do Serviço Legacy (Padrão WeDo 2.0)
        this.SERVICE_UUID = "00001523-1212-efde-1523-785feabcd123";
        // UUID da Característica de Comando (Motores/LED/Piezo)
        this.COMMAND_UUID_PART = "1565"; 
    }

    /* ===============================
       CONEXÃO ROBUSTA
    =============================== */
    async connect() {
        if (!navigator.bluetooth) {
            throw new Error("Web Bluetooth não suportado neste navegador.");
        }

        console.log("🔍 Iniciando busca por WeDo 2.0...");

        try {
            // 1. Solicitar dispositivo (Permissivo)
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [this.SERVICE_UUID] // Essencial para permissão de acesso
            });

            console.log("📱 Dispositivo selecionado:", this.device.name);

            this.device.addEventListener('gattserverdisconnected', () => {
                this.connected = false;
                console.log("❌ Desconectado pelo dispositivo");
            });

            // 2. Conectar ao Servidor GATT
            this.server = await this.device.gatt.connect();
            console.log("🔌 Conectado ao GATT");

            // 3. Obter Serviço Principal
            const service = await this.server.getPrimaryService(this.SERVICE_UUID);
            console.log("🛠️ Serviço encontrado:", service.uuid);

            // 4. Buscar Característica de Escrita (Prioridade 1565)
            const characteristics = await service.getCharacteristics();
            
            console.log("📋 Características disponíveis:");
            characteristics.forEach(c => console.log(`   - ${c.uuid} (Write: ${c.properties.write}, WriteNoResp: ${c.properties.writeWithoutResponse})`));

            // Tenta encontrar a característica oficial de comandos (1565)
            this.characteristic = characteristics.find(c => c.uuid.indexOf(this.COMMAND_UUID_PART) > -1);

            if (this.characteristic) {
                console.log("✅ Característica de COMANDO (1565) encontrada!");
            } else {
                console.warn("⚠️ Característica 1565 não encontrada. Tentando fallback genérico...");
                // Fallback: Procura qualquer característica que permita escrita
                this.characteristic = characteristics.find(c => 
                    c.properties.write || c.properties.writeWithoutResponse
                );
            }

            if (!this.characteristic) {
                throw new Error("Nenhuma característica de escrita encontrada no serviço.");
            }

            console.log("🔗 Característica vinculada para envio:", this.characteristic.uuid);
            
            this.connected = true;
            
            // Sequência de Inicialização (Stop All + Blink)
            await this.motorOff();
            await this.setLED("green");
            
            return true;

        } catch (error) {
            console.error("🚨 Erro na conexão:", error);
            this.connected = false;
            throw error;
        }
    }

    /* ===============================
       FILA DE COMANDOS (Anti-conflito)
    =============================== */
    async send(bytes) {
        if (!this.characteristic) return;

        // Enfileira comandos para evitar "GATT Operation in Progress"
        this.queue = this.queue.then(async () => {
            try {
                const data = new Uint8Array(bytes);
                console.log("➡️ Enviando:", Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '));
                
                // Prioriza WriteWithResponse para garantir entrega (WeDo Legacy prefere isso)
                if (this.characteristic.properties.write) {
                    await this.characteristic.writeValue(data);
                } else if (this.characteristic.properties.writeWithoutResponse) {
                    await this.characteristic.writeValueWithoutResponse(data);
                } else {
                    console.warn("⚠️ Característica não possui permissão de escrita clara.");
                    await this.characteristic.writeValue(data); // Tenta mesmo assim
                }
                
                // Delay necessário para o Hub processar
                await new Promise(r => setTimeout(r, 60));
            } catch (e) {
                console.warn("🚨 Falha no envio:", e);
            }
        });
        
        return this.queue;
    }

    /* ===============================
       ADAPTADORES DE INTERFACE
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
    
    // Liga ambos os motores
    async motorOn(speed) { 
        await this.motorA(speed); 
        await this.motorB(speed); 
    }
    
    async getDistance() { return 0; }
    async getTilt() { return 0; }

    /* ===============================
       MOTORES
    =============================== */
    // Motor A = Porta 1 (0x01)
    async motorA(speed) {
        let s = Math.max(-100, Math.min(100, speed));
        // Conversão Signed Int8 -> Uint8
        let p = s < 0 ? 256 + s : s; 
        // Payload: [Port, Command, Mode, Power]
        await this.send([0x01, 0x01, 0x01, p]);
    }

    // Motor B = Porta 2 (0x02)
    async motorB(speed) {
        let s = Math.max(-100, Math.min(100, speed));
        let p = s < 0 ? 256 + s : s;
        await this.send([0x02, 0x01, 0x01, p]);
    }

    async motorOff() {
        // Envia comando de parada explícito (Velocidade 0)
        await this.motorA(0);
        await this.motorB(0);
    }

    /* ===============================
       LED DO HUB
    =============================== */
    async setLED(color) {
        let index = 0;

        if (typeof color === 'number') {
            index = color;
        } else if (typeof color === 'string') {
            const hex = color.toLowerCase();
            const map = {
                "off": 0, "#000000": 0,
                "pink": 1, "#ffc0cb": 1,
                "purple": 2, "#800080": 2,
                "blue": 3, "#0000ff": 3,
                "cyan": 4, "#00ffff": 4,
                "teal": 5, "#008080": 5,
                "green": 6, "#00ff00": 6,
                "yellow": 7, "#ffff00": 7,
                "orange": 8, "#ffa500": 8,
                "red": 9, "#ff0000": 9,
                "white": 10, "#ffffff": 10
            };
            index = map[hex] !== undefined ? map[hex] : 10;
        }

        // Comando LED: [Port=0x06, Command=0x04, Mode=0x01, ColorIndex]
        await this.send([0x06, 0x04, 0x01, index]);
    }
}
