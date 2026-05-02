'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Loader2, ArrowLeft } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Navbar } from '@/components/Navbar';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { session, user } = useAuth();
  const { markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const tokenRef = useRef(session?.access_token);
  useEffect(() => {
    tokenRef.current = session?.access_token;
  }, [session?.access_token]);

  useEffect(() => {
    if (user?.id) {
      loadData(0, filter, true);
    } else {
      setLoading(false);
    }
  }, [user?.id, filter]);

  const loadData = async (pageNum: number, f: string, reset: boolean = false) => {
    try {
      if (reset && notifications.length === 0) setLoading(true);
      const res = await fetch(`/api/notifications?filter=${f}&page=${pageNum}`, {
        headers: { 'Authorization': `Bearer ${tokenRef.current}` }
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(prev => reset ? data.notifications : [...prev, ...data.notifications]);
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col items-center pt-24 px-4 min-h-screen pb-10">
      <Navbar />
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 shrink-0">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
              <Bell className="h-8 w-8 text-orange-600 hidden sm:block" />
              নোটিফিকেশন
            </h1>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm" className="gap-2">
              <CheckCheck className="h-4 w-4" /> সব পড়া হয়েছে
            </Button>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} size="sm">সব</Button>
          <Button variant={filter === 'unread' ? 'default' : 'outline'} onClick={() => setFilter('unread')} size="sm">আনরিড</Button>
          <Button variant={filter === 'read' ? 'default' : 'outline'} onClick={() => setFilter('read')} size="sm">পড়া হয়েছে</Button>
        </div>

        {notifications.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-500 bg-white border border-dashed rounded-xl">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>আপনার কোনো নোটিফিকেশন নেই।</p>
          </div>
        )}

        <div className="space-y-4">
          {notifications.map((notif) => (
            <Link key={notif.id} href={notif.url || '#'} onClick={() => !notif.is_read && handleMarkAsRead(notif.id, { preventDefault: () => {}, stopPropagation: () => {} } as any)}>
              <Card className={`p-4 hover:shadow-md transition-shadow relative overflow-hidden ${!notif.is_read ? 'border-orange-200 bg-orange-50/50' : 'bg-white'}`}>
                {!notif.is_read && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-orange-500"></div>
                )}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${!notif.is_read ? 'text-gray-900' : 'text-gray-700'}`}>{notif.title}</h3>
                    <p className={`text-sm ${!notif.is_read ? 'text-gray-700' : 'text-gray-500'}`}>{notif.body}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: bn })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <Button variant="ghost" size="icon" onClick={(e) => handleMarkAsRead(notif.id, e)} className="h-8 w-8 text-gray-400 hover:text-orange-600 shrink-0">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {loading && (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => loadData(page + 1, filter, false)}>আরো দেখুন</Button>
          </div>
        )}
      </div>
    </div>
  );
}
