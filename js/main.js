import { setupBlockly } from './blockly_setup.js';
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
    lucide.createIcons();

    // Setup Blockly
    workspace = setupBlockly('blockly-div');

    // Event Listeners
    btnConnect.addEventListener('click', handleConnect);
    btnRun.addEventListener('click', handleRun);
    btnStop.addEventListener('click', handleStop);
    hardwareSelect.addEventListener('change', handleHardwareChange);
    btnSave.addEventListener('click', handleSave);
    btnLoad.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleLoad);
    
    // Initial Driver Setup
    handleHardwareChange();
    
    console.log("Plataforma CodeKids Inicializada");
});

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
    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Failed to load config');
        const config = await response.json();
        applyConfig(config);
    } catch (e) {
        console.warn('Backend not available or config load failed. Using defaults.', e);
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
    
    document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
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
    
    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newConfig)
        });
        
        if (response.ok) {
            applyConfig(newConfig);
            closeSettingsModal();
            alert('Configurações salvas com sucesso!');
        } else {
            alert('Erro ao salvar configurações.');
        }
    } catch (e) {
        console.error(e);
        alert('Erro de conexão com o servidor.');
    }
}
