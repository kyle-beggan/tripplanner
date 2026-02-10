
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log('Testing Supabase Connection...');
    const { data, error } = await supabase.from('trips').select('id, name').limit(1);

    if (error) {
        console.error('Error fetching trips:', error);
    } else {
        console.log('Successfully fetched trips:', data);
    }
}

testFetch();
