'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { BackButton } from '@/components/BackButton';
import { POINTS } from '@/lib/contribution';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, LayoutDashboard, FileEdit, ImageIcon, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> এপ্রুভড</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200"><XCircle className="w-3 h-3 mr-1" /> রিজেক্টেড</Badge>;
    default:
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"><Clock className="w-3 h-3 mr-1" /> পেন্ডিং</Badge>;
  }
}

function getPointsDisplay(status: string, pointValue: number) {
  switch (status) {
    case 'approved':
      return <span className="text-green-600 font-bold">+{pointValue} পয়েন্ট</span>;
    case 'rejected':
      return <span className="text-red-500 font-bold">-{POINTS.REJECTION_PENALTY} পয়েন্ট</span>;
    default:
      return <span className="text-gray-400 font-medium">0 পয়েন্ট</span>;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [temples, setTemples] = useState<any[]>([]);
  const [edits, setEdits] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    approvedTempleCount: 0,
    approvedEditCount: 0,
    approvedPhotoCount: 0,
    rejectedCount: 0,
    score: 0
  });

  useEffect(() => {
    let active = true;

    async function loadData() {
      // Must have user immediately because useAuth might take time? 
      // It's better to wait for auth check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (active) router.push('/login');
        return;
      }
      
      const userId = session.user.id;
      
      const [templesRes, editsRes, photosRes] = await Promise.all([
        supabase.from('temples').select('id, slug, title, status, created_at, moderation_reason').eq('created_by', userId).order('created_at', { ascending: false }),
        supabase.from('temple_edits').select('id, temple_id, status, created_at, moderator_note, temples(title, slug)').eq('profile_id', userId).order('created_at', { ascending: false }),
        supabase.from('temple_photos').select('id, temple_id, status, created_at, photo_type, url, temples(title, slug)').eq('profile_id', userId).order('created_at', { ascending: false })
      ]);

      const tItems = templesRes.data || [];
      const eItems = editsRes.data || [];
      const pItems = photosRes.data || [];

      // compute summary stats on client side as fallback or wait until stats get loaded
      const approvedTemples = tItems.filter(t => t.status === 'approved').length;
      const approvedEdits = eItems.filter(e => e.status === 'approved').length;
      const approvedPhotos = pItems.filter(p => p.status === 'approved').length;
      const rejectedCount = tItems.filter(t => t.status === 'rejected').length + 
                            eItems.filter(e => e.status === 'rejected').length + 
                            pItems.filter(p => p.status === 'rejected').length;

      const score = (approvedTemples * POINTS.TEMPLE_ADD) + 
                    (approvedEdits * POINTS.EDIT_APPROVED) + 
                    (approvedPhotos * POINTS.PHOTO_APPROVED) - 
                    (rejectedCount * POINTS.REJECTION_PENALTY);

      if (active) {
        setTemples(tItems);
        setEdits(eItems);
        setPhotos(pItems);
        setSummary({
          approvedTempleCount: approvedTemples,
          approvedEditCount: approvedEdits,
          approvedPhotoCount: approvedPhotos,
          rejectedCount,
          score
        });
        setLoading(false);
      }
    }

    loadData();

    return () => { active = false; };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  const pendingCount = 
    temples.filter(t => t.status === 'pending').length + 
    edits.filter(e => e.status === 'pending').length + 
    photos.filter(p => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <BackButton className="mb-6" />
        <div className="flex items-center gap-3 mb-8 text-gray-900 border-b pb-6">
          <div className="bg-orange-100 p-3 rounded-2xl">
            <LayoutDashboard className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-sans">আমার ড্যাশবোর্ড</h1>
            <p className="text-gray-500">আপনার অবদান এবং পয়েন্টের বিস্তারিত বিবরণ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card className="bg-white border-none shadow-sm shadow-orange-100/50">
            <CardHeader className="pb-2">
              <CardDescription>মোট স্কোর</CardDescription>
              <CardTitle className="text-4xl font-black text-orange-600">{summary.score}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>এপ্রুভড</CardDescription>
              <CardTitle className="text-3xl font-bold text-green-600">
                {summary.approvedTempleCount + summary.approvedEditCount + summary.approvedPhotoCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>পেন্ডিং</CardDescription>
              <CardTitle className="text-3xl font-bold text-yellow-600">{pendingCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>রিজেক্টেড</CardDescription>
              <CardTitle className="text-3xl font-bold text-red-500">{summary.rejectedCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="temples" className="w-full">
          <TabsList className="grid w-full mb-8 grid-cols-1 sm:grid-cols-3 gap-2 h-auto bg-transparent p-0">
            <TabsTrigger value="temples" className="flex items-center gap-2 py-3 bg-gray-100 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200">
              <MapPin className="w-4 h-4" /> আমার যুক্ত করা মন্দির <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs ml-1">{temples.length}</span>
            </TabsTrigger>
            <TabsTrigger value="edits" className="flex items-center gap-2 py-3 bg-gray-100 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200">
              <FileEdit className="w-4 h-4" /> এডিট সাজেশন <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs ml-1">{edits.length}</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2 py-3 bg-gray-100 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200">
              <ImageIcon className="w-4 h-4" /> ফোটো অবদান <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs ml-1">{photos.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="temples" className="space-y-4 focus-visible:outline-none">
            {temples.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 mb-4">আপনি এখনো কোনো মন্দির যুক্ত করেননি</p>
                <Link href="/add-temple" className="text-orange-600 font-medium hover:underline">নতুন মন্দির যুক্ত করুন</Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100 whitespace-nowrap">
                      <tr>
                        <th className="px-6 py-4">মন্দির</th>
                        <th className="px-6 py-4">তারিখ</th>
                        <th className="px-6 py-4">স্ট্যাটাস</th>
                        <th className="px-6 py-4">পয়েন্ট</th>
                        <th className="px-6 py-4">মন্তব্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {temples.map((temple) => (
                        <tr key={temple.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-medium whitespace-nowrap">
                            {temple.slug && temple.status === 'approved' ? (
                              <Link href={`/temple/${temple.slug}`} className="text-blue-600 hover:underline">{temple.title}</Link>
                            ) : (
                              <span className="text-gray-900">{temple.title}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{new Date(temple.created_at).toLocaleDateString('bn-BD')}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(temple.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getPointsDisplay(temple.status, POINTS.TEMPLE_ADD)}</td>
                          <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate" title={temple.moderation_reason || ''}>
                            {temple.moderation_reason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="edits" className="space-y-4 focus-visible:outline-none">
            {edits.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500">আপনার কোনো এডিট সাজেশন নেই</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100 whitespace-nowrap">
                      <tr>
                        <th className="px-6 py-4">মন্দির</th>
                        <th className="px-6 py-4">তারিখ</th>
                        <th className="px-6 py-4">স্ট্যাটাস</th>
                        <th className="px-6 py-4">পয়েন্ট</th>
                        <th className="px-6 py-4">মন্তব্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {edits.map((edit) => (
                        <tr key={edit.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                            {edit.temples?.title || 'Unknown Temple'}
                          </td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{new Date(edit.created_at).toLocaleDateString('bn-BD')}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(edit.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getPointsDisplay(edit.status, POINTS.EDIT_APPROVED)}</td>
                          <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate" title={edit.moderator_note || ''}>
                            {edit.moderator_note || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="space-y-4 focus-visible:outline-none">
            {photos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500">আপনার কোনো ফোটো অবদান নেই</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100 whitespace-nowrap">
                      <tr>
                        <th className="px-6 py-4">ছবি</th>
                        <th className="px-6 py-4">মন্দির</th>
                        <th className="px-6 py-4">তারিখ</th>
                        <th className="px-6 py-4">স্ট্যাটাস</th>
                        <th className="px-6 py-4">পয়েন্ট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {photos.map((photo) => (
                        <tr key={photo.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="relative w-16 h-12">
                              <Image src={photo.url} alt="Temple" fill className="object-cover rounded-lg" referrerPolicy="no-referrer" />
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                            {photo.temples?.title || 'Unknown Temple'}
                          </td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{new Date(photo.created_at).toLocaleDateString('bn-BD')}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(photo.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getPointsDisplay(photo.status, POINTS.PHOTO_APPROVED)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
