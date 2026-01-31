// js/drivers/wedo_driver.js
// Driver WeDo 2.0 usando node-poweredup (ESTÁVEL)

export class WeDoDriver {
    constructor() {
        this.poweredUP = null;
        this.hub = null;
        this.connected = false;
    }

    /* ===============================
       CONECTAR AO HUB
    =============================== */
    async connect() {
        if (!window.PoweredUP) {
            throw new Error("Biblioteca PoweredUP não carregada.");
        }

        this.poweredUP = new PoweredUP.PoweredUP();

        return new Promise((resolve, reject) => {
            this.poweredUP.on("discover", async (hub) => {
                try {
                    console.log("🟦 Hub encontrado:", hub.name);
                    this.hub = hub;

                    await hub.connect();
                    this.connected = true;

                    console.log("✅ WeDo 2.0 conectado via PoweredUP");
                    resolve(true);
                } catch (e) {
                    reject(e);
                }
            });

            this.poweredUP.scan();
        });
    }

    /* ===============================
       ADAPTADORES DE INTERFACE
    =============================== */
    isConnected() { return this.connected; }
    
    disconnect() {
        if (this.hub) {
            this.hub.disconnect();
        }
        this.connected = false;
    }

    async wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    
    async stopAll() { 
        await this.motorOff(); 
    }
    
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
        if (!this.hub) return;
        await this.hub.setMotorSpeed("A", speed);
    }

    async motorB(speed) {
        if (!this.hub) return;
        await this.hub.setMotorSpeed("B", speed);
    }

    async motorOff() {
        if (!this.hub) return;
        await this.hub.setMotorSpeed("A", 0);
        await this.hub.setMotorSpeed("B", 0);
    }

    /* ===============================
       LED DO HUB
    =============================== */
    async setLED(color) {
        if (!this.hub) return;

        // Mapeamento HEX para Cores PoweredUP (Compatibilidade)
        let colorName = "off";
        
        if (typeof color === 'string') {
            const hex = color.toLowerCase();
            // Mapa aproximado HEX -> PoweredUP Color Name
            const map = {
                "#000000": "off",
                "#ffc0cb": "pink",
                "#800080": "purple",
                "#0000ff": "blue",
                "#00ffff": "cyan",
                "#008080": "green", // Teal -> Green (approx)
                "#00ff00": "green",
                "#ffff00": "yellow",
                "#ffa500": "orange", // Orange -> Red/Yellow? PoweredUP usually supports orange? Check docs if fail. 
                // PoweredUP colors: black, pink, purple, blue, lightblue, cyan, green, yellow, orange, red, white
                "#ff0000": "red",
                "#ffffff": "white"
            };
            
            // Ajuste para cores específicas se necessário, mas 'orange' costuma existir no WeDo via PoweredUP
            colorName = map[hex] || "white";
        } else if (typeof color === 'number') {
             // Se vier index numérico (legado), mapeia para cores básicas
             const indexMap = ["off", "pink", "purple", "blue", "cyan", "green", "green", "yellow", "orange", "red", "white"];
             colorName = indexMap[color] || "white";
        } else {
             colorName = color; // Assume que já veio string válida (ex: "red")
        }

        // Cores aceitas: "red", "green", "blue", "yellow", "white", "off" ...
        try {
            await this.hub.setLEDColor(colorName);
        } catch (e) {
            console.warn("Cor não suportada ou erro no LED:", e);
        }
    }
}
