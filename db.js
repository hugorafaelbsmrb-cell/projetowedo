const { createClient } = require('@supabase/supabase-js');

// These should be environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client initialized');
        console.log('   URL:', supabaseUrl.substring(0, 20) + '...');
    } catch (e) {
        console.error('❌ Failed to initialize Supabase client:', e.message);
    }
} else {
    console.warn('⚠️  Supabase URL or Key missing. Database features will be disabled.');
}

module.exports = supabase;
