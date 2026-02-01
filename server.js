const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'config.json');
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(bodyParser.json());
app.use(session({
    secret: 'wedo-secret-key-123',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Initialize users file if not exists
if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [{ username: 'admin', password: '123' }]; // Default user
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
}

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

const BLOCKS_FILE = path.join(__dirname, 'blocks.json');

// Initialize blocks file if not exists
if (!fs.existsSync(BLOCKS_FILE)) {
    const defaultBlocks = [
        { id: 'event_start', type: 'event_start', icon: 'assets/block_icons/play.svg', name: 'Iniciar' },
        { id: 'motor_on', type: 'motor_on', icon: 'assets/block_icons/motor.svg', name: 'Motor Ligar' },
        { id: 'motor_off', type: 'motor_off', icon: 'assets/block_icons/motor.svg', name: 'Motor Parar' },
        { id: 'motor_spin', type: 'motor_spin', icon: 'assets/block_icons/motor.svg', name: 'Motor Girar' },
        { id: 'control_wait', type: 'control_wait', icon: 'assets/block_icons/wait.svg', name: 'Esperar' },
        { id: 'control_repeat', type: 'control_repeat', icon: 'assets/block_icons/loop.svg', name: 'Repetir' },
        { id: 'led_set_color', type: 'led_set_color', icon: 'assets/block_icons/led.svg', name: 'LED' },
        { id: 'sound_play', type: 'sound_play', icon: 'assets/block_icons/sound.svg', name: 'Som' }
    ];
    fs.writeFileSync(BLOCKS_FILE, JSON.stringify(defaultBlocks, null, 2));
}

app.use(express.static(__dirname));

// Increase limit for image uploads
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    fs.readFile(USERS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        
        const users = JSON.parse(data);
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            req.session.user = { username: user.username };
            res.json({ success: true, user: req.session.user });
        } else {
            res.status(401).json({ error: 'Credenciais inválidas' });
        }
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Check Auth
app.get('/api/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

// Get Config (Public)
app.get('/api/config', (req, res) => {
    fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read config' });
        }
        res.json(JSON.parse(data));
    });
});

// Update Config (Protected)
app.post('/api/config', isAuthenticated, (req, res) => {
    const newConfig = req.body;
    
    // Validate (basic)
    if (!newConfig.appName) {
        return res.status(400).json({ error: 'AppName is required' });
    }

    fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save config' });
        }
        res.json({ success: true, config: newConfig });
    });
});

// Get Blocks (Public)
app.get('/api/blocks', (req, res) => {
    fs.readFile(BLOCKS_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read blocks' });
        }
        res.json(JSON.parse(data));
    });
});

// Update Blocks (Protected)
app.post('/api/blocks', isAuthenticated, (req, res) => {
    const newBlocks = req.body;
    // Basic validation
    if (!Array.isArray(newBlocks)) {
        return res.status(400).json({ error: 'Invalid format' });
    }
    fs.writeFile(BLOCKS_FILE, JSON.stringify(newBlocks, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save blocks' });
        res.json({ success: true });
    });
});

// Save Icon (Protected) - Renamed logic to support general icon upload
app.post('/api/save-icon', isAuthenticated, (req, res) => {
    const { type, image, filename } = req.body;
    // type is now just a prefix or identifier, we use filename mostly
    if (!image || !filename) {
        return res.status(400).json({ error: 'Missing data' });
    }

    const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches) {
        return res.status(400).json({ error: 'Invalid image data' });
    }

    const ext = matches[1] === 'svg+xml' ? 'svg' : matches[1]; // Handle svg+xml
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Ensure filename has extension or add it
    let safeFilename = filename.replace(/[^a-z0-9\.]/gi, '_').toLowerCase();
    if (!safeFilename.endsWith('.' + ext)) {
        safeFilename += '.' + ext;
    }
    
    // Unique-ify filename if needed, or just overwrite?
    // Let's overwrite if name matches, or prepend timestamp
    const uniqueFilename = `${Date.now()}_${safeFilename}`;

    const filePath = path.join(__dirname, 'assets', 'block_icons', uniqueFilename);
    const publicPath = `assets/block_icons/${uniqueFilename}`;

    fs.writeFile(filePath, buffer, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to save file' });
        }
        
        res.json({ success: true, path: publicPath });
    });
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
