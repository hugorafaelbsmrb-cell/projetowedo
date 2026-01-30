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
        
        // Fila de comandos para evitar conflitos GATT
        this.commandQueue = Promise.resolve();
    }

    async connect() {
        if (!navigator.bluetooth) {
            throw new Error("Web Bluetooth API não suportada neste navegador.");
        }

        // Garante limpeza de estados anteriores
        await this.disconnect();

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

            // Pequeno delay para estabilidade do empilhamento Bluetooth (fix para Windows)
            await new Promise(r => setTimeout(r, 500));

            this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

            console.log("Conectando ao servidor GATT...");
            
            // Retry logic for connection
            let connected = false;
            let retryCount = 0;
            const maxRetries = 3;

            while (!connected && retryCount < maxRetries) {
                try {
                    this.server = await this.device.gatt.connect();
                    connected = true;
                } catch (err) {
                    console.warn(`Tentativa de conexão ${retryCount + 1} falhou:`, err);
                    retryCount++;
                    if (retryCount >= maxRetries) throw err;
                    await new Promise(r => setTimeout(r, 1000)); // Espera 1s entre tentativas
                }
            }

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

            console.log("Obtendo características...");
            
            // Variáveis para características separadas
            let writeChar = null;
            let notifyChar = null;

            try {
                const characteristics = await this.service.getCharacteristics();
                console.log("Características disponíveis:", characteristics.map(c => c.uuid));

                // 1. Encontrar característica de escrita (Comando) - Prioridade: 1565 > Write Property
                writeChar = characteristics.find(c => c.uuid.includes("1565")) || 
                            characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);

                // 2. Encontrar característica de notificação (Sensor) - Prioridade: 1560 > Notify Property
                notifyChar = characteristics.find(c => c.uuid.includes("1560")) || 
                             characteristics.find(c => c.properties.notify);

                if (!writeChar) {
                    throw new Error("Não foi possível encontrar uma característica de escrita (Comando).");
                }

                this.characteristic = writeChar; // Característica principal para envio de comandos
                console.log("Característica de Comando selecionada:", this.characteristic.uuid);

            } catch (eChar) {
                console.error("Erro ao listar características:", eChar);
                throw new Error("Falha ao configurar comunicação com o WeDo 2.0.");
            }
            
            // Configurar Notificações (Sensores)
            if (notifyChar) {
                try {
                    console.log("Iniciando notificações na característica:", notifyChar.uuid);
                    await notifyChar.startNotifications();
                    notifyChar.addEventListener('characteristicvaluechanged', this.handleNotification.bind(this));
                    console.log("Notificações de sensores ativas.");
                } catch (eNotify) {
                    console.warn("Falha ao iniciar notificações (sensores podem não funcionar):", eNotify);
                }
            } else {
                console.warn("Nenhuma característica de notificação encontrada. Sensores indisponíveis.");
            }

            this.connected = true;
            console.log("WeDo 2.0 Conectado e Pronto!");
            return true;
        } catch (error) {
            console.error("Erro detalhado na conexão WeDo:", error);
            
            // Tratamento específico para erro comum no Windows
            if (error.message && error.message.includes("Connection attempt failed")) {
                throw new Error("Erro de conexão Bluetooth (Windows). \n\nSOLUÇÃO:\n1. Vá nas Configurações do Windows > Bluetooth.\n2. REMOVA o dispositivo 'LPF2 Smart Hub' ou 'WeDo Hub'.\n3. Reinicie o Hub (segure o botão até apagar, ligue de novo).\n4. Tente conectar novamente AQUI no navegador.");
            }
            
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
            const maxRetries = 5; 
            
            for (let i = 0; i < maxRetries; i++) {
                try {
                    // console.log(`WeDo: Enviando [${data.join(',')}]`);
                    await this.characteristic.writeValue(buffer);
                    await new Promise(r => setTimeout(r, 50)); // Aumentado delay para estabilidade
                    return;
                } catch (e) {
                    const isGattBusy = e.name === 'NetworkError' && e.message.includes('GATT operation already in progress');
                    
                    if (isGattBusy) {
                        await new Promise(r => setTimeout(r, 150 + (i * 50))); 
                    } else {
                        console.error("WeDo: Erro fatal ao enviar:", e);
                        throw e;
                    }
                }
            }
            console.error("WeDo: Falha ao enviar comando após várias tentativas.");
        }).catch(err => {
            console.error("WeDo: Erro na fila de comandos:", err);
        });

        return this.commandQueue;
    }

    // --- Actions ---

    async motorOn(speed) {
        // ... (código existente mantido se necessário, mas foco em A/B agora)
        // ...
        let s = parseInt(speed);
        if (isNaN(s)) s = 100;
        if (s > 100) s = 100;
        if (s < -100) s = -100;

        // Tentar enviar para todas as portas possíveis
        const ports = [1, 2, 0, 3, 4, 5, 6];
        for (const port of ports) {
             // Formato correto WeDo 2.0 Motor: [PortID, 0x01, 0x01, Power]
             // Testando formato alternativo se o acima falhar: [PortID, 0x01, 0x02, Power] (alguns docs sugerem len 2 para certos modos?)
             // Mas o padrão LPF2 para Power (Mode 0) é WriteDirect (0x01 is actually execute... wait)
             
             // O protocolo WeDo 2.0 correto para "Output Command" é:
             // [PortID, 0x01 (Execute), 0x02 (WriteDirectModeData?), SubCmd?] 
             // NÃO.
             // Protocolo simplificado WeDo 2.0 BLE:
             // Byte 0: Port ID
             // Byte 1: 0x01 (Execute immediately)
             // Byte 2: 0x02 (Length of sub-command + payload? No. Byte 2 is Command ID usually?)
             
             // Reference: https://github.com/nathankellenicki/node-wedo2/blob/master/lib/wedo2.js
             // port.write(new Buffer([0x01, 0x01, power])); -> No, that's inside a wrapper.
             
             // Official WeDo 2.0 Specs (reverse engineered):
             // Characteristic: 1565 (Input/Output)
             // Structure: [PortID, 0x01 (Command: Motor Output), 0x01 (Payload Length), Power]
             // Power: -100 to 100 (int8)
             
             // Vamos tentar converter o Power para Int8 corretamente (se for negativo, precisa ser complemento de 2 em Uint8)
             let powerByte = s;
             if (powerByte < 0) {
                 powerByte = 256 + powerByte;
             }

             await this.sendCommand([port, 0x01, 0x01, powerByte]);
        }
    }

    async motorA(speed) {
        let s = parseInt(speed);
        if (isNaN(s)) s = 100;
        if (s > 100) s = 100;
        if (s < -100) s = -100;

        // Converter para Int8 (byte)
        let powerByte = s;
        if (powerByte < 0) powerByte = 256 + powerByte;

        console.log(`WeDo: Motor A (Porta 1) ON ${s} [Byte: ${powerByte}]`);
        await this.sendCommand([1, 0x01, 0x01, powerByte]);
    }

    async motorB(speed) {
        let s = parseInt(speed);
        if (isNaN(s)) s = 100;
        if (s > 100) s = 100;
        if (s < -100) s = -100;

        let powerByte = s;
        if (powerByte < 0) powerByte = 256 + powerByte;

        console.log(`WeDo: Motor B (Porta 2) ON ${s} [Byte: ${powerByte}]`);
        await this.sendCommand([2, 0x01, 0x01, powerByte]);
    }

    async motorOff() {
        console.log("WeDo: Motor OFF");
        const ports = [1, 2, 0, 3, 4, 5, 6];
        for (const port of ports) {
            this.sendCommand([port, 0x01, 0x01, 0]);
        }
    }

    async setLED(colorHex) {
        console.log(`WeDo: Set LED ${colorHex}`);
        
        // Mapeamento aproximado de HEX para WeDo 2.0 Color Index
        // 0:Off, 1:Pink, 2:Purple, 3:Blue, 4:Sky, 5:Teal, 6:Green, 7:Yellow, 8:Orange, 9:Red, 10:White
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

        // Encontrar a cor mais próxima ou usar um padrão (Azul)
        // Simplificação: Switch case para cores comuns do Blockly
        let index = 3; // Default Blue
        
        // Normalizar hex
        colorHex = colorHex.toLowerCase();
        
        if (colorHex === "#ff0000") index = 9; // Red
        else if (colorHex === "#00ff00") index = 6; // Green
        else if (colorHex === "#0000ff") index = 3; // Blue
        else if (colorHex === "#ffff00") index = 7; // Yellow
        else if (colorHex === "#ffa500") index = 8; // Orange
        else if (colorHex === "#ffffff") index = 10; // White
        else if (colorHex === "#000000") index = 0; // Off
        
        // Command: [PortID (0x06 for LED), 0x04 (Set RGB?), 0x01 (Len), Index]
        // O comando correto para LED Index mode é: [0x06, 0x01, 0x01, Index]? 
        // Não, para o LED (Porta 6), o modo padrão é index.
        // Tentar: [0x06, 0x01, 0x01, Index]
        
        await this.sendCommand([0x06, 0x04, 0x01, index]);
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
