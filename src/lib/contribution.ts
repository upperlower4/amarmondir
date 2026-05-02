import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase';

export type ContributionSummary = {
  approvedTempleCount: number;
  approvedEditCount: number;
  approvedPhotoCount: number;
  rejectedCount: number;
  score: number;
};

async function fetchContributionSummaryWithClient(client: any, profileId: string): Promise<ContributionSummary> {
  const [templesRes, editsRes, photosRes] = await Promise.all([
    client.from('temples').select('id, status, points_awarded').eq('created_by', profileId).in('status', ['approved', 'rejected']).is('deleted_at', null),
    client.from('temple_edits').select('id, status, points_awarded, temples!inner(id)').eq('profile_id', profileId).in('status', ['approved', 'rejected']).is('temples.deleted_at', null),
    client.from('temple_photos').select('id, status, points_awarded, temples!inner(id)').eq('profile_id', profileId).in('status', ['approved', 'rejected']).is('temples.deleted_at', null),
  ]);

  const temples = templesRes.data || [];
  const edits = editsRes.data || [];
  const photos = photosRes.data || [];

  const approvedTemples = temples.filter((t: any) => t.status === 'approved');
  const approvedEdits = edits.filter((e: any) => e.status === 'approved');
  const approvedPhotos = photos.filter((p: any) => p.status === 'approved');
  const rejectedTemples = temples.filter((t: any) => t.status === 'rejected');
  const rejectedEdits = edits.filter((e: any) => e.status === 'rejected');
  const rejectedPhotos = photos.filter((p: any) => p.status === 'rejected');

  const score = [...temples, ...edits, ...photos].reduce((acc, curr) => acc + (curr.points_awarded || 0), 0);

  return {
    approvedTempleCount: approvedTemples.length,
    approvedEditCount: approvedEdits.length,
    approvedPhotoCount: approvedPhotos.length,
    rejectedCount: rejectedTemples.length + rejectedEdits.length + rejectedPhotos.length,
    score,
  };
}

export async function getContributionSummary(profileId: string): Promise<ContributionSummary> {
  return fetchContributionSummaryWithClient(supabase, profileId);
}

function getBadgeFromTempleCount(approvedTempleCount: number) {
  if (approvedTempleCount >= 10) return 'মন্দির রক্ষক';
  if (approvedTempleCount >= 5) return 'নিবেদিত অবদানকারী';
  if (approvedTempleCount >= 2) return 'উদীয়মান অবদানকারী';
  return 'নতুন অবদানকারী';
}

export async function syncProfileStats(profileId: string) {
  const admin = getSupabaseAdmin();
  const summary = await fetchContributionSummaryWithClient(admin, profileId);

  await admin
    .from('profiles')
    .update({
      temples_added: summary.approvedTempleCount,
      edits_made: summary.approvedEditCount,
      badge: getBadgeFromTempleCount(summary.approvedTempleCount),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId);

  return summary;
}

export async function getLeaderboardProfiles() {
  const admin = getSupabaseAdmin();
  
  // 1. Fetch all profiles
  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id, username, full_name, avatar_url, badge, temples_added, edits_made');

  if (profileError || !profiles) return [];

  // 2. Fetch all relevant approved/rejected entries in bulk to avoid N+1
  const [temples, edits, photos] = await Promise.all([
    admin.from('temples').select('created_by, status, points_awarded').is('deleted_at', null).in('status', ['approved', 'rejected']),
    admin.from('temple_edits').select('profile_id, status, points_awarded, temples!inner(id)').is('temples.deleted_at', null).in('status', ['approved', 'rejected']),
    admin.from('temple_photos').select('profile_id, status, points_awarded, temples!inner(id)').is('temples.deleted_at', null).in('status', ['approved', 'rejected']),
  ]);

  const templeData = temples.data || [];
  const editData = edits.data || [];
  const photoData = photos.data || [];

  // 3. Map outcomes to profiles
  const leaderboard = profiles.map(profile => {
    const userTemples = templeData.filter((t: any) => t.created_by === profile.id);
    const userEdits = editData.filter((e: any) => e.profile_id === profile.id);
    const userPhotos = photoData.filter((p: any) => p.profile_id === profile.id);

    const approvedTemples = userTemples.filter((t: any) => t.status === 'approved').length;
    const approvedEdits = userEdits.filter((e: any) => e.status === 'approved').length;
    const approvedPhotos = userPhotos.filter((p: any) => p.status === 'approved').length;
    
    const rejectedTemples = userTemples.filter((t: any) => t.status === 'rejected').length;
    const rejectedEdits = userEdits.filter((e: any) => e.status === 'rejected').length;
    const rejectedPhotos = userPhotos.filter((p: any) => p.status === 'rejected').length;
    const rejectedCount = rejectedTemples + rejectedEdits + rejectedPhotos;

    const score = [...userTemples, ...userEdits, ...userPhotos].reduce((acc, curr) => acc + (curr.points_awarded || 0), 0);

    return {
      ...profile,
      temples_added: approvedTemples,
      edits_made: approvedEdits,
      photos_added: approvedPhotos,
      rejected_count: rejectedCount,
      score: score
    };
  });

  // 4. Sort and return
  return leaderboard.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.temples_added !== a.temples_added) return b.temples_added - a.temples_added;
    if (b.edits_made !== a.edits_made) return b.edits_made - a.edits_made;
    return b.photos_added - a.photos_added;
  });
}
