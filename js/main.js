import { setupBlockly } from './blockly_setup.js';
import { defineGenerators } from './blocks/generators.js';
import { ArduinoDriver } from './drivers/arduino_driver.js';
import { WeDoDriver } from './drivers/wedo_driver.js';
import { AudioManager } from './audio_manager.js';

// State
let currentDriver = null;
let isRunning = false;
let workspace = null;
const audioManager = new AudioManager();

// DOM Elements
const btnConnect = document.getElementById('btn-connect');
const btnRun = document.getElementById('btn-run');
const btnStop = document.getElementById('btn-stop');
const statusIndicator = document.getElementById('connection-status');
const statusText = document.getElementById('status-text');
const hardwareSelect = document.getElementById('hardware-type');
const btnSave = document.getElementById('btn-save');
const btnLoad = document.getElementById('btn-load');
const fileInput = document.getElementById('file-input');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Icons
    if (window.lucide) {
        lucide.createIcons();
    } else {
        console.warn('Lucide icons library not loaded');
    }

    // Check if running via file:// protocol (ES Modules won't work)
    if (window.location.protocol === 'file:') {
        alert('Atenção: Esta aplicação precisa rodar em um servidor web (Localhost ou Vercel) para funcionar corretamente. O protocolo file:// não suporta módulos JavaScript.');
    }

    // Setup Blockly (Wait for config load inside setupBlockly if needed, but here we can just await it)
    (async () => {
        let blocksConfig = [];
        try {
            const res = await fetch('/api/blocks');
            if(res.ok) blocksConfig = await res.json();
        } catch(e) { console.warn("Failed to load blocks", e); }

        setupBlockly('blockly-div', blocksConfig).then(ws => {
            workspace = ws;
            defineGenerators(blocksConfig);
        });
    })();

    // Event Listeners
    btnConnect.addEventListener('click', handleConnect);
    btnRun.addEventListener('click', handleRun);
    btnStop.addEventListener('click', handleStop);
    hardwareSelect.addEventListener('change', handleHardwareChange);
    btnSave.addEventListener('click', handleSave);
    btnLoad.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleLoad);
    
    // Settings Modal Listeners
    document.getElementById('btn-settings').addEventListener('click', openSettingsModal);
    document.querySelector('.close-modal').addEventListener('click', closeSettingsModal);
    document.getElementById('btn-cancel-settings').addEventListener('click', closeSettingsModal);
    document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
    document.getElementById('settings-logo-type').addEventListener('change', toggleLogoInput);
    document.getElementById('btn-copy-embed').addEventListener('click', copyEmbedCode);
    
    // Logout Listener
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Initial Driver Setup
    handleHardwareChange();
    
    // Check Auth & Load Config
    checkAuth().then(() => {
        loadConfig();
    });

    // Check if running in Iframe
    if (window.self !== window.top) {
        console.log("Running in iframe mode - hiding system controls");
        const sysControls = document.querySelector('.system-controls');
        if (sysControls) {
            sysControls.style.display = 'none';
        }
    }

    // Register Service Worker (PWA)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Registered', reg))
            .catch(err => console.warn('Service Worker Failed', err));
    }
    
    console.log("Plataforma CodeKids Inicializada");
});

async function checkAuth() {
    // 1. Check LocalStorage (Static/Vercel Mode)
    const localAuth = localStorage.getItem('auth_user');
    if (localAuth) {
        return true; // Authenticated
    }

    // 2. Check Backend Session (Legacy/Local Mode)
    try {
        const response = await fetch('/api/check-auth');
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                localStorage.setItem('auth_user', JSON.stringify(data.user));
                return true;
            }
        }
    } catch (e) {
        console.warn('Backend auth check failed (offline/static mode)');
    }

    // If both failed, redirect
    window.location.href = '/login.html';
    return false;
}

async function handleLogout() {
    // Clear LocalStorage
    localStorage.removeItem('auth_user');
    
    // Try Backend Logout
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
        console.log('Backend logout failed or ignored');
    }
    
    window.location.href = '/login.html';
}

function handleHardwareChange() {
    const type = hardwareSelect.value;
    if (currentDriver) {
        currentDriver.disconnect();
    }
    
    if (type === 'arduino') {
        currentDriver = new ArduinoDriver();
    } else if (type === 'wedo') {
        currentDriver = new WeDoDriver();
    }
    
    // Inject audio manager into driver (simplest way for blocks to access it via driver object)
    currentDriver.playSound = (name) => audioManager.playSound(name);

    updateStatus(`Modo selecionado: ${type === 'arduino' ? 'Arduino' : 'LEGO WeDo 2.0'}`);
    statusIndicator.classList.remove('connected');
    statusIndicator.classList.add('disconnected');
}

async function handleConnect() {
    if (!currentDriver) return;
    
    try {
        updateStatus("Conectando...");
        const connected = await currentDriver.connect();
        if (connected) {
            statusIndicator.classList.remove('disconnected');
            statusIndicator.classList.add('connected');
            updateStatus("Conectado com sucesso!");
        } else {
            updateStatus("Falha na conexão.");
        }
    } catch (error) {
        console.error(error);
        if (error.name === 'NotFoundError') {
            updateStatus("Cancelado pelo usuário ou dispositivo não encontrado.");
        } else if (error.name === 'SecurityError') {
            updateStatus("Erro de permissão. Use HTTPS ou Localhost.");
        } else {
            updateStatus("Erro: " + error.message);
        }
        alert("Detalhe do Erro: " + error.message + "\n\nDica: Abra o console (F12) para ver mais detalhes.");
    }
}

async function handleRun() {
    if (!workspace) return;
    if (!currentDriver || !currentDriver.isConnected()) {
        // Allow running without hardware if only sounds? 
        // For now, enforce hardware connection or at least mock it.
        // But users might want to test logic.
        // Let's warn but proceed if user wants (optional), or enforce.
        // Given the prompt requirements, let's enforce connection for hardware blocks.
        // But we can check if blocks are hardware related.
        // Simpler: Just warn.
        if (!confirm("Hardware não conectado. Deseja simular? (Comandos de hardware serão ignorados)")) {
            return;
        }
    }

    try {
        // Encontrar o bloco "Quando Iniciar"
        const topBlocks = workspace.getTopBlocks(true);
        let startBlock = null;
        
        for (const block of topBlocks) {
            if (block.type === 'event_start') {
                startBlock = block;
                break;
            }
        }

        if (!startBlock) {
            alert("Por favor, adicione o bloco 'Quando Iniciar' para começar o programa.");
            return;
        }

        // Inicializar o gerador antes de usar blockToCode
        Blockly.JavaScript.init(workspace);

        // Gerar código apenas a partir do bloco de início
        // blockToCode retorna o código para o bloco e seus sucessores
        const code = Blockly.JavaScript.blockToCode(startBlock);
        
        console.log("Generated Code:", code);
        
        if (!code.trim()) {
            updateStatus("Programa vazio.");
            return;
        }

        updateStatus("Executando...");
        isRunning = true;
        
        // Reinicia estado do driver (ex: limpa flag de parada)
        if (currentDriver && currentDriver.reset) {
            currentDriver.reset();
        }
        
        // Pass driver to the function
        const runFunction = new Function('driver', `return (async () => { ${code} })();`);
        await runFunction(currentDriver);
        
        updateStatus("Execução finalizada.");
        isRunning = false;
    } catch (e) {
        if (e.message === "Execução interrompida") {
            updateStatus("Parado.");
        } else {
            console.error(e);
            updateStatus("Erro na execução: " + e.message);
        }
        isRunning = false;
    }
}

function handleStop() {
    if (currentDriver) {
        currentDriver.stopAll(); 
    }
    isRunning = false;
    updateStatus("Parado.");
}

function handleSave() {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToText(xml);
    const blob = new Blob([xmlText], {type: 'text/xml'});
    const a = document.createElement('a');
    a.download = 'projeto_codekids.xml';
    a.href = URL.createObjectURL(blob);
    a.click();
}

function handleLoad(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const xmlText = e.target.result;
        workspace.clear();
        const xml = Blockly.Xml.textToDom(xmlText);
        Blockly.Xml.domToWorkspace(xml, workspace);
        fileInput.value = ''; // Reset
    };
    reader.readAsText(file);
}

function updateStatus(msg) {
    statusText.textContent = msg;
}

// Settings / Backend Integration
async function loadConfig() {
    // 1. Check LocalStorage (Priority for Vercel/Static)
    const localConfig = localStorage.getItem('appConfig');
    let configLoaded = false;

    if (localConfig) {
        try {
            applyConfig(JSON.parse(localConfig));
            configLoaded = true;
        } catch (e) {
            console.error('Invalid local config', e);
        }
    }

    // 2. Fetch from Backend/Static File (as fallback or initial seed)
    if (!configLoaded) {
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                applyConfig(config);
                // Cache it so next time we have it
                localStorage.setItem('appConfig', JSON.stringify(config));
            }
        } catch (e) {
            console.warn('Backend not available or config load failed. Using defaults.', e);
        }
    }
}

function applyConfig(config) {
    if (config.appName) {
        document.title = config.appName;
        const logoText = document.getElementById('app-logo-text');
        if (logoText) logoText.textContent = config.appName;
    }
    
    const logoImg = document.getElementById('app-logo-img');
    const logoText = document.getElementById('app-logo-text');
    
    if (config.logoType === 'image' && config.logoUrl) {
        if (logoText) logoText.style.display = 'none';
        if (logoImg) {
            logoImg.src = config.logoUrl;
            logoImg.style.display = 'block';
        }
    } else {
        if (logoText) logoText.style.display = 'block';
        if (logoImg) logoImg.style.display = 'none';
    }
}

function openSettingsModal() {
    // Load current values into form
    const appName = document.getElementById('app-logo-text').textContent;
    document.getElementById('settings-app-name').value = appName;
    
    const logoImg = document.getElementById('app-logo-img');
    const isImage = logoImg && logoImg.style.display !== 'none';
    
    document.getElementById('settings-logo-type').value = isImage ? 'image' : 'text';
    if (isImage) {
        document.getElementById('settings-logo-url').value = logoImg.src;
    }
    
    toggleLogoInput();
    
    // Generate Embed Code
    const baseUrl = window.location.href.replace('/index.html', '').replace(/\/$/, '');
    const embedCode = `<iframe 
    src="${baseUrl}" 
    width="100%" 
    height="600px" 
    frameborder="0" 
    allow="bluetooth; microphone; camera"
    allowfullscreen>
</iframe>`;
    document.getElementById('embed-code').value = embedCode;

    // Load Block Settings
    loadBlockSettings();

    document.getElementById('settings-modal').style.display = 'flex';
}

async function loadBlockSettings() {
    const container = document.getElementById('settings-icons-container');
    if (!container) return;
    
    container.innerHTML = '<p>Carregando blocos...</p>';

    try {
        const response = await fetch('/api/blocks');
        if (!response.ok) throw new Error('Failed to load');
        const blocks = await response.json();
        
        container.innerHTML = `
            <div style="margin-bottom: 15px;">
                <button id="btn-add-block" class="btn btn-green" style="width: 100%; padding: 10px; border-radius: 8px;">+ Adicionar Novo Bloco</button>
            </div>
            <div id="blocks-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
        `;

        const list = document.getElementById('blocks-list');
        document.getElementById('btn-add-block').addEventListener('click', () => showAddBlockForm(blocks));

        blocks.forEach((block, index) => {
            const div = document.createElement('div');
            div.className = 'block-setting-item';
            div.style.border = '1px solid #eee';
            div.style.borderRadius = '8px';
            div.style.padding = '10px';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'space-between';
            div.style.background = '#f9f9f9';
            
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${block.icon}" alt="${block.name}" style="width: 32px; height: 32px; object-fit: contain; background: #fff; border-radius: 4px; padding: 2px; border: 1px solid #ddd;">
                    <div>
                        <strong style="display: block; font-size: 0.95rem;">${block.name || 'Sem Nome'}</strong>
                        <small style="color: #666; font-size: 0.8rem;">Tipo: ${getLabelForType(block.type)}</small>
                    </div>
                </div>
                <div>
                    <button class="btn btn-red btn-sm" style="padding: 5px 10px; font-size: 0.8rem;" data-index="${index}">🗑️</button>
                </div>
            `;
            
            div.querySelector('.btn-red').addEventListener('click', () => deleteBlock(index, blocks));
            list.appendChild(div);
        });

    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="color: red;">Erro ao carregar configurações de blocos.</p>';
    }
}

function getLabelForType(type) {
    const labels = {
        'event_start': 'Iniciar (Play)',
        'motor_on': 'Motor Ligar',
        'motor_spin': 'Motor Girar (CW/CCW)',
        'motor_off': 'Motor Parar',
        'control_wait': 'Esperar',
        'control_repeat': 'Repetir (Loop)',
        'led_set_color': 'LED',
        'sound_play': 'Som'
    };
    return labels[type] || type;
}

async function deleteBlock(index, blocks) {
    if(!confirm('Tem certeza que deseja remover este bloco?')) return;
    
    blocks.splice(index, 1);
    await saveBlocks(blocks);
}

async function saveBlocks(blocks) {
    try {
        const response = await fetch('/api/blocks', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(blocks)
        });
        if(response.ok) {
            alert('Configuração salva! A página será recarregada.');
            window.location.reload();
        } else {
            alert('Erro ao salvar blocos.');
        }
    } catch(e) {
        console.error(e);
        alert('Erro de conexão.');
    }
}

function showAddBlockForm(currentBlocks) {
    const container = document.getElementById('settings-icons-container');
    container.innerHTML = `
        <h3 style="margin-top: 0;">Novo Bloco</h3>
        <div class="form-group">
            <label>Nome do Bloco</label>
            <input type="text" id="new-block-name" placeholder="Ex: Motor Rápido">
        </div>
        <div class="form-group">
            <label>Função (Comportamento)</label>
            <select id="new-block-type">
                <option value="event_start">Iniciar (Play)</option>
                <option value="motor_on">Ligar Motor</option>
                <option value="motor_spin">Girar Motor (CW/CCW)</option>
                <option value="motor_off">Parar Motor</option>
                <option value="control_wait">Esperar</option>
                <option value="control_repeat">Repetir (Loop)</option>
                <option value="led_set_color">LED</option>
                <option value="sound_play">Som</option>
            </select>
        </div>
        <div class="form-group">
            <label>Ícone (PNG/SVG)</label>
            <input type="file" id="new-block-icon" accept=".png,.svg,.jpg,.jpeg">
            <div id="preview-container" style="margin-top: 10px; display: none;">
                <img id="new-block-preview" style="width: 48px; height: 48px; object-fit: contain; background: #eee; border-radius: 8px; padding: 4px;">
            </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="btn-cancel-add" class="btn btn-red" style="flex: 1;">Cancelar</button>
            <button id="btn-save-new-block" class="btn btn-green" style="flex: 1;">Salvar</button>
        </div>
    `;

    document.getElementById('btn-cancel-add').addEventListener('click', loadBlockSettings);
    
    const iconInput = document.getElementById('new-block-icon');
    let uploadedIconPath = null;

    iconInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if(!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.getElementById('new-block-preview');
            img.src = ev.target.result;
            img.style.display = 'block';
            document.getElementById('preview-container').style.display = 'block';
        };
        reader.readAsDataURL(file);

        // Upload immediately to get path
        // Alternatively, wait for Save button. Let's wait for Save button logic?
        // No, better upload now to verify. Or upload base64 directly?
        // Let's reuse existing logic: read as base64 and send on save.
    });

    document.getElementById('btn-save-new-block').addEventListener('click', async () => {
        const name = document.getElementById('new-block-name').value;
        const type = document.getElementById('new-block-type').value;
        const file = iconInput.files[0];

        if (!name || !type || !file) {
            alert('Preencha todos os campos!');
            return;
        }

        // Upload Icon
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64 = ev.target.result;
            
            try {
                const uploadRes = await fetch('/api/save-icon', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        type: 'custom', // Prefix
                        filename: file.name,
                        image: base64
                    })
                });
                
                if(!uploadRes.ok) throw new Error('Erro no upload');
                const uploadData = await uploadRes.json();
                
                // Add to blocks list
                const newBlock = {
                    id: `custom_${Date.now()}`,
                    type: type,
                    name: name,
                    icon: uploadData.path
                };
                
                currentBlocks.push(newBlock);
                await saveBlocks(currentBlocks);
                
            } catch(err) {
                console.error(err);
                alert('Erro ao salvar ícone.');
            }
        };
        reader.readAsDataURL(file);
    });
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

function copyEmbedCode() {
    const embedText = document.getElementById('embed-code');
    embedText.select();
    embedText.setSelectionRange(0, 99999); // For mobile devices
    
    navigator.clipboard.writeText(embedText.value).then(() => {
        const btn = document.getElementById('btn-copy-embed');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px; margin-right: 8px;"></i> Copiado!';
        btn.classList.remove('btn-blue');
        btn.classList.add('btn-green');
        if (window.lucide) lucide.createIcons();
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-green');
            btn.classList.add('btn-blue');
            if (window.lucide) lucide.createIcons();
        }, 2000);
    });
}

function toggleLogoInput() {
    const type = document.getElementById('settings-logo-type').value;
    const urlGroup = document.getElementById('logo-url-group');
    if (type === 'image') {
        urlGroup.style.display = 'block';
    } else {
        urlGroup.style.display = 'none';
    }
}

async function saveSettings() {
    const appName = document.getElementById('settings-app-name').value;
    const logoType = document.getElementById('settings-logo-type').value;
    const logoUrl = document.getElementById('settings-logo-url').value;
    
    const newConfig = {
        appName,
        logoType,
        logoUrl
    };
    
    // 1. Save to LocalStorage (Guaranteed persistence for Vercel/Static)
    localStorage.setItem('appConfig', JSON.stringify(newConfig));
    applyConfig(newConfig);
    
    // 2. Try Backend Save (Best effort for local dev)
    let backendSaved = false;
    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newConfig)
        });
        
        if (response.ok) {
            backendSaved = true;
        }
    } catch (e) {
        console.warn('Backend unreachable (offline/static mode)');
    }

    closeSettingsModal();
    
    if (backendSaved) {
        alert('Configurações salvas no servidor e navegador!');
    } else {
        alert('Configurações salvas no navegador (Modo Static)!');
    }
}
