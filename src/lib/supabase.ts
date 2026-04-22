import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  if (typeof window !== 'undefined') {
    return (window as any).ENV?.[key] || process.env[key];
  }
  return process.env[key];
};

const envSupabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const envSupabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const isConfigured = Boolean(envSupabaseUrl && envSupabaseAnonKey);

const supabaseUrl = envSupabaseUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envSupabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!envSupabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables');
  }

  return createClient(envSupabaseUrl, serviceRoleKey);
};
