export function defineCustomBlocks() {
    
    // --- Colors (WeDo 2.0 Palette - Refined) ---
    const COLOUR_EVENT = "#FFB300";   // Amber (Events)
    const COLOUR_MOTION = "#0091EA";  // Blue (Motors)
    const COLOUR_CONTROL = "#FF6D00"; // Deep Orange (Control/Loops)
    const COLOUR_SENSOR = "#4CAF50";  // Green (Sensors)
    const COLOUR_SOUND = "#E91E63";   // Pink (Sound)

    // --- Icons (Custom WeDo Style with Circular Background) ---
    const ICON_PLAY = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4xNSkiIC8+CiAgPHBhdGggZD0iTTggNXYxNGwxMSt3eiIgZmlsbD0iI2ZmZiIgdHJhbnNmb3JtPSJzY2FsZSgwLjcpIHRyYW5zbGF0ZSg1LDUpIiAvPgo8L3N2Zz4=';
    const ICON_MOTOR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4xNSkiIHN0cm9rZT0ibm9uZSIgLz4KICA8ZyB0cmFuc2Zvcm09InNjYWxlKDAuNykgdHJhbnNsYXRlKDUsNSkiPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjgiLz48cGF0aCBkPSJNMTIgOHY4TTggMTJoOCIvPgogIDwvZz4KPC9zdmc+';
    const ICON_WAIT = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4xNSkiIHN0cm9rZT0ibm9uZSIgLz4KICA8ZyB0cmFuc2Zvcm09InNjYWxlKDAuNykgdHJhbnNsYXRlKDUsNSkiPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBvbHlsaW5lIHBvaW50cz0iMTIgNiAxMiAxMiAxNiAxNCIvPgogIDwvZz4KPC9zdmc+';
    const ICON_LOOP = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4xNSkiIHN0cm9rZT0ibm9uZSIgLz4KICA8ZyB0cmFuc2Zvcm09InNjYWxlKDAuNykgdHJhbnNsYXRlKDUsNSkiPgogIDxwYXRoIGQ9Ik0xNyAxbDQgNC00IDQiLz48cGF0aCBkPSJNMyAxMVY5YTQgNCAwIDAgMSA0LTRoMTQiLz48cGF0aCBkPSJNNyAyM2wtNC00IDQtNCIvPjxwYXRoIGQ9Ik0yMSAxM3YyYTQgNCAwIDAgMS00IDRIMyIvPgogIDwvZz4KPC9zdmc+';
    const ICON_LED = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4xNSkiIHN0cm9rZT0ibm9uZSIgLz4KICA8ZyB0cmFuc2Zvcm09InNjYWxlKDAuNykgdHJhbnNsYXRlKDUsNSkiPgogIDxwYXRoIGQ9Ik0xMiAydjRNMTIgMTh2NE00LjkzIDQuOTNsMi44MyAyLjgzTTE2LjI0IDE2LjI0bDIuODMgMi44M00yIDEyaDRNMTggMTJoNE00LjkzIDE5LjA3bDIuODMtMi44M00xNi4yNCA3Ljc2bDIuODMtMi44MyIvPgogIDwvZz4KPC9zdmc+';
    const ICON_SOUND = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4xNSkiIHN0cm9rZT0ibm9uZSIgLz4KICA8ZyB0cmFuc2Zvcm09InNjYWxlKDAuNykgdHJhbnNsYXRlKDUsNSkiPgogIDxwb2x5Z29uIHBvaW50cz0iMTEgNSA2IDkgMiA5IDIgMTUgNiAxNSAxMSAxOSAxMSA1Ii8+PHBhdGggZD0iTTE5LjA3IDQuOTNhMTAgMTAgMCAwIDEgMCAxNC4xNE0xNS41NCA4LjQ2YTUgNSAwIDAgMSAwIDcuMDciLz4KICA8L2c+Cjwvc3ZnPg==';

    // --- Blocks Definitions ---

    // Event: Start
    Blockly.Blocks['event_start'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage(ICON_PLAY, 32, 32, "Play"));
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
                .appendField(new Blockly.FieldImage(ICON_MOTOR, 32, 32, "Motor"));
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
                .appendField(new Blockly.FieldImage(ICON_MOTOR, 32, 32, "Motor"));
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
                .appendField(new Blockly.FieldImage(ICON_MOTOR, 24, 24, "Motor A"));
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
                .appendField(new Blockly.FieldImage(ICON_MOTOR, 24, 24, "Motor B"));
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
                .appendField(new Blockly.FieldImage(ICON_MOTOR, 32, 32, "Motor"))
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
                .appendField(new Blockly.FieldImage(ICON_LED, 32, 32, "LED"))
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
                .appendField(new Blockly.FieldImage(ICON_WAIT, 32, 32, "Wait"));
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
                .appendField(new Blockly.FieldImage(ICON_LOOP, 32, 32, "Loop"));
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
                .appendField(new Blockly.FieldImage(ICON_SOUND, 32, 32, "Sound"))
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
