'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function usePushNotification() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { session } = useAuth();
  
  const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/service-worker.js').then((reg) => {
        setRegistration(reg);
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true);
            setSubscription(sub);
          }
        });
      }).catch((err) => {
        console.error('Service Worker registration failed: ', err);
      });
    }
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!registration || !applicationServerKey || !session?.access_token) return;

    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      setSubscription(sub);
      setIsSubscribed(true);

      // Send to backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ subscription: sub }),
      });
    } catch (error) {
      console.error('Failed to subscribe: ', error);
    }
  }, [registration, applicationServerKey, session]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription || !session?.access_token) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      setIsSubscribed(false);

      // Remove from backend
      await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
    } catch (error) {
      console.error('Failed to unsubscribe', error);
    }
  }, [subscription, session]);

  return { isSubscribed, subscribeToPush, unsubscribeFromPush, isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window };
}
