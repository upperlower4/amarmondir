import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: edits, error } = await supabase.from('temple_edits').select('*').limit(5);
  console.log('Edits table:', edits, error);
}

test();
