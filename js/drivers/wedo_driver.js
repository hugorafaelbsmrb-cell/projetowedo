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

            // Percorrer todas as characteristics de cada serviço
            for (const service of services) {
                console.log(`Explorando serviço: ${service.uuid}`);
                try {
                    const characteristics = await service.getCharacteristics();
                    
                    // Normalização para comparação segura
                    const targetLpf2 = this.LPF2_COMMAND_UUID.toLowerCase(); // 1624
                    const targetLegacy = this.WEDO_LEGACY_UUID.toLowerCase(); // 1565
                    const targetLegacyService = this.WEDO_SERVICE_UUID.toLowerCase(); // 1523

                    // VERIFICAÇÃO ESTRITA: Se estamos no serviço 1523, procuramos APENAS a 1565
                    if (service.uuid.toLowerCase() === targetLegacyService) {
                         const exactLegacy = characteristics.find(c => c.uuid.toLowerCase() === targetLegacy);
                         if (exactLegacy) {
                             this.characteristic = exactLegacy;
                             this.service = service;
                             this.isLegacy = true;
                             console.log(`  -> [SUCESSO ABSOLUTO] Característica Legacy WeDo 2.0 (1565) encontrada no Serviço 1523!`);
                             break; // Encontramos a correta, paramos tudo.
                         }
                    }

                    // Prioridade 1: LPF2 Command Characteristic (1624)
                    // Só aceita se não tivermos encontrado a Legacy ainda
                    if (!this.characteristic) {
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
                    }

                    // Prioridade 2: Busca varredura por 1565 (caso não esteja no serviço 1523 por algum motivo bizarro)
                    if (!this.characteristic) {
                        const legacyChar = characteristics.find(c => c.uuid.toLowerCase().includes("1565") || c.uuid.toLowerCase() === targetLegacy);
                        if (legacyChar) {
                             this.characteristic = legacyChar;
                             this.service = service;
                             this.isLegacy = true;
                             console.log(`  -> [SUCESSO] Característica Legacy WeDo 2.0 (1565) ENCONTRADA (Varredura)!`);
                             break; 
                        }
                    }
                } catch (eServ) {
                    console.warn(`  Erro ao listar características do serviço ${service.uuid}:`, eServ);
                }
            }

            // Fallback Genérico (Último recurso - Cuidado para não pegar 1524 High Speed)
            if (!this.characteristic) {
                 console.warn("  -> Nenhuma característica oficial encontrada. Tentando fallback genérico seguro...");
                 for (const service of services) {
                     try {
                        const characteristics = await service.getCharacteristics();
                        // Procurar qualquer writeable QUE NÃO SEJA 1524 ou outras conhecidas de dados
                        const writeChar = characteristics.find(c => 
                            (c.properties.write || c.properties.writeWithoutResponse) &&
                            !c.uuid.includes("1524") && // Bloqueia High Speed Data
                            !c.uuid.includes("1560") && // Bloqueia Name
                            !c.uuid.includes("1561")    // Bloqueia Button
                        );
                        
                        if (writeChar) {
                            console.log(`  -> [FALLBACK] Usando característica genérica: ${writeChar.uuid}`);
                            this.characteristic = writeChar;
                            this.service = service;
                            this.isLegacy = true; // Assume legacy
                            break;
                        }
                     } catch(e) {}
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

    // 6) HANDLER DE NOTIFICAÇÕES (SENSORES)
    handleNotification(event) {
        const value = event.target.value;
        const data = new Uint8Array(value.buffer);
        // console.log("WeDo Notify:", data);

        // Protocolo de Sensor WeDo 2.0 (vheun/wedo2)
        // [PortID, SensorType, Data...]
        
        // Exemplo Tilt: [Port, 0x22 (Tilt), X, Y]
        // Exemplo Distance: [Port, 0x23 (Distance), DistLow, DistHigh]

        const portId = data[0]; // Port ID geralmente no byte 0 ou 1 dependendo do formato da notificação
        
        // Detectar tipo de sensor pelo ID da Porta ou Byte de Tipo
        // Simplificação: Assumir que Porta 1 e 2 são as portas externas.
        
        // TODO: Implementar parser robusto baseado na lib vheun/wedo2
        // Por enquanto, apenas logar para debug
        if (data.length > 2) {
             console.log(`WeDo Sensor Data (Port ${portId}):`, data);
        }
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
            
            // Log Hexadecimal para Debug
            const hexString = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join(' ');
            console.log(`WeDo Send [${hexString}] (Legacy: ${this.isLegacy})`);

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

        let powerByte = s;
        if (powerByte < 0) powerByte = 256 + powerByte;

        console.log(`WeDo: Motor A (Porta 1) Speed ${s} (Legacy: ${this.isLegacy})`);
        
        if (this.isLegacy) {
            // Protocolo WeDo 2.0 Legacy (Characteristic 1565)
            // Baseado em vheun/wedo2: [Port, 0x01, 0x02, Power]
            await this.sendCommand([0x01, 0x01, 0x02, powerByte]);
        } else {
            // Protocolo LPF2 (Characteristic 1624)
            // Motor na Porta 1
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
            await this.sendCommand([0x02, 0x01, 0x02, powerByte]);
        } else {
            // Protocolo LPF2 (Characteristic 1624)
            // Motor na Porta 2
            await this.sendCommand([0x06, 0x00, 0x81, 0x02, 0x11, 0x51, powerByte]);
        }
    }

    async motorOff() {
        console.log("WeDo: Motor OFF");
        if (this.isLegacy) {
             await this.sendCommand([0x01, 0x01, 0x02, 0x00]);
             await this.sendCommand([0x02, 0x01, 0x02, 0x00]);
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
        // Mapeamento de cores baseado em vheun/wedo2
        const colorMap = {
            "#000000": 0, // BLACK
            "#ff0000": 9, // RED
            "#00ff00": 6, // GREEN
            "#0000ff": 3, // BLUE
            "#ffff00": 7, // YELLOW
            "#ff00ff": 1, // PINK (WeDo Pink)
            "#00ffff": 4, // CYAN
            "#ffffff": 10,// WHITE
            "#ffa500": 8  // ORANGE
        };

        const index = colorMap[colorHex.toLowerCase()] || 0;
        console.log(`WeDo: Set LED ${colorHex} (Index ${index})`);

        if (this.isLegacy) {
            // Protocolo WeDo 2.0 Legacy
            // Baseado em vheun/wedo2: [Port=0x06, Cmd=0x04, Mode=0x01, Index]
            await this.sendCommand([0x06, 0x04, 0x01, index]);
        } else {
            // Protocolo LPF2
            // [0x06, 0x00, 0x81, Port=0x06, 0x11, 0x51, Index]
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
