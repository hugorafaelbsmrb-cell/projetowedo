// js/drivers/wedo_driver.js
// LEGO WeDo 2.0 – Driver Nativo "Broadcast Mode"
// Motivo: Envia comandos para TODAS as características de escrita disponíveis para garantir funcionamento.

export class WeDoDriver {
    constructor() {
        this.device = null;
        this.server = null;
        this.connected = false;
        this.queue = Promise.resolve();
        
        // UUID do Serviço Legacy (Padrão WeDo 2.0)
        this.SERVICE_UUID = "00001523-1212-efde-1523-785feabcd123";
        
        // Lista de características candidatas para envio
        this.writeCandidates = [];
    }

    /* ===============================
       CONEXÃO ROBUSTA
    =============================== */
    async connect() {
        if (!navigator.bluetooth) {
            throw new Error("Web Bluetooth não suportado neste navegador.");
        }

        console.log("🔍 Iniciando busca por WeDo 2.0...");
        this.writeCandidates = []; // Limpa lista anterior

        try {
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [this.SERVICE_UUID]
            });

            console.log("📱 Dispositivo selecionado:", this.device.name);

            this.device.addEventListener('gattserverdisconnected', () => {
                this.connected = false;
                console.log("❌ Desconectado pelo dispositivo");
            });

            this.server = await this.device.gatt.connect();
            console.log("🔌 Conectado ao GATT");

            const service = await this.server.getPrimaryService(this.SERVICE_UUID);
            console.log("🛠️ Serviço encontrado:", service.uuid);

            // Mapeamento de TODAS as características
            const characteristics = await service.getCharacteristics();
            console.log(`📋 Total de características encontradas: ${characteristics.length}`);

            // Filtra todas que aceitam escrita
            this.writeCandidates = characteristics.filter(c => 
                c.properties.write || c.properties.writeWithoutResponse
            );

            if (this.writeCandidates.length === 0) {
                throw new Error("Nenhuma característica de escrita encontrada!");
            }

            console.log("🔫 MODO BROADCAST ATIVADO: Comandos serão enviados para:");
            this.writeCandidates.forEach(c => {
                console.log(`   - UUID: ${c.uuid} (Write: ${c.properties.write}, NoResp: ${c.properties.writeWithoutResponse})`);
            });

            this.connected = true;
            
            // Teste inicial: Piscar LED em todas as portas
            console.log("🧪 Iniciando teste de injeção em todas as portas...");
            await this.setLED("green");
            
            return true;

        } catch (error) {
            console.error("🚨 Erro na conexão:", error);
            this.connected = false;
            throw error;
        }
    }

    /* ===============================
       ENVIO MULTI-PORTA (BROADCAST)
    =============================== */
    async send(bytes) {
        if (this.writeCandidates.length === 0) return;

        this.queue = this.queue.then(async () => {
            const data = new Uint8Array(bytes);
            const hexData = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ');
            
            console.log(`➡️ Broadcast [${hexData}] para ${this.writeCandidates.length} alvos:`);

            // Dispara para todas as características candidatas
            for (const char of this.writeCandidates) {
                try {
                    // Tenta WriteWithResponse primeiro se disponível
                    if (char.properties.write) {
                        await char.writeValue(data);
                        console.log(`   ✅ Enviado para ${char.uuid} (Com Resposta)`);
                    } 
                    // Se não, tenta WriteWithoutResponse
                    else if (char.properties.writeWithoutResponse) {
                        await char.writeValueWithoutResponse(data);
                        console.log(`   ✅ Enviado para ${char.uuid} (Sem Resposta)`);
                    }
                    // Pequeno delay entre envios para não engasgar o BLE
                    await new Promise(r => setTimeout(r, 20)); 
                } catch (e) {
                    console.warn(`   ⚠️ Falha em ${char.uuid}:`, e.message);
                }
            }
            
            // Delay final de ciclo
            await new Promise(r => setTimeout(r, 50));
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
    
    async motorOn(speed) { 
        await this.motorA(speed); 
        await this.motorB(speed); 
    }
    
    async getDistance() { return 0; }
    async getTilt() { return 0; }

    /* ===============================
       MOTORES
    =============================== */
    async motorA(speed) {
        let s = Math.max(-100, Math.min(100, speed));
        let p = s < 0 ? 256 + s : s; 
        await this.send([0x01, 0x01, 0x01, p]);
    }

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
    async setLED(color) {
        let index = 0;
        if (typeof color === 'number') {
            index = color;
        } else if (typeof color === 'string') {
            const hex = color.toLowerCase();
            const map = {
                "off": 0, "#000000": 0, "pink": 1, "#ffc0cb": 1, "purple": 2, "#800080": 2,
                "blue": 3, "#0000ff": 3, "cyan": 4, "#00ffff": 4, "teal": 5, "#008080": 5,
                "green": 6, "#00ff00": 6, "yellow": 7, "#ffff00": 7, "orange": 8, "#ffa500": 8,
                "red": 9, "#ff0000": 9, "white": 10, "#ffffff": 10
            };
            index = map[hex] !== undefined ? map[hex] : 10;
        }
        await this.send([0x06, 0x04, 0x01, index]);
    }
}
