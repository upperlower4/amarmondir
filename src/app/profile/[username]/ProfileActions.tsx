'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings } from 'lucide-react';

export function ProfileActions({ profileId }: { profileId: string }) {
  const { profile } = useAuth();

  if (profile?.id !== profileId) {
    return null;
  }

  return (
    <div className="w-full lg:w-auto flex justify-center lg:justify-end">
      <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-xl px-6 h-10 w-full sm:w-auto">
        <Link href="/settings/profile">
          <Settings className="h-4 w-4 mr-2" /> প্রোফাইল এডিট
        </Link>
      </Button>
    </div>
  );
}
