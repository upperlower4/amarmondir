'use client';

import { usePushNotification } from '@/hooks/usePushNotification';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function PushToggle() {
  const { isSupported, isSubscribed, subscribeToPush, unsubscribeFromPush } = usePushNotification();
  const [loading, setLoading] = useState(false);

  if (!isSupported) {
    return <span className="text-sm text-gray-400">আপনার ব্রাউজারে সাপোর্টেড নয়</span>;
  }

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
        toast.success('পুশ নোটিফিকেশন বন্ধ করা হয়েছে');
      } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await subscribeToPush();
          toast.success('পুশ নোটিফিকেশন চালু করা হয়েছে');
        } else {
          toast.error('ব্রাউজার থেকে পারমিশন দেওয়া হয়নি');
        }
      }
    } catch (e: any) {
      toast.error('সমস্যা হয়েছে: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={isSubscribed ? 'outline' : 'default'} 
      onClick={handleToggle} 
      disabled={loading}
      className={!isSubscribed ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
    >
      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {isSubscribed ? 'বন্ধ করুন' : 'চালু করুন'}
    </Button>
  );
}
