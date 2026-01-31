import { BLOCK_TEMPLATES } from './templates.js';

export function defineGenerators(blocksConfig) {
    if (!Blockly.JavaScript) {
        console.warn("Blockly.JavaScript not available");
        return;
    }

    // Dynamic Generators
    if (Array.isArray(blocksConfig)) {
        blocksConfig.forEach(blockDef => {
             const template = BLOCK_TEMPLATES[blockDef.type];
             if (template) {
                 Blockly.JavaScript[blockDef.id] = template.generator;
             }
        });
    }

    // Static Generators (Sensors)
    Blockly.JavaScript['sensor_distance'] = function(block) {
        var code = 'await driver.getDistance()';
        return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };

    Blockly.JavaScript['sensor_tilt'] = function(block) {
        var axis = block.getFieldValue('AXIS');
        var code = `await driver.getTilt('${axis}')`;
        return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };
}
