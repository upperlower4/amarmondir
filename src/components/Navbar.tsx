'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trophy, User as UserIcon, LogOut, Menu, Settings, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md overflow-x-hidden">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4 md:gap-8 min-w-0">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            
            <span className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 font-serif truncate">
              <Image src="https://res.cloudinary.com/dhavfhslp/image/upload/v1776825082/horizontal_logo_ysoot5.png" alt="Amar Mondir" width={168} height={32} className="h-8 w-auto" priority />
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
              <Button asChild size="sm" className="hidden sm:flex items-center gap-1.5 px-3 bg-orange-500 hover:bg-orange-600 whitespace-nowrap">
                <Link href="/add-temple" className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>নতুন মন্দির</span>
                </Link>
              </Button>

              {/* Profile Menu - Shown when logged in */}
              <div className="hidden md:block">
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
                  <DropdownMenuContent align="end" className="w-60 !bg-white">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-0.5 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">{profile?.username}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">{profile?.badge}</p>
                      </div>
                    </div>
                    <hr className="my-1 border-gray-100" />                
                    <DropdownMenuItem asChild>
                      <Link href="/add-temple" className="flex items-center gap-2 text-orange-600 font-bold">
                        <Plus className="h-4 w-4" /> নতুন মন্দির
                      </Link>
                    </DropdownMenuItem>
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
              </div>

              {/* Mobile Profile Drawer */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger className={cn(buttonVariants({ variant: 'ghost' }), "relative h-10 w-10 rounded-full p-0 flex items-center justify-center")}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[85vw] !bg-white p-0">
                    <div className="flex flex-col h-full bg-white">
                      <div className="flex items-center justify-between p-4 border-b">
                        <span className="font-bold text-lg">আমার প্রোফাইল</span>
                      </div>
                      <div className="flex flex-col p-4 gap-2">
                        <div className="flex items-center gap-3 mb-2 p-2">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{profile?.username}</span>
                            <span className="text-xs text-muted-foreground">{profile?.badge}</span>
                          </div>
                        </div>
                        <hr className="my-2" />
                        <Link href="/add-temple" className="flex items-center gap-2 p-2 rounded-lg hover:bg-orange-50 font-bold text-orange-600">
                          <Plus className="h-4 w-4" /> নতুন মন্দির
                        </Link>
                        <Link href={`/profile/${profile?.username}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-orange-50">
                          <UserIcon className="h-4 w-4" /> প্রোফাইল
                        </Link>
                        <Link href="/settings/profile" className="flex items-center gap-2 p-2 rounded-lg hover:bg-orange-50">
                          <Settings className="h-4 w-4" /> প্রোফাইল এডিট
                        </Link>
                        <Link href="/leaderboard" className="flex items-center gap-2 p-2 rounded-lg hover:bg-orange-50">
                          <Trophy className="h-4 w-4" /> র‍্যাঙ্কিং
                        </Link>
                        {profile?.is_admin && (
                          <Link href="/admin" className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 text-blue-700">
                            <ShieldCheck className="h-4 w-4" /> অ্যাডমিন প্যানেল
                          </Link>
                        )}
                        <hr className="my-2" />
                        <button onClick={handleLogout} className="flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 text-red-600 font-medium">
                          <LogOut className="h-4 w-4" /> লগ আউট
                        </button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">লগ ইন</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex bg-orange-500 hover:bg-orange-600">
                <Link href="/signup">জয়েন করুন</Link>
              </Button>

              <div className="md:hidden flex items-center gap-2">
                <Sheet>
                  <SheetTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "text-gray-600")}>
                    <Menu className="h-6 w-6" />
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[85vw] !bg-white p-0">
                    <div className="flex flex-col h-full bg-white">
                      <div className="flex items-center justify-between p-4 border-b">
                         <span className="font-bold text-lg">মেনু</span>
                      </div>
                      <div className="flex flex-col p-4 gap-2">
                        <Link href="/directory" className="flex items-center gap-2 p-2 rounded-lg hover:bg-orange-50 font-medium">
                          মন্দির খুঁজুন
                        </Link>
                        <Link href="/leaderboard" className="flex items-center gap-2 p-2 rounded-lg hover:bg-orange-50 font-medium">
                          লিডারবোর্ড
                        </Link>
                        <hr className="my-2" />
                        <Link href="/login" className="flex items-center gap-2 p-2 rounded-lg hover:bg-orange-50 font-bold">
                          লগ ইন
                        </Link>
                        <Link href="/signup" className="flex items-center gap-2 p-2 rounded-lg bg-orange-500 text-white font-bold">
                          রেজিস্ট্রেশন
                        </Link>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
