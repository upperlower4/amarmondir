'use client';

import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import Link from 'next/link';

export function NotificationBell() {
  const { unreadCount } = useNotifications();

  return (
    <Link href="/notifications" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
      <Bell className="h-6 w-6 text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
