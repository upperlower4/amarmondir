import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Clock,
  Map as MapIcon,
  History,
  Users,
  AlertCircle,
  Calendar,
  Sparkles,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { supabase, isConfigured } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { getDivisionColor } from '@/lib/utils';
import Link from 'next/link';
import { TempleActions } from '@/components/temple/TempleActions';
import { TempleEditProvider } from '@/components/temple/TempleEditProvider';
import { EditableField } from '@/components/temple/EditableField';

import { GalleryTrigger } from '@/components/temple/GalleryTrigger';

async function getTempleData(rawSlug: string) {
  if (!isConfigured) return null;
  const slug = decodeURIComponent(rawSlug || '').trim();

  let temple: any = null;
  const templeQueries = [
    () => supabase.from('temples').select('*').eq('slug', slug).eq('status', 'approved').maybeSingle(),
    () => supabase.from('temples').select('*').ilike('slug', slug).eq('status', 'approved').maybeSingle(),
    () => supabase.from('temples').select('*').eq('slug', slug).maybeSingle(),
  ];

  for (const run of templeQueries) {
    const { data } = await run();
    if (data) {
      temple = data;
      break;
    }
  }

  if (!temple) return null;

  const [{ data: creatorProfile }, { data: photos }, { data: contributors }, { data: festivals }] = await Promise.all([
    temple.created_by
      ? supabase.from('profiles').select('username, avatar_url').eq('id', temple.created_by).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('temple_photos').select('*').eq('temple_id', temple.id),
    supabase.from('temple_contributors').select('*, profiles(username, full_name, avatar_url, badge)').eq('temple_id', temple.id),
    supabase.from('temple_festivals').select('*').eq('temple_id', temple.id),
  ]);

  return {
    temple: {
      ...temple,
      profiles: creatorProfile || null,
    },
    photos: (photos || []).filter((photo: any) => !photo.status || photo.status === 'approved'),
    contributors: contributors || [],
    festivals: festivals || [],
  };
}

function renderArticleContent(article?: string | null) {
  if (!article) return null;

  return article
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={index} className="mb-4 whitespace-pre-line">
        {paragraph}
      </p>
    ));
}

export default async function TemplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getTempleData(slug);

  if (!data) notFound();

  const { temple, photos, contributors, festivals } = data;

  return (
    <>
      <Navbar />
      <TempleEditProvider>
        <main className="flex-1 bg-[#fcfaf7] pb-20">
          {/* Desktop Custom Grid Layout */}
          <div 
            className="container mx-auto px-4 md:px-8 mt-6 lg:mt-12 hidden lg:grid lg:grid-cols-9 lg:gap-x-10 lg:gap-y-0"
            style={{ marginLeft: '5px', paddingLeft: '5px', paddingRight: '5px', marginRight: '5px', marginTop: '5px', marginBottom: '5px' }}
          >
            
            {/* div1: Cover Photo */}
            <div 
              className="lg:col-start-3 lg:col-span-4 lg:row-start-1 lg:row-span-3 pb-[2px]"
              style={{ paddingBottom: '0px', marginBottom: '-93px', paddingTop: '0px', marginTop: '0px', height: '297px', padding: '2px' }}
            >
              <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-xl border border-orange-50 bg-gray-100">
                <Image
                  src={temple.cover_image || 'https://picsum.photos/seed/temple/1920/1080'}
                  alt={temple.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* div5, 7, 9: Sidebar Gallery Previews */}
            <div className="lg:col-start-2 lg:row-start-1 h-full">
              {photos?.[0] && (
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white mb-[2px]">
                  <Image src={photos[0].url} alt="Gallery 1" fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
            <div className="lg:col-start-2 lg:row-start-2 h-full">
              {photos?.[1] && (
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white mb-[2px]">
                  <Image src={photos[1].url} alt="Gallery 2" fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
            <div className="lg:col-start-2 lg:row-start-3 h-full">
              <GalleryTrigger />
            </div>

            {/* div2: Sticky Basic Info Card */}
            <div className="lg:col-start-7 lg:col-span-2 lg:row-start-1 lg:row-span-5 relative">
              <div className="sticky top-24">
                <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-orange-100/50 overflow-hidden">
                  <CardHeader className="bg-orange-500 text-white pt-8 pb-6">
                    <CardTitle className="text-xl font-serif">মৌলিক তথ্য</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-8">
                    <EditableField step={1} label="উপাস্য দেবতা ও তথ্য">
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                            <Sparkles className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">উপাস্য দেবতা</p>
                            <p className="font-semibold">{temple.deity || 'তথ্য নেই'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                            <History className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">প্রতিষ্ঠাকাল</p>
                            <p className="font-semibold">{temple.established_year || 'অজানা'}</p>
                          </div>
                        </div>
                      </div>
                    </EditableField>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                        <MapIcon className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">অবস্থান</p>
                        <p className="font-semibold">{temple.upazila}, {temple.district}</p>
                      </div>
                    </div>
                    <div className="pt-4 space-y-3">
                      {temple.map_link && (
                        <Button className="w-full bg-orange-500 h-12 rounded-xl text-lg" asChild>
                          <a href={temple.map_link} target="_blank" rel="noopener noreferrer">
                            <MapIcon className="h-5 w-5 mr-2" /> গুগল ম্যাপ
                          </a>
                        </Button>
                      )}
                      <TempleActions templeId={temple.id} defaultValues={temple} />
                    </div>
                  </CardContent>
                </Card>

                {/* Contributors moved here for desktop */}
                <Card className="mt-6 rounded-3xl border-none shadow-sm bg-white/50 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 font-serif opacity-70">
                      <Users className="h-4 w-4" /> অবদানকারী
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4">
                    {contributors?.slice(0, 3).map((cont: any) => (
                      <Link key={cont.id} href={`/profile/${cont.profiles.username}`} className="flex items-center gap-2 p-1.5 hover:bg-orange-50 rounded-xl transition-colors">
                        <Image src={cont.profiles.avatar_url || 'https://picsum.photos/seed/user/100/100'} alt={cont.profiles.username} width={24} height={24} className="rounded-full border border-white" />
                        <span className="text-xs font-bold truncate">{cont.profiles.full_name || cont.profiles.username}</span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* div3: Bangla Title */}
            <div 
              className="lg:col-start-3 lg:col-span-4 lg:row-start-4"
              style={{ paddingBottom: '2px', paddingTop: '2px', marginLeft: '0px', marginTop: '0px', height: '135.17px' }}
            >
              <EditableField step={1} label="নাম ও ধরন">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${getDivisionColor(temple.division)}`}>{temple.division}</Badge>
                  <Badge variant="outline" className="border-orange-200">{temple.temple_type}</Badge>
                </div>
                <h1 className="text-5xl font-bold text-gray-900 font-serif leading-tight">{temple.title}</h1>
                <p className="text-xl text-gray-400 italic font-medium">{temple.english_name}</p>
              </EditableField>
            </div>

            {/* div10: Location + Mondir Info */}
            <div 
              className="lg:col-start-3 lg:col-span-4 lg:row-start-5 flex flex-wrap items-center gap-4 py-4 border-y border-orange-100 my-4 text-gray-600"
              style={{ marginBottom: '14px' }}
            >
              <EditableField step={2} label="ঠিকানা ও ম্যাপ" className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 font-medium bg-white px-3 py-1.5 rounded-full border border-gray-100">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <span>{temple.address}</span>
                </div>
                {temple.open_hours && (
                  <div className="flex items-center gap-2 font-medium bg-white px-3 py-1.5 rounded-full border border-gray-100">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>{temple.open_hours}</span>
                  </div>
                )}
              </EditableField>
              {temple.status === 'approved' && (
                <div className="flex items-center gap-2 text-green-600 font-bold ml-auto">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs tracking-tighter uppercase">Verified</span>
                </div>
              )}
            </div>

            {/* div11: Sonkipto Totto */}
            <div className="lg:col-start-3 lg:col-span-4 lg:row-start-6 lg:row-span-4 py-6">
              <h2 className="text-xl font-bold mb-4 font-serif flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                সংক্ষিপ্ত পরিচিতি
              </h2>
              <EditableField step={3} label="সংক্ষিপ্ত বর্ণনা">
                <div className="prose prose-orange max-w-none bengali-text leading-relaxed text-lg text-gray-700 bg-white p-8 rounded-[2.5rem] border shadow-sm">
                  {temple.short_bio ? <p>{temple.short_bio}</p> : <p className="italic text-gray-400">এই মন্দিরের কোন বর্ণনা এখনো যুক্ত করা হয়নি।</p>}
                </div>
              </EditableField>
            </div>

            {/* div12: Bistarito Totto */}
            <div className="lg:col-start-3 lg:col-span-4 lg:row-start-10 lg:row-span-3 py-6">
              <h2 className="text-xl font-bold mb-4 font-serif flex items-center gap-2">
                <History className="h-5 w-5 text-orange-500" />
                ইতিহাস ও বিস্তারিত
              </h2>
              <EditableField step={3} label="বিস্তারিত ইতিহাস">
                <div className="prose prose-orange max-w-none bengali-text leading-loose text-lg text-gray-700 bg-white p-8 rounded-[2.5rem] border shadow-sm">
                  {temple.article_content ? (
                    <div>{renderArticleContent(temple.article_content)}</div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 italic">বিস্তারিত ইতিহাস এখনো যোগ করা হয়নি।</p>
                    </div>
                  )}
                </div>
              </EditableField>

              {festivals && festivals.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-lg font-bold mb-6 font-serif flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-500" /> উৎসবসমূহ
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {festivals.map((fest: any) => (
                      <Card key={fest.id} className="border-none shadow-sm bg-white/50">
                        <CardContent className="p-4">
                          <p className="font-bold text-orange-600 mb-1">{fest.name}</p>
                          <p className="text-xs text-gray-400 mb-2">{fest.date_info}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{fest.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full Gallery Section (Bottom trigger) */}
          <div id="full-gallery" className="container mx-auto px-4 mt-20">
             <h2 className="text-2xl font-bold mb-8 font-serif">গ্যালারি ও ফটো</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photos?.map((photo: any) => (
                  <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden group border border-gray-100 shadow-sm bg-white">
                    <Image src={photo.url} alt="Gallery" fill className="object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                    {(photo.caption || photo.credit_name) && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                        <p className="text-[10px] font-medium line-clamp-1">{photo.caption}</p>
                        {photo.credit_name && <p className="text-[8px] opacity-70">© {photo.credit_name}</p>}
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </div>

          {/* Existing Mobile View (Preserved for compatibility and user requested pc-only update) */}
          <div className="lg:hidden">
            <div className="container mx-auto px-4 mt-6">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-xl border bg-gray-100">
                <Image src={temple.cover_image || 'https://picsum.photos/seed/temple/1920/1080'} alt={temple.title} fill className="object-cover" referrerPolicy="no-referrer" />
              </div>

              <EditableField step={1} label="নাম ও ধরন">
                <div 
                  className="py-8 border-b"
                  style={{ paddingTop: '12px', paddingBottom: '22px' }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge className={getDivisionColor(temple.division)}>{temple.division}</Badge>
                    <Badge variant="outline">{temple.temple_type}</Badge>
                  </div>
                  <h1 
                    className="text-3xl font-bold text-gray-900 mb-2 font-serif"
                    style={{ marginLeft: '0px', marginTop: '-3px', marginBottom: '6px' }}
                  >
                    {temple.title}
                  </h1>
                  <p className="text-gray-500 italic mb-6">{temple.english_name}</p>
                  
                  <div className="space-y-4 text-sm text-gray-600">
                    <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-orange-500" /><span>{temple.address}</span></div>
                    {temple.open_hours && <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-orange-500" /><span>{temple.open_hours}</span></div>}
                  </div>
                </div>
              </EditableField>

              <div className="space-y-10 py-10">
                <EditableField step={1} label="মৌলিক তথ্য">
                  <Card className="rounded-3xl border-none shadow-lg bg-orange-500 text-white">
                      <CardHeader><CardTitle className="font-serif">মৌলিক তথ্য</CardTitle></CardHeader>
                      <CardContent className="space-y-6 pt-0">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-xl"><Sparkles className="h-4 w-4" /></div>
                          <div><p className="text-[10px] uppercase font-bold opacity-70">উপাস্য দেবতা</p><p className="font-semibold">{temple.deity}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-xl"><History className="h-4 w-4" /></div>
                          <div><p className="text-[10px] uppercase font-bold opacity-70">প্রতিষ্ঠাকাল</p><p className="font-semibold">{temple.established_year}</p></div>
                        </div>
                        <div className="pt-4 space-y-3">
                          {temple.map_link && <Button className="w-full bg-white text-orange-600 hover:bg-gray-100 h-12 rounded-xl" asChild><a href={temple.map_link}>ম্যাপে দেখুন</a></Button>}
                          <TempleActions templeId={temple.id} defaultValues={temple} />
                        </div>
                      </CardContent>
                  </Card>
                </EditableField>

                 <section>
                   <h2 className="text-xl font-bold mb-4 font-serif">সংক্ষিপ্ত বর্ণনা</h2>
                   <EditableField step={3} label="সংক্ষিপ্ত বর্ণনা">
                    <div className="bg-white p-6 rounded-3xl border shadow-sm bengali-text text-gray-700 leading-relaxed">
                      {temple.short_bio}
                    </div>
                   </EditableField>
                 </section>

                 <section>
                   <h2 className="text-xl font-bold mb-4 font-serif">বিস্তারিত ইতিহাস</h2>
                   <EditableField step={3} label="বিস্তারিত ইতিহাস">
                    <div className="bg-white p-6 rounded-3xl border shadow-sm bengali-text text-gray-700 leading-loose">
                        {temple.article_content ? renderArticleContent(temple.article_content) : <p className="italic text-gray-400">তথ্য নেই।</p>}
                    </div>
                   </EditableField>
                 </section>
              </div>
            </div>
          </div>
        </main>
      </TempleEditProvider>
      <Footer />
    </>
  );
}
