import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { TempleCard } from '@/components/TempleCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sidebar, Search, SlidersHorizontal, MapPin, ListFilter, X } from 'lucide-react';
import { safeJsonStringify } from '@/lib/utils';
import { DIVISIONS, DISTRICTS, TEMPLE_TYPES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const dynamic = 'force-dynamic';

interface DirectoryPageProps {
  searchParams: Promise<{
    q?: string;
    division?: string;
    district?: string;
    type?: string;
  }>;
}

function sanitizeSearchTerm(value?: string) {
  return (value || '').replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildDirectoryHref(
  params: Awaited<DirectoryPageProps['searchParams']>,
  updates: Partial<Awaited<DirectoryPageProps['searchParams']>>
) {
  const merged = {
    q: params.q || '',
    division: params.division || '',
    district: params.district || '',
    type: params.type || '',
    ...updates,
  };

  if (updates.division && updates.division !== params.division) {
    merged.district = '';
  }

  const search = new URLSearchParams();
  if (merged.q) search.set('q', merged.q);
  if (merged.division) search.set('division', merged.division);
  if (merged.district) search.set('district', merged.district);
  if (merged.type) search.set('type', merged.type);

  const qs = search.toString();
  return qs ? `/directory?${qs}` : '/directory';
}

async function getTemples(params: Awaited<DirectoryPageProps['searchParams']>) {
  try {
    let query = supabase
      .from('temples')
      .select('*')
      .eq('status', 'approved')
      .not('slug', 'is', null);

    const safeQ = sanitizeSearchTerm(params.q);
    if (safeQ) {
      const tokens = safeQ.split(' ').filter(Boolean);
      const strongest = tokens[0] || safeQ;
      query = query.or(
        `title.ilike.*${strongest}*,english_name.ilike.*${strongest}*,district.ilike.*${strongest}*,upazila.ilike.*${strongest}*,address.ilike.*${strongest}*,short_bio.ilike.*${strongest}*,deity.ilike.*${strongest}*`
      );
    }

    if (params.division) {
      query = query.eq('division', params.division);
    }

    if (params.district) {
      query = query.eq('district', params.district);
    }

    if (params.type) {
      query = query.eq('temple_type', params.type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching temples:', safeJsonStringify(error));
    return [];
  }
}

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const params = await searchParams;
  const temples = await getTemples(params);
  const selectedDivisionDistricts = params.division ? DISTRICTS[params.division] || [] : [];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50/50">
        <div className="container mx-auto px-4 py-6 sm:py-12">
          <BackButton className="mb-6" />
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters Sidebar (Desktop) */}
            <aside className="hidden md:block w-64 space-y-8 bg-white p-6 rounded-2xl border h-fit shrink-0 overflow-y-auto max-h-[calc(100vh-8rem)] sticky top-24">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Sidebar className="h-4 w-4 text-orange-500" />
                ফিল্টার
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">বিভাগ</h4>
                  <div className="space-y-2">
                    <Link
                      href={buildDirectoryHref(params, { division: '', district: '' })}
                      className={`flex items-center gap-2 text-sm p-1 rounded hover:bg-orange-50 transition-colors ${!params.division ? 'text-orange-600 font-bold' : ''}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${!params.division ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                        {!params.division && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      সব বিভাগ
                    </Link>

                    {DIVISIONS.map((div) => (
                      <Link
                        key={div}
                        href={buildDirectoryHref(params, { division: div, district: '' })}
                        className={`flex items-center gap-2 text-sm p-1 rounded hover:bg-orange-50 transition-colors ${params.division === div ? 'text-orange-600 font-bold' : ''}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${params.division === div ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                          {params.division === div && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        {div}
                      </Link>
                    ))}
                  </div>
                </div>

                {params.division && selectedDivisionDistricts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">জেলা</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      <Link
                        href={buildDirectoryHref(params, { district: '' })}
                        className={`flex items-center gap-2 text-sm p-1 rounded hover:bg-orange-50 transition-colors ${!params.district ? 'text-orange-600 font-bold' : ''}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${!params.district ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                          {!params.district && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        সব জেলা
                      </Link>

                      {selectedDivisionDistricts.map((district) => (
                        <Link
                          key={district}
                          href={buildDirectoryHref(params, { district })}
                          className={`flex items-center gap-2 text-sm p-1 rounded hover:bg-orange-50 transition-colors ${params.district === district ? 'text-orange-600 font-bold' : ''}`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${params.district === district ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                            {params.district === district && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className="break-anywhere">{district}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">মন্দিরের ধরন</h4>
                  <div className="space-y-2">
                    <Link
                      href={buildDirectoryHref(params, { type: '' })}
                      className={`flex items-center gap-2 text-sm p-1 rounded hover:bg-orange-50 transition-colors ${!params.type ? 'text-orange-600 font-bold' : ''}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${!params.type ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                        {!params.type && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      সব ধরন
                    </Link>

                    {TEMPLE_TYPES.map((type) => (
                      <Link
                        key={type}
                        href={buildDirectoryHref(params, { type })}
                        className={`flex items-center gap-2 text-sm p-1 rounded hover:bg-orange-50 transition-colors ${params.type === type ? 'text-orange-600 font-bold' : ''}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${params.type === type ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                          {params.type === type && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className="break-anywhere">{type}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-8">
                <div>
                  <h1 className="text-2xl font-bold font-serif">মন্দির ডিরেক্টরি</h1>
                  <p className="text-sm text-gray-500 bengali-text">মোট {temples.length}টি মন্দির পাওয়া গেছে</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Mobile Filter Trigger */}
                  <div className="md:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="w-full flex items-center justify-between px-4 h-11 rounded-xl border-orange-200 bg-orange-50/50 text-orange-700 font-bold">
                          <div className="flex items-center gap-2">
                            <ListFilter className="h-4 w-4" />
                            ফিল্টার অপশন
                          </div>
                          {Object.values(params).filter(Boolean).length > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white text-[10px]">
                              {Object.values(params).filter(Boolean).length}
                            </span>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl border-none !bg-white p-0">
                        <div className="flex flex-col h-full">
                          <SheetHeader className="p-6 border-b shrink-0">
                            <div className="flex items-center justify-between">
                               <SheetTitle className="text-xl font-bold flex items-center gap-2">
                                  <SlidersHorizontal className="h-5 w-5 text-orange-500" /> ফিল্টার করুন
                               </SheetTitle>
                               {Object.values(params).filter(Boolean).length > 0 && (
                                  <Link href="/directory" className="text-xs text-orange-600 font-bold px-3 py-1 rounded-full bg-orange-50">ক্লিয়ার করুন</Link>
                               )}
                            </div>
                          </SheetHeader>
                          
                          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                             {/* Mobile Division Filter */}
                             <section>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin className="h-3 w-3" /> বিভাগ</h4>
                                <div className="grid grid-cols-2 gap-2">
                                   <Link 
                                      href={buildDirectoryHref(params, { division: '', district: '' })}
                                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all text-center ${!params.division ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-100'}`}
                                   >সব বিভাগ</Link>
                                   {DIVISIONS.map(div => (
                                     <Link 
                                        key={div}
                                        href={buildDirectoryHref(params, { division: div, district: '' })}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all text-center ${params.division === div ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-100'}`}
                                     >{div}</Link>
                                   ))}
                                </div>
                             </section>

                             {/* Mobile District Filter */}
                             {params.division && selectedDivisionDistricts.length > 0 && (
                               <section>
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin className="h-3 w-3" /> জেলা ({params.division})</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                     <Link 
                                        href={buildDirectoryHref(params, { district: '' })}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all text-center ${!params.district ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-gray-100'}`}
                                     >সব জেলা</Link>
                                     {selectedDivisionDistricts.map(dist => (
                                       <Link 
                                          key={dist}
                                          href={buildDirectoryHref(params, { district: dist })}
                                          className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all text-center ${params.district === dist ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-gray-100'}`}
                                       >{dist}</Link>
                                     ))}
                                  </div>
                               </section>
                             )}

                             {/* Mobile Type Filter */}
                             <section>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ListFilter className="h-3 w-3" /> মন্দিরের ধরন</h4>
                                <div className="flex flex-wrap gap-2">
                                   <Link 
                                      href={buildDirectoryHref(params, { type: '' })}
                                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${!params.type ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-100'}`}
                                   >সব ধরন</Link>
                                   {TEMPLE_TYPES.map(t => (
                                     <Link 
                                        key={t}
                                        href={buildDirectoryHref(params, { type: t })}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${params.type === t ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-100'}`}
                                     >{t}</Link>
                                   ))}
                                </div>
                             </section>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  <form action="/directory" method="GET" className="flex items-center gap-2 w-full sm:w-auto">
                    {params.division && <input type="hidden" name="division" value={params.division} />}
                    {params.district && <input type="hidden" name="district" value={params.district} />}
                    {params.type && <input type="hidden" name="type" value={params.type} />}
                    <div className="relative w-full">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                       <Input name="q" defaultValue={params.q} placeholder="নাম দিয়ে খুঁজুন..." className="pl-9 pr-4 h-11 rounded-xl shadow-sm border-gray-200 sm:w-64" />
                    </div>
                    <Button type="submit" variant="default" className="bg-orange-500 hover:bg-orange-600 h-11 px-6 rounded-xl">সার্চ</Button>
                  </form>
                </div>
              </div>

              {/* Active Pills */}
              {Object.values(params).filter(Boolean).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mr-1">ফিল্টার:</span>
                  {params.q && (
                    <div className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-lg text-xs font-medium border border-orange-100">
                      <span>&quot;{params.q}&quot;</span>
                      <Link href={buildDirectoryHref(params, { q: '' })}><X className="h-3 w-3" /></Link>
                    </div>
                  )}
                  {params.division && (
                    <div className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-lg text-xs font-medium border border-orange-100">
                      <span>বিভাগ: {params.division}</span>
                      <Link href={buildDirectoryHref(params, { division: '', district: '' })}><X className="h-3 w-3" /></Link>
                    </div>
                  )}
                  {params.district && (
                    <div className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-lg text-xs font-medium border border-orange-100">
                      <span>জেলা: {params.district}</span>
                      <Link href={buildDirectoryHref(params, { district: '' })}><X className="h-3 w-3" /></Link>
                    </div>
                  )}
                  {params.type && (
                    <div className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-lg text-xs font-medium border border-orange-100">
                      <span>ধরন: {params.type}</span>
                      <Link href={buildDirectoryHref(params, { type: '' })}><X className="h-3 w-3" /></Link>
                    </div>
                  )}
                  <Link href="/directory" className="text-xs text-red-500 font-bold hover:underline ml-2">সব মুছুন</Link>
                </div>
              )}

              {temples.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {temples.map((temple) => (
                    <TempleCard key={temple.id} temple={temple} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 md:p-12 text-center border-2 border-dashed">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">কোন মন্দির পাওয়া যায়নি</h3>
                  <p className="text-gray-500 bengali-text">অন্য কোন শব্দ দিয়ে চেষ্টা করুন অথবা নতুন মন্দির যোগ করুন।</p>
                  <Button className="mt-6 bg-orange-500" asChild>
                    <Link href="/add-temple">নতুন মন্দির যোগ করুন</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
