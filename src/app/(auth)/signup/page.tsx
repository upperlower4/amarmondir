'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
import { sanitizeUsername } from '@/lib/utils';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanUsername = sanitizeUsername(username);
      if (!cleanUsername || cleanUsername.length < 3) {
        toast.error('ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে');
        return;
      }

      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existingUser) {
        toast.error('এই ইউজারনেমটি আগেই নেওয়া হয়েছে');
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: cleanUsername,
          },
        },
      });

      if (error) {
        throw error;
      }

      toast.success('রেজিস্ট্রেশন সফল হয়েছে!', {
        description: 'অ্যাকাউন্ট তৈরির পর প্রোফাইল এডিট পেজ থেকে তথ্য আপডেট করতে পারবেন।',
      });
      router.push('/login');
    } catch (error: any) {
      toast.error('রেজিস্ট্রেশন ব্যর্থ হয়েছে', {
        description: String(error?.message || error),
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
          <p className="text-muted-foreground bengali-text">নতুন কমিউনিটি মেম্বার হিসেবে জয়েন করুন</p>
        </div>

        <Card className="border-none shadow-2xl shadow-orange-100/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">অ্যাকাউন্ট খুলুন</CardTitle>
            <CardDescription>আপনার সঠিক তথ্য দিয়ে ফরমটি পূরণ করুন</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">সম্পূর্ণ নাম</Label>
                <Input id="fullName" placeholder="আপনার নাম" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">ইউজারনেম</Label>
                <Input id="username" placeholder="your_username" required minLength={3} value={username} onChange={(e) => setUsername(e.target.value)} />
                <p className="text-xs text-muted-foreground">a-z, 0-9 এবং underscore ব্যবহার করুন</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
                {loading ? 'প্রসেসিং...' : 'রেজিস্ট্রেশন করুন'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                <Link href="/login" className="font-semibold text-orange-600 hover:underline">
                  লগ ইন করুন
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
