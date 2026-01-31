import { defineCustomBlocks } from './blocks/custom_blocks.js';

export async function setupBlockly(containerId) {
    // Fetch icons config from server
    let iconsConfig = {};
    try {
        const response = await fetch('/api/icons');
        if (response.ok) {
            iconsConfig = await response.json();
        }
    } catch (e) {
        console.warn('Failed to load icons config, using defaults', e);
    }

    // Define custom blocks with loaded config
    defineCustomBlocks(iconsConfig);

    const toolbox = {
        "kind": "categoryToolbox",
        "contents": [
            {
                "kind": "category",
                "name": "Eventos",
                "colour": "#FF9800", // Orange
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
                "colour": "#FFD700", // Yellow
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
                    }
                ]
            },
            {
                "kind": "category",
                "name": "Movimento",
                "colour": "#0091EA", // Blue (Motor)
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
                    }
                ]
            },
            {
                "kind": "category",
                "name": "Sensores",
                "colour": "#4CAF50", // Green
                "contents": [
                    {
                         "kind": "block",
                         "type": "led_set_color"
                    }
                ]
            }
        ]
    };

    const workspace = Blockly.inject(containerId, {
        toolbox: toolbox,
        scrollbars: true,
        trashcan: true,
        sounds: true,
        media: 'https://unpkg.com/blockly/media/',
        renderer: 'zelos', // Scratch-like renderer (capsule shapes)
        horizontalLayout: true,
        toolboxPosition: 'end',
        zoom: {
            controls: true,
            wheel: true,
            startScale: 0.9,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        move: {
            scrollbars: true,
            drag: true,
            wheel: false
        }
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
