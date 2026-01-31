import { BLOCK_TEMPLATES } from './templates.js';

export function defineCustomBlocks(blocksConfig) {
    
    // --- Colors (WeDo 2.0 Palette - Refined) ---
    const COLOUR_SENSOR = "#4CAF50";  // Green (Sensors)

    // Define Dynamic Blocks from Config
    if (Array.isArray(blocksConfig)) {
        blocksConfig.forEach(blockDef => {
            const template = BLOCK_TEMPLATES[blockDef.type];
            if (template) {
                Blockly.Blocks[blockDef.id] = {
                    init: function() {
                        template.init(this, blockDef.icon);
                        if (blockDef.name) {
                            this.setTooltip(blockDef.name);
                        }
                    }
                };
            }
        });
    }

    // --- Static Sensors (Not currently templated/dynamic) ---

    // Sensor: Distance
    Blockly.Blocks['sensor_distance'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("📏")
                .appendField("Distância");
            this.setOutput(true, "Number");
            this.setColour(COLOUR_SENSOR);
            this.setTooltip("Distância");
            this.setInputsInline(true);
        }
    };
    
    // Sensor: Tilt
    Blockly.Blocks['sensor_tilt'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("📐")
                .appendField(new Blockly.FieldDropdown([
                    ["Inclinação X", "x"],
                    ["Inclinação Y", "y"]
                ]), "AXIS");
            this.setOutput(true, "Number");
            this.setColour(COLOUR_SENSOR);
            this.setTooltip("Lê a inclinação (Eixo X ou Y)");
            this.setInputsInline(true);
        }
    };
}
