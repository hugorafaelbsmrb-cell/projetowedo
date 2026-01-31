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

            // 3. Priorização de Característica (CRÍTICO)
            // O WeDo 2.0 suporta dois protocolos: Legacy (1565) e LPF2 (1624/outros).
            // Nossos comandos [0x01, 0x01, ...] são formato Legacy.
            // Se enviarmos isso para a porta LPF2, o Hub ignora ou trava.
            // Portanto, se acharmos a 1565, DEVEMOS usar APENAS ela.
            
            const legacyChar = this.writeCandidates.find(c => c.uuid.includes("1565"));
            
            if (legacyChar) {
                console.log("🎯 Característica Legacy (1565) encontrada! Usando APENAS ela para estabilidade.");
                this.writeCandidates = [legacyChar];
            } else {
                console.warn("⚠️ Característica 1565 não encontrada. Tentando broadcast nos candidatos restantes (pode falhar)...");
            }

            if (this.writeCandidates.length === 0) {
                throw new Error("Nenhuma característica de escrita encontrada!");
            }

            console.log(`🔫 MODO DE ENVIO: ${this.writeCandidates.length} alvo(s).`);
            this.connected = true;
            
            // Pequeno delay para estabilização do Hub antes do primeiro comando
            await this.wait(500);

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
        
        // Debug (Throttle logs if needed)
        // console.log(`📡 DADOS ${uuid}:`, bytes);

        // Heurística para WeDo 2.0 (Tentativa de identificar pelo formato)
        
        // Caso 1: 1 Byte (Geralmente Distância 0-10 ou Botão 0/1)
        if (bytes.length === 1) {
            const val = bytes[0];
            
            // Distância (WeDo Motion Sensor retorna 0-10)
            // Se o valor flutua entre 0 e 10, assumimos que é distância
            this.sensors.distance = val;

            // Botão (Geralmente 0 solto, 1 pressionado)
            // Difícil distinguir de distância 0 ou 1, mas salvamos
            this.sensors.button = val; 
        }
        
        // Caso 2: 2 Bytes (Geralmente Tilt X, Y)
        else if (bytes.length === 2) {
            // Converter para Signed Int8 (pois inclinação pode ser negativa)
            const view = new DataView(data.buffer);
            const x = view.getInt8(0);
            const y = view.getInt8(1);
            
            this.sensors.tilt = { x, y };
        }
        
        // Caso 3: 4 Bytes ou mais (Floats LPF2)
        else if (bytes.length >= 4) {
            // LPF2 às vezes manda floats (32-bit)
            // Tentar ler como float
            const view = new DataView(data.buffer);
            try {
                const f = view.getFloat32(0, true); // Little Endian
                if (!isNaN(f) && f >= 0 && f <= 10) {
                     this.sensors.distance = Math.round(f);
                }
            } catch(e) {}
        }
    }

    /* ===============================
       SOM (Browser)
    =============================== */
    async playSound(name) {
        console.log(`🔊 Tocar som: ${name}`);
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            gain.gain.setValueAtTime(0.1, ctx.currentTime);

            if (name === "BEEP") {
                osc.type = 'sine';
                osc.frequency.value = 880;
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } else if (name === "ALERT") {
                osc.type = 'triangle';
                osc.frequency.value = 440;
                osc.start();
                osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);
                osc.stop(ctx.currentTime + 0.3);
            } else { // SUCCESS
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1); // C#
                osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2); // E
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) {
            console.error("Erro ao tocar som", e);
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
    
    async getDistance() { 
        return this.sensors.distance; 
    }
    
    async getTilt(axis = 'x') { 
        if (axis === 'y') return this.sensors.tilt.y;
        return this.sensors.tilt.x; 
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
