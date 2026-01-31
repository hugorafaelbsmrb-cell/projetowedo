export function defineCustomBlocks() {
    
    // --- Colors (WeDo 2.0 Palette - Refined) ---
    const COLOUR_EVENT = "#FFB300";   // Amber (Events)
    const COLOUR_MOTION = "#0091EA";  // Blue (Motors)
    const COLOUR_CONTROL = "#FF6D00"; // Deep Orange (Control/Loops)
    const COLOUR_SENSOR = "#4CAF50";  // Green (Sensors)
    const COLOUR_SOUND = "#E91E63";   // Pink (Sound)

    // --- Configuration: Icons (Admin Area) ---
    // Change these paths to point to your PNG files in 'assets/block_icons/'
    // Default is .svg, but you can replace with .png if you upload PNG files.
    const ICON_PATH = 'assets/block_icons/';
    
    const ICONS = {
        PLAY: ICON_PATH + 'play.svg',   // Replace with 'play.png'
        MOTOR: ICON_PATH + 'motor.svg', // Replace with 'motor.png'
        WAIT: ICON_PATH + 'wait.svg',   // Replace with 'wait.png'
        LOOP: ICON_PATH + 'loop.svg',   // ...
        LED: ICON_PATH + 'led.svg',
        SOUND: ICON_PATH + 'sound.svg'
    };

    // --- Blocks Definitions ---

    // Event: Start
    Blockly.Blocks['event_start'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICONS.PLAY, 32, 32, "Play"));
            this.appendValueInput("NEXT")
                .setCheck("WEDO");
            this.setColour(COLOUR_EVENT);
            this.setTooltip("Começar");
            this.setInputsInline(true);
        }
    };

    // Motor: On (Simpler)
    Blockly.Blocks['motor_on'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICONS.MOTOR, 32, 32, "Motor"));
            this.appendValueInput("SPEED")
                .setCheck("Number");
            this.appendValueInput("NEXT")
                .setCheck("WEDO");
            this.setOutput(true, "WEDO");
            this.setColour(COLOUR_MOTION);
            this.setTooltip("Ligar Motor");
            this.setInputsInline(true);
        }
    };

    // Motor: Spin (Direction + Speed)
    Blockly.Blocks['motor_spin'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICONS.MOTOR, 32, 32, "Motor"));
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([
                    ["↻", "CW"],
                    ["↺", "CCW"]
                ]), "DIRECTION");
            this.appendValueInput("SPEED")
                .setCheck("Number");
            this.appendValueInput("NEXT")
                .setCheck("WEDO");
            this.setOutput(true, "WEDO");
            this.setColour(COLOUR_MOTION);
            this.setTooltip("Girar Motor");
            this.setInputsInline(true);
        }
    };

    // Motor A/B (Specific Ports)
    Blockly.Blocks['motor_a_speed'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("A")
                .appendField(new Blockly.FieldImage(ICONS.MOTOR, 24, 24, "Motor A"));
            this.appendValueInput("SPEED")
                .setCheck("Number");
            this.appendValueInput("NEXT")
                .setCheck("WEDO");
            this.setOutput(true, "WEDO");
            this.setColour(COLOUR_MOTION);
            this.setInputsInline(true);
        }
    };

    Blockly.Blocks['motor_b_speed'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("B")
                .appendField(new Blockly.FieldImage(ICONS.MOTOR, 24, 24, "Motor B"));
            this.appendValueInput("SPEED")
                .setCheck("Number");
            this.appendValueInput("NEXT")
                .setCheck("WEDO");
            this.setOutput(true, "WEDO");
            this.setColour(COLOUR_MOTION);
            this.setInputsInline(true);
        }
    };

    // Motor: Off
    Blockly.Blocks['motor_off'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICONS.MOTOR, 32, 32, "Motor"))
                .appendField("🛑");
            this.appendValueInput("NEXT")
                .setCheck("WEDO");
            this.setOutput(true, "WEDO");
            this.setColour(COLOUR_MOTION);
            this.setTooltip("Parar Motor");
            this.setInputsInline(true);
        }
    };

    // LED: Set Color
    Blockly.Blocks['led_set_color'] = {
        init: function() {
            const wedoColors = [
                "#000000", "#ffc0cb", "#800080", "#0000ff", 
                "#00ffff", "#008080", "#00ff00", "#ffff00", 
                "#ffa500", "#ff0000", "#ffffff"
            ];
            
            let field;
            if (Blockly.FieldColour) {
                field = new Blockly.FieldColour("#ff0000");
                field.setColours(wedoColors);
                field.setColumns(4);
            } else {
                field = new Blockly.FieldDropdown([["Red", "#ff0000"]]);
            }

            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICONS.LED, 32, 32, "LED"))
                .appendField(field, "COLOR");
            this.appendValueInput("NEXT")
                .setCheck("WEDO");
            this.setOutput(true, "WEDO");
            this.setColour(COLOUR_SENSOR); // Used Sensor color as per previous, but maybe Control? Keeping Sensor.
            this.setTooltip("Cor LED");
            this.setInputsInline(true);
        }
    };

    // Control: Wait
    Blockly.Blocks['control_wait'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICONS.WAIT, 32, 32, "Wait"));
            this.appendValueInput("DURATION")
                .setCheck("Number");
            this.appendValueInput("NEXT")
                .setCheck("WEDO");
            this.setOutput(true, "WEDO");
            this.setColour(COLOUR_CONTROL);
            this.setTooltip("Esperar");
            this.setInputsInline(true);
        }
    };

    // Control: Repeat (Loop)
    Blockly.Blocks['control_repeat'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICONS.LOOP, 32, 32, "Loop"));
            this.appendValueInput("TIMES")
                .setCheck("Number");
            this.appendValueInput("SUBSTACK")
                .setCheck("WEDO");
            this.appendValueInput("NEXT")
                .setCheck("WEDO");
            this.setOutput(true, "WEDO");
            this.setColour(COLOUR_CONTROL);
            this.setTooltip("Repetir");
            this.setInputsInline(true);
        }
    };

    // --- Sensors ---

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

    // --- Sounds ---

    // Sound: Play Note
    Blockly.Blocks['sound_play'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICONS.SOUND, 32, 32, "Sound"))
                .appendField(new Blockly.FieldDropdown([
                    ["Bip", "BEEP"], 
                    ["Sucesso", "SUCCESS"], 
                    ["Alerta", "ALERT"]
                ]), "SOUND");
            this.appendValueInput("NEXT")
                .setCheck("WEDO");
            this.setOutput(true, "WEDO");
            this.setColour(COLOUR_SOUND);
            this.setTooltip("Toca um som no computador");
            this.setInputsInline(true);
        }
    };
}
