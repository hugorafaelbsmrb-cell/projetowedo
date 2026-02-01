const { createClient } = require('@supabase/supabase-js');

// These should be environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');
} else {
    console.warn('Supabase URL or Key missing. Database features will be disabled.');
}

module.exports = supabase;
