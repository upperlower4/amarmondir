'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchProfile = async (userId: string) => {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (!isActive) return;
        setProfile(data || null);
      } catch (err) {
        console.error('fetchProfile error', err);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    const init = async () => {
      // Safety timeout to ensure loading doesn't get stuck forever in some iframe environments
      const timeout = setTimeout(() => {
        if (isActive && loading) {
          console.warn('Auth initialization timed out');
          setLoading(false);
        }
      }, 5000);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isActive) return;

        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth init error', err);
        if (isActive) {
          setLoading(false);
        }
      } finally {
        clearTimeout(timeout);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isActive) return;

      try {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('onAuthStateChange error', err);
        if (isActive) setLoading(false);
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
