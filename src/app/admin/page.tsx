'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Loader2, ShieldCheck, AlertCircle, FilePenLine, Users, Building, Activity, Search, Image as ImageIcon, Flag, Trash2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { safeJsonStringify } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const [pendingTemples, setPendingTemples] = useState<any[]>([]);
  const [allTemples, setAllTemples] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [pendingEdits, setPendingEdits] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    pendingEditCount: 0,
    totalTemples: 0,
    totalUsers: 0,
    approvedTemples: 0
  });

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.is_admin) {
      fetchAdminData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [profile, authLoading]);

  const fetchAdminData = async () => {
    setLoading(true);

    try {
      const [
        pendingRes,
        editsDataRes,
        totalTemplesRes,
        totalUsersRes,
        approvedTemplesRes,
        allTemplesDataRes,
        usersDataRes
      ] = await Promise.all([
        supabase
          .from('temples')
          .select('*, profiles!temples_created_by_fkey(username, full_name, avatar_url)')
          .eq('status', 'pending')
          .order('created_at', { ascending: true }),
        supabase
          .from('temple_edits')
          .select('*, temples(title, slug), profiles!temple_edits_profile_id_fkey(username, avatar_url)')
          .eq('status', 'pending')
          .order('created_at', { ascending: true }),
        supabase
          .from('temples')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('temples')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase
          .from('temples')
          .select('id, title, status, created_at, upazila, district, profiles!temples_created_by_fkey(username)')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('profiles')
          .select('id, username, full_name, is_admin, created_at, avatar_url')
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      if (pendingRes.error) throw pendingRes.error;

      setPendingTemples(pendingRes.data || []);
      setPendingEdits(editsDataRes.data || []);
      setAllTemples(allTemplesDataRes.data || []);
      setAllUsers(usersDataRes.data || []);
      
      setStats({
        pendingEditCount: editsDataRes.data?.length || 0,
        totalTemples: totalTemplesRes.count || 0,
        totalUsers: totalUsersRes.count || 0,
        approvedTemples: approvedTemplesRes.count || 0
      });
      
    } catch (error: any) {
      console.error('Fetch admin data error:', error);
      toast.error('অ্যাডমিন ডাটা লোড করা যায়নি', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModerateTemple = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      const { error } = await supabase.from('temples').update({ status }).eq('id', id);
      if (error) throw error;

      toast.success(status === 'approved' ? 'মন্দির এপ্রুভ করা হয়েছে' : 'মন্দির রিজেক্ট করা হয়েছে');
      
      setPendingTemples((prev) => prev.filter((t) => t.id !== id));
      setAllTemples((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
      
      if (status === 'approved') {
        setStats(s => ({ ...s, approvedTemples: s.approvedTemples + 1 }));
      }
    } catch (error: any) {
      toast.error('অপারেশন ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const handleModerateEdit = async (editId: string, templeId: string, suggestedData: any, status: 'approved' | 'rejected') => {
    setProcessingId(`edit-${editId}`);
    try {
      if (status === 'approved') {
        const { error: updateError } = await supabase.from('temples').update(suggestedData).eq('id', templeId);
        if (updateError) throw updateError;
      }
      
      const { error } = await supabase.from('temple_edits').update({ status }).eq('id', editId);
      if (error) throw error;

      toast.success(status === 'approved' ? 'এডিট এপ্রুভ করা হয়েছে' : 'এডিট রিজেক্ট করা হয়েছে');
      setPendingEdits((prev) => prev.filter((e) => e.id !== editId));
      setStats(s => ({ ...s, pendingEditCount: s.pendingEditCount - 1 }));
    } catch (error: any) {
      toast.error('অপারেশন ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center pt-24"><Loader2 className="h-10 w-10 animate-spin text-orange-500" /></div>;
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
      <main className="flex-1 bg-gray-50/50 py-8 md:py-12 min-h-[80vh]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold mb-3">
                <ShieldCheck className="h-3 w-3" />
                ADVANCED ADMIN STUDIO
              </div>
              <h1 className="text-3xl font-bold font-serif text-slate-900">ড্যাশবোর্ড</h1>
              <p className="text-gray-500 bengali-text mt-1">পুরো অ্যাপ্লিকেশনের সার্বিক অবস্থা ও মডারেশন</p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="bg-white border p-1 rounded-xl h-auto w-full md:w-auto inline-flex overflow-x-auto justify-start">
              <TabsTrigger value="overview" className="rounded-lg px-4 py-2.5">Overview</TabsTrigger>
              <TabsTrigger value="moderation" className="rounded-lg px-4 py-2.5">
                New Temples
                {pendingTemples.length > 0 && <span className="ml-2 bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-bold">{pendingTemples.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="edits" className="rounded-lg px-4 py-2.5">
                Edit Requests
                {stats.pendingEditCount > 0 && <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs font-bold">{stats.pendingEditCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="temples" className="rounded-lg px-4 py-2.5">All Temples</TabsTrigger>
              <TabsTrigger value="users" className="rounded-lg px-4 py-2.5">Users</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm border-none bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">মোট ইউজার</CardTitle>
                    <Users className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{loading ? '-' : stats.totalUsers}</div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">সার্বমোট মন্দির</CardTitle>
                    <Building className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{loading ? '-' : stats.totalTemples}</div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">এপ্রুভড মন্দির</CardTitle>
                    <Check className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{loading ? '-' : stats.approvedTemples}</div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">অপেক্ষমাণ কাজ</CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{loading ? '-' : pendingTemples.length + stats.pendingEditCount}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* NEW TEMPLES TAB */}
            <TabsContent value="moderation" className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-orange-500" /></div>
              ) : pendingTemples.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm"><ShieldCheck className="h-12 w-12 text-green-200 mx-auto mb-4" /><p className="text-gray-500">বর্তমানে কোন নতুন সাবমিশন নেই।</p></div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {pendingTemples.map((temple) => (
                    <Card key={temple.id} className="overflow-hidden border-none shadow-sm flex flex-col md:flex-row">
                      <div className="relative w-full md:w-64 h-48 md:h-auto shrink-0 bg-gray-100">
                        <Image src={temple.cover_image || 'https://picsum.photos/seed/temple/500/500'} alt={temple.title || 'Temple'} fill className="object-cover" />
                      </div>
                      <CardContent className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold">{temple.title}</h3>
                            <p className="text-sm text-gray-500">{temple.upazila}, {temple.district}, {temple.division}</p>
                          </div>
                          <Badge variant="outline">{temple.temple_type}</Badge>
                        </div>
                        <p className="text-sm text-gray-700 bg-orange-50 p-3 rounded-lg mb-4">{temple.short_bio || 'বর্ণনা নেই'}</p>
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" asChild><Link href={`/temple/${temple.id}`} target="_blank">বিস্তারিত</Link></Button>
                          <Button variant="destructive" onClick={() => handleModerateTemple(temple.id, 'rejected')} disabled={processingId === temple.id}>রিজেক্ট</Button>
                          <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleModerateTemple(temple.id, 'approved')} disabled={processingId === temple.id}>এপ্রুভ</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* EDIT REQUESTS TAB */}
            <TabsContent value="edits" className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-orange-500" /></div>
              ) : pendingEdits.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm"><FilePenLine className="h-12 w-12 text-blue-200 mx-auto mb-4" /><p className="text-gray-500">বর্তমানে কোন এডিট রিকোয়েস্ট নেই।</p></div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {pendingEdits.map((edit) => (
                    <Card key={edit.id} className="border-none shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-8 w-8"><AvatarImage src={edit.profiles?.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                          <div className="text-sm">
                            <span className="font-bold">@{edit.profiles?.username}</span> suggested edits for 
                            <Link href={`/temple/${edit.temple?.slug}`} target="_blank" className="text-orange-600 font-bold ml-1 hover:underline">{edit.temple?.title}</Link>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border mb-4 font-mono text-xs overflow-x-auto">
                          <pre>{JSON.stringify(edit.suggested_data, null, 2)}</pre>
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="destructive" onClick={() => handleModerateEdit(edit.id, edit.temple_id, edit.suggested_data, 'rejected')} disabled={processingId === `edit-${edit.id}`}>রিজেক্ট এডিট</Button>
                          <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleModerateEdit(edit.id, edit.temple_id, edit.suggested_data, 'approved')} disabled={processingId === `edit-${edit.id}`}>এপ্রুভ করুন</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ALL TEMPLES TAB */}
            <TabsContent value="temples" className="space-y-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Building className="h-5 w-5" /> সব মন্দির</h3>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="মন্দির খুঁজুন..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b">
                      <tr>
                        <th className="px-6 py-4">নাম</th>
                        <th className="px-6 py-4">আপলোডার</th>
                        <th className="px-6 py-4">স্ট্যাটাস</th>
                        <th className="px-6 py-4">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allTemples.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">{t.title}</td>
                          <td className="px-6 py-4 text-gray-500">@{t.profiles?.username}</td>
                          <td className="px-6 py-4">
                            <Badge variant={t.status === 'approved' ? 'default' : t.status === 'rejected' ? 'destructive' : 'secondary'} className={t.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}>{t.status.toUpperCase()}</Badge>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            <Button variant="ghost" size="sm" asChild className="h-8"><Link href={`/temple/${t.id}`} target="_blank">দেখুন</Link></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* USERS TAB */}
            <TabsContent value="users" className="space-y-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users className="h-5 w-5" /> রেজিস্টার্ড ইউজার</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b">
                      <tr>
                        <th className="px-6 py-4">প্রোফাইল</th>
                        <th className="px-6 py-4">ইউজারনেম</th>
                        <th className="px-6 py-4">রোল</th>
                        <th className="px-6 py-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8"><AvatarImage src={u.avatar_url || ''} /><AvatarFallback>U</AvatarFallback></Avatar>
                              <span className="font-medium text-slate-800">{u.full_name || 'নাম নেই'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500">@{u.username}</td>
                          <td className="px-6 py-4">
                            {u.is_admin ? <Badge className="bg-purple-100 text-purple-700">Admin</Badge> : <Badge variant="outline">User</Badge>}
                          </td>
                          <td className="px-6 py-4 text-right">
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
            
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
