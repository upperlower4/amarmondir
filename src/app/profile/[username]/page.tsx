import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, MapPin, Edit3, Calendar, ShieldCheck, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { TempleCard } from '@/components/TempleCard';

async function getProfileData(username: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) return null;

  const { data: contributedTemples } = await supabase
    .from('temple_contributors')
    .select('*, temples(*)')
    .eq('profile_id', profile.id);

  return { profile, contributedTemples };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getProfileData(username);
  if (!data) notFound();

  const { profile, contributedTemples } = data;
  const temples = contributedTemples?.map(c => c.temples).filter(Boolean) || [];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50/50">
        
        {/* Profile Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="relative">
                <Avatar className="h-32 w-32 md:h-48 md:w-48 border-4 border-white shadow-2xl">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="text-4xl">{profile.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                {profile.is_admin && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg border-2 border-white">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold font-serif">{profile.full_name || profile.username}</h1>
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{profile.badge}</Badge>
                  </div>
                  <p className="text-gray-500 font-mono text-sm tracking-widest">@{profile.username}</p>
                </div>
                
                <p className="text-gray-600 max-w-xl bengali-text leading-relaxed">
                  {profile.bio || 'এই ব্যবহারকারী এখনো তার বায়ো আপডেট করেননি।'}
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                  {profile.is_admin && (
                    <div className="flex items-center gap-2 text-blue-600 text-sm font-bold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Moderator</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="icon" className="rounded-xl"><Mail className="h-4 w-4" /></Button>
                <Button className="bg-orange-500 rounded-xl px-8 h-10">ফলো করুন</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="container mx-auto px-4 -translate-y-8">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={MapPin} label="মন্দির যোগ করা হয়েছে" value={profile.temples_added} color="text-orange-500" />
              <StatCard icon={Edit3} label="এডিট সাজেশন" value={profile.edits_made} color="text-blue-500" />
              <StatCard icon={Trophy} label="লিডারবোর্ড র‍্যাঙ্ক" value="#5" color="text-yellow-600" />
              <StatCard icon={ShieldCheck} label="কন্ট্রিবিউশন স্কোর" value={profile.temples_added * 10 + profile.edits_made * 2} color="text-green-600" />
           </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-8 font-serif">অবদানকৃত মন্দিরসমূহ</h2>
          
          {temples.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {temples.map((temple: any) => (
                <TempleCard key={temple.id} temple={temple} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-20 text-center border-none shadow-sm">
              <p className="text-gray-500 bengali-text">এই ইউজার এখনো কোন মন্দির যোগ করেননি।</p>
            </div>
          )}
        </div>

      </main>
      <Footer />
    </>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
  return (
    <Card className="border-none shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold leading-none">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
