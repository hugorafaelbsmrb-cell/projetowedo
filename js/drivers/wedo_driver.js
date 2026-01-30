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

        // WeDo 2.0 Legacy Command UUID (Fallback para hardware antigo)
        this.WEDO_LEGACY_UUID = "00001565-1212-efde-1523-785feabcd123";

        // Fallback or additional UUIDs
        this.LPF2_SERVICE_UUID = "00001623-1212-efde-1523-785feabcd123";

        // Flag de modo de operação
        this.isLegacy = false;

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
            
            // 1) CONEXÃO BLE: Configuração permissiva e listagem de serviços
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    this.WEDO_SERVICE_UUID, 
                    this.LPF2_SERVICE_UUID,
                    // Incluindo UUIDs comuns de serviços LEGO para garantir descoberta
                    "00001623-1212-efde-1623-785feabcd123",
                    "00001523-1212-efde-1523-785feabcd123"
                ]
            });

            // Delay de segurança para estabilidade do empilhamento Bluetooth
            await new Promise(r => setTimeout(r, 500));

            this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

            console.log("Conectando ao servidor GATT...");
            this.server = await this.device.gatt.connect();

            console.log("Procurando serviços...");
            
            // Listar todos os serviços disponíveis do dispositivo
            const services = await this.server.getPrimaryServices();
            console.log("Serviços encontrados:", services.map(s => s.uuid));

            this.characteristic = null;
            this.isLegacy = false; // Reset flag

            // Percorrer todas as characteristics de cada serviço para encontrar a 1624
            for (const service of services) {
                console.log(`Explorando serviço: ${service.uuid}`);
                try {
                    const characteristics = await service.getCharacteristics();
                    console.log(`  Características encontradas no serviço ${service.uuid}:`);
                    characteristics.forEach(c => {
                        console.log(`    - UUID: ${c.uuid}`);
                        console.log(`      Propriedades: ${JSON.stringify(c.properties)}`);
                    });
                    
                    // Normalização para comparação segura
                    const targetLpf2 = this.LPF2_COMMAND_UUID.toLowerCase();
                    const targetLegacy = this.WEDO_LEGACY_UUID.toLowerCase();

                    // Prioridade 1: LPF2 Command Characteristic (1624)
                    const lpf2Char = characteristics.find(c => c.uuid.toLowerCase().includes("1624") || c.uuid.toLowerCase() === targetLpf2);
                    if (lpf2Char) {
                        this.characteristic = lpf2Char;
                        this.service = service;
                        this.isLegacy = false;
                        console.log(`  -> [SUCESSO] Característica de Comando LPF2 (1624) ENCONTRADA!`);
                        
                        // Tentar iniciar notificações
                        try {
                            await this.characteristic.startNotifications();
                            this.characteristic.addEventListener('characteristicvaluechanged', this.handleNotification.bind(this));
                        } catch (eNotify) {
                            console.warn("  -> Não foi possível ativar notificações na 1624:", eNotify);
                        }
                        break;
                    }

                    // Prioridade 2: WeDo 2.0 Legacy Characteristic (1565) - Fallback
                    const legacyChar = characteristics.find(c => c.uuid.toLowerCase().includes("1565") || c.uuid.toLowerCase() === targetLegacy);
                    if (legacyChar && !this.characteristic) {
                         this.characteristic = legacyChar;
                         this.service = service;
                         this.isLegacy = true;
                         console.log(`  -> [SUCESSO] Característica Legacy WeDo 2.0 (1565) ENCONTRADA! (Modo de Compatibilidade Ativado)`);
                         // Se achou a legacy, não damos break imediatamente para tentar achar a LPF2 em outro serviço, 
                         // mas se não achar, usaremos esta.
                    }
                    
                    // Prioridade 3: Fallback Genérico (Universal Write)
                    // Se ainda não temos characteristic definida (nem LPF2 nem Legacy encontrada anteriormente neste loop),
                    // procuramos qualquer característica que permita escrita.
                    if (!this.characteristic) {
                        const writeChar = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);
                        if (writeChar) {
                            console.log(`  -> [TENTATIVA] Característica Genérica de Escrita encontrada: ${writeChar.uuid}`);
                            // Salvamos como candidato, mas continuamos procurando por uma específica melhor
                            // Se ao final de tudo não tivermos nada, usaremos esta.
                            this.characteristic = writeChar;
                            this.service = service;
                            // Assumimos Legacy por segurança se for um UUID desconhecido curto, ou LPF2 se for longo... 
                            // Na dúvida, tentamos LPF2 primeiro se o UUID não for explicitamente o 1565.
                            this.isLegacy = writeChar.uuid.includes("1565"); 
                            console.log(`  -> Usando característica genérica (Modo Legacy: ${this.isLegacy})`);
                        }
                    }

                } catch (eServ) {
                    console.warn(`  Erro ao listar características do serviço ${service.uuid}:`, eServ);
                }
            }

            if (!this.characteristic) {
                throw new Error("Falha crítica: Nenhuma característica de comando (1624, 1565 ou Genérica de Escrita) encontrada.");
            }
            
            if (this.isLegacy) {
                console.warn("AVISO: Operando em modo Legacy (WeDo 2.0 Original). Protocolo ajustado automaticamente.");
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

    handleNotification(event) {
        // Placeholder para processamento de dados de sensores
        // const value = event.target.value;
        // console.log("Notificação recebida:", value);
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

        // 5) ESTABILIDADE: Fila de comandos e delay
        this.commandQueue = this.commandQueue.then(async () => {
            const buffer = new Uint8Array(data);
            
            try {
                // Usar writeValueWithResponse conforme solicitado
                await this.characteristic.writeValueWithResponse(buffer);
                // Delay pequeno entre comandos (20-50ms)
                await new Promise(r => setTimeout(r, 40)); 
            } catch (e) {
                const isGattBusy = e.name === 'NetworkError' && e.message.includes('GATT operation already in progress');
                
                if (isGattBusy) {
                    console.warn("GATT ocupado, tentando novamente em breve...");
                    await new Promise(r => setTimeout(r, 100));
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

    // 2) MOTOR
    async motorA(speed) {
        let s = parseInt(speed);
        if (isNaN(s)) s = 100;
        if (s > 100) s = 100;
        if (s < -100) s = -100;

        // Converter para complemento de 2 (Uint8) para valores negativos
        let powerByte = s;
        if (powerByte < 0) powerByte = 256 + powerByte;

        console.log(`WeDo: Motor A (Porta 1) Speed ${s} (Legacy: ${this.isLegacy})`);
        
        if (this.isLegacy) {
            // Protocolo WeDo 2.0 Legacy (Characteristic 1565)
            // [PortID, CommandID=1, Mode=1, Power]
            await this.sendCommand([0x01, 0x01, 0x01, powerByte]);
        } else {
            // Protocolo LPF2 (Characteristic 1624)
            // [0x06, 0x00, 0x81, PORT, 0x11, 0x51, POWER]
            await this.sendCommand([0x06, 0x00, 0x81, 0x01, 0x11, 0x51, powerByte]);
        }
    }

    async motorB(speed) {
        let s = parseInt(speed);
        if (isNaN(s)) s = 100;
        if (s > 100) s = 100;
        if (s < -100) s = -100;

        let powerByte = s;
        if (powerByte < 0) powerByte = 256 + powerByte;

        console.log(`WeDo: Motor B (Porta 2) Speed ${s} (Legacy: ${this.isLegacy})`);
        
        if (this.isLegacy) {
            // Protocolo WeDo 2.0 Legacy (Characteristic 1565)
            await this.sendCommand([0x02, 0x01, 0x01, powerByte]);
        } else {
            // Protocolo LPF2 (Characteristic 1624)
            await this.sendCommand([0x06, 0x00, 0x81, 0x02, 0x11, 0x51, powerByte]);
        }
    }

    async motorOff() {
        console.log("WeDo: Motor OFF");
        if (this.isLegacy) {
             await this.sendCommand([0x01, 0x01, 0x01, 0x00]);
             await this.sendCommand([0x02, 0x01, 0x01, 0x00]);
        } else {
             await this.sendCommand([0x06, 0x00, 0x81, 0x01, 0x11, 0x51, 0x00]);
             await this.sendCommand([0x06, 0x00, 0x81, 0x02, 0x11, 0x51, 0x00]);
        }
    }

    // Compatibilidade com blocos genéricos
    async motorOn(speed) {
        // Mapeia o bloco genérico "Motor On" para o Motor A
        await this.motorA(speed);
    }

    async playSound(soundName) {
        console.log(`WeDo: Tocar som ${soundName} (Simulado)`);
        // Aqui poderia entrar a implementação de Web Audio API se necessário
        // Por enquanto, apenas evita erro de execução
    }

    // 3) LED
    async setLED(colorHex) {
        // Mapeamento de Cores LPF2
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

        let index = 3; // Default Blue
        if (colorHex && typeof colorHex === 'string') {
             const normalized = colorHex.toLowerCase();
             if (colors.hasOwnProperty(normalized)) {
                 index = colors[normalized];
             }
        }
        
        console.log(`WeDo: Set LED ${colorHex} (Index ${index})`);

        if (this.isLegacy) {
            // Protocolo WeDo 2.0 Legacy (Characteristic 1565)
            // LED is Port 0x06. Command 0x04 (Set Color RGB?) or similar.
            // Padrão WeDo 2.0 para LED: Port 6, Mode 0, Command Set Output
            // [0x06, 0x04, 0x01, index]
            await this.sendCommand([0x06, 0x04, 0x01, index]);
        } else {
            // Enviar comando via LPF2.
            // Usando estrutura padrão Output Command para Porta 6 (LED)
            // [0x06, 0x00, 0x81, 0x06, 0x11, 0x51, COLOR_INDEX]
            await this.sendCommand([0x06, 0x00, 0x81, 0x06, 0x11, 0x51, index]);
        }
    }

    // 4) SENSORES (Mock / Preparado para implementação real)
    async getDistance() {
        // Retorna valor simulado por enquanto (0-10)
        return Math.floor(Math.random() * 10); 
    }

    async getTilt() {
        // Retorna valor simulado (0-4)
        // 0: Flat, 1: Up, 2: Down, 3: Left, 4: Right
        return Math.floor(Math.random() * 5); 
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async stopAll() {
        await this.motorOff();
    }
}
