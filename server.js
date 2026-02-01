const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cookieSession = require('cookie-session');
const supabase = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'config.json');
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(bodyParser.json());
app.use(cookieSession({
    name: 'session',
    keys: ['wedo-secret-key-123'], // Change this in production!
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Initialize users file if not exists
if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [{ username: 'admin', password: '123' }]; // Default user
    safeWriteFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
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

// Helper to safely write files (skips if read-only filesystem)
function safeWriteFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, data);
    } catch (err) {
        console.warn(`Warning: Could not write to ${filePath}. Environment might be read-only.`);
    }
}

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
    safeWriteFile(BLOCKS_FILE, JSON.stringify(defaultBlocks, null, 2));
}

app.use(express.static(__dirname));

// Increase limit for image uploads
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Supabase Auth Strategy
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .single();
            
            if (error || !data) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            req.session.user = { username: data.username };
            return res.json({ success: true, user: req.session.user });
        } catch (err) {
            console.error("Supabase Login Error:", err);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    // Local File Auth Strategy (Fallback)
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
    req.session = null;
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
            console.error('Save config error:', err);
            // Don't fail the request if just file write failed in read-only env,
            // but for now, we return error to let client handle it or fallback.
            // Or better: return success but warn? 
            // Vercel won't persist anyway.
            return res.status(500).json({ error: 'Failed to save config (Read-only environment?)' });
        }
        res.json({ success: true, config: newConfig });
    });
});

// Get Blocks (Public)
app.get('/api/blocks', async (req, res) => {
    // Supabase Strategy
    if (supabase) {
        const { data, error } = await supabase
            .from('blocks')
            .select('*')
            //.order('id'); // Ordering by ID might be random if UUID. 
            // Better to order by a 'rank' or just rely on client sort?
            // Client doesn't seem to sort, so insert order matters?
            // Supabase returns in PK order usually.
            // Let's rely on default for now or add an 'order' column later if needed.
        
        if (error) {
            console.error("Supabase Blocks Error:", error);
            // Fallback to default blocks if DB error (or empty table?)
        } else if (data && data.length > 0) {
            return res.json(data);
        } else {
             // If DB is empty, return defaults
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
            return res.json(defaultBlocks);
        }
    }

    if (!fs.existsSync(BLOCKS_FILE)) {
         // Return default blocks if file doesn't exist (e.g. Vercel cold start without file)
         // This is a fallback to ensure we don't crash or return 404/500 if file missing
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
        return res.json(defaultBlocks);
    }

    fs.readFile(BLOCKS_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading blocks.json:", err);
            return res.status(500).json({ error: 'Failed to read blocks' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (parseErr) {
            console.error("Error parsing blocks.json:", parseErr);
            res.status(500).json({ error: 'Invalid blocks JSON' });
        }
    });
});

// Update Blocks (Protected)
app.post('/api/blocks', isAuthenticated, async (req, res) => {
    const newBlocks = req.body;
    // Basic validation
    if (!Array.isArray(newBlocks)) {
        return res.status(400).json({ error: 'Invalid format' });
    }

    if (supabase) {
        // Strategy: We want to sync the client state to DB.
        // Client sends the full list of desired blocks.
        // Simple approach: Delete all and re-insert. 
        // Note: This changes created_at timestamps.
        
        try {
            // 1. Delete all
            const { error: deleteError } = await supabase
                .from('blocks')
                .delete()
                .neq('id', 'placeholder_impossible_id'); // Delete all rows where ID is not something impossible (aka all rows)
                // Note: .delete() requires a filter in Supabase client unless configured otherwise?
                // Actually .delete().neq('id', 0) works if ID is numeric, or .gt('id', '') for text.
            
            // Safer: Delete where ID is in the list of existing IDs? 
            // Or just use upsert and ignore deletions?
            // If user DELETED a block in UI, upsert won't remove it from DB.
            // So we MUST delete.
            
            // Let's try deleting everything.
            // "delete()" without filter might be blocked by middleware?
            // "neq('id', '0')" is a hack.
            
            await supabase.from('blocks').delete().neq('id', '____'); 
            
            // 2. Insert new
            // Ensure data matches schema
            const blocksToInsert = newBlocks.map(b => ({
                id: b.id,
                type: b.type,
                icon: b.icon,
                name: b.name
            }));
            
            const { error: insertError } = await supabase
                .from('blocks')
                .insert(blocksToInsert);
                
            if (insertError) throw insertError;
            
            return res.json({ success: true });
        } catch (err) {
            console.error("Supabase Save Blocks Error:", err);
            return res.status(500).json({ error: 'Failed to save blocks to DB' });
        }
    }

    fs.writeFile(BLOCKS_FILE, JSON.stringify(newBlocks, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save blocks' });
        res.json({ success: true });
    });
});

// Save Icon (Protected) - Renamed logic to support general icon upload
app.post('/api/save-icon', isAuthenticated, async (req, res) => {
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

    // Supabase Storage Strategy
    if (supabase) {
        try {
            // Upload to 'block_icons' bucket
            const { data, error } = await supabase
                .storage
                .from('block_icons')
                .upload(uniqueFilename, buffer, {
                    contentType: `image/${ext}`,
                    upsert: false
                });

            if (error) {
                console.error("Supabase Upload Error:", error);
                throw error;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('block_icons')
                .getPublicUrl(uniqueFilename);

            return res.json({ success: true, path: publicUrl });

        } catch (err) {
            console.error("Supabase Storage Exception:", err);
            return res.status(500).json({ error: 'Failed to upload icon to cloud storage' });
        }
    }

    // Local Filesystem Strategy (Fallback)
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
