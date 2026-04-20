import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, MapPin, Edit3, Calendar, ShieldCheck, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { TempleCard } from '@/components/TempleCard';
import Link from 'next/link';

import { ProfileActions } from './ProfileActions';

export const dynamic = 'force-dynamic';

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

  // Dynamically count contributions instead of relying only on the trigger to update profile.temples_added
  const templeCount = contributedTemples?.filter(c => c.contribution_type === 'original').length || 0;
  
  const { count: editCount } = await supabase
    .from('temple_edits')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, temples_added, edits_made')
    .order('created_at', { ascending: true });

  const { data: allContributors } = await supabase.from('temple_contributors').select('profile_id, contribution_type');
  const { data: allEdits } = await supabase.from('temple_edits').select('profile_id');

  const formattedProfiles = (profiles || []).map(p => {
    const pTemples = allContributors?.filter(c => c.profile_id === p.id && c.contribution_type === 'original').length || 0;
    const pEdits = allEdits?.filter(e => e.profile_id === p.id).length || 0;
    return {
      ...p,
      temples_added: Math.max(p.temples_added || 0, pTemples),
      edits_made: Math.max(p.edits_made || 0, pEdits)
    };
  }).sort((a, b) => {
    if (b.temples_added !== a.temples_added) return b.temples_added - a.temples_added;
    return b.edits_made - a.edits_made;
  });

  const leaderboardRank = formattedProfiles.findIndex((leader) => leader.id === profile.id) + 1;

  // Use dynamic counts for the profile display
  const dynamicProfile = {
    ...profile,
    temples_added: Math.max(profile.temples_added, templeCount), // Show higher of trigger or dynamic count
    edits_made: Math.max(profile.edits_made, editCount || 0)
  };

  return { profile: dynamicProfile, contributedTemples, leaderboardRank: leaderboardRank || null };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getProfileData(username);
  if (!data) notFound();

  const { profile, contributedTemples, leaderboardRank } = data;
  const temples = contributedTemples?.map((c) => c.temples).filter(Boolean) || [];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50/50">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-10 md:py-16">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              <div className="relative shrink-0">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-2xl">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="text-4xl">{profile.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                {profile.is_admin && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg border-2 border-white">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center lg:text-left space-y-4 min-w-0">
                <div>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold font-serif break-anywhere">{profile.full_name || profile.username}</h1>
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 max-w-full break-anywhere">{profile.badge}</Badge>
                  </div>
                  <p className="text-gray-500 font-mono text-sm tracking-wide break-anywhere">@{profile.username}</p>
                </div>

                <p className="text-gray-600 max-w-2xl bengali-text leading-relaxed break-anywhere">
                  {profile.bio || 'এই ব্যবহারকারী এখনো তার বায়ো আপডেট করেননি।'}
                </p>

                <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2">
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

              <ProfileActions profileId={profile.id} />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 -translate-y-6 md:-translate-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={MapPin} label="মন্দির যোগ করা হয়েছে" value={profile.temples_added} color="text-orange-500" />
            <StatCard icon={Edit3} label="এডিট সাজেশন" value={profile.edits_made} color="text-blue-500" />
            <StatCard icon={Trophy} label="লিডারবোর্ড র‍্যাঙ্ক" value={leaderboardRank ? `#${leaderboardRank}` : 'N/A'} color="text-yellow-600" />
            <StatCard icon={ShieldCheck} label="কন্ট্রিবিউশন স্কোর" value={profile.temples_added * 10 + profile.edits_made * 2} color="text-green-600" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 md:py-12">
          <h2 className="text-2xl font-bold mb-8 font-serif">অবদানকৃত মন্দিরসমূহ</h2>

          {temples.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {temples.map((temple: any) => (
                <TempleCard key={temple.id} temple={temple} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 md:p-12 text-center border-none shadow-sm">
              <p className="text-gray-500 bengali-text">এই ইউজার এখনো কোন মন্দির যোগ করেননি।</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <Card className="border-none shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden h-full">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-gray-400 tracking-wide mb-1 leading-snug break-anywhere">{label}</p>
          <p className="text-2xl font-bold leading-none break-anywhere">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
