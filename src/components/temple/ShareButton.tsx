'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

export function ShareButton({ title }: { title: string }) {
  const handleShare = async () => {
    const shareData = {
      title: `${title} | আমার মন্দির`,
      text: `${title} সম্পর্কে আরও জানুন আমার মন্দির পোর্টালে।`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('লিঙ্ক কপি করা হয়েছে');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="w-full rounded-xl border-gray-200" 
      onClick={handleShare}
    >
      <Share2 className="h-4 w-4 mr-2" /> শেয়ার
    </Button>
  );
}
