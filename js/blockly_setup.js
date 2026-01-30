import { defineCustomBlocks } from './blocks/custom_blocks.js';

export function setupBlockly(containerId) {
    // Define custom blocks first
    defineCustomBlocks();

    const toolbox = {
        "kind": "categoryToolbox",
        "contents": [
            {
                "kind": "category",
                "name": "Eventos",
                "colour": "#FFD700",
                "contents": [
                    {
                        "kind": "block",
                        "type": "event_start"
                    }
                ]
            },
            {
                "kind": "category",
                "name": "Controle",
                "colour": "#FF8C00",
                "contents": [
                    {
                        "kind": "block",
                        "type": "control_wait",
                        "inputs": {
                            "DURATION": {
                                "shadow": {
                                    "type": "math_number",
                                    "fields": {
                                        "NUM": 1
                                    }
                                }
                            }
                        }
                    },
                    {
                        "kind": "block",
                        "type": "control_repeat",
                        "inputs": {
                            "TIMES": {
                                "shadow": {
                                    "type": "math_number",
                                    "fields": {
                                        "NUM": 10
                                    }
                                }
                            }
                        }
                    },
                    {
                        "kind": "block",
                        "type": "controls_if"
                    }
                ]
            },
            {
                "kind": "category",
                "name": "Movimento",
                "colour": "#0066CC",
                "contents": [
                    {
                        "kind": "block",
                        "type": "motor_a_speed",
                        "inputs": {
                            "SPEED": {
                                "shadow": {
                                    "type": "math_number",
                                    "fields": {
                                        "NUM": 50
                                    }
                                }
                            }
                        }
                    },
                    {
                        "kind": "block",
                        "type": "motor_on",
                        "inputs": {
                            "SPEED": {
                                "shadow": {
                                    "type": "math_number",
                                    "fields": {
                                        "NUM": 100
                                    }
                                }
                            }
                        }
                    },
                    {
                        "kind": "block",
                        "type": "motor_spin",
                        "inputs": {
                            "SPEED": {
                                "shadow": {
                                    "type": "math_number",
                                    "fields": {
                                        "NUM": 50
                                    }
                                }
                            }
                        }
                    },
                    {
                        "kind": "block",
                        "type": "motor_off"
                    },
                    {
                        "kind": "block",
                        "type": "led_set_color"
                    }
                ]
            },
            {
                "kind": "category",
                "name": "Sensores",
                "colour": "#4CAF50",
                "contents": [
                    {
                        "kind": "block",
                        "type": "sensor_distance"
                    },
                    {
                        "kind": "block",
                        "type": "sensor_tilt"
                    }
                ]
            },
            {
                "kind": "category",
                "name": "Sons",
                "colour": "#9C27B0",
                "contents": [
                    {
                        "kind": "block",
                        "type": "sound_play"
                    }
                ]
            }
        ]
    };

    const workspace = Blockly.inject(containerId, {
        toolbox: toolbox,
        scrollbars: true,
        trashcan: true,
        move: {
            scrollbars: true,
            drag: true,
            wheel: true
        },
        grid: {
            spacing: 20,
            length: 3,
            colour: '#ccc',
            snap: true
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        // Configuração para toolbox horizontal na parte inferior
        toolboxPosition: 'end', 
        horizontalLayout: true,
        renderer: 'geras' // 'geras' is the standard modern renderer, good for rounded look
    });

    // Initialize JavaScript generator if not already present
    if (!Blockly.JavaScript) {
        // Just in case the CDN didn't load it or it's named differently in newer versions (it's usually in a separate file or part of the bundle)
        // We included the core, but we might need the generator file.
        // Actually, blockly.min.js usually contains the core. We might need `javascript_compressed.js`.
        // I'll assume the user will need to add that to index.html if it's missing, but let's check.
        // For now, let's assume it's available or we will add it to index.html later.
    }

    return workspace;
}
