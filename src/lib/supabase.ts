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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'amarmondir-auth-token-v2', // Changed key to avoid stale data
    autoRefreshToken: true,
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null;
        try {
          const val = window.localStorage.getItem(key);
          if (val) return val;
        } catch (e) {}
        
        // Fallback to cookie if localStorage is blocked
        const name = key + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) === ' ') c = c.substring(1);
          if (c.indexOf(name) === 0) return decodeURIComponent(c.substring(name.length, c.length));
        }
        return null;
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        try {
          window.localStorage.setItem(key, value);
        } catch (e) {}
        
        // Also sync to cookie with iframe-friendly attributes
        try {
          // Store the full value in the cookie too as fallback for iframe
          document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=None; Secure`;
          
          const session = JSON.parse(value);
          if (session?.access_token) {
             document.cookie = `amarmondir-auth-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=None; Secure`;
          }
        } catch (e) {}
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        try {
          window.localStorage.removeItem(key);
        } catch (e) {}
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`;
        document.cookie = 'amarmondir-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
      },
    },
  }
});

export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!envSupabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables');
  }

  return createClient(envSupabaseUrl, serviceRoleKey);
};
