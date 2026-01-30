export function defineCustomBlocks() {
    
    // --- Colors ---
    const COLOUR_EVENT = "#FFD700"; // Amarelo
    const COLOUR_CONTROL = "#FF8C00"; // Laranja
    const COLOUR_MOTION = "#0066CC"; // Azul
    const COLOUR_SENSOR = "#4CAF50"; // Verde
    const COLOUR_SOUND = "#9C27B0"; // Roxo (Mantido ou ajustado se precisar)

    // --- Blocks Definitions ---

    // Event: Start
    Blockly.Blocks['event_start'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(
                    "https://www.gstatic.com/images/icons/material/system/2x/play_arrow_white_24dp.png",
                    24, 24, "Play"
                ))
                .appendField("Quando Iniciar");
            this.setNextStatement(true, null);
            this.setColour(COLOUR_EVENT);
            this.setTooltip("Começa o programa");
            this.setHelpUrl("");
        }
    };

    // Motor: On
    Blockly.Blocks['motor_on'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Ligar Motor");
            this.appendValueInput("SPEED")
                .setCheck("Number")
                .appendField("Velocidade");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(COLOUR_MOTION);
            this.setTooltip("Liga o motor na velocidade definida");
            this.setInputsInline(true);
        }
    };

    // Motor: Spin (Direction + Speed)
    Blockly.Blocks['motor_spin'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Girar Motor")
                .appendField(new Blockly.FieldDropdown([
                    ["Horário ↻", "CW"],
                    ["Anti-horário ↺", "CCW"]
                ]), "DIRECTION");
            this.appendValueInput("SPEED")
                .setCheck("Number")
                .appendField("Velocidade");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(COLOUR_MOTION);
            this.setTooltip("Gira o motor na direção e velocidade especificadas");
            this.setInputsInline(true);
        }
    };

    // Motor: Off
    Blockly.Blocks['motor_off'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Desligar Motor");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(COLOUR_MOTION);
            this.setTooltip("Para o motor");
            this.setInputsInline(true);
        }
    };

    // LED: Set Color
    Blockly.Blocks['led_set_color'] = {
        init: function() {
            const field = Blockly.FieldColour ? new Blockly.FieldColour("#ff0000") : new Blockly.FieldTextInput("#ff0000");
            this.appendDummyInput()
                .appendField("Definir LED")
                .appendField(field, "COLOR");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(COLOUR_MOTION);
            this.setTooltip("Muda a cor do LED do dispositivo");
            this.setInputsInline(true);
        }
    };

    // Control: Wait
    Blockly.Blocks['control_wait'] = {
        init: function() {
            this.appendValueInput("DURATION")
                .setCheck("Number")
                .appendField("Esperar");
            this.appendDummyInput()
                .appendField("segundos");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(COLOUR_CONTROL);
            this.setTooltip("Pausa a execução");
            this.setInputsInline(true);
        }
    };

    // Control: Repeat (Loop) - Custom visual wrapper for standard loop
    Blockly.Blocks['control_repeat'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Repetir");
            this.appendValueInput("TIMES")
                .setCheck("Number");
            this.appendDummyInput()
                .appendField("vezes");
            this.appendStatementInput("DO")
                .setCheck(null);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(COLOUR_CONTROL);
            this.setTooltip("Repete os blocos dentro");
            this.setInputsInline(true);
        }
    };

    // --- Sensors ---

    // Sensor: Distance
    Blockly.Blocks['sensor_distance'] = {
        init: function() {
            this.appendDummyInput()
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
                .appendField("Inclinação/Botão");
            this.setOutput(true, "Number");
            this.setColour(COLOUR_SENSOR);
            this.setTooltip("Lê status de inclinação ou botão (0 ou 1)");
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
        
        // Ensure speed is treated as number for calculation if it's a string from generator
        // But generator usually returns string code.
        // We want to construct the string: "-speed" or "speed".
        // Note: If speed expression is complex (e.g. "variable + 1"), we need parens.
        // But for simplicity, we assume simple numbers. 
        // Safer approach: multiply by -1 if CCW.
        
        if (direction === 'CCW') {
             return `await driver.motorOn(-1 * (${speed}));\n`;
        } else {
             return `await driver.motorOn(${speed});\n`;
        }
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
