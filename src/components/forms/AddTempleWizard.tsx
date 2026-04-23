'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DIVISIONS, DISTRICTS, TEMPLE_TYPES, CLOUDINARY_FOLDERS } from '@/lib/constants';
import { UPAZILAS } from '@/lib/upazilas';
import { ImagePlus, MapPin, CheckCircle, Info, FileText, Loader2, Sparkles, X, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { generateSlug, safeJsonStringify } from '@/lib/utils';
import Image from 'next/image';

const formSchema = z.object({
  title: z.string().min(3, 'নাম অন্তত ৩ অক্ষরের হতে হবে'),
  english_name: z.string().min(3, 'English name is required'),
  division: z.string().min(1, 'বিভাগ নির্বাচন করুন'),
  district: z.string().min(1, 'জেলা নির্বাচন করুন'),
  upazila: z.string().min(1, 'উপজেলা নির্বাচন করুন'),
  temple_type: z.string().min(1, 'ধরন নির্বাচন করুন'),
  deity: z.string().optional(),
  established_year: z.string().optional(),
  open_hours: z.string().optional(),
  short_bio: z.string().max(300, 'সর্বোচ্চ ৩০০ চরিত্র'),
  address: z.string().min(10, 'পূর্ণাঙ্গ ঠিকানা দিন'),
  map_link: z.string().url('সঠিক ম্যাপ লিংক দিন').optional().or(z.literal('')),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  article_content: z.string().optional(),
});

const MAX_COVER_SIZE_MB = 5;
const MAX_GALLERY_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AddTempleWizard({ userId }: { userId: string }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      english_name: '',
      division: '',
      district: '',
      upazila: '',
      temple_type: '',
      deity: '',
      established_year: '',
      open_hours: '',
      short_bio: '',
      address: '',
      map_link: '',
      latitude: '',
      longitude: '',
      article_content: '',
    },
  });

  const selectedDivision = form.watch('division');
  const selectedDistrict = form.watch('district');

  useEffect(() => {
    form.setValue('district', '');
    form.setValue('upazila', '');
  }, [selectedDivision, form]);

  useEffect(() => {
    form.setValue('upazila', '');
  }, [selectedDistrict, form]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSizeMb = type === 'cover' ? MAX_COVER_SIZE_MB : MAX_GALLERY_SIZE_MB;

    try {
      const nextImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          toast.error('শুধু JPG, PNG, WEBP ছবি আপলোড করা যাবে');
          continue;
        }

        if (file.size > maxSizeMb * 1024 * 1024) {
          toast.error(`ছবির সাইজ সর্বোচ্চ ${maxSizeMb}MB হতে হবে`);
          continue;
        }

        const base64 = await fileToBase64(file);
        nextImages.push(base64);
      }

      if (type === 'cover') {
        setCoverImage(nextImages[0] || null);
      } else if (nextImages.length > 0) {
        setGalleryImages((prev) => [...prev, ...nextImages].slice(0, 8));
      }
    } catch (err: any) {
      console.error('Image read error:', safeJsonStringify(err));
      toast.error('ছবি প্রসেস করা যায়নি');
    } finally {
      e.target.value = '';
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    console.log('Starting image upload process...');
    const uploadedUrls: { cover?: string; gallery: string[] } = { gallery: [] };

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      throw new Error('আপনাকে আবার লগইন করতে হবে');
    }

    const uploadSingle = async (image: string, folder: string, type: 'cover' | 'gallery' | 'avatar', index?: number) => {
      const label = index !== undefined ? `${type} ${index + 1}` : type;
      console.log(`Starting upload for ${label}...`);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ image, folder, type }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(`Upload failed for ${label}:`, data?.error);
        throw new Error(data?.error || `${label} আপলোড ব্যর্থ হয়েছে`);
      }

      console.log(`Successfully uploaded ${label}`);
      return data.url as string;
    };

    const uploadPromises: Promise<any>[] = [];

    if (coverImage && typeof coverImage === 'string') {
      uploadPromises.push(
        uploadSingle(coverImage, CLOUDINARY_FOLDERS.COVERS, 'cover').then(url => {
          uploadedUrls.cover = url;
        })
      );
    }

    galleryImages.forEach((img, idx) => {
      if (typeof img === 'string') {
        uploadPromises.push(
          uploadSingle(img, CLOUDINARY_FOLDERS.GALLERY, 'gallery', idx).then(url => {
            uploadedUrls.gallery.push(url);
          })
        );
      }
    });

    if (uploadPromises.length === 0) return uploadedUrls;

    console.log(`Executing ${uploadPromises.length} parallel uploads...`);
    await Promise.all(uploadPromises);
    console.log('All images uploaded successfully');

    return uploadedUrls;
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) {
      fieldsToValidate = ['title', 'english_name', 'division', 'district', 'upazila', 'temple_type'];
    } else if (step === 2) {
      fieldsToValidate = ['address'];
    }

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      if (step === 2 && !coverImage) {
        toast.error('অন্তত একটি কভার ফটো দিতে হবে');
        return;
      }
      setStep(step + 1);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('onSubmit triggered with values:', values);
    setLoading(true);
    try {
      toast.info('ছবি ও তথ্য আপলোড হচ্ছে, দয়া করে কিছুক্ষণ অপেক্ষা করুন...', { duration: 6000 });
      console.log('Uploading images...');
      const urls = await uploadImages();
      console.log('Images uploaded:', urls);

      const uuidFragment = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).substring(2, 10);
      const slug = `${generateSlug(values.english_name)}-${uuidFragment}`;
      console.log('Generated slug:', slug);

      // 1. Prepare clean values
      const cleanValues = {
        title: String(values.title || ''),
        english_name: String(values.english_name || ''),
        division: String(values.division || ''),
        district: String(values.district || ''),
        upazila: String(values.upazila || ''),
        temple_type: String(values.temple_type || ''),
        deity: values.deity ? String(values.deity) : null,
        established_year: values.established_year ? String(values.established_year) : null,
        open_hours: values.open_hours ? String(values.open_hours) : null,
        short_bio: String(values.short_bio || ''),
        address: String(values.address || ''),
        map_link: values.map_link ? String(values.map_link) : null,
        article_content: values.article_content ? String(values.article_content) : null,
        latitude: (values.latitude && !isNaN(parseFloat(values.latitude))) ? parseFloat(values.latitude) : null,
        longitude: (values.longitude && !isNaN(parseFloat(values.longitude))) ? parseFloat(values.longitude) : null,
      };

      // 2. Auth Session
      console.log('Fetching session...');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('আপনার সেশন এক্সপায়ার হয়েছে। দয়া করে আবার লগইন করুন।');
      }

      console.log('Posting to /api/temples...');
      const res = await fetch('/api/temples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: safeJsonStringify({
          cleanValues,
          slug: String(slug),
          urls,
        }),
      });

      const result = await res.json();
      console.log('API Response received:', result);

      if (!res.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      toast.success('মন্দির সফলভাবে সাবমিট হয়েছে!', {
        description: 'অ্যাডমিন ভেরিফিকেশনের পর এটি লাইভ হবে।'
      });
      router.push('/directory');
    } catch (error: any) {
      console.error('Form submission detailed error:', error);
      const errorMessage = error?.message || 'সাবমিশন ব্যর্থ হয়েছে';
      toast.error('সাবমিশন ব্যর্থ হয়েছে', { 
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = (errors: any) => {
    console.error('Form validation errors:', errors);
    toast.error('ফর্মে ভুল আছে', {
      description: 'অনুগ্রহ করে সব তথ্য সঠিক ভাবে দিন।'
    });
  };

  return (
    <div className="space-y-8">
      {/* Progress Stepper */}
      <div className="flex items-center justify-center max-w-2xl mx-auto px-2">
        {[
          { id: 1, label: 'প্রাথমিক তথ্য', icon: Info },
          { id: 2, label: 'ছবি ও অবস্থান', icon: MapPin },
          { id: 3, label: 'বিস্তারিত বর্ণনা', icon: FileText },
        ].map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all ${step >= s.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-gray-100 text-gray-400'}`}>
                <s.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <span className={`text-[10px] md:text-xs font-bold bengali-text text-center max-w-[60px] md:max-w-none leading-tight ${step >= s.id ? 'text-orange-600' : 'text-gray-400'}`}>{s.label}</span>
            </div>
            {idx < 2 && (
              <div className={`h-0.5 w-8 md:w-16 mx-1 md:mx-2 mb-4 rounded-full transition-all ${step > s.id ? 'bg-orange-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
          
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card className="border-none shadow-xl shadow-orange-100/50 p-6 md:p-10 rounded-[2.5rem]">
              <CardContent className="space-y-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>মন্দিরের নাম (বাংলা)</FormLabel>
                        <FormControl><Input placeholder="উদা: ঢাকেশ্বরী মন্দির" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="english_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temple Name (English)</FormLabel>
                        <FormControl><Input placeholder="e.g. Dhakeshwari Temple" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="division"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>বিভাগ</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('district', '');
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>জেলা</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDivision}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="জেলা" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedDivision && DISTRICTS[selectedDivision].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="upazila"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>উপজেলা</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDistrict}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="উপজেলা" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedDistrict && UPAZILAS[selectedDistrict] ? (
                              UPAZILAS[selectedDistrict].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)
                            ) : (
                              <SelectItem value="none" disabled>জেলা নির্বাচন করুন</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="temple_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>মন্দিরের ধরন</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TEMPLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>উপাস্য দেবতা</FormLabel>
                        <FormControl><Input placeholder="উদা: শ্রী কৃষ্ণ" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={nextStep} className="bg-orange-500 h-11 md:h-12 px-6 md:px-10 rounded-xl text-base md:text-lg">
                    পরবর্তী ধাপ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Images & Location */}
          {step === 2 && (
            <Card className="border-none shadow-xl shadow-orange-100/50 p-6 md:p-10 rounded-[2.5rem]">
              <CardContent className="space-y-8 pt-0">
                
                {/* Image Uploads */}
                <div className="space-y-4">
                  <FormLabel className="text-lg font-bold">কভার ছবি</FormLabel>
                  <div className="relative aspect-[21/9] w-full bg-orange-50 rounded-2xl border-2 border-dashed border-orange-200 flex items-center justify-center overflow-hidden">
                    {coverImage ? (
                      <>
                        <Image src={coverImage} alt="Cover Preview" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 rounded-full h-8 w-8"
                          onClick={() => setCoverImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center gap-2 cursor-pointer text-orange-600 hover:text-orange-700">
                        <ImagePlus className="h-10 w-10" />
                        <span className="font-bold bengali-text">ছবি নির্বাচন করুন (কম্প্রেসড ছবি সাজেস্টেড)</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'cover')} />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 bengali-text italic">* কভার ফটোটি মন্দিরের প্রধান ছবি হিসেবে ব্যবহৃত হবে।</p>
                </div>

                <div className="space-y-4">
                  <FormLabel className="text-lg font-bold">গ্যালারি ছবি</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {galleryImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden shadow-md">
                        <Image src={img} alt={`Gallery ${idx}`} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-1 right-1 rounded-full h-6 w-6"
                          onClick={() => removeGalleryImage(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {galleryImages.length < 8 && (
                      <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                        <Plus className="h-6 w-6 text-gray-400" />
                        <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Add More</span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => onFileChange(e, 'gallery')} />
                      </label>
                    )}
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>পূর্ণাঙ্গ ঠিকানা</FormLabel>
                        <FormControl><Input placeholder="উদা: ৫২ ঢাকেশ্বরী রোড, লালবাগ, ঢাকা ১২১১" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="map_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>গুগল ম্যাপ লিঙ্ক</FormLabel>
                        <FormControl><Input placeholder="https://maps.app.goo.gl/..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 md:h-12 px-5 md:px-10 rounded-xl">
                    পিছনে
                  </Button>
                  <Button type="button" onClick={nextStep} className="bg-orange-500 h-11 md:h-12 px-5 md:px-10 rounded-xl">
                    পরবর্তী ধাপ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Bio & Article */}
          {step === 3 && (
            <Card className="border-none shadow-xl shadow-orange-100/50 p-6 md:p-10 rounded-[2.5rem]">
              <CardContent className="space-y-6 pt-0">
                <FormField
                  control={form.control}
                  name="short_bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>সংক্ষিপ্ত ভূমিকা</FormLabel>
                      <FormControl><Textarea placeholder="মন্দির সম্পর্কে সংক্ষেপে ২-৩ লাইনে লিখুন..." className="h-32 rounded-2xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="article_content"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>বিস্তারিত ইতিহাস / নিবন্ধ</FormLabel>
                        <span className="text-[10px] uppercase font-bold text-gray-400 italic">Optional but Recommended</span>
                      </div>
                      <FormControl><Textarea placeholder="মন্দিরের ইতিহাস, স্থাপত্য এবং অন্যান্য বিস্তারিত তথ্য এখানে লিখুন..." className="min-h-[300px] rounded-2xl p-6" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex gap-4">
                   <div className="shrink-0 w-10 h-10 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center">
                     <Sparkles className="h-5 w-5" />
                   </div>
                   <div>
                     <h4 className="font-bold text-orange-800">সাবমিট করার আগে চেক করুন</h4>
                     <p className="text-sm text-orange-700/80 bengali-text">আপনার দেওয়া তথ্য সঠিক কিনা নিশ্চিত হয়ে সাবমিট বাটনে ক্লিক করুন। অ্যাডমিন প্যানেল থেকে তথ্য যাচাই করার পর মন্দিরটি লাইভ হবে।</p>
                   </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-11 md:h-12 px-5 md:px-10 rounded-xl">
                    পিছনে
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-orange-600 h-12 px-12 rounded-xl text-lg flex items-center gap-2">
                    {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> প্রসেসিং...</> : 'কনফার্ম ও সাবমিট'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </form>
      </Form>
    </div>
  );
}
