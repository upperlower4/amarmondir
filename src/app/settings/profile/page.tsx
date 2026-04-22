'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { CLOUDINARY_FOLDERS } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2, Save, Upload } from 'lucide-react';
import { safeJsonStringify } from '@/lib/utils';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        toast.error('প্রোফাইল এডিট করতে লগইন করুন');
        router.push('/login');
        return;
      }

      setUserId(session.user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !data) {
        toast.error('প্রোফাইল লোড করা যায়নি');
      } else {
        setUsername(data.username || '');
        setFullName(data.full_name || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
      }
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('শুধু JPG, PNG, WEBP ছবি আপলোড করা যাবে');
      return;
    }

    try {
      setAvatarUploading(true);
      const base64 = await fileToBase64(file);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('আপনাকে আবার লগইন করতে হবে');

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: safeJsonStringify({
          image: base64,
          folder: CLOUDINARY_FOLDERS.AVATARS,
          type: 'avatar',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Avatar upload failed');

      setAvatarUrl(data.url);
      toast.success('অ্যাভাটার আপডেট হয়েছে');
    } catch (error: any) {
      toast.error('অ্যাভাটার আপলোড ব্যর্থ হয়েছে', {
        description: String(error?.message || error),
      });
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
    if (!cleanUsername || cleanUsername.length < 3) {
      toast.error('ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        username: cleanUsername,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
      })
      .eq('id', userId);

    if (error) {
      toast.error('প্রোফাইল সেভ করা যায়নি', {
        description: error.message,
      });
      setSaving(false);
      return;
    }

    toast.success('প্রোফাইল আপডেট হয়েছে');
    router.push(`/profile/${cleanUsername}`);
    router.refresh();
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50/50 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="border-none shadow-xl shadow-orange-100/50 rounded-3xl">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl md:text-3xl">প্রোফাইল এডিট</CardTitle>
              <CardDescription className="bengali-text">
                আপনার নাম, ইউজারনেম, বায়ো এবং অ্যাভাটার এখান থেকে আপডেট করুন।
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="text-2xl bg-orange-100 text-orange-600">
                        {username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-3 min-w-0">
                      <div>
                        <p className="font-semibold">প্রোফাইল ছবি</p>
                        <p className="text-sm text-gray-500 bengali-text">অ্যাভাটার WebP-এ compress হয়ে upload হবে।</p>
                      </div>
                      <Label htmlFor="avatar-upload" className="inline-flex">
                        <span className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-orange-600">
                          {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          নতুন ছবি আপলোড
                        </span>
                      </Label>
                      <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">সম্পূর্ণ নাম</Label>
                      <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="আপনার নাম লিখুন" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">ইউজারনেম</Label>
                      <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_username" />
                      <p className="text-xs text-gray-500">a-z, 0-9 এবং underscore ব্যবহার করুন</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">বায়ো</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="নিজের সম্পর্কে কিছু লিখুন"
                      className="min-h-32"
                      maxLength={300}
                    />
                    <p className="text-xs text-gray-500 text-right">{bio.length}/300</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <Button variant="outline" onClick={() => router.back()}>
                      বাতিল
                    </Button>
                    <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleSave} disabled={saving || avatarUploading}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      সেভ করুন
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
