const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'config.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Get Config
app.get('/api/config', (req, res) => {
    fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read config' });
        }
        res.json(JSON.parse(data));
    });
});

// Update Config
app.post('/api/config', (req, res) => {
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
