import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Image from 'next/image';
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
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { getDivisionColor } from '@/lib/utils';
import Link from 'next/link';

async function getTempleData(slug: string) {
  const { data: temple } = await supabase
    .from('temples')
    .select('*, profiles(username, avatar_url)')
    .eq('slug', slug)
    .single();

  if (!temple) return null;

  const { data: photos } = await supabase
    .from('temple_photos')
    .select('*')
    .eq('temple_id', temple.id);

  const { data: contributors } = await supabase
    .from('temple_contributors')
    .select('*, profiles(username, full_name, avatar_url, badge)')
    .eq('temple_id', temple.id);

  const { data: festivals } = await supabase
    .from('temple_festivals')
    .select('*')
    .eq('temple_id', temple.id);

  return { temple, photos, contributors, festivals };
}

export default async function TemplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getTempleData(slug);
  if (!data) notFound();

  const { temple, photos, contributors, festivals } = data;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#fcfaf7]">
        {/* Hero Banner */}
        <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
          <Image
            src={temple.cover_image || 'https://picsum.photos/seed/temple/1920/1080'}
            alt={temple.title}
            fill
            priority
            className="object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
            <div className="container mx-auto">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={getDivisionColor(temple.division)}>
                  {temple.division}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-md">
                  {temple.temple_type}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 font-serif">
                {temple.title}
              </h1>
              <p className="text-xl text-white/80 italic font-light tracking-wide md:text-2xl mb-6">
                {temple.english_name}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm md:text-base mb-8">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-400" />
                  <span>{temple.address}</span>
                </div>
                {temple.open_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-400" />
                    <span>{temple.open_hours}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column: Content */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Gallery Grid */}
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 font-serif">
                  <Sparkles className="h-6 w-6 text-orange-500" />
                  ছবি গ্যালারি
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(photos?.length ?? 0) > 0 ? (
                    photos?.map((photo: any) => (
                      <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-orange-100 transition-all">
                        <Image
                          src={photo.url}
                          alt="Temple Photo"
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))
                  ) : (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                        <Sparkles className="h-8 w-8 text-gray-300" />
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Bio & Long Form Article */}
              <section className="bg-white p-8 rounded-[2rem] shadow-sm border">
                <Tabs defaultValue="about" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 bg-orange-50/50 p-1 h-14 rounded-xl">
                    <TabsTrigger value="about" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-lg">সংক্ষিপ্ত বর্ণনা</TabsTrigger>
                    <TabsTrigger value="article" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-lg">বিস্তারিত খবর/ইতিহাস</TabsTrigger>
                  </TabsList>
                  <TabsContent value="about" className="mt-0">
                    <div className="prose prose-orange max-w-none bengali-text leading-relaxed text-lg text-gray-700">
                      {temple.short_bio ? (
                        <p>{temple.short_bio}</p>
                      ) : (
                        <p className="italic text-gray-400">এই মন্দিরের কোন বর্ণনা এখনো যুক্ত করা হয়নি।</p>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="article" className="mt-0">
                    <div className="prose prose-orange max-w-none bengali-text leading-loose text-lg text-gray-700">
                      {temple.article_content ? (
                        <div dangerouslySetInnerHTML={{ __html: temple.article_content.replace(/\n/g, '<br />') }} />
                      ) : (
                        <div className="text-center py-12">
                          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">বিস্তারিত ইতিহাস বা নিবন্ধ এখনো যোগ করা হয়নি।</p>
                          <Button variant="outline" className="mt-4 border-orange-200 text-orange-600">
                            নিবন্ধ যোগ করুন
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </section>

              {/* Festivals */}
              {festivals && festivals.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 font-serif">
                    <Calendar className="h-6 w-6 text-orange-500" />
                    মূল উৎসবসমূহ
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {festivals.map((fest: any) => (
                      <Card key={fest.id} className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-bold text-orange-600">{fest.name}</CardTitle>
                          <p className="text-xs text-gray-400 bengali-text">{fest.date_info}</p>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 bengali-text">{fest.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Sidebar */}
            <div className="space-y-8">
              
              {/* Quick Info Card */}
              <Card className="rounded-3xl border-none shadow-xl shadow-orange-100/50">
                <CardHeader className="bg-orange-500 text-white rounded-t-3xl pt-8 pb-6">
                  <CardTitle className="text-xl font-serif">মৌলিক তথ্য</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-8">
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
                    <Button className="w-full bg-orange-500 h-12 rounded-xl text-lg flex items-center gap-2" asChild>
                      <a href={temple.map_link} target="_blank" rel="noopener noreferrer">
                        <MapIcon className="h-5 w-5" /> গুগল ম্যাপে দেখুন
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full h-12 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 flex items-center gap-2">
                      <Edit2 className="h-4 w-4" /> তথ্য আপডেট করুন
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Contributors */}
              <Card className="rounded-3xl border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 font-serif">
                    <Users className="h-5 w-5 text-orange-500" />
                    অবদানকারী
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(contributors?.length ?? 0) > 0 ? (
                    contributors?.map((cont: any) => (
                      <Link key={cont.id} href={`/profile/${cont.profiles.username}`} className="flex items-center gap-3 p-2 hover:bg-orange-50 rounded-xl transition-colors group">
                        <div className="relative">
                          <Image
                            src={cont.profiles.avatar_url || 'https://picsum.photos/seed/user/100/100'}
                            alt={cont.profiles.username}
                            width={40}
                            height={40}
                            className="rounded-full border-2 border-white shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate group-hover:text-orange-600">
                            {cont.profiles.full_name || cont.profiles.username}
                          </p>
                          <p className="text-[10px] text-gray-400 bengali-text">{cont.profiles.badge}</p>
                        </div>
                        <Badge variant="ghost" className="text-[9px] bg-orange-100 text-orange-700">
                          {cont.contribution_type === 'original' ? 'মূল' : 'আপডেট'}
                        </Badge>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">কোন অবদানকারী খুঁজে পাওয়া যায়নি।</p>
                  )}
                </CardContent>
              </Card>

              {/* Verified Status */}
              {temple.status === 'approved' && (
                <div className="bg-green-50 border border-green-100 p-6 rounded-[2rem] flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-green-100">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-green-800">ভেরিফাইড তথ্য</p>
                    <p className="text-xs text-green-700 bengali-text">এই মন্দিরের তথ্য আমাদের প্যানেল দ্বারা যাচাইকৃত।</p>
                  </div>
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
