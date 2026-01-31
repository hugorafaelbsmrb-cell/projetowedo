
export function defineGenerators() {
    if (!Blockly.JavaScript) {
        console.warn("Blockly.JavaScript not available");
        return;
    }

    // Event: Start
    Blockly.JavaScript['event_start'] = function(block) {
        var nextCode = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
        // Since this is the start block, we return the code string directly.
        // It's the entry point.
        return nextCode;
    };

    // Motor: On
    Blockly.JavaScript['motor_on'] = function(block) {
        var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '50';
        var nextCode = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
        
        var code = `await driver.motorOn(${speed});\n${nextCode}`;
        return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };

    // Motor: Spin
    Blockly.JavaScript['motor_spin'] = function(block) {
        var direction = block.getFieldValue('DIRECTION'); // "CW" or "CCW"
        var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '50';
        var nextCode = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
        
        // Convert speed based on direction if driver expects signed speed
        // Or driver handles direction separately. Let's assume driver.motorSpin(direction, speed) or similar.
        // Existing wedo_driver has motorOn(speed). 
        // If speed is negative, it might reverse?
        // Let's assume we pass direction logic here or driver handles it.
        // Let's check wedo_driver.js later. For now, generated code:
        
        var code = `await driver.motorSpin('${direction}', ${speed});\n${nextCode}`;
        return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };

    // Motor A
    Blockly.JavaScript['motor_a_speed'] = function(block) {
        var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '50';
        var nextCode = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
        var code = `await driver.motorA(${speed});\n${nextCode}`;
        return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };

    // Motor B
    Blockly.JavaScript['motor_b_speed'] = function(block) {
        var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '50';
        var nextCode = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
        var code = `await driver.motorB(${speed});\n${nextCode}`;
        return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };

    // Motor Off
    Blockly.JavaScript['motor_off'] = function(block) {
        var nextCode = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
        var code = `await driver.motorOff();\n${nextCode}`;
        return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };

    // LED Color
    Blockly.JavaScript['led_set_color'] = function(block) {
        var color = block.getFieldValue('COLOR');
        var nextCode = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
        var code = `await driver.setLED('${color}');\n${nextCode}`;
        return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };

    // Wait
    Blockly.JavaScript['control_wait'] = function(block) {
        var duration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        var nextCode = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
        // Convert seconds to milliseconds
        var code = `await driver.wait(${duration} * 1000);\n${nextCode}`;
        return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };

    // Repeat
    Blockly.JavaScript['control_repeat'] = function(block) {
        var times = Blockly.JavaScript.valueToCode(block, 'TIMES', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        var substack = Blockly.JavaScript.valueToCode(block, 'SUBSTACK', Blockly.JavaScript.ORDER_ATOMIC) || '';
        var nextCode = Blockly.JavaScript.valueToCode(block, 'NEXT', Blockly.JavaScript.ORDER_ATOMIC) || '';
        
        var code = `
        for (let i = 0; i < ${times}; i++) {
            ${substack}
        }
        ${nextCode}`;
        return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // Sensors (Value blocks - already correct, they return [code, order])
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
