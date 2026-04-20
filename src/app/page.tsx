import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TempleCard } from '@/components/TempleCard';
import { Search, MapPin, Sparkles, Navigation, Users } from 'lucide-react';
import Link from 'next/link';
import { DIVISIONS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

async function getFeaturedTemples() {
  try {
    const { data, error } = await supabase
      .from('temples')
      .select('*')
      .eq('status', 'approved')
      .limit(4)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching featured temples:', String(error.message));
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Fetch error:', String(err instanceof Error ? err.message : err));
    return [];
  }
}

export default async function HomePage() {
  const temples = await getFeaturedTemples();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-orange-50/50 -z-10" />
          <div className="absolute top-0 right-0 w-1/3 h-full bg-orange-100/30 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-8 border border-orange-200">
              <Sparkles className="h-4 w-4" />
              <span>বাংলাদেশের ১০০০+ মন্দিরের ডিরেক্টরি</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 font-serif leading-[1.1]">
              খুঁজে নিন আপনার কাছের <br />
              <span className="text-orange-500">পবিত্র মঠ ও মন্দির</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 bengali-text">
              আমাদের ঐতিহ্য ও সংস্কৃতির অবিচ্ছেদ্য অংশ বাংলাদেশের মন্দিরগুলো। এখন সহজেই খুঁজে দেখুন এবং আপনার এলাকার মন্দিরটি যুক্ত করুন।
            </p>

            <form action="/directory" method="GET" className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-2xl shadow-orange-100 flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  name="q"
                  placeholder="মন্দিরের নাম বা এলাকা দিয়ে খুঁজুন..." 
                  className="pl-10 h-12 border-none focus-visible:ring-0 text-lg"
                />
              </div>
              <Button type="submit" className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-lg rounded-xl">
                খুঁজুন
              </Button>
            </form>
          </div>
        </section>

        {/* Categories / Divisions */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-10 font-serif">বিভাগ অনুযায়ী ব্রাউজ করুন</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {DIVISIONS.map((division) => (
                <Link 
                  key={division}
                  href={`/directory?division=${division}`}
                  className="group flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-sm border hover:border-orange-200 hover:shadow-orange-100/50 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <span className="font-bold text-center">{division}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Temples */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold font-serif">সেরা মন্দিরগুলো</h2>
                <p className="text-gray-500 bengali-text">সম্প্রতি যুক্ত হওয়া এবং ভেরিফাইড চমৎকার মন্দিরগুলো</p>
              </div>
              <Link href="/directory" className="text-orange-600 font-semibold hover:underline">সবগুলো দেখুন</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {temples.length > 0 ? (
                temples.map((temple: any) => (
                  <TempleCard key={temple.id} temple={temple} />
                ))
              ) : (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-[400px] bg-gray-50 rounded-2xl animate-pulse" />
                ))
              )}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-orange-500 text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-20 bg-white -translate-y-10 rounded-[100%]" />
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-serif mb-4">আমাদের সাথে যুক্ত হোন</h2>
              <p className="text-orange-50 opacity-90 text-lg bengali-text">মাত্র ৩টি ধাপে যুক্ত করুন আপনার এলাকার মন্দির</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border border-white/30">
                  ১
                </div>
                <h3 className="text-xl font-bold font-serif">বেসিক তথ্য দিন</h3>
                <p className="text-orange-50/80 bengali-text">মন্দিরের নাম, ধরন এবং অবস্থান নির্দিষ্ট করুন।</p>
              </div>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border border-white/30">
                  ২
                </div>
                <h3 className="text-xl font-bold font-serif">ছবি আপলোড করুন</h3>
                <p className="text-orange-50/80 bengali-text">মন্দিরের সুন্দর ছবি এবং ম্যাপ লোকেশন যুক্ত করুন।</p>
              </div>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border border-white/30">
                  ৩
                </div>
                <h3 className="text-xl font-bold font-serif">ইতিহাস লিখুন</h3>
                <p className="text-orange-50/80 bengali-text">মন্দিরের ইতিহাস, উৎসব এবং গুরুত্বপূর্ণ তথ্য দিন।</p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Link href="/add-temple">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 text-xl h-16 px-12 rounded-2xl shadow-xl">
                  মন্দির যোগ করুন
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
