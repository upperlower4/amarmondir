'use client';

import { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Loader2, ShieldCheck, AlertCircle, Search, Flag, Star, RotateCcw, Users, FilePenLine, Images } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { safeJsonStringify, getTempleEditDiff, similarityScore } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

async function adminAction(body: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/admin/moderation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Action failed');
  return data;
}

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [query, setQuery] = useState('');
  const [bulkTempleIds, setBulkTempleIds] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pendingTemples, setPendingTemples] = useState<any[]>([]);
  const [pendingEdits, setPendingEdits] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [allTemples, setAllTemples] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.is_admin) fetchData();
    else if (!authLoading) setLoading(false);
  }, [profile, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templesRes, editsRes, reportsRes, usersRes, templeIndexRes, photosRes] = await Promise.all([
        supabase.from('temples').select('*, profiles(username, full_name, avatar_url)').eq('status', 'pending').is('deleted_at', null).order('created_at', { ascending: true }),
        supabase.from('temple_edits').select('*, profiles(username, full_name), temples(*)').eq('status', 'pending').order('created_at', { ascending: true }),
        supabase.from('temple_reports').select('*, profiles(username, full_name), temples(id, title, district, slug)').eq('status', 'pending').order('created_at', { ascending: true }),
        supabase.from('profiles').select('id, username, full_name, avatar_url, is_suspended, suspension_reason, temples_added, edits_made, badge').order('updated_at', { ascending: false }).limit(50),
        supabase.from('temples').select('id, title, english_name, district, slug, is_featured, deleted_at, status').order('updated_at', { ascending: false }).limit(200),
        supabase.from('temple_photos').select('*, temples(id, title, slug)').eq('status', 'pending').order('created_at', { ascending: true }),
      ]);

      setPendingTemples(templesRes.data || []);
      setPendingEdits(editsRes.data || []);
      setPendingReports(reportsRes.data || []);
      setUsers(usersRes.data || []);
      setAllTemples(templeIndexRes.data || []);
      setPendingPhotos(photosRes.data || []);
    } catch (error: any) {
      console.error('Admin fetch error:', safeJsonStringify(error));
      toast.error(error?.message || 'Admin data load failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemples = useMemo(() => {
    const q = query.toLowerCase();
    return allTemples.filter((t) => !q || [t.title, t.english_name, t.district, t.slug].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [allTemples, query]);

  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter((u) => !q || [u.username, u.full_name].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [users, query]);

  const duplicateCandidates = useMemo(() => {
    const pairs: any[] = [];
    for (let i = 0; i < allTemples.length; i++) {
      for (let j = i + 1; j < allTemples.length; j++) {
        const a = allTemples[i];
        const b = allTemples[j];
        const score = Math.max(similarityScore(a.title, b.title), similarityScore(a.english_name, b.english_name), similarityScore(a.slug, b.slug));
        if (score >= 0.75 && a.district === b.district) pairs.push({ a, b, score });
      }
    }
    return pairs.slice(0, 12);
  }, [allTemples]);

  const handleAction = async (body: any) => {
    setProcessingId(body.id || body.ids?.[0] || 'bulk');
    try {
      await adminAction({ ...body, note });
      toast.success('অ্যাকশন সম্পন্ন হয়েছে');
      setNote('');
      setBulkTempleIds([]);
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'অ্যাকশন ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading) return null;

  if (!profile?.is_admin) {
    return <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50"><Card className="max-w-md w-full text-center p-8 space-y-4"><AlertCircle className="h-12 w-12 text-red-500 mx-auto" /><h1 className="text-xl font-bold">এক্সেস নেই</h1><p className="text-gray-500">এই পৃষ্ঠাটি শুধুমাত্র অ্যাডমিনদের জন্য।</p><Button asChild className="bg-orange-500"><Link href="/">হোমপেজে ফিরে যান</Link></Button></Card></div>;
  }

  const analytics = [
    { label: 'Pending temples', value: pendingTemples.length, icon: ShieldCheck },
    { label: 'Edit requests', value: pendingEdits.length, icon: FilePenLine },
    { label: 'Reports', value: pendingReports.length, icon: Flag },
    { label: 'Pending photos', value: pendingPhotos.length, icon: Images },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50/50 py-8 md:py-12">
        <div className="container mx-auto px-4 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-3"><ShieldCheck className="h-3 w-3" /> ADVANCED ADMIN</div>
              <h1 className="text-3xl font-bold font-serif">মডারেশন ও কন্ট্রোল সেন্টার</h1>
              <p className="text-gray-500">edit workflow, reports, gallery review, featured control, user moderation, duplicate hints</p>
            </div>
            <div className="w-full lg:w-96"><Input placeholder="Temple বা user search করুন..." value={query} onChange={(e) => setQuery(e.target.value)} className="bg-white" /></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.map((item) => <Card key={item.label}><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">{item.label}</p><p className="text-2xl font-bold">{item.value}</p></div><item.icon className="h-5 w-5 text-orange-500" /></div></CardContent></Card>)}
          </div>

          <Card><CardContent className="p-4 space-y-3"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Approve/reject/suspend reason লিখুন (optional but recommended)" /><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!bulkTempleIds.length || processingId === 'bulk'} onClick={() => handleAction({ entity: 'temple', action: 'approve', ids: bulkTempleIds })}>Bulk approve</Button><Button variant="outline" disabled={!bulkTempleIds.length || processingId === 'bulk'} onClick={() => handleAction({ entity: 'temple', action: 'reject', ids: bulkTempleIds })}>Bulk reject</Button><Button variant="outline" disabled={!bulkTempleIds.length || processingId === 'bulk'} onClick={() => handleAction({ entity: 'temple', action: 'feature', ids: bulkTempleIds })}>Bulk feature</Button></div></CardContent></Card>

          {loading ? <div className="grid gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-3xl bg-white border animate-pulse" />)}</div> : (
            <Tabs defaultValue="temples" className="space-y-6">
              <TabsList className="flex flex-wrap h-auto bg-white p-2 rounded-2xl border"><TabsTrigger value="temples">Temples</TabsTrigger><TabsTrigger value="edits">Edits</TabsTrigger><TabsTrigger value="reports">Reports</TabsTrigger><TabsTrigger value="photos">Photos</TabsTrigger><TabsTrigger value="users">Users</TabsTrigger><TabsTrigger value="search">Search</TabsTrigger></TabsList>

              <TabsContent value="temples" className="space-y-4">
                {pendingTemples.length === 0 ? <EmptyState title="Pending temples নেই" /> : pendingTemples.map((temple) => (
                  <Card key={temple.id} className="overflow-hidden"><div className="grid xl:grid-cols-[260px_1fr] gap-0"><div className="relative min-h-56 bg-gray-100"><Image src={temple.cover_image || 'https://picsum.photos/seed/temple/500/500'} alt={temple.title} fill className="object-cover" /></div><CardContent className="p-5 space-y-4"><div className="flex flex-col lg:flex-row justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={bulkTempleIds.includes(temple.id)} onChange={(e) => setBulkTempleIds((prev) => e.target.checked ? [...prev, temple.id] : prev.filter((id) => id !== temple.id))} /> bulk</label><h3 className="text-xl font-bold">{temple.title}</h3>{temple.is_featured && <Badge>Featured</Badge>}</div><p className="text-sm text-gray-500">{temple.upazila}, {temple.district}, {temple.division}</p><p className="text-sm mt-2 text-gray-700">{temple.short_bio || 'কোন bio নেই'}</p></div><div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl h-fit"><Avatar className="h-8 w-8"><AvatarImage src={temple.profiles?.avatar_url || ''} /><AvatarFallback>{temple.profiles?.username?.[0] || '?'}</AvatarFallback></Avatar><div className="text-xs"><p className="font-bold">{temple.profiles?.full_name || temple.profiles?.username || 'Unknown'}</p><p className="text-gray-400">{new Date(temple.created_at).toLocaleDateString()}</p></div></div></div><div className="flex flex-wrap gap-2 justify-end"><Button variant="outline" onClick={() => handleAction({ entity: 'temple', action: 'feature', id: temple.id })}><Star className="h-4 w-4 mr-2" />Feature</Button><Button variant="destructive" onClick={() => handleAction({ entity: 'temple', action: 'reject', id: temple.id })}><X className="h-4 w-4 mr-2" />Reject</Button><Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction({ entity: 'temple', action: 'approve', id: temple.id })}>{processingId === temple.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" />Approve</>}</Button></div></CardContent></div></Card>
                ))}
              </TabsContent>

              <TabsContent value="edits" className="space-y-4">
                {pendingEdits.length === 0 ? <EmptyState title="Pending edits নেই" /> : pendingEdits.map((edit) => {
                  const diff = getTempleEditDiff(edit.temples || {}, edit.suggested_data || {});
                  return <Card key={edit.id}><CardHeader><CardTitle className="text-lg flex items-center justify-between"><span>{edit.temples?.title || 'Unknown temple'} - edit compare</span><Badge variant="outline">{edit.profiles?.full_name || edit.profiles?.username || 'Unknown contributor'}</Badge></CardTitle></CardHeader><CardContent className="space-y-4">{diff.length ? diff.map(([key, value]) => <div key={key} className="grid md:grid-cols-2 gap-4"><div className="rounded-2xl border p-3 bg-gray-50"><p className="text-xs uppercase text-gray-400">Current</p><p className="break-words">{String(edit.temples?.[key] ?? '—')}</p></div><div className="rounded-2xl border p-3 bg-green-50 border-green-200"><p className="text-xs uppercase text-green-600">Suggested · {key}</p><p className="break-words">{String(value ?? '—')}</p></div></div>) : <p className="text-sm text-gray-500">No visible diff</p>}<div className="flex flex-wrap justify-end gap-2"><Button variant="destructive" onClick={() => handleAction({ entity: 'edit', action: 'reject', id: edit.id })}>Reject</Button><Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction({ entity: 'edit', action: 'approve', id: edit.id })}>Approve edit</Button></div></CardContent></Card>;
                })}
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                {pendingReports.length === 0 ? <EmptyState title="Pending reports নেই" /> : pendingReports.map((report) => <Card key={report.id}><CardContent className="p-5 space-y-3"><div className="flex flex-col md:flex-row justify-between gap-3"><div><div className="flex items-center gap-2"><Badge variant="outline">{report.report_type}</Badge><Link className="font-bold hover:text-orange-600" href={`/temple/${report.temples?.slug}`}>{report.temples?.title || 'Unknown temple'}</Link></div><p className="text-sm text-gray-500">Reported by {report.profiles?.full_name || report.profiles?.username || 'Anonymous'}</p></div><p className="text-xs text-gray-400">{new Date(report.created_at).toLocaleString()}</p></div><div className="rounded-2xl border bg-red-50 p-4 text-sm">{report.details}</div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => handleAction({ entity: 'report', action: 'review', id: report.id })}>Mark reviewed</Button><Button variant="destructive" onClick={() => handleAction({ entity: 'report', action: 'reject', id: report.id })}>Reject</Button><Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction({ entity: 'report', action: 'resolve', id: report.id })}>Resolve</Button></div></CardContent></Card>)}
              </TabsContent>

              <TabsContent value="photos" className="space-y-4">
                {pendingPhotos.length === 0 ? <EmptyState title="Pending photo submissions নেই" /> : pendingPhotos.map((photo) => <Card key={photo.id}><div className="grid md:grid-cols-[220px_1fr] gap-0"><div className="relative min-h-52 bg-gray-100"><Image src={photo.url} alt={photo.caption || 'Photo'} fill className="object-cover" /></div><CardContent className="p-5 space-y-3"><div className="flex flex-wrap gap-2 items-center"><Link href={`/temple/${photo.temples?.slug}`} className="font-bold hover:text-orange-600">{photo.temples?.title}</Link>{photo.is_cover_requested && <Badge>Cover requested</Badge>}</div><p className="text-sm text-gray-600">{photo.caption || 'No caption'}</p><p className="text-xs text-gray-400">Credit: {photo.credit_name || 'Unknown'}</p><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => handleAction({ entity: 'photo', action: 'set_cover', id: photo.id })}>Set as cover</Button><Button variant="destructive" onClick={() => handleAction({ entity: 'photo', action: 'reject', id: photo.id })}>Reject</Button><Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction({ entity: 'photo', action: 'approve', id: photo.id })}>Approve</Button></div></CardContent></div></Card>)}
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                {filteredUsers.length === 0 ? <EmptyState title="কোন user পাওয়া যায়নি" /> : filteredUsers.map((user) => <Card key={user.id}><CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-3"><Avatar><AvatarImage src={user.avatar_url || ''} /><AvatarFallback>{user.username?.[0] || '?'}</AvatarFallback></Avatar><div><p className="font-bold">{user.full_name || user.username}</p><p className="text-xs text-gray-500">@{user.username} · {user.badge}</p><p className="text-xs text-gray-400">Temple: {user.temples_added} · Edit: {user.edits_made}</p></div></div><div className="flex gap-2">{user.is_suspended ? <Badge variant="destructive">Suspended</Badge> : null}<Button variant="outline" onClick={() => handleAction({ entity: 'user', action: user.is_suspended ? 'unsuspend' : 'suspend', id: user.id })}>{user.is_suspended ? <RotateCcw className="h-4 w-4 mr-2" /> : <Users className="h-4 w-4 mr-2" />}{user.is_suspended ? 'Restore' : 'Suspend'}</Button><Button variant="destructive" onClick={() => handleAction({ entity: 'user', action: 'ban', id: user.id })}>Ban</Button></div></CardContent></Card>)}
              </TabsContent>

              <TabsContent value="search" className="space-y-6">
                <Card><CardHeader><CardTitle>Temple search & controls</CardTitle></CardHeader><CardContent className="space-y-3">{filteredTemples.length === 0 ? <EmptyState title="No temple matches" /> : filteredTemples.map((temple) => <div key={temple.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border p-4"><div><p className="font-semibold">{temple.title}</p><p className="text-xs text-gray-500">{temple.district} · {temple.slug}</p></div><div className="flex flex-wrap gap-2">{temple.is_featured && <Badge>Featured</Badge>}{temple.deleted_at && <Badge variant="destructive">Soft deleted</Badge>}<Button variant="outline" onClick={() => handleAction({ entity: 'temple', action: temple.is_featured ? 'unfeature' : 'feature', id: temple.id })}>{temple.is_featured ? 'Unfeature' : 'Feature'}</Button><Button variant="outline" onClick={() => handleAction({ entity: 'temple', action: temple.deleted_at ? 'restore' : 'soft_delete', id: temple.id })}>{temple.deleted_at ? 'Restore' : 'Soft delete'}</Button></div></div>)}</CardContent></Card>
                <Card><CardHeader><CardTitle>Duplicate detection hints</CardTitle></CardHeader><CardContent className="space-y-3">{duplicateCandidates.length === 0 ? <EmptyState title="No strong duplicate hints" /> : duplicateCandidates.map((item, idx) => <div key={idx} className="rounded-2xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><p className="font-semibold">{item.a.title} ↔ {item.b.title}</p><p className="text-xs text-gray-500">{item.a.district} · similarity {(item.score * 100).toFixed(0)}%</p></div><div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">Manual merge UI next phase; candidate pair identified.</div></div>)}</CardContent></Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function EmptyState({ title }: { title: string }) {
  return <div className="bg-white rounded-3xl p-10 text-center border shadow-sm text-gray-500">{title}</div>;
}
