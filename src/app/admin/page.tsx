'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2, ShieldCheck, AlertCircle, FilePenLine } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const [pendingTemples, setPendingTemples] = useState<any[]>([]);
  const [pendingEditCount, setPendingEditCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchModerationData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [profile, authLoading]);

  const fetchModerationData = async () => {
    setLoading(true);

    const [templeRes, editRes] = await Promise.all([
      supabase
        .from('temples')
        .select('*, profiles(username, full_name, avatar_url)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true }),
      supabase
        .from('temple_edits')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    if (templeRes.error) {
      console.error('Fetch moderation queue error:', templeRes.error.message);
      toast.error('মডারেশন কিউ লোড করা যায়নি', {
        description: templeRes.error.message,
      });
      setPendingTemples([]);
      setPendingEditCount(0);
      setLoading(false);
      return;
    }

    if (editRes.error) {
      console.error('Fetch edit queue error:', editRes.error.message);
      toast.error('এডিট রিকোয়েস্ট কাউন্ট লোড করা যায়নি', {
        description: editRes.error.message,
      });
    }

    setPendingTemples(templeRes.data || []);
    setPendingEditCount(editRes.count || 0);
    setLoading(false);
  };

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);

    try {
      const { error } = await supabase.from('temples').update({ status }).eq('id', id);
      if (error) throw error;

      toast.success(status === 'approved' ? 'মন্দির এপ্রুভ করা হয়েছে' : 'মন্দির রিজেক্ট করা হয়েছে');
      setPendingTemples((prev) => prev.filter((t) => t.id !== id));
    } catch (error: any) {
      console.error('Moderation error:', safeJsonStringify(error));
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
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
      <main className="flex-1 bg-gray-50/50 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 md:mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-3">
                <ShieldCheck className="h-3 w-3" />
                ADMIN PANEL
              </div>
              <h1 className="text-3xl font-bold font-serif">মডারেশন কিউ</h1>
              <p className="text-gray-500 bengali-text">নতুন সাবমিশনগুলো রিভিউ করুন</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-white p-4 rounded-2xl border shadow-sm text-center min-w-36">
                <p className="text-2xl font-bold text-orange-600">{pendingTemples.length}</p>
                <p className="text-[11px] text-gray-400 font-bold">অপেক্ষমাণ মন্দির</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border shadow-sm text-center min-w-36">
                <p className="text-2xl font-bold text-green-600">{pendingEditCount}</p>
                <p className="text-[11px] text-gray-400 font-bold">এডিট রিকোয়েস্ট</p>
              </div>
            </div>
          </div>

          {pendingEditCount > 0 && (
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-center gap-3">
              <FilePenLine className="h-4 w-4 shrink-0" />
              <span className="bengali-text break-anywhere">temple_edits টেবিলে pending edit request আছে। এই patch-এ count real data থেকে দেখানো হচ্ছে, তবে full edit moderation workflow পরে add করা লাগবে।</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            </div>
          ) : pendingTemples.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 md:p-12 text-center border shadow-sm">
              <p className="text-gray-500">বর্তমানে কোন সাবমিশন পেন্ডিং নেই।</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingTemples.map((temple) => (
                <Card key={temple.id} className="overflow-hidden border-none shadow-lg">
                  <div className="flex flex-col xl:flex-row">
                    <div className="relative w-full xl:w-72 h-48 xl:h-auto shrink-0">
                      <Image
                        src={temple.cover_image || 'https://picsum.photos/seed/temple/500/500'}
                        alt={temple.title || 'Temple'}
                        fill
                        sizes="(max-width: 1280px) 100vw, 30vw"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <CardContent className="p-5 md:p-6 flex-1 min-w-0">
                      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold break-anywhere">{temple.title}</h3>
                            <Badge variant="outline" className="max-w-full break-anywhere">{temple.temple_type}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 break-anywhere">
                            {temple.upazila}, {temple.district}, {temple.division}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl h-fit max-w-full">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={temple.profiles?.avatar_url || ''} />
                            <AvatarFallback>{temple.profiles?.username?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="text-xs min-w-0">
                            <p className="font-bold break-anywhere">
                              {temple.profiles?.full_name || temple.profiles?.username || 'Unknown user'}
                            </p>
                            <p className="text-gray-400">
                              Submitted on {new Date(temple.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-orange-50/50 p-4 rounded-xl mb-6 text-sm text-gray-700 bengali-text break-anywhere">
                        {temple.short_bio || 'কোন সংক্ষিপ্ত বর্ণনা নেই'}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3">
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
