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

    Blockly.JavaScript['event_start'] = function(block) {
        // The start block is just an entry point, it doesn't generate code itself 
        // that executes, but it might be used to wrap logic.
        // In our simple linear execution model, we just ignore it and generate the next blocks.
        return '';
    };

    Blockly.JavaScript['motor_on'] = function(block) {
        var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '100';
        // Generate async call
        return `await driver.motorOn(${speed});\n`;
    };

    Blockly.JavaScript['motor_off'] = function(block) {
        return `await driver.motorOff();\n`;
    };

    Blockly.JavaScript['control_wait'] = function(block) {
        var duration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        // Convert seconds to ms
        return `await driver.wait(${duration} * 1000);\n`;
    };

    Blockly.JavaScript['sensor_distance'] = function(block) {
        var code = 'await driver.getDistance()';
        return [code, Blockly.JavaScript.ORDER_AWAIT || Blockly.JavaScript.ORDER_ATOMIC];
    };

    Blockly.JavaScript['sensor_tilt'] = function(block) {
        var code = 'await driver.getTilt()';
        return [code, Blockly.JavaScript.ORDER_AWAIT || Blockly.JavaScript.ORDER_ATOMIC];
    };

    Blockly.JavaScript['sound_play'] = function(block) {
        var sound = block.getFieldValue('SOUND');
        return `await driver.playSound("${sound}");\n`;
    };
}
