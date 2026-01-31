export function defineCustomBlocks() {
    
    // --- Colors (WeDo 2.0 Palette) ---
    const COLOUR_EVENT = "#FFD700";   // Yellow (Flow)
    const COLOUR_CONTROL = "#FF8C00"; // Orange (Control)
    const COLOUR_MOTION = "#4CAF50";  // Green (Motor) - Note: User image shows Green for motors
    const COLOUR_SENSOR = "#E91E63";  // Pink/Red (Sensors/Display)
    const COLOUR_SOUND = "#E91E63";   // Pink (Sound)

    // --- Icons (Base64 SVGs) ---
    const ICON_PLAY = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwOTY4OCI+PHBhdGggZD0iTTggNXYxNGwxMS03eiIvPjwvc3ZnPg=="; // Green Play
    const ICON_MOTOR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTEyIDZ2MTIiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTE2IDhsLTQgNC00LTQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+";
    const ICON_WAIT = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiI+PHBhdGggZD0iTTYgMnY2bDYgNi02IDZ2NmgyNHYtNmwtNi02IDYtNlYySDZ6bTEwIDE0LjVMMTIgMTMgOCAxNi41VjIwMThoLTR2LTJsNC00LTQtNHYtMmg4djJsLTQgNCA0IDR2MmgtNHYtMi41eiIvPjwvc3ZnPg==";
    const ICON_LOOP = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiI+PHBhdGggZD0iTTEyIDRWMS43TDkgNS40bDMgMy43VjZoM2M3LjIgMCA3LjIgMTAgMCAxMEg4di0yaDRjNC44IDAgNC44LTggMC04aC0zem0tMyA1SDV2MTJoMTJ2LTJIN1Y5eiIvPjwvc3ZnPg==";
    const ICON_LED = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiI+PHBhdGggZD0iTTkgMjFoNnYtMi41SDlWMjF6bTMtMTlhNyA3IDAgMCAwLTcgN2MwIDIuMTQgMS4wNiAzLjkzIDIuNDcgNS4xOGwxLjUzIDEuMTZWMTdoNnYtMi42NWwxLjUzLTEuMTZBNyA3IDAgMCAwIDEyIDJ6bTMuNSA3YzAgMS4zLS41IDIuNS0xLjIgMy41bC0xLjEgMS4yVjE1aC00LjR2LTEuM2wtMS4xLTEuMkE1LjUgNS41IDAgMCAxIDEyIDRjMy4wNSAwIDUuNSAyLjQ1IDUuNSA1eiIvPjwvc3ZnPg==";
    const ICON_SOUND = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiI+PHBhdGggZD0iTTEyIDN2MTAuNTVjLS41OS0uMzQtMS4yNy0uNTUtMi0uNTUtMi4yMSAwLTQgMS43OS00IDRzMS43OSA0IDQgNCA0LTEuNzkgNC00VjdoNHYtNGgtOHoiLz48L3N2Zz4=";

    // --- Blocks Definitions ---

    // Event: Start
    Blockly.Blocks['event_start'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICON_PLAY, 40, 40, "Play"));
            this.setNextStatement(true, null);
            this.setColour(COLOUR_EVENT);
            this.setTooltip("Começar");
            this.setInputsInline(true);
        }
    };

    // Motor: On (Simpler)
    Blockly.Blocks['motor_on'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICON_MOTOR, 32, 32, "Motor"));
            this.appendValueInput("SPEED")
                .setCheck("Number");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(COLOUR_MOTION);
            this.setTooltip("Ligar Motor");
            this.setInputsInline(true);
        }
    };

    // Motor: Spin (Direction + Speed)
    Blockly.Blocks['motor_spin'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICON_MOTOR, 32, 32, "Motor"));
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([
                    ["↻", "CW"],
                    ["↺", "CCW"]
                ]), "DIRECTION");
            this.appendValueInput("SPEED")
                .setCheck("Number");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
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
                .appendField(new Blockly.FieldImage(ICON_MOTOR, 24, 24, "Motor A"));
            this.appendValueInput("SPEED")
                .setCheck("Number");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(COLOUR_MOTION);
            this.setInputsInline(true);
        }
    };

    Blockly.Blocks['motor_b_speed'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("B")
                .appendField(new Blockly.FieldImage(ICON_MOTOR, 24, 24, "Motor B"));
            this.appendValueInput("SPEED")
                .setCheck("Number");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(COLOUR_MOTION);
            this.setInputsInline(true);
        }
    };

    // Motor: Off
    Blockly.Blocks['motor_off'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICON_MOTOR, 32, 32, "Motor"))
                .appendField("🛑");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
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
                .appendField(new Blockly.FieldImage(ICON_LED, 32, 32, "LED"))
                .appendField(field, "COLOR");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(COLOUR_MOTION); // Using Motion color as per user preference (or distinct?) WeDo uses same color for output.
            this.setTooltip("Cor LED");
            this.setInputsInline(true);
        }
    };

    // Control: Wait
    Blockly.Blocks['control_wait'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICON_WAIT, 32, 32, "Wait"));
            this.appendValueInput("DURATION")
                .setCheck("Number");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(COLOUR_CONTROL);
            this.setTooltip("Esperar");
            this.setInputsInline(true);
        }
    };

    // Control: Repeat (Loop)
    Blockly.Blocks['control_repeat'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICON_LOOP, 32, 32, "Loop"));
            this.appendValueInput("TIMES")
                .setCheck("Number");
            this.appendStatementInput("DO")
                .setCheck(null);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
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
    
    Blockly.Blocks['sensor_tilt'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("📐");
            this.setOutput(true, "Number");
            this.setColour(COLOUR_SENSOR);
            this.setTooltip("Inclinação");
            this.setInputsInline(true);
        }
    };
}
                .appendField("Distância (cm)");
            this.setOutput(true, "Number");
            this.setColour(COLOUR_SENSOR);
            this.setTooltip("Lê a distância em cm");
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
                .appendField("Tocar Som")
                .appendField(new Blockly.FieldDropdown([
                    ["Bip", "BEEP"], 
                    ["Sucesso", "SUCCESS"], 
                    ["Alerta", "ALERT"]
                ]), "SOUND");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(COLOUR_SOUND);
            this.setTooltip("Toca um som no computador");
            this.setInputsInline(true);
        }
    };

    // --- Generators ---

    const generator = Blockly.JavaScript;
    
    // Helper to register generator correctly for v10+ or older
    function registerGenerator(blockName, generatorFunction) {
        if (generator.forBlock) {
            generator.forBlock[blockName] = generatorFunction;
        } else {
            generator[blockName] = generatorFunction;
        }
    }

    registerGenerator('event_start', function(block) {
        // The start block is just an entry point
        return '';
    });

    registerGenerator('motor_on', function(block) {
        var speed = generator.valueToCode(block, 'SPEED', generator.ORDER_ATOMIC) || '100';
        return `await driver.motorOn(${speed});\n`;
    });

    registerGenerator('motor_spin', function(block) {
        var direction = block.getFieldValue('DIRECTION');
        var speed = generator.valueToCode(block, 'SPEED', generator.ORDER_ATOMIC) || '100';
        
        if (direction === 'CCW') {
             return `await driver.motorOn(-1 * (${speed}));\n`;
        } else {
             return `await driver.motorOn(${speed});\n`;
        }
    });

    registerGenerator('motor_a_speed', function(block) {
        var speed = generator.valueToCode(block, 'SPEED', generator.ORDER_ATOMIC) || '100';
        return `await driver.motorA(${speed});\n`;
    });

    registerGenerator('motor_b_speed', function(block) {
        var speed = generator.valueToCode(block, 'SPEED', generator.ORDER_ATOMIC) || '100';
        return `await driver.motorB(${speed});\n`;
    });

    registerGenerator('motor_off', function(block) {
        return `await driver.motorOff();\n`;
    });

    registerGenerator('led_set_color', function(block) {
        var color = block.getFieldValue('COLOR');
        return `await driver.setLED("${color}");\n`;
    });

    registerGenerator('control_repeat', function(block) {
        var times = generator.valueToCode(block, 'TIMES', generator.ORDER_ATOMIC) || '0';
        var branch = generator.statementToCode(block, 'DO');
        return `
        for (let i = 0; i < ${times}; i++) {
            ${branch}
        }
        `;
    });

    registerGenerator('control_wait', function(block) {
        var duration = generator.valueToCode(block, 'DURATION', generator.ORDER_ATOMIC) || '1';
        return `await driver.wait(${duration} * 1000);\n`;
    });

    registerGenerator('sensor_distance', function(block) {
        var code = 'await driver.getDistance()';
        return [code, generator.ORDER_AWAIT || generator.ORDER_ATOMIC];
    });

    registerGenerator('sensor_tilt', function(block) {
        var code = 'await driver.getTilt()';
        return [code, generator.ORDER_AWAIT || generator.ORDER_ATOMIC];
    });

    registerGenerator('sound_play', function(block) {
        var sound = block.getFieldValue('SOUND');
        return `await driver.playSound("${sound}");\n`;
    });
}
