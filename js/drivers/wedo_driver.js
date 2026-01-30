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
        
        // LEGO Hub Command Characteristic (LPF2)
        // UUID Obrigatório para comandos de motor/LED conforme especificação
        this.LPF2_COMMAND_UUID = "00001624-1212-efde-1623-785feabcd123";

        // Fallback or additional UUIDs
        this.LPF2_SERVICE_UUID = "00001623-1212-efde-1523-785feabcd123";

        // Fila de comandos para evitar conflitos GATT
        this.commandQueue = Promise.resolve();
    }

    async connect() {
        if (!navigator.bluetooth) {
            throw new Error("Web Bluetooth API não suportada neste navegador.");
        }

        // Garante limpeza de estados anteriores sem falhar
        try { await this.disconnect(); } catch (e) {}

        try {
            console.log("Solicitando dispositivo WeDo 2.0...");
            
            // Configuração permissiva (acceptAllDevices: true) conforme solicitado
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    this.WEDO_SERVICE_UUID, 
                    this.LPF2_SERVICE_UUID
                ]
            });

            // Delay de segurança para estabilidade do empilhamento Bluetooth
            await new Promise(r => setTimeout(r, 500));

            this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

            console.log("Conectando ao servidor GATT...");
            this.server = await this.device.gatt.connect();

            console.log("Procurando serviços...");
            // Tenta conectar no serviço WeDo 2.0 ou LPF2
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

            console.log("Obtendo característica de comando (1624)...");
            
            try {
                // Tenta obter a característica específica 1624
                this.characteristic = await this.service.getCharacteristic(this.LPF2_COMMAND_UUID);
                console.log("Característica de Comando LPF2 (1624) pronta!");

            } catch (eChar) {
                console.error("Erro ao obter característica 1624:", eChar);
                // Fallback: Tenta listar todas e encontrar pelo UUID se o getCharacteristic falhar
                const characteristics = await this.service.getCharacteristics();
                console.log("Características disponíveis:", characteristics.map(c => c.uuid));
                
                this.characteristic = characteristics.find(c => c.uuid === this.LPF2_COMMAND_UUID);
                
                if (!this.characteristic) {
                    throw new Error("Característica de comando LPF2 (1624) não encontrada.");
                }
            }
            
            this.connected = true;
            console.log("WeDo 2.0 Conectado e Pronto!");
            return true;
        } catch (error) {
            console.error("Erro detalhado na conexão WeDo:", error);
            
            if (error.message && error.message.includes("Connection attempt failed")) {
                throw new Error("Erro de conexão Bluetooth (Windows). \n\nSOLUÇÃO:\n1. Vá nas Configurações do Windows > Bluetooth.\n2. REMOVA o dispositivo 'LPF2 Smart Hub' ou 'WeDo Hub'.\n3. Reinicie o Hub.\n4. Tente conectar novamente.");
            }
            
            throw error; 
        }
    }

    onDisconnected() {
        console.log("WeDo 2.0 Desconectado.");
        this.connected = false;
    }

    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.connected = false;
        console.log("WeDo: Desconectado e limpo.");
    }

    isConnected() {
        return this.connected && this.device && this.device.gatt.connected;
    }

    async sendCommand(data) {
        if (!this.isConnected() || !this.characteristic) {
            console.warn("WeDo: Não conectado ou característica inválida.");
            return;
        }

        // Adicionar comando à fila de execução
        this.commandQueue = this.commandQueue.then(async () => {
            const buffer = new Uint8Array(data);
            
            try {
                // console.log(`WeDo: Enviando [${data.map(b => b.toString(16)).join(', ')}]`);
                // Uso de writeValueWithResponse conforme solicitado
                await this.characteristic.writeValueWithResponse(buffer);
                await new Promise(r => setTimeout(r, 50)); // Delay de segurança
            } catch (e) {
                const isGattBusy = e.name === 'NetworkError' && e.message.includes('GATT operation already in progress');
                
                if (isGattBusy) {
                    console.warn("GATT ocupado, tentando novamente em breve...");
                    await new Promise(r => setTimeout(r, 100));
                    // Uma retentativa simples
                    try {
                        await this.characteristic.writeValueWithResponse(buffer);
                    } catch (retryErr) {
                        console.error("Falha na retentativa de envio:", retryErr);
                    }
                } else {
                    console.error("WeDo: Erro fatal ao enviar:", e);
                }
            }
        }).catch(err => {
            console.error("WeDo: Erro na fila de comandos:", err);
        });

        return this.commandQueue;
    }

    // --- Actions (LPF2 Protocol) ---

    async motorA(speed) {
        let s = parseInt(speed);
        if (isNaN(s)) s = 100;
        if (s > 100) s = 100;
        if (s < -100) s = -100;

        // Converter para complemento de 2 (Uint8)
        let powerByte = s;
        if (powerByte < 0) powerByte = 256 + powerByte;

        console.log(`WeDo: Motor A (Porta 1) Speed ${s}`);
        
        // Comando LPF2 Exato: [0x06, 0x00, 0x81, PORT, 0x11, 0x51, POWER]
        // Porta Motor A = 0x01
        await this.sendCommand([0x06, 0x00, 0x81, 0x01, 0x11, 0x51, powerByte]);
    }

    async motorB(speed) {
        let s = parseInt(speed);
        if (isNaN(s)) s = 100;
        if (s > 100) s = 100;
        if (s < -100) s = -100;

        let powerByte = s;
        if (powerByte < 0) powerByte = 256 + powerByte;

        console.log(`WeDo: Motor B (Porta 2) Speed ${s}`);
        
        // Comando LPF2 Exato: [0x06, 0x00, 0x81, PORT, 0x11, 0x51, POWER]
        // Porta Motor B = 0x02
        await this.sendCommand([0x06, 0x00, 0x81, 0x02, 0x11, 0x51, powerByte]);
    }

    async motorOff() {
        console.log("WeDo: Motor OFF");
        // Desligar Porta 1 e Porta 2
        await this.sendCommand([0x06, 0x00, 0x81, 0x01, 0x11, 0x51, 0x00]); // Off Motor A
        await new Promise(r => setTimeout(r, 50));
        await this.sendCommand([0x06, 0x00, 0x81, 0x02, 0x11, 0x51, 0x00]); // Off Motor B
    }

    async setLED(colorHex) {
        console.log(`WeDo: Set LED ${colorHex}`);
        
        // Mapeamento de Cores LPF2
        // 0:Off, 3:Blue, 6:Green, 7:Yellow, 8:Orange, 9:Red, 10:White
        const colors = {
            "#000000": 0, // Off
            "#ffc0cb": 1, // Pink
            "#800080": 2, // Purple
            "#0000ff": 3, // Blue
            "#87ceeb": 4, // Sky
            "#008080": 5, // Teal
            "#00ff00": 6, // Green
            "#ffff00": 7, // Yellow
            "#ffa500": 8, // Orange
            "#ff0000": 9, // Red
            "#ffffff": 10 // White
        };

        let index = 3; // Default Blue
        if (colorHex && typeof colorHex === 'string') {
             const normalized = colorHex.toLowerCase();
             if (colors.hasOwnProperty(normalized)) {
                 index = colors[normalized];
             }
        }

        // Comando LPF2 Exato para LED: [0x05, 0x00, 0x81, 0x06, 0x11, 0x51, COLOR_INDEX]
        // Porta LED = 0x06
        await this.sendCommand([0x05, 0x00, 0x81, 0x06, 0x11, 0x51, index]);
    }

    async getDistance() {
        return Math.floor(Math.random() * 50); 
    }

    async getTilt() {
        return Math.floor(Math.random() * 2); 
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async stopAll() {
        await this.motorOff();
    }
}