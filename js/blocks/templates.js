export const BLOCK_TEMPLATES = {
    'event_start': {
        label: 'Evento: Iniciar',
        category: 'Eventos',
        colour: '#FFB300',
        init: function(block, iconUrl) {
            block.appendDummyInput()
                .appendField(new Blockly.FieldImage(iconUrl, 40, 40, "Play"));
            block.appendValueInput("NEXT")
                .setCheck("WEDO");
            block.setInputsInline(true);
            block.setOutput(false);
            block.setNextStatement(false);
            block.setPreviousStatement(false);
        },
        generator: function(block) {
            var nextCode = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
            return nextCode; // It's a hat block start, usually triggers execution
        }
    },
    'motor_on': {
        label: 'Motor: Ligar',
        category: 'Movimento',
        colour: '#0091EA',
        init: function(block, iconUrl) {
            block.appendDummyInput()
                .appendField(new Blockly.FieldImage(iconUrl, 40, 40, "Motor"));
            block.appendValueInput("SPEED")
                .setCheck("Number");
            block.appendValueInput("NEXT")
                .setCheck("WEDO");
            block.setOutput(true, "WEDO");
            block.setInputsInline(true);
        },
        generator: function(block) {
            var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '50';
            var next = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
            return [`await driver.motorA(${speed});\n${next}`, Blockly.JavaScript.ORDER_ATOMIC];
        }
    },
    'motor_spin': {
        label: 'Motor: Girar',
        category: 'Movimento',
        colour: '#0091EA',
        init: function(block, iconUrl) {
            block.appendDummyInput()
                .appendField(new Blockly.FieldImage(iconUrl, 40, 40, "Spin"));
             block.appendValueInput("SPEED")
                .setCheck("Number");
            block.appendValueInput("NEXT")
                .setCheck("WEDO");
            block.setOutput(true, "WEDO");
            block.setInputsInline(true);
        },
        generator: function(block) {
            var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '50';
            var next = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
            // Assuming spin logic handled by driver or negative speed
            return [`await driver.motorA(${speed});\n${next}`, Blockly.JavaScript.ORDER_ATOMIC];
        }
    },
    'motor_off': {
        label: 'Motor: Parar',
        category: 'Movimento',
        colour: '#0091EA',
        init: function(block, iconUrl) {
            block.appendDummyInput()
                .appendField(new Blockly.FieldImage(iconUrl, 40, 40, "Stop"));
            block.appendValueInput("NEXT")
                .setCheck("WEDO");
            block.setOutput(true, "WEDO");
            block.setInputsInline(true);
        },
        generator: function(block) {
            var next = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
            return [`await driver.motorOff();\n${next}`, Blockly.JavaScript.ORDER_ATOMIC];
        }
    },
    'control_wait': {
        label: 'Controle: Esperar',
        category: 'Controle',
        colour: '#FF6D00',
        init: function(block, iconUrl) {
            block.appendDummyInput()
                .appendField(new Blockly.FieldImage(iconUrl, 40, 40, "Wait"));
            block.appendValueInput("DURATION")
                .setCheck("Number");
            block.appendValueInput("NEXT")
                .setCheck("WEDO");
            block.setOutput(true, "WEDO");
            block.setInputsInline(true);
        },
        generator: function(block) {
            var duration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ATOMIC) || '1';
            var next = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
            return [`await new Promise(r => setTimeout(r, ${duration} * 1000));\n${next}`, Blockly.JavaScript.ORDER_ATOMIC];
        }
    },
    'control_repeat': {
        label: 'Controle: Repetir',
        category: 'Controle',
        colour: '#FF6D00',
        init: function(block, iconUrl) {
            block.appendDummyInput()
                .appendField(new Blockly.FieldImage(iconUrl, 40, 40, "Loop"));
            block.appendValueInput("TIMES")
                .setCheck("Number");
            block.appendValueInput("DO")
                .setCheck("WEDO");
             block.appendValueInput("NEXT")
                .setCheck("WEDO");
            block.setOutput(true, "WEDO");
            block.setInputsInline(true);
        },
        generator: function(block) {
            var times = Blockly.JavaScript.valueToCode(block, 'TIMES', Blockly.JavaScript.ORDER_ATOMIC) || '10';
            var branch = Blockly.JavaScript.valueToCode(block, 'DO', Blockly.JavaScript.ORDER_ATOMIC) || '';
            var next = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
            // Simple loop unrolling for horizontal execution flow? 
            // Or actual loop structure? 
            // In WeDo horizontal flow, Loop is tricky. 
            // Usually: Loop -> [Sequence] -> Next
            return [`for(let i=0; i<${times}; i++) { ${branch} }\n${next}`, Blockly.JavaScript.ORDER_ATOMIC];
        }
    },
    'led_set_color': {
        label: 'LED: Definir Cor',
        category: 'Movimento', // WeDo groups Light with Motors
        colour: '#0091EA',
        init: function(block, iconUrl) {
            block.appendDummyInput()
                .appendField(new Blockly.FieldImage(iconUrl, 40, 40, "LED"));
            // Maybe input for color index?
            block.appendValueInput("COLOR")
                .setCheck("Number");
            block.appendValueInput("NEXT")
                .setCheck("WEDO");
            block.setOutput(true, "WEDO");
            block.setInputsInline(true);
        },
        generator: function(block) {
             var color = Blockly.JavaScript.valueToCode(block, 'COLOR', Blockly.JavaScript.ORDER_ATOMIC) || '0';
             var next = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
             return [`await driver.setLED(${color});\n${next}`, Blockly.JavaScript.ORDER_ATOMIC];
        }
    },
    'sound_play': {
        label: 'Som: Tocar',
        category: 'Som',
        colour: '#E91E63',
        init: function(block, iconUrl) {
            block.appendDummyInput()
                .appendField(new Blockly.FieldImage(iconUrl, 40, 40, "Sound"));
            block.appendValueInput("NEXT")
                .setCheck("WEDO");
            block.setOutput(true, "WEDO");
            block.setInputsInline(true);
        },
        generator: function(block) {
            var next = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
            return [`await driver.playSound();\n${next}`, Blockly.JavaScript.ORDER_ATOMIC];
        }
    }
};
