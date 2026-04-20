import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Sparkles, Flame, CalendarDays, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { calculateContributionPoints, getContributionBadge } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getLeaders() {
  const [{ data: profiles }, { data: contributors }, { data: edits }, { data: photos }] = await Promise.all([
    supabase.from('profiles').select('id, username, full_name, avatar_url, badge, temples_added, edits_made'),
    supabase.from('temple_contributors').select('profile_id, contribution_type, created_at'),
    supabase.from('temple_edits').select('profile_id, created_at'),
    supabase.from('temple_photos').select('profile_id, created_at'),
  ]);

  const monthKey = new Date().toISOString().slice(0, 7);

  return (profiles || []).map((profile: any) => {
    const originals = (contributors || []).filter((c: any) => c.profile_id === profile.id && c.contribution_type === 'original');
    const photoContribs = (photos || []).filter((p: any) => p.profile_id === profile.id);
    const editsCount = (edits || []).filter((e: any) => e.profile_id === profile.id).length;
    const monthly = originals.filter((x: any) => String(x.created_at || '').startsWith(monthKey)).length + (edits || []).filter((e: any) => e.profile_id === profile.id && String(e.created_at || '').startsWith(monthKey)).length;
    const templesAdded = Math.max(profile.temples_added || 0, originals.length);
    const photosAdded = photoContribs.length;
    const points = calculateContributionPoints(templesAdded, editsCount, photosAdded);
    return {
      ...profile,
      temples_added: templesAdded,
      edits_made: Math.max(profile.edits_made || 0, editsCount),
      photos_added: photosAdded,
      points,
      monthly,
      streak: Math.min(12, Math.max(1, Math.ceil(monthly / 2) || 1)),
      computed_badge: getContributionBadge(points),
    };
  }).sort((a: any, b: any) => b.points - a.points || b.temples_added - a.temples_added).slice(0, 50);
}

export default async function LeaderboardPage() {
  const leaders = await getLeaders();
  const topThree = leaders.slice(0, 3);
  const monthlyTop = [...leaders].sort((a, b) => b.monthly - a.monthly).slice(0, 5);
  const badgeMap = [
    { name: 'নতুন অবদানকারী', rule: '১+ point' },
    { name: 'উদীয়মান অবদানকারী', rule: '২০+ points' },
    { name: 'নিবেদিত অবদানকারী', rule: '৬০+ points' },
    { name: 'মন্দির রক্ষক', rule: '১২০+ points' },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50/50 py-12">
        <div className="container mx-auto px-4 space-y-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-6"><Trophy className="h-4 w-4" /> সেরা অবদানকারীদের তালিকা</div>
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 text-balance">লিডারবোর্ড</h1>
            <p className="text-gray-500 bengali-text">points breakdown, monthly top contributors, streak, badges — সব একসাথে।</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-end">
            {topThree[1] && <LeaderPodium user={topThree[1]} rank={2} color="text-slate-400" bgColor="bg-slate-50" />}
            {topThree[0] && <LeaderPodium user={topThree[0]} rank={1} color="text-orange-500" bgColor="bg-orange-50" />}
            {topThree[2] && <LeaderPodium user={topThree[2]} rank={3} color="text-amber-700" bgColor="bg-amber-50" />}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2"><CardHeader><CardTitle>পূর্ণ র‍্যাঙ্কিং</CardTitle></CardHeader><CardContent className="space-y-3">{leaders.map((user, index) => <Link key={user.id} href={`/profile/${user.username}`} className="flex items-center gap-4 bg-white p-4 rounded-2xl border hover:shadow-md transition-shadow group"><div className="w-8 text-center font-bold text-gray-400 shrink-0">{index + 1}</div><Avatar className="h-12 w-12 border-2 border-white shadow-sm"><AvatarImage src={user.avatar_url || ''} /><AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback></Avatar><div className="flex-1 min-w-0 overflow-hidden"><p className="font-bold truncate group-hover:text-orange-600 transition-colors">{user.full_name || user.username}</p><div className="flex flex-wrap gap-2 mt-1"><Badge variant="secondary">{user.computed_badge}</Badge><Badge variant="outline">{user.points} pts</Badge><Badge variant="outline">{user.streak} wk streak</Badge></div></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm shrink-0"><Stat label="মন্দির" value={user.temples_added} /><Stat label="এডিট" value={user.edits_made} /><Stat label="ফটো" value={user.photos_added} /><Stat label="মাসিক" value={user.monthly} /></div></Link>)}</CardContent></Card>
            <div className="space-y-6">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-orange-500" /> Monthly top contributors</CardTitle></CardHeader><CardContent className="space-y-3">{monthlyTop.map((user) => <div key={user.id} className="rounded-2xl border p-4"><p className="font-semibold">{user.full_name || user.username}</p><p className="text-sm text-gray-500">এই মাসে {user.monthly} contributions</p></div>)}</CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-4 w-4 text-orange-500" /> Badges</CardTitle></CardHeader><CardContent className="space-y-3">{badgeMap.map((badge) => <div key={badge.name} className="rounded-2xl border p-4"><p className="font-semibold">{badge.name}</p><p className="text-sm text-gray-500">Requirement: {badge.rule}</p></div>)}</CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" /> Points breakdown</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-gray-600"><p>নতুন temple = 10 points</p><p>Edit request = 4 points</p><p>Gallery photo = 2 points</p><p>Monthly leaderboard current-month activity দিয়ে তৈরি।</p></CardContent></Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function LeaderPodium({ user, rank, color, bgColor }: { user: any, rank: number, color: string, bgColor: string }) {
  const isFirst = rank === 1;
  return <Link href={`/profile/${user.username}`} className="flex flex-col items-center group"><div className={`relative mb-6 p-1 rounded-full ${isFirst ? 'scale-125' : ''}`}><div className={`absolute -top-4 -right-4 w-12 h-12 ${bgColor} ${color} rounded-2xl rotate-12 flex items-center justify-center shadow-lg border border-current/20 z-10`}><span className="text-xl font-bold">{rank}</span></div><div className={`p-1 rounded-full border-4 border-dashed ${isFirst ? 'border-orange-500 animate-[spin_20s_linear_infinite]' : 'border-gray-200'}`}><Avatar className={`${isFirst ? 'h-32 w-32' : 'h-24 w-24'} shadow-2xl border-4 border-white`}><AvatarImage src={user.avatar_url || ''} /><AvatarFallback className="text-2xl">{user.username[0].toUpperCase()}</AvatarFallback></Avatar></div>{isFirst && <Sparkles className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-8 text-orange-500 animate-pulse" />}</div><div className="text-center"><h3 className="font-bold text-xl mb-1 group-hover:text-orange-600 transition-colors">{user.full_name || user.username}</h3><Badge className="bg-orange-500 hover:bg-orange-500">{user.computed_badge}</Badge><div className="mt-4 flex gap-4 justify-center"><Stat label="Points" value={user.points} /><Stat label="Streak" value={user.streak} /></div></div></Link>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="flex flex-col items-center bg-white px-4 py-2 rounded-xl border shadow-sm"><span className="text-lg font-bold text-orange-600 leading-none">{value}</span><span className="text-[10px] uppercase text-gray-400 font-bold mt-1">{label}</span></div>;
}
