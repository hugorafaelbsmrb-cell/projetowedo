import { defineCustomBlocks } from './blocks/custom_blocks.js';
import { BLOCK_TEMPLATES } from './blocks/templates.js';

export async function setupBlockly(containerId, blocksConfig) {
    
    // Define custom blocks with loaded config
    defineCustomBlocks(blocksConfig);

    // Build Toolbox Dynamically
    const toolbox = buildToolbox(blocksConfig);

    const workspace = Blockly.inject(containerId, {
        toolbox: toolbox,
        scrollbars: true,
        trashcan: true,
        sounds: true,
        media: 'https://unpkg.com/blockly/media/',
        renderer: 'zelos', 
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

    return workspace;
}

function buildToolbox(blocksConfig) {
    // Group blocks by category
    const categories = {};
    
    // Initialize standard categories
    const standardCats = ['Eventos', 'Movimento', 'Controle', 'Sensores', 'Som'];
    standardCats.forEach(cat => categories[cat] = []);

    // Add Dynamic Blocks
    if (Array.isArray(blocksConfig)) {
        blocksConfig.forEach(block => {
            const template = BLOCK_TEMPLATES[block.type];
            if (template) {
                const cat = template.category || 'Outros';
                if (!categories[cat]) categories[cat] = [];
                
                // Create block XML/JSON
                const blockJson = {
                    kind: "block",
                    type: block.id
                };
                
                // Add default shadow values (Heuristic)
                if (block.type === 'motor_on' || block.type === 'motor_spin') {
                    blockJson.inputs = { SPEED: { shadow: { type: "math_number", fields: { NUM: 50 } } } };
                }
                if (block.type === 'control_wait') {
                    blockJson.inputs = { DURATION: { shadow: { type: "math_number", fields: { NUM: 1 } } } };
                }
                if (block.type === 'control_repeat') {
                    blockJson.inputs = { TIMES: { shadow: { type: "math_number", fields: { NUM: 10 } } } };
                }
                if (block.type === 'led_set_color') {
                     // Color field is usually a field, not input. 
                     // But if we had value input for color, we'd shadow it.
                }
                
                categories[cat].push(blockJson);
            }
        });
    }

    // Add Static Sensors
    if (!categories['Sensores']) categories['Sensores'] = [];
    categories['Sensores'].push({ kind: "block", type: "sensor_distance" });
    categories['Sensores'].push({ kind: "block", type: "sensor_tilt" });

    // Build Final Structure
    const contents = [];
    
    // Define Category Colors
    const catColors = {
        'Eventos': '#FFB300',
        'Movimento': '#0091EA',
        'Controle': '#FF6D00',
        'Sensores': '#4CAF50',
        'Som': '#E91E63',
        'Outros': '#9E9E9E'
    };

    for (const [name, blocks] of Object.entries(categories)) {
        if (blocks.length > 0) {
            contents.push({
                kind: "category",
                name: name,
                colour: catColors[name] || '#999',
                contents: blocks
            });
        }
    }

    return {
        kind: "categoryToolbox",
        contents: contents
    };
}
