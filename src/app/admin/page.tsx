'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const [pendingTemples, setPendingTemples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchSessions();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [profile, authLoading]);

  const fetchSessions = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('temples')
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch moderation queue error:', error.message);
      toast.error('মডারেশন কিউ লোড করা যায়নি', {
        description: error.message,
      });
      setPendingTemples([]);
      setLoading(false);
      return;
    }

    setPendingTemples(data || []);
    setLoading(false);
  };

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);

    try {
      const { error } = await supabase
        .from('temples')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast.success(status === 'approved' ? 'মন্দির এপ্রুভ করা হয়েছে' : 'মন্দির রিজেক্ট করা হয়েছে');
      setPendingTemples((prev) => prev.filter((t) => t.id !== id));
    } catch (error: any) {
      console.error('Moderation error:', String(error?.message || error));
      toast.error('অপারেশন ব্যর্থ হয়েছে', {
        description: String(error?.message || 'Unknown error').slice(0, 500),
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading) {
    return null;
  }

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold">এক্সেস নেই</h1>
          <p className="text-gray-500">এই পৃষ্ঠাটি শুধুমাত্র অ্যাডমিনদের জন্য।</p>
          <Button asChild className="bg-orange-500">
            <Link href="/">হোমপেজে ফিরে যান</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-3">
                <ShieldCheck className="h-3 w-3" />
                ADMIN PANEL
              </div>
              <h1 className="text-3xl font-bold font-serif">মডারেশন কিউ</h1>
              <p className="text-gray-500 bengali-text">নতুন সাবমিশনগুলো রিভিউ করুন</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border shadow-sm text-center">
                <p className="text-2xl font-bold text-orange-600">{pendingTemples.length}</p>
                <p className="text-[10px] uppercase font-bold text-gray-400">অপেক্ষমাণ</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border shadow-sm text-center">
                <p className="text-2xl font-bold text-green-600">০</p>
                <p className="text-[10px] uppercase font-bold text-gray-400">এডিট রিকোয়েস্ট</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            </div>
          ) : pendingTemples.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center border shadow-sm">
              <p className="text-gray-500">বর্তমানে কোন সাবমিশন পেন্ডিং নেই।</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingTemples.map((temple) => (
                <Card key={temple.id} className="overflow-hidden border-none shadow-lg">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-64 h-48 md:h-auto shrink-0">
                      <Image
                        src={temple.cover_image || 'https://picsum.photos/seed/temple/500/500'}
                        alt="Temple"
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <CardContent className="p-6 flex-1">
                      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold">{temple.title}</h3>
                            <Badge variant="outline">{temple.temple_type}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {temple.upazila}, {temple.district}, {temple.division}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl h-fit">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={temple.profiles?.avatar_url || ''} />
                            <AvatarFallback>{temple.profiles?.username?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="text-xs">
                            <p className="font-bold">
                              {temple.profiles?.full_name || temple.profiles?.username || 'Unknown user'}
                            </p>
                            <p className="text-gray-400">
                              Submitted on {new Date(temple.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-orange-50/50 p-4 rounded-xl mb-6 text-sm text-gray-700 bengali-text">
                        {temple.short_bio || 'কোন সংক্ষিপ্ত বর্ণনা নেই'}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-4">
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            disabled={processingId === temple.id}
                            onClick={() => handleModerate(temple.id, 'rejected')}
                          >
                            <X className="h-4 w-4 mr-2" /> রিজেক্ট
                          </Button>

                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            disabled={processingId === temple.id}
                            onClick={() => handleModerate(temple.id, 'approved')}
                          >
                            {processingId === temple.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            এপ্রুভ
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}