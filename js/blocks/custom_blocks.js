export function defineCustomBlocks() {
    
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
            this.setColour("#FFD700");
            this.setTooltip("Começa o programa");
            this.setHelpUrl("");
            this.setStyle('hat_blocks'); // Optional, needs theme support usually, but color works
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
            this.setColour("#4CAF50");
            this.setTooltip("Liga o motor na velocidade definida");
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
            this.setColour("#4CAF50");
            this.setTooltip("Gira o motor na direção e velocidade especificadas");
        }
    };

    // Motor: Off
    Blockly.Blocks['motor_off'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Desligar Motor");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4CAF50");
            this.setTooltip("Para o motor");
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
            this.setColour("#2196F3");
            this.setTooltip("Pausa a execução");
        }
    };

    // --- Sensors ---

    // Sensor: Distance
    Blockly.Blocks['sensor_distance'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Distância (cm)");
            this.setOutput(true, "Number");
            this.setColour("#E91E63");
            this.setTooltip("Lê a distância em cm");
        }
    };

    // Sensor: Tilt
    Blockly.Blocks['sensor_tilt'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Inclinação/Botão");
            this.setOutput(true, "Number");
            this.setColour("#E91E63");
            this.setTooltip("Lê status de inclinação ou botão (0 ou 1)");
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
            this.setColour("#9C27B0");
            this.setTooltip("Toca um som no computador");
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
