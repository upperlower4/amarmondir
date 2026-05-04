'use client';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type NotificationType = {
  id: string;
  is_read: boolean;
  created_at: string;
  title: string;
  body: string;
  url?: string;
  type?: string;
};

type NotificationContextType = {
  unreadCount: number;
  notifications: NotificationType[];
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loadNotifications: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, session } = useAuth();

  const tokenRef = useRef(session?.access_token);
  useEffect(() => {
    tokenRef.current = session?.access_token;
  }, [session?.access_token]);

  const loadNotifications = useCallback(async () => {
    if (!tokenRef.current) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      // Fire cron async
      fetch('/api/cron/process-notifications').catch(e => console.error(e));

      const res = await fetch('/api/notifications?filter=all&page=0', {
        headers: { 'Authorization': `Bearer ${tokenRef.current}` }
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: any) => !n.is_read).length); // Actually we might need a separate count API or just sum up
        
        // Fetch real unread count
        const unreadRes = await fetch('/api/notifications?filter=unread&page=0', {
          headers: { 'Authorization': `Bearer ${tokenRef.current}` }
        });
        const unreadData = await unreadRes.json();
        setUnreadCount(unreadData.count || 0);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  }, []);

  const markAsRead = async (id: string) => {
    if (!session?.access_token) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'mark_read', notification_id: id })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    if (!session?.access_token) return;
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`notifications:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Play notification sound
          try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
              const ctx = new AudioContext();
              const playNote = (freq: number, startTime: number, duration: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + duration);
              };
              const now = ctx.currentTime;
              playNote(783.99, now, 0.3); // G5 
              playNote(1046.50, now + 0.15, 0.4); // C6
            }
          } catch (e) {
            console.error("Audio playback failed:", e);
          }

          // When new notification comes, reload to get the joined data
          await loadNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? { ...n, is_read: payload.new.is_read } : n));
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadNotifications]);

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, markAsRead, markAllAsRead, loadNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
