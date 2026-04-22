'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, isConfigured } from '@/lib/supabase';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfigured) {
      toast.error('সিস্টেম এরর', {
        description: 'Supabase ডাটাবেস ঠিকভাবে কনফিগার করা হয়নি। দয়া করে সেটিংস চেক করুন।',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('সফলভাবে লগ ইন হয়েছে');
      router.push('/');
      router.refresh();
    } catch (error: any) {
      let errorMsg = String(error?.message || error);
      
      if (errorMsg.includes('Email not confirmed')) {
        errorMsg = 'আপনার ইমেইলটি ভেরিফাই করা হয়নি। ইনবক্স (বা স্প্যাম ফোল্ডার) চেক করে কনফার্মেশন লিংকে ক্লিক করুন।';
      } else if (errorMsg.includes('Invalid login credentials')) {
        errorMsg = 'ইমেইল অথবা পাসওয়ার্ড ভুল দিয়েছেন। দয়া করে আবার চেষ্টা করুন।';
      }

      toast.error('লগ ইন ব্যর্থ হয়েছে', {
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcfaf7] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-200">
            <MapPin className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-serif">amarmondir</h1>
          <p className="text-muted-foreground bengali-text">মন্দির ডিরেক্টরিতে স্বাগতম</p>
        </div>

        <Card className="border-none shadow-2xl shadow-orange-100/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">লগ ইন করুন</CardTitle>
            <CardDescription>আপনার অ্যাকাউন্ট ব্যবহার করে প্রবেশ করুন</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">পাসওয়ার্ড</Label>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
                {loading ? 'প্রসেসিং...' : 'প্রবেশ করুন'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                অ্যাকাউন্ট নেই?{' '}
                <Link href="/signup" className="font-semibold text-orange-600 hover:underline">
                  রেজিস্ট্রেশন করুন
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
