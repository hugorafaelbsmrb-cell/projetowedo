// js/drivers/wedo_driver.js
// LEGO WeDo 2.0 – Driver "Total Broadcast" (Multi-Serviço)
// Motivo: Se a característica 1565 não aparece no serviço 1523, buscamos em TODOS os serviços conhecidos da LEGO.

export class WeDoDriver {
    constructor() {
        this.device = null;
        this.server = null;
        this.connected = false;
        this.queue = Promise.resolve();
        
        // Lista de UUIDs de Serviços Possíveis (Legacy, LPF2, Nordic)
        this.TARGET_SERVICES = [
            "00001523-1212-efde-1523-785feabcd123", // WeDo Legacy
            "00004f0e-1212-efde-1523-785feabcd123", // LPF2 Smart Hub
            "00001623-1212-efde-1523-785feabcd123"  // LPF2 Alternativo
        ];
        
        // Lista de características para NÃO escrever (Perigosas)
        this.BLACKLIST_UUIDS = [
            "0000152b-1212-efde-1523-785feabcd123" // Desliga o Hub (Shutdown)
        ];

        // Listas de candidatos
        this.writeCandidates = [];
        this.notifyCandidates = []; // Para sensores
        
        // Estado dos sensores
        this.sensors = {
            distance: 0,
            tilt: { x: 0, y: 0 }
        };
    }

    /* ===============================
       CONEXÃO VARREDURA TOTAL
    =============================== */
    async connect() {
        if (!navigator.bluetooth) {
            throw new Error("Web Bluetooth não suportado neste navegador.");
        }

        console.log("🔍 Iniciando busca TOTAL por WeDo 2.0...");
        this.writeCandidates = []; 
        this.notifyCandidates = [];

        try {
            // 1. Solicita dispositivo com permissão para TODOS os serviços alvo
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: this.TARGET_SERVICES 
            });

            console.log("📱 Dispositivo selecionado:", this.device.name);

            this.device.addEventListener('gattserverdisconnected', () => {
                this.connected = false;
                console.log("❌ Desconectado pelo dispositivo");
            });

            this.server = await this.device.gatt.connect();
            console.log("🔌 Conectado ao GATT");

            // 2. Varredura de Serviços
            // Tenta obter cada serviço da lista. Alguns podem não existir, e tudo bem.
            for (const serviceUUID of this.TARGET_SERVICES) {
                try {
                    const service = await this.server.getPrimaryService(serviceUUID);
                    console.log(`🛠️ Serviço Encontrado: ${service.uuid}`);
                    
                    // Busca características dentro deste serviço
                    const characteristics = await service.getCharacteristics();
                    
                    // A. Filtra WRITES (Motores/LED)
                    const writers = characteristics.filter(c => 
                        (c.properties.write || c.properties.writeWithoutResponse) &&
                        !this.BLACKLIST_UUIDS.includes(c.uuid)
                    );
                    
                    writers.forEach(c => this.writeCandidates.push(c));

                    // B. Filtra NOTIFIES (Sensores)
                    const notifiers = characteristics.filter(c => c.properties.notify);
                    
                    for (const c of notifiers) {
                        console.log(`      👂 Ouvindo Sensor em: ${c.uuid}`);
                        try {
                            await c.startNotifications();
                            c.addEventListener('characteristicvaluechanged', (event) => this.handleSensorData(event, c.uuid));
                            this.notifyCandidates.push(c);
                        } catch (e) {
                            console.warn(`      ⚠️ Falha ao ativar notify em ${c.uuid}`, e);
                        }
                    }

                } catch (err) {
                    // Serviço não existe, ignora
                }
            }

            if (this.writeCandidates.length === 0) {
                throw new Error("Nenhuma característica de escrita encontrada!");
            }

            console.log(`🔫 MODO TOTAL BROADCAST: ${this.writeCandidates.length} saídas, ${this.notifyCandidates.length} entradas.`);
            this.connected = true;
            
            // Teste inicial visual
            await this.setLED("green");
            
            return true;

        } catch (error) {
            console.error("🚨 Erro na conexão:", error);
            this.connected = false;
            throw error;
        }
    }

    /* ===============================
       LEITURA DE SENSORES
    =============================== */
    handleSensorData(event, uuid) {
        const data = event.target.value;
        const bytes = new Uint8Array(data.buffer);
        
        // Log para Debug dos Sensores (Apenas se mudar muito para não floodar)
        // console.log(`📡 DADOS DE ${uuid}:`, bytes);

        // Tenta decodificar Sensor de Distância (Geralmente bytes flutuantes ou inteiros simples)
        // WeDo 2.0 Distância costuma ser um float ou int em bytes específicos
        if (bytes.length >= 2) {
            // Exemplo simples: assumindo que o byte[1] ou byte[2] é a distância
            // Isso é experimental. Precisamos ver o log real.
            this.sensors.distance = bytes[1]; 
        }
    }

    /* ===============================
       ENVIO MULTI-SERVIÇO (TOTAL BROADCAST)
    =============================== */
    async send(bytes) {
        if (this.writeCandidates.length === 0) return;

        this.queue = this.queue.then(async () => {
            const data = new Uint8Array(bytes);
            
            // Log reduzido para não poluir
            // const hexData = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ');
            // console.log(`➡️ Broadcast [${hexData}]...`);

            for (const char of this.writeCandidates) {
                try {
                    if (char.properties.write) {
                        await char.writeValue(data);
                    } else if (char.properties.writeWithoutResponse) {
                        await char.writeValueWithoutResponse(data);
                    }
                } catch (e) {
                    // Silencia erros individuais de envio no broadcast para não assustar
                }
            }
            
            await new Promise(r => setTimeout(r, 20));
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
    
    async getDistance() { 
        return this.sensors.distance; 
    }
    
    async getTilt() { 
        // Mock por enquanto, retornando 0 ou implementando depois
        return 0; 
    }

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
