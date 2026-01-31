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

app.use(express.static(__dirname));

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

// Get Icons Config (Public)
app.get('/api/icons', (req, res) => {
    fs.readFile(ICONS_FILE, 'utf8', (err, data) => {
        if (err) {
            // Return default if file doesn't exist yet
            return res.json({
                PLAY: 'assets/block_icons/play.svg',
                MOTOR: 'assets/block_icons/motor.svg',
                WAIT: 'assets/block_icons/wait.svg',
                LOOP: 'assets/block_icons/loop.svg',
                LED: 'assets/block_icons/led.svg',
                SOUND: 'assets/block_icons/sound.svg'
            });
        }
        res.json(JSON.parse(data));
    });
});

// Upload Icon (Protected)
app.post('/api/save-icon', isAuthenticated, (req, res) => {
    const { type, image, filename } = req.body; // image is base64 string
    
    if (!type || !image) {
        return res.status(400).json({ error: 'Type and image are required' });
    }

    // Decode base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate filename
    const ext = filename ? path.extname(filename) : '.png';
    const newFilename = `${type.toLowerCase()}_${Date.now()}${ext}`;
    const relativePath = `assets/block_icons/${newFilename}`;
    const absolutePath = path.join(__dirname, relativePath);

    // Save file
    fs.writeFile(absolutePath, buffer, (err) => {
        if (err) {
            console.error('Error saving file:', err);
            return res.status(500).json({ error: 'Failed to save image' });
        }

        // Update icons.json
        fs.readFile(ICONS_FILE, 'utf8', (err, data) => {
            let icons = {};
            if (!err) {
                try {
                    icons = JSON.parse(data);
                } catch (e) {
                    icons = {};
                }
            }

            icons[type] = relativePath;

            fs.writeFile(ICONS_FILE, JSON.stringify(icons, null, 2), (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update config' });
                }
                res.json({ success: true, path: relativePath });
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
