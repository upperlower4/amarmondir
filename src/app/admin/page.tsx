'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Loader2, ShieldCheck, AlertCircle, FilePenLine, Users, Building, Activity, Search } from 'lucide-react';
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
        editsRes,
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
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
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
          .limit(50),
        supabase
          .from('profiles')
          .select('id, username, full_name, is_admin, created_at, avatar_url')
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (pendingRes.error) throw pendingRes.error;

      setPendingTemples(pendingRes.data || []);
      setAllTemples(allTemplesDataRes.data || []);
      setAllUsers(usersDataRes.data || []);
      
      setStats({
        pendingEditCount: editsRes.count || 0,
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

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);

    try {
      const { error } = await supabase.from('temples').update({ status }).eq('id', id);
      if (error) throw error;

      toast.success(status === 'approved' ? 'মন্দির এপ্রুভ করা হয়েছে' : 'মন্দির রিজেক্ট করা হয়েছে');
      
      // Update local state
      setPendingTemples((prev) => prev.filter((t) => t.id !== id));
      setAllTemples((prev) => 
        prev.map((t) => t.id === id ? { ...t, status } : t)
      );
      
      if (status === 'approved') {
        setStats(s => ({ ...s, approvedTemples: s.approvedTemples + 1 }));
      }
    } catch (error: any) {
      console.error('Moderation error:', safeJsonStringify(error));
      toast.error('অপারেশন ব্যর্থ হয়েছে', {
        description: String(error?.message || 'Unknown error').slice(0, 500),
      });
    } finally {
      setProcessingId(null);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean | null | undefined) => {
    const isCurrentlyAdmin = currentStatus === true;
    toast.error('নিরাপত্তার স্বার্থে প্যানেল থেকে অ্যাডমিন স্ট্যাটাস পরিবর্তন আপাতত বন্ধ আছে। ডাটাবেস থেকে ম্যানুয়ালি করুন।');
  }

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
              <TabsTrigger value="overview" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Overview</TabsTrigger>
              <TabsTrigger value="moderation" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                Moderation Queue
                {pendingTemples.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-700 data-[state=active]:bg-white/20 data-[state=active]:text-white py-0.5 px-2 rounded-full text-xs font-bold">
                    {pendingTemples.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="temples" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">All Temples</TabsTrigger>
              <TabsTrigger value="users" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Users</TabsTrigger>
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
                    <p className="text-xs text-gray-400 mt-1">রেজিস্টার্ড প্রোফাইল</p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">সার্বমোট মন্দির</CardTitle>
                    <Building className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{loading ? '-' : stats.totalTemples}</div>
                    <p className="text-xs text-gray-400 mt-1">প্ল্যাটফর্মে আপলোড করা হয়েছে</p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">এপ্রুভড মন্দির</CardTitle>
                    <Check className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{loading ? '-' : stats.approvedTemples}</div>
                    <p className="text-xs text-gray-400 mt-1">সবার জন্য উন্মুক্ত</p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">অপেক্ষমাণ কাজ</CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{loading ? '-' : pendingTemples.length + stats.pendingEditCount}</div>
                    <p className="text-xs text-gray-400 mt-1">রিভিউয়ের জন্য প্রস্তুত</p>
                  </CardContent>
                </Card>
              </div>

              {stats.pendingEditCount > 0 && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-800 flex items-start sm:items-center gap-3 shadow-sm">
                  <FilePenLine className="h-5 w-5 shrink-0 mt-0.5 sm:mt-0 text-blue-500" />
                  <div>
                    <strong className="block mb-1">এডিট রিকোয়েস্ট পেন্ডিং আছে!</strong>
                    <span className="bengali-text text-blue-600 block sm:inline">বর্তমানে {stats.pendingEditCount} টি নতুন এডিট রিকোয়েস্ট জমা আছে তবে প্যানেলে তা দেখার ফিচার এখনো তৈরি হয়নি।</span>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* MODERATION TAB */}
            <TabsContent value="moderation" className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                </div>
              ) : pendingTemples.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-dashed border-2 shadow-sm">
                  <ShieldCheck className="h-12 w-12 text-green-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium text-lg">বর্তমানে কোন সাবমিশন পেন্ডিং নেই।</p>
                  <p className="text-gray-400 text-sm mt-1">আপনার সব কাজ শেষ!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingTemples.map((temple) => (
                    <Card key={temple.id} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow bg-white relative">
                      {/* Status indicator line */}
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-orange-400"></div>
                      
                      <div className="flex flex-col xl:flex-row pl-1">
                        <div className="relative w-full xl:w-80 h-56 xl:h-auto shrink-0 bg-gray-100">
                          <Image
                            src={temple.cover_image || 'https://picsum.photos/seed/temple/500/500'}
                            alt={temple.title || 'Temple'}
                            fill
                            sizes="(max-width: 1280px) 100vw, 30vw"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <CardContent className="p-6 md:p-8 flex-1 min-w-0">
                          <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-2xl font-bold break-anywhere text-slate-800">{temple.title}</h3>
                                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 max-w-full break-anywhere">{temple.temple_type}</Badge>
                              </div>
                              <p className="text-sm text-gray-500 break-anywhere flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                {temple.upazila}, {temple.district}, {temple.division}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 border px-4 py-2.5 rounded-xl h-fit max-w-full">
                              <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                <AvatarImage src={temple.profiles?.avatar_url || ''} />
                                <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                                  {temple.profiles?.username?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-sm min-w-0">
                                <p className="font-bold text-slate-700 break-anywhere">
                                  {temple.profiles?.full_name || temple.profiles?.username || 'Unknown user'}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {new Date(temple.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-orange-50/50 border border-orange-100/50 p-5 rounded-2xl mb-8 text-sm text-gray-700 bengali-text break-anywhere leading-relaxed">
                            <span className="font-bold text-orange-800 block mb-1">সংক্ষিপ্ত বিবরণ:</span>
                            {temple.short_bio || 'কোন সংক্ষিপ্ত বর্ণনা নেই'}
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-dashed">
                            <Button variant="outline" asChild className="mr-auto">
                              <Link href={`/temple/${temple.id}`} target="_blank">বিস্তারিত দেখুন</Link>
                            </Button>
                            
                            <Button
                              variant="destructive"
                              size="lg"
                              className="rounded-xl px-6"
                              disabled={processingId === temple.id}
                              onClick={() => handleModerate(temple.id, 'rejected')}
                            >
                              <X className="h-5 w-5 mr-2" /> রিজেক্ট
                            </Button>

                            <Button
                              className="bg-green-600 hover:bg-green-700 rounded-xl px-6"
                              size="lg"
                              disabled={processingId === temple.id}
                              onClick={() => handleModerate(temple.id, 'approved')}
                            >
                              {processingId === temple.id ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              ) : (
                                <Check className="h-5 w-5 mr-2" />
                              )}
                              এপ্রুভ করুন
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ALL TEMPLES TAB */}
            <TabsContent value="temples" className="space-y-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Building className="h-5 w-5 text-gray-400" />
                    সম্প্রতিক মন্দির তালিকা
                  </h3>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="মন্দির খুঁজুন..." 
                      className="pl-9 bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b">
                      <tr>
                        <th className="px-6 py-4">নাম</th>
                        <th className="px-6 py-4">অবস্থান</th>
                        <th className="px-6 py-4">আপলোডার</th>
                        <th className="px-6 py-4">স্ট্যাটাস</th>
                        <th className="px-6 py-4">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allTemples
                        .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">{t.title}</td>
                          <td className="px-6 py-4 text-gray-500">{t.upazila}, {t.district}</td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium">
                              @{t.profiles?.username || 'unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={t.status === 'approved' ? 'default' : t.status === 'rejected' ? 'destructive' : 'secondary'}
                                   className={t.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}>
                              {t.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Button variant="ghost" size="sm" asChild className="h-8">
                              <Link href={`/temple/${t.id}`}>দেখুন</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {allTemples.length === 0 && !loading && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            কোন তথ্য পাওয়া যায়নি
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* USERS TAB */}
            <TabsContent value="users" className="space-y-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    রেজিস্টার্ড ইউজার
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b">
                      <tr>
                        <th className="px-6 py-4">প্রোফাইল</th>
                        <th className="px-6 py-4">ইউজারনেম</th>
                        <th className="px-6 py-4">যোগদানের তারিখ</th>
                        <th className="px-6 py-4">রোল (Role)</th>
                        <th className="px-6 py-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={u.avatar_url || ''} />
                                <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                                  {u.username?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-slate-800">{u.full_name || 'নাম নেই'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500">@{u.username}</td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            {u.is_admin ? (
                              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">Admin</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 font-normal">User</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-xs"
                              onClick={() => toggleAdminStatus(u.id, u.is_admin)}
                            >
                              রোল পরিবর্তন
                            </Button>
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
