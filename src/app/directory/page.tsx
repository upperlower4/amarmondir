import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { TempleCard } from '@/components/TempleCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Sidebar, Search } from 'lucide-react';
import { DIVISIONS, DISTRICTS, TEMPLE_TYPES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface DirectoryPageProps {
  searchParams: Promise<{
    q?: string;
    division?: string;
    district?: string;
    type?: string;
  }>;
}

async function getTemples(params: Awaited<DirectoryPageProps['searchParams']>) {
  try {
    let query = supabase
      .from('temples')
      .select('*')
      .eq('status', 'approved');

    if (params.q) {
      query = query.or(`title.ilike.%${params.q}%,english_name.ilike.%${params.q}%,district.ilike.%${params.q}%`);
    }

    if (params.division) {
      query = query.eq('division', params.division);
    }

    if (params.type) {
      query = query.eq('temple_type', params.type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching temples:', String(error instanceof Error ? error.message : error));
    return [];
  }
}

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const params = await searchParams;
  const temples = await getTemples(params);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50/50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="w-full md:w-64 space-y-8 bg-white p-6 rounded-2xl border h-fit shrink-0 overflow-y-auto max-h-[calc(100vh-8rem)] sticky top-24">
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Sidebar className="h-4 w-4 text-orange-500" />
                  ফিল্টার
                </h3>
                
                <div className="space-y-6">
                  {/* Division */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">বিভাগ</h4>
                    <div className="space-y-2">
                      {DIVISIONS.map(div => (
                        <Link 
                          key={div} 
                          href={`/directory?division=${div}`}
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

                  {/* Temple Type */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">মন্দিরের ধরন</h4>
                    <div className="space-y-2">
                      {TEMPLE_TYPES.map(type => (
                        <Link 
                          key={type} 
                          href={`/directory?type=${type}`}
                          className={`flex items-center gap-2 text-sm p-1 rounded hover:bg-orange-50 transition-colors ${params.type === type ? 'text-orange-600 font-bold' : ''}`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${params.type === type ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                            {params.type === type && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className="truncate max-w-[150px]">{type}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Results Grid */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-2xl font-bold font-serif">মন্দির ডিরেক্টরি</h1>
                  <p className="text-sm text-gray-500 bengali-text">মোট {temples.length}টি মন্দির পাওয়া গেছে</p>
                </div>
                
                <form action="/directory" method="GET" className="flex items-center gap-2">
                  <Input name="q" defaultValue={params.q} placeholder="নাম দিয়ে খুঁজুন..." className="sm:w-64" />
                  <Button type="submit" variant="outline">সার্চ</Button>
                </form>
              </div>

              {temples.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {temples.map((temple) => (
                    <TempleCard key={temple.id} temple={temple} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed">
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
