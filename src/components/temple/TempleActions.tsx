'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Edit2, Flag, ImagePlus, Loader2, ShieldAlert } from 'lucide-react';

async function authedFetch(url: string, body: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data;
}

async function uploadImage(file: File) {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify({ image: base64, folder: 'amarmondir/gallery', type: 'gallery' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Upload failed');
  return data.url as string;
}

export function TempleActions({ templeId, defaultValues }: { templeId: string; defaultValues: Record<string, any> }) {
  const [editOpen, setEditOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [loading, setLoading] = useState<'edit' | 'report' | 'photo' | null>(null);

  const initialEdit = useMemo(() => ({
    title: defaultValues.title || '',
    english_name: defaultValues.english_name || '',
    address: defaultValues.address || '',
    district: defaultValues.district || '',
    short_bio: defaultValues.short_bio || '',
    map_link: defaultValues.map_link || '',
  }), [defaultValues]);

  const [editValues, setEditValues] = useState(initialEdit);
  const [reportType, setReportType] = useState('incorrect_info');
  const [reportDetails, setReportDetails] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCredit, setPhotoCredit] = useState('');
  const [setAsCover, setSetAsCover] = useState(false);

  const submitEdit = async () => {
    setLoading('edit');
    try {
      await authedFetch(`/api/temples/${templeId}/edit`, { suggestedData: editValues });
      toast.success('এডিট রিকোয়েস্ট জমা হয়েছে');
      setEditOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'এডিট পাঠানো যায়নি');
    } finally {
      setLoading(null);
    }
  };

  const submitReport = async () => {
    setLoading('report');
    try {
      await authedFetch(`/api/temples/${templeId}/report`, { reportType, details: reportDetails });
      toast.success('রিপোর্ট জমা হয়েছে');
      setReportOpen(false);
      setReportDetails('');
    } catch (error: any) {
      toast.error(error.message || 'রিপোর্ট পাঠানো যায়নি');
    } finally {
      setLoading(null);
    }
  };

  const submitPhoto = async () => {
    if (!photoFile) return toast.error('একটি ছবি নির্বাচন করুন');
    setLoading('photo');
    try {
      const url = await uploadImage(photoFile);
      await authedFetch(`/api/temples/${templeId}/photos`, {
        url,
        caption: photoCaption,
        creditName: photoCredit,
        setAsCover,
      });
      toast.success('ছবি রিভিউয়ের জন্য জমা হয়েছে');
      setPhotoOpen(false);
      setPhotoFile(null);
      setPhotoCaption('');
      setPhotoCredit('');
      setSetAsCover(false);
    } catch (error: any) {
      toast.error(error.message || 'ছবি জমা যায়নি');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full h-12 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 flex items-center gap-2">
            <Edit2 className="h-4 w-4" /> তথ্য আপডেট করুন
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>মন্দিরের তথ্য এডিট সাবমিট করুন</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>বাংলা নাম</Label><Input value={editValues.title} onChange={(e) => setEditValues((p) => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>English Name</Label><Input value={editValues.english_name} onChange={(e) => setEditValues((p) => ({ ...p, english_name: e.target.value }))} /></div>
            <div><Label>জেলা</Label><Input value={editValues.district} onChange={(e) => setEditValues((p) => ({ ...p, district: e.target.value }))} /></div>
            <div><Label>ম্যাপ লিংক</Label><Input value={editValues.map_link} onChange={(e) => setEditValues((p) => ({ ...p, map_link: e.target.value }))} /></div>
          </div>
          <div><Label>ঠিকানা</Label><Textarea value={editValues.address} onChange={(e) => setEditValues((p) => ({ ...p, address: e.target.value }))} /></div>
          <div><Label>সংক্ষিপ্ত বর্ণনা</Label><Textarea value={editValues.short_bio} onChange={(e) => setEditValues((p) => ({ ...p, short_bio: e.target.value }))} /></div>
          <Button onClick={submitEdit} className="bg-orange-500 hover:bg-orange-600" disabled={loading === 'edit'}>{loading === 'edit' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'এডিট সাবমিট করুন'}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-white hover:bg-gray-50 text-orange-600 border border-orange-200 rounded-xl h-12 px-8 flex items-center gap-2 font-bold shadow-sm">
            <ImagePlus className="h-4 w-4" /> ছবি আপলোড করুন
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>গ্যালারি ছবি যোগ করুন</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>ছবি</Label><Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} /></div>
            <div><Label>Caption</Label><Input value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} placeholder="ছবির ছোট বর্ণনা" /></div>
            <div><Label>Credit</Label><Input value={photoCredit} onChange={(e) => setPhotoCredit(e.target.value)} placeholder="ফটোগ্রাফারের নাম" /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={setAsCover} onChange={(e) => setSetAsCover(e.target.checked)} /> এই ছবিকে cover হিসেবে বিবেচনা করুন</label>
            <Button onClick={submitPhoto} className="bg-orange-500 hover:bg-orange-600" disabled={loading === 'photo'}>{loading === 'photo' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ছবি সাবমিট করুন'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2">
            <Flag className="h-4 w-4" /> ভুল তথ্য রিপোর্ট করুন
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>রিপোর্ট সাবমিট করুন</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>সমস্যার ধরন</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="incorrect_info">ভুল তথ্য</SelectItem>
                  <SelectItem value="wrong_photo">ভুল ছবি</SelectItem>
                  <SelectItem value="duplicate">ডুপ্লিকেট মন্দির</SelectItem>
                  <SelectItem value="other">অন্যান্য</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>বিস্তারিত লিখুন</Label><Textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="কি ভুল আছে, তা বিস্তারিত লিখুন" /></div>
            <div className="rounded-xl border bg-amber-50 px-3 py-2 text-sm text-amber-800 flex gap-2"><ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" /> address ভুল, duplicate entry, wrong photo—সবই এখানে রিপোর্ট করা যাবে।</div>
            <Button onClick={submitReport} className="bg-red-500 hover:bg-red-600" disabled={loading === 'report'}>{loading === 'report' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'রিপোর্ট পাঠান'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
