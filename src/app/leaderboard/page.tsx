import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getLeaders() {
  const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, avatar_url, badge, temples_added, edits_made');
  if (!profiles) return [];

  const { data: contributors } = await supabase.from('temple_contributors').select('profile_id, contribution_type, temples(status)');
  const { data: edits } = await supabase.from('temple_edits').select('profile_id, status').eq('status', 'approved');

  return profiles
    .map((profile) => {
      const dynamicTemplesAdded = (contributors || []).filter(
        (c: any) => c.profile_id === profile.id && c.contribution_type === 'original' && c.temples?.status === 'approved'
      ).length;
      const dynamicEditsMade = (edits || []).filter((e: any) => e.profile_id === profile.id).length;

      return {
        ...profile,
        temples_added: Math.max(profile.temples_added || 0, dynamicTemplesAdded),
        edits_made: Math.max(profile.edits_made || 0, dynamicEditsMade),
      };
    })
    .sort((a, b) => {
      if (b.temples_added !== a.temples_added) return b.temples_added - a.temples_added;
      return b.edits_made - a.edits_made;
    });
}

export default async function LeaderboardPage() {
  const leaders = await getLeaders();
  const [first, second, third, ...rest] = leaders;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#fcfaf7]">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-6 border border-orange-200">
              <Trophy className="h-4 w-4" />
              <span>কমিউনিটির সেরা অবদানকারীরা</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight font-serif mb-4">লিডারবোর্ড</h1>
            <p className="text-gray-600 max-w-2xl mx-auto bengali-text text-lg">
              যারা নতুন মন্দির যুক্ত করেন এবং মানসম্মত এডিট অনুমোদন পান, তারাই এখানে উঠে আসেন।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto mb-12 md:mb-16">
            {second && <LeaderPodium user={second} rank={2} color="text-gray-700" bgColor="bg-gray-200" />}
            {first && <LeaderPodium user={first} rank={1} color="text-orange-700" bgColor="bg-orange-200" />}
            {third && <LeaderPodium user={third} rank={3} color="text-amber-700" bgColor="bg-amber-200" />}
          </div>

          <div className="bg-white rounded-[2rem] shadow-xl shadow-orange-100/30 p-4 md:p-6 border border-orange-50">
            <div className="mb-5 flex items-center gap-2">
              <Medal className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-bold font-serif">অন্য সব অবদানকারী</h2>
            </div>

            <div className="space-y-3">
              {rest.map((user, index) => (
                <Link key={user.id} href={`/profile/${user.username}`} className="flex items-center gap-4 bg-white p-4 rounded-2xl border hover:shadow-md transition-shadow group">
                  <div className="w-8 text-center font-bold text-gray-400 shrink-0">{index + 4}</div>
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-bold truncate group-hover:text-orange-600 transition-colors">{user.full_name || user.username}</p>
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
        </div>
      </main>
      <Footer />
    </>
  );
}

function LeaderPodium({ user, rank, color, bgColor }: { user: any; rank: number; color: string; bgColor: string }) {
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
        <h3 className="font-bold text-xl mb-1 group-hover:text-orange-600 transition-colors">{user.full_name || user.username}</h3>
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
