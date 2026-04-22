'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Edit2, Flag, ImagePlus, Loader2, ShieldAlert, ChevronRight, ChevronLeft, Upload, CheckCircle2, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';

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

import { useTempleEdit } from './TempleEditProvider';

export function TempleActions({ templeId, defaultValues }: { templeId: string; defaultValues: Record<string, any> }) {
  const { isEditMode, setIsEditMode, setOpenEditDialog } = useTempleEdit();
  const [editOpen, setEditOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [loading, setLoading] = useState<'edit' | 'report' | 'photo' | null>(null);

  // Expose the open function to the context
  useEffect(() => {
    setOpenEditDialog((step?: number) => {
      if (step) setEditStep(step);
      setEditOpen(true);
    });
  }, [setOpenEditDialog]);

  const toggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
      toast.success('এডিট মোড বন্ধ হয়েছে।');
      return;
    }

    setIsEditMode(true);
    setEditStep(1);
    setEditOpen(true);
    toast.info('এডিট মোড চালু হয়েছে। আপনি সরাসরি ফর্ম পূরণ করতে পারেন অথবা পেন্সিল আইকনে ক্লিক করে নির্দিষ্ট অংশ এডিট করতে পারেন।');
  };

  // Edit State
  const [editStep, setEditStep] = useState(1);
  const initialEdit = useMemo(() => ({
    title: defaultValues.title || '',
    english_name: defaultValues.english_name || '',
    address: defaultValues.address || '',
    district: defaultValues.district || '',
    short_bio: defaultValues.short_bio || '',
    map_link: defaultValues.map_link || '',
    deity: defaultValues.deity || '',
    established_year: defaultValues.established_year || '',
    article_content: defaultValues.article_content || '',
  }), [defaultValues]);

  const [editValues, setEditValues] = useState(initialEdit);

  useEffect(() => {
    setEditValues(initialEdit);
  }, [initialEdit]);

  // Photo State
  const [photoStep, setPhotoStep] = useState(1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCredit, setPhotoCredit] = useState('');
  const [setAsCover, setSetAsCover] = useState(false);

  // Report State
  const [reportType, setReportType] = useState('incorrect_info');
  const [reportDetails, setReportDetails] = useState('');

  const submitEdit = async () => {
    setLoading('edit');
    try {
      await authedFetch(`/api/temples/${templeId}/edit`, { suggestedData: editValues });
      toast.success('এডিট রিকোয়েস্ট জমা হয়েছে', {
        description: 'অ্যাডমিন রিভিউ করার পর তথ্য আপডেট হবে।'
      });
      setEditOpen(false);
      setEditStep(1);
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(String(reader.result));
      reader.readAsDataURL(file);
      setPhotoStep(2);
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
      setPhotoStep(1);
      setPhotoFile(null);
      setPhotoPreview(null);
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
      {/* Edit Trigger Button */}
      <Button 
        variant={isEditMode ? "default" : "outline"}
        onClick={toggleEditMode}
        className={cn(
          "w-full h-12 rounded-xl flex items-center gap-2 transition-all",
          isEditMode ? "bg-orange-600 hover:bg-orange-700 text-white shadow-lg ring-2 ring-orange-200" : "border-orange-200 text-orange-600 hover:bg-orange-50"
        )}
      >
        <Edit2 className={cn("h-4 w-4", isEditMode && "animate-pulse")} /> 
        {isEditMode ? "এডিট মোড বন্ধ করুন" : "তথ্য আপডেট করুন"}
      </Button>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if(!v) setEditStep(1); }}>
        <DialogContent className="max-w-2xl overflow-hidden p-0 rounded-3xl border-none">
          <div className="bg-orange-500 p-6 text-white shrink-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif text-white">তথ্য আপডেট করুন</DialogTitle>
              <div className="flex gap-1 mt-3">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-1 flex-1 rounded-full bg-white/20 overflow-hidden`}>
                    <motion.div animate={{ width: editStep >= s ? '100%' : '0%' }} className="h-full bg-white" />
                  </div>
                ))}
              </div>
            </DialogHeader>
          </div>

          <div className="max-h-[55vh] overflow-y-auto p-5 md:max-h-[58vh] md:p-8">
            <AnimatePresence mode="wait">
              {editStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>বাংলা নাম</Label><Input value={editValues.title} onChange={(e) => setEditValues((p) => ({ ...p, title: e.target.value }))} className="rounded-xl border-orange-100" /></div>
                    <div className="space-y-2"><Label>English Name</Label><Input value={editValues.english_name} onChange={(e) => setEditValues((p) => ({ ...p, english_name: e.target.value }))} className="rounded-xl border-orange-100" /></div>
                    <div className="space-y-2"><Label>জেলা</Label><Input value={editValues.district} onChange={(e) => setEditValues((p) => ({ ...p, district: e.target.value }))} className="rounded-xl border-orange-100" /></div>
                    <div className="space-y-2"><Label>উপাস্য দেবতা</Label><Input value={editValues.deity} onChange={(e) => setEditValues((p) => ({ ...p, deity: e.target.value }))} className="rounded-xl border-orange-100 placeholder:text-gray-300" placeholder="উদা: শ্রী কৃষ্ণ" /></div>
                  </div>
                </motion.div>
              )}

              {editStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="space-y-2"><Label>ঠিকানা</Label><Textarea value={editValues.address} onChange={(e) => setEditValues((p) => ({ ...p, address: e.target.value }))} className="rounded-xl border-orange-100 min-h-[100px]" /></div>
                  <div className="space-y-2"><Label>গুগল ম্যাপ লিংক</Label><Input value={editValues.map_link} onChange={(e) => setEditValues((p) => ({ ...p, map_link: e.target.value }))} className="rounded-xl border-orange-100" /></div>
                  <div className="space-y-2"><Label>প্রতিষ্ঠাকাল</Label><Input value={editValues.established_year} onChange={(e) => setEditValues((p) => ({ ...p, established_year: e.target.value }))} className="rounded-xl border-orange-100" placeholder="উদা: ১২০০ শতাব্দী" /></div>
                </motion.div>
              )}

              {editStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="space-y-2"><Label>সংক্ষিপ্ত বর্ণনা</Label><Textarea value={editValues.short_bio} onChange={(e) => setEditValues((p) => ({ ...p, short_bio: e.target.value }))} className="rounded-xl border-orange-100 min-h-[100px]" /></div>
                  <div className="space-y-2"><Label>বিস্তারিত ইতিহাস (যদি থাকে)</Label><Textarea value={editValues.article_content} onChange={(e) => setEditValues((p) => ({ ...p, article_content: e.target.value }))} className="rounded-xl border-orange-100 min-h-[150px]" /></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DialogFooter className="flex items-center bg-gray-50/50 p-5 pt-0 sm:justify-between md:p-8 md:pt-0">
            <div className="text-sm text-gray-500 font-medium">ধাপ {editStep}/৩</div>
            <div className="flex gap-2">
              {editStep > 1 && <Button variant="outline" onClick={() => setEditStep(p => p - 1)} className="rounded-xl"><ChevronLeft className="h-4 w-4 mr-1" /> পেছনে</Button>}
              {editStep < 3 ? (
                <Button onClick={() => setEditStep(p => p + 1)} className="bg-orange-500 hover:bg-orange-600 rounded-xl px-8">এগিয়ে যান <ChevronRight className="h-4 w-4 ml-1" /></Button>
              ) : (
                <Button onClick={submitEdit} disabled={loading === 'edit'} className="bg-green-600 hover:bg-green-700 rounded-xl px-8">
                  {loading === 'edit' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  সাবমিট করুন
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Modal */}
      <Dialog open={photoOpen} onOpenChange={(v) => { setPhotoOpen(v); if(!v) { setPhotoStep(1); setPhotoPreview(null); setPhotoFile(null); } }}>
        <DialogTrigger asChild>
          <Button className="w-full bg-white hover:bg-gray-50 text-orange-600 border border-orange-200 rounded-xl h-12 px-8 flex items-center gap-2 font-bold shadow-sm">
            <ImagePlus className="h-4 w-4" /> ছবি আপলোড করুন
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none">
          <div className="bg-orange-500 p-6 text-white shrink-0">
            <DialogHeader><DialogTitle className="text-xl font-serif text-white">ছবি যোগ করুন</DialogTitle></DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <AnimatePresence mode="wait">
              {photoStep === 1 ? (
                <motion.div key="photo-pick" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <label className="border-2 border-dashed border-orange-200 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 transition-colors gap-4">
                    <div className="p-4 bg-orange-100 rounded-full"><Upload className="h-8 w-8 text-orange-600" /></div>
                    <div className="text-center">
                      <p className="font-bold text-gray-700">জিপিসি বা গ্যালারি থেকে ছবি সিলেক্ট করুন</p>
                      <p className="text-sm text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                  </label>
                </motion.div>
              ) : (
                <motion.div key="photo-details" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                  {photoPreview && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border bg-gray-100">
                      <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                      <button onClick={() => {setPhotoStep(1); setPhotoPreview(null); setPhotoFile(null);}} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-lg hover:bg-black/70"><ChevronLeft className="h-4 w-4" /></button>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>ছবির বর্ণনা (Caption)</Label><Input value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} placeholder="উদা: মন্দিরের প্রবেশপথ" className="rounded-xl border-orange-100" /></div>
                    <div className="space-y-2">
                       <Label className="flex items-center gap-1"><User className="h-3 w-3" /> ফটোগ্রাফারের নাম (Credit)</Label>
                       <Input value={photoCredit} onChange={(e) => setPhotoCredit(e.target.value)} placeholder="ফটোগ্রাফারের নাম" className="rounded-xl border-orange-100" />
                    </div>
                    <label className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl cursor-pointer hover:bg-orange-100 transition-colors">
                      <input type="checkbox" checked={setAsCover} onChange={(e) => setSetAsCover(e.target.checked)} className="h-5 w-5 rounded border-orange-300 text-orange-600 focus:ring-orange-500" />
                      <div className="text-sm">
                        <p className="font-bold text-orange-800">কভার ফটো হিসেবে রিকোয়েস্ট করুন</p>
                        <p className="text-orange-600/70">অ্যাডমিন চাইলে এটিকে মন্দিরের মূল ছবি হিসেবে সেট করতে পারবেন।</p>
                      </div>
                    </label>
                  </div>
                  <Button onClick={submitPhoto} className="w-full bg-orange-500 hover:bg-orange-600 h-12 rounded-xl text-lg font-bold" disabled={loading === 'photo'}>
                    {loading === 'photo' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'ছবি সাবমিট করুন'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2">
            <Flag className="h-4 w-4" /> ভুল তথ্য রিপোর্ট করুন
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-3xl border-none p-8">
          <DialogHeader><DialogTitle className="text-2xl font-serif mb-4">রিপোর্ট সাবমিট করুন</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>সমস্যার ধরন</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="rounded-xl border-red-100 h-12"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="incorrect_info">ভুল তথ্য</SelectItem>
                  <SelectItem value="wrong_photo">ভুল ছবি</SelectItem>
                  <SelectItem value="duplicate">ডুপ্লিকেট মন্দির</SelectItem>
                  <SelectItem value="other">অন্যান্য</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>বিস্তারিত লিখুন</Label><Textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="কি ভুল আছে, তা বিস্তারিত লিখুন" className="rounded-xl border-red-100 min-h-[120px]" /></div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex gap-3"><ShieldAlert className="h-5 w-5 shrink-0" /> <p>আপনার রিপোর্ট গুরুত্ব সহকারে দেখা হবে। ভুল তথ্য সংশোধনে আমাদের সহায়তা করার জন্য ধন্যবাদ।</p></div>
            <Button onClick={submitReport} className="w-full bg-red-500 hover:bg-red-600 h-12 rounded-xl text-lg font-bold" disabled={loading === 'report'}>{loading === 'report' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'রিপোর্ট পাঠান'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
