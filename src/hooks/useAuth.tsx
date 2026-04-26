'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getLegacyCookieValue(name: string) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeAuthCookie(session: Session | null) {
  if (typeof document === 'undefined') return;

  const maxAge = session ? 60 * 60 * 24 * 7 : 0;
  const expires = session ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';

  // Kept only for the existing server admin guard. UI auth uses Supabase's own session.
  document.cookie = `amarmondir-auth-token=${session?.access_token ?? ''}; path=/; max-age=${maxAge}; SameSite=Lax${secure}${expires}`;
}

async function recoverLegacySessionOnce() {
  if (typeof window === 'undefined') return;

  const current = await supabase.auth.getSession();
  if (current.data.session) return;

  // Older builds stored the full Supabase session in a custom cookie/localStorage key.
  const legacyRaw =
    window.localStorage.getItem('amarmondir-auth-token-v2') ||
    getLegacyCookieValue('amarmondir-auth-token-v2');

  if (!legacyRaw) return;

  try {
    const parsed = JSON.parse(legacyRaw);
    const accessToken = parsed?.access_token || parsed?.currentSession?.access_token;
    const refreshToken = parsed?.refresh_token || parsed?.currentSession?.refresh_token;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    }
  } catch {
    // Ignore invalid stale auth data.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const activeRequest = useRef(0);

  const loadProfile = async (userId: string) => {
    const requestId = ++activeRequest.current;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (requestId !== activeRequest.current) return;

    if (error) {
      console.error('Profile load error:', error);
      setProfile(null);
      return;
    }

    setProfile(data || null);
  };

  const applySession = async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    writeAuthCookie(nextSession);

    if (nextSession?.user) {
      await loadProfile(nextSession.user.id);
    } else {
      activeRequest.current += 1;
      setProfile(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      try {
        await recoverLegacySessionOnce();

        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) console.error('Auth init error:', error);
        if (!isMounted) return;

        await applySession(initialSession ?? null);
      } catch (error) {
        console.error('Auth init failed:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;

      setLoading(true);
      // Supabase recommends avoiding awaited Supabase calls directly inside
      // onAuthStateChange. Defer profile loading to prevent auth-lock races.
      setTimeout(() => {
        if (!isMounted) return;
        applySession(nextSession ?? null).finally(() => {
          if (isMounted) setLoading(false);
        });
      }, 0);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      refreshProfile: async () => {
        if (user?.id) await loadProfile(user.id);
      },
    }),
    [user, session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
