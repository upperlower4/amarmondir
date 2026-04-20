import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal, MapPin, Edit3, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getLeaders() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, badge, temples_added, edits_made');

  if (!profiles) return [];

  const { data: contributors } = await supabase
    .from('temple_contributors')
    .select('profile_id, contribution_type');

  const { data: edits } = await supabase
    .from('temple_edits')
    .select('profile_id');

  const formattedProfiles = profiles.map(profile => {
    const dynamicTemplesAdded = contributors?.filter(c => c.profile_id === profile.id && c.contribution_type === 'original').length || 0;
    const dynamicEditsMade = edits?.filter(e => e.profile_id === profile.id).length || 0;
    
    return {
      ...profile,
      temples_added: Math.max(profile.temples_added || 0, dynamicTemplesAdded),
      edits_made: Math.max(profile.edits_made || 0, dynamicEditsMade)
    };
  });

  return formattedProfiles
    .sort((a, b) => {
      if (b.temples_added !== a.temples_added) return b.temples_added - a.temples_added;
      return b.edits_made - a.edits_made;
    })
    .slice(0, 50);
}

export default async function LeaderboardPage() {
  const leaders = await getLeaders();
  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50/50 py-12">
        <div className="container mx-auto px-4">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-6">
              <Trophy className="h-4 w-4" />
              <span>সেরা অবদানকারীদের তালিকা</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 text-balance">লিডারবোর্ড</h1>
            <p className="text-gray-500 bengali-text">মন্দির ডিরেক্টরি সমৃদ্ধ করার পেছনে যারা নিরলস কাজ করে যাচ্ছেন।</p>
          </div>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto items-end">
            {/* Rank 2 (Silver) */}
            {topThree[1] && (
              <LeaderPodium user={topThree[1]} rank={2} color="text-slate-400" bgColor="bg-slate-50" />
            )}
            
            {/* Rank 1 (Gold) */}
            {topThree[0] && (
              <LeaderPodium user={topThree[0]} rank={1} color="text-orange-500" bgColor="bg-orange-50" />
            )}

            {/* Rank 3 (Bronze) */}
            {topThree[2] && (
              <LeaderPodium user={topThree[2]} rank={3} color="text-amber-700" bgColor="bg-amber-50" />
            )}
          </div>

          {/* Rest of the list */}
          <div className="max-w-4xl mx-auto space-y-3">
            {rest.map((user, index) => (
              <Link 
                key={user.id} 
                href={`/profile/${user.username}`}
                className="flex items-center gap-4 bg-white p-4 rounded-2xl border hover:shadow-md transition-shadow group"
              >
                <div className="w-8 text-center font-bold text-gray-400 shrink-0">
                  {index + 4}
                </div>
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="font-bold truncate group-hover:text-orange-600 transition-colors">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs text-gray-400 bengali-text">{user.badge}</p>
                </div>
                <div className="flex items-center gap-4 sm:gap-8 text-sm shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-orange-600">{user.temples_added}</span>
                    <span className="text-[10px] text-gray-400 font-bold">মন্দির</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-blue-600">{user.edits_made}</span>
                    <span className="text-[10px] text-gray-400 font-bold">এডিট</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

function LeaderPodium({ user, rank, color, bgColor }: { user: any, rank: number, color: string, bgColor: string }) {
  const isFirst = rank === 1;
  
  return (
    <Link href={`/profile/${user.username}`} className="flex flex-col items-center group">
      <div className={`relative mb-6 p-1 rounded-full ${isFirst ? 'scale-125' : ''}`}>
        <div className={`absolute -top-4 -right-4 w-12 h-12 ${bgColor} ${color} rounded-2xl rotate-12 flex items-center justify-center shadow-lg border border-current/20 z-10`}>
          <span className="text-xl font-bold">{rank}</span>
        </div>
        <div className={`p-1 rounded-full border-4 border-dashed ${isFirst ? 'border-orange-500 animate-[spin_20s_linear_infinite]' : 'border-gray-200'}`}>
          <Avatar className={`${isFirst ? 'h-32 w-32' : 'h-24 w-24'} shadow-2xl border-4 border-white`}>
            <AvatarImage src={user.avatar_url || ''} />
            <AvatarFallback className="text-2xl">{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        {isFirst && <Sparkles className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-8 text-orange-500 animate-pulse" />}
      </div>
      
      <div className="text-center">
        <h3 className="font-bold text-xl mb-1 group-hover:text-orange-600 transition-colors">
          {user.full_name || user.username}
        </h3>
        <Badge variant={isFirst ? 'default' : 'secondary'} className={isFirst ? 'bg-orange-500 hover:bg-orange-500' : ''}>
          {user.badge}
        </Badge>
        
        <div className="mt-4 flex gap-4 justify-center">
          <div className="flex flex-col items-center bg-white px-4 py-2 rounded-xl border shadow-sm">
            <span className="text-lg font-bold text-orange-600 leading-none">{user.temples_added}</span>
            <span className="text-[10px] uppercase text-gray-400 font-bold mt-1">মন্দির</span>
          </div>
          <div className="flex flex-col items-center bg-white px-4 py-2 rounded-xl border shadow-sm">
            <span className="text-lg font-bold text-blue-600 leading-none">{user.edits_made}</span>
            <span className="text-[10px] uppercase text-gray-400 font-bold mt-1">এডিট</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
