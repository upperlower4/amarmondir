import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Share2,
  ChevronRight,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { getDivisionColor } from '@/lib/utils';
import Link from 'next/link';
import { TempleTabs } from '@/components/temple/TempleTabs';
import { EditableField } from '@/components/temple/EditableField';
import { TempleEditProvider } from '@/components/temple/TempleEditProvider';
import { ShareButton } from '@/components/temple/ShareButton';
import { TempleActions } from '@/components/temple/TempleActions';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
  const { data: temple } = await supabase
    .from('temples')
    .select('title, english_name, upazila, district, short_bio, cover_image')
    .in('slug', [slug, decodedSlug])
    .eq('status', 'approved')
    .single();

  if (!temple) {
    return {
      title: 'মন্দির পাওয়া যায়নি | আমার মন্দির',
    };
  }

  return {
    title: `${temple.title} | ${temple.district} | আমার মন্দির`,
    description: temple.short_bio ? temple.short_bio.substring(0, 160) : `${temple.upazila}, ${temple.district}-এ অবস্থিত ${temple.title} এর বিস্তারিত জানুন।`,
    openGraph: {
      title: `${temple.title} | আমার মন্দির`,
      description: temple.short_bio ? temple.short_bio.substring(0, 160) : `${temple.upazila}, ${temple.district}-এ অবস্থিত ${temple.title} এর বিস্তারিত জানুন।`,
      images: [
        {
          url: temple.cover_image || 'https://picsum.photos/seed/bengal/1200/630',
          width: 1200,
          height: 630,
          alt: temple.title,
        },
      ],
      locale: 'bn_BD',
      type: 'article',
    },
  };
}

async function getTempleData(slug: string) {
  const decodedSlug = decodeURIComponent(slug);
  
  const { data: temple, error } = await supabase
    .from('temples')
    .select('*')
    .in('slug', [slug, decodedSlug])
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();

  if (error || !temple) return null;

  const { data: photos } = await supabase
    .from('temple_photos')
    .select('*')
    .eq('temple_id', temple.id)
    .order('created_at', { ascending: false });

  const { data: contributors } = await supabase
    .from('temple_contributors')
    .select('*, profiles(username, full_name, avatar_url, badge)')
    .eq('temple_id', temple.id)
    .order('created_at', { ascending: false });

  const { data: festivals } = await supabase
    .from('temple_festivals')
    .select('*')
    .eq('temple_id', temple.id)
    .order('created_at', { ascending: false });

  return { temple, photos, contributors, festivals };
}

export default async function TemplePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sParams = await searchParams;
  const isEditMode = sParams.edit === 'true';

  const data = await getTempleData(slug);

  if (!data) notFound();

  const { temple, photos, contributors, festivals } = data;
  const safeContributors = (contributors || []).filter((cont: any) => cont?.profiles?.username);

  return (
    <TempleEditProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Place",
            "name": temple.title,
            "description": temple.short_bio,
            "image": temple.cover_image,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": temple.upazila,
              "addressRegion": temple.district,
              "addressCountry": "BD"
            }
          })
        }}
      />
      <Navbar />
      <main className="flex-1 bg-white relative selection:bg-orange-100 selection:text-orange-900">
        
        {/* EDIT MODE BANNER */}
        {isEditMode && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 sticky top-[60px] z-40 flex items-center justify-between shadow-sm">
            <p className="text-orange-800 font-medium text-sm flex items-center gap-2">
              <Edit2 className="h-4 w-4" /> এডিট মোড চালু আছে
            </p>
            <Button asChild size="sm" variant="outline" className="h-8 bg-white border-orange-200 text-orange-700 hover:bg-orange-100">
              <Link href={`/temple/${slug}`} scroll={false}>বন্ধ করুন</Link>
            </Button>
          </div>
        )}

        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl mt-8">
          <BackButton className="mb-4" />
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-900 transition-colors">হোম</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/temples?division=${temple.division}`} className="hover:text-gray-900 transition-colors">{temple.division}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900 font-medium">{temple.district}</span>
          </nav>

          {/* Title Section */}
          <div className="max-w-4xl mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100 font-normal rounded-md px-2.5 py-0.5 border border-orange-100">{temple.temple_type}</Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-gray-900 font-bold tracking-tight mb-3 leading-[1.1]">
              {temple.title}
            </h1>
            
            {temple.english_name && (
              <p className="text-xl md:text-2xl text-gray-500 font-serif italic mb-6">
                {temple.english_name}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-6 text-gray-600 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                <EditableField editMode={isEditMode} templeId={temple.id} field="address" label="ঠিকানা" currentValue={temple.address || ''}>
                  <span>{temple.address || `${temple.upazila}, ${temple.district}`}</span>
                </EditableField>
              </div>
              
              {temple.open_hours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <EditableField editMode={isEditMode} templeId={temple.id} field="open_hours" label="খোলার সময়" currentValue={temple.open_hours || ''}>
                    <span>{temple.open_hours}</span>
                  </EditableField>
                </div>
              )}
            </div>
          </div>

          {/* Main Layout (Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-20">
            
            {/* LEFT COLUMN */}
            <article className="lg:col-span-8 flex flex-col space-y-12">
              
              {/* Hero Image */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] rounded-2xl md:rounded-3xl overflow-hidden bg-gray-100 border border-gray-200/60 shadow-sm">
                 <Image
                  src={temple.cover_image || 'https://picsum.photos/seed/temple/1920/1080'}
                  alt={temple.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Photo Gallery */}
              {(photos?.length ?? 0) > 0 && (
                <section>
                  <h2 className="text-2xl font-bold font-serif text-gray-900 flex items-center gap-2 mb-6">
                    <Sparkles className="h-6 w-6 text-orange-500" /> গ্যালারি
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {photos?.slice(0, 6).map((photo: any, idx: number) => (
                      <div
                        key={photo.id}
                        className={`relative rounded-xl overflow-hidden group border border-gray-200/60 ${
                          idx === 0 ? 'col-span-2 row-span-2 aspect-[4/3] md:aspect-auto' : 'aspect-square'
                        }`}
                      >
                        <Image
                          src={photo.url}
                          alt={`${temple.title} photo`}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* TABS */}
              <section className="bg-white rounded-2xl border border-gray-200/60 p-6 md:p-8 shadow-sm">
                <TempleTabs 
                  editMode={isEditMode}
                  templeId={temple.id}
                  shortBio={temple.short_bio} 
                  articleContent={temple.article_content} 
                  templeSlug={temple.slug} 
                />
              </section>

              {/* Festivals */}
              {festivals && festivals.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold font-serif text-gray-900 flex items-center gap-2 mb-6">
                    <Calendar className="h-6 w-6 text-orange-500" /> মূল উৎসবসমূহ
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {festivals.map((fest: any) => (
                      <div key={fest.id} className="p-5 rounded-xl bg-gray-50 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{fest.name}</h3>
                        <p className="text-sm font-medium text-orange-600 mb-2">{fest.date_info}</p>
                        <p className="text-gray-600 text-sm leading-relaxed">{fest.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </article>

            {/* RIGHT COLUMN */}
            <aside className="lg:col-span-4 space-y-6">
              
              <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50/50 p-5 p-5">
                  <h3 className="text-lg font-bold font-serif text-gray-900 flex items-center gap-2">
                    <Info className="h-5 w-5 text-gray-400" /> তথ্য সংক্ষেপ
                  </h3>
                </div>
                
                <div className="p-5 space-y-5">
                  <div className="flex gap-3">
                    <div className="mt-0.5"><Sparkles className="h-4 w-4 text-orange-400" /></div>
                    <EditableField editMode={isEditMode} templeId={temple.id} field="deity" label="উপাস্য দেবতা" currentValue={temple.deity || ''}>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">উপাস্য দেবতা</p>
                        <p className="font-semibold text-gray-900 text-sm">{temple.deity || 'তথ্য নেই'}</p>
                      </div>
                    </EditableField>
                  </div>

                  <div className="flex gap-3">
                    <div className="mt-0.5"><History className="h-4 w-4 text-orange-400" /></div>
                    <EditableField editMode={isEditMode} templeId={temple.id} field="established_year" label="প্রতিষ্ঠাকাল" currentValue={temple.established_year || ''}>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">প্রতিষ্ঠাকাল</p>
                        <p className="font-semibold text-gray-900 text-sm">{temple.established_year || 'অজানা'}</p>
                      </div>
                    </EditableField>
                  </div>

                  <div className="flex gap-3">
                    <div className="mt-0.5"><MapIcon className="h-4 w-4 text-orange-400" /></div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">অবস্থান</p>
                      <p className="font-semibold text-gray-900 text-sm">{temple.upazila}, {temple.district}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    {temple.map_link ? (
                      <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl" asChild>
                        <a href={temple.map_link} target="_blank" rel="noopener noreferrer">
                          <MapIcon className="h-4 w-4 mr-2" /> গুগল ম্যাপে দেখুন
                        </a>
                      </Button>
                    ) : (
                      <Button disabled className="w-full rounded-xl bg-gray-100 text-gray-400">
                        <MapIcon className="h-4 w-4 mr-2" /> ম্যাপ নেই
                      </Button>
                    )}

                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="w-full rounded-xl border-gray-200" asChild>
                          <Link href={`/temple/${temple.slug}?edit=true`} scroll={false}>
                            <Edit2 className="h-4 w-4 mr-2" /> আপডেট
                          </Link>
                        </Button>
                        <ShareButton title={temple.title} />
                      </div>
                  </div>
                </div>
              </div>

              {/* Contributors */}
              <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">অবদানকারী</h3>
                <div className="space-y-3">
                  {(safeContributors.length ?? 0) > 0 ? (
                    safeContributors.slice(0, 5).map((cont: any) => (
                      <Link key={cont.id} href={`/profile/${cont.profiles.username}`} className="flex items-center gap-3 group">
                        <Avatar className="h-8 w-8 ring-1 ring-gray-100">
                          <AvatarImage src={cont.profiles.avatar_url || ''} />
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                            {cont.profiles.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                            {cont.profiles.full_name || cont.profiles.username}
                          </p>
                          <p className="text-[10px] text-gray-500">{cont.profiles.badge}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">কোন অবদানকারী নেই</p>
                  )}
                </div>
              </div>

              {/* Verified Status */}
              {temple.status === 'approved' && (
                <div className="rounded-2xl border border-green-200/60 bg-green-50 p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-green-900 mb-0.5">ভেরিফাইড মন্দির</h4>
                    <p className="text-xs text-green-700">এই মন্দিরের তথ্য আমাদের সিস্টেম দ্বারা যাচাইকৃত।</p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </TempleEditProvider>
  );
}
