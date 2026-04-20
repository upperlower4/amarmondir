'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Plus, Trophy, User as UserIcon, LogOut, Menu, Settings, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Navbar() {
  const { user, profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4 md:gap-8 min-w-0">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-200 shrink-0">
              <MapPin className="h-6 w-6" />
            </div>
            <span className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 font-serif truncate">
              amarmondir
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/directory" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">
              মন্দির খুঁজুন
            </Link>
            <Link href="/leaderboard" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">
              লিডারবোর্ড
            </Link>
            {profile?.is_admin && (
              <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">
                অ্যাডমিন
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <>
              <Link href="/add-temple" className="hidden sm:block">
                <Button size="sm" className="items-center gap-2 bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4" />
                  নতুন মন্দির
                </Button>
              </Link>

              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-600">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/directory">মন্দির খুঁজুন</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/leaderboard">লিডারবোর্ড</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/add-temple" className="text-orange-600 font-bold">নতুন মন্দির যোগ করুন</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings/profile">প্রোফাইল এডিট</Link>
                    </DropdownMenuItem>
                    {profile?.is_admin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="font-bold text-blue-700">অ্যাডমিন প্যানেল</Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-0.5 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{profile?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{profile?.badge}</p>
                    </div>
                  </div>
                  <hr className="my-1 border-gray-100" />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${profile?.username}`} className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" /> প্রোফাইল
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" /> প্রোফাইল এডিট
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/leaderboard" className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" /> র‍্যাঙ্কিং
                    </Link>
                  </DropdownMenuItem>
                  {profile?.is_admin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 text-blue-700">
                        <ShieldCheck className="h-4 w-4" /> অ্যাডমিন প্যানেল
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <hr className="my-1 border-gray-100" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" /> লগ আউট
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">লগ ইন</Button>
              </Link>
              <Link href="/signup" className="hidden sm:block">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600">জয়েন করুন</Button>
              </Link>

              <div className="md:hidden flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-600">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/directory">মন্দির খুঁজুন</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/leaderboard">লিডারবোর্ড</Link>
                    </DropdownMenuItem>
                    <hr className="my-1 border-gray-100" />
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="font-bold">লগ ইন</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/signup" className="text-orange-600 font-bold">রেজিস্ট্রেশন</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
