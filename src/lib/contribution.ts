import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase';

export type ContributionSummary = {
  approvedTempleCount: number;
  approvedEditCount: number;
  approvedPhotoCount: number;
  rejectedCount: number;
  score: number;
};

export const POINTS = {
  TEMPLE_ADD: 10,
  EDIT_APPROVED: 5,
  PHOTO_APPROVED: 2,
  REJECTION_PENALTY: 5,
} as const;

function scoreFromCounts(summary: Omit<ContributionSummary, 'score'>): number {
  return (
    summary.approvedTempleCount * POINTS.TEMPLE_ADD +
    summary.approvedEditCount * POINTS.EDIT_APPROVED +
    summary.approvedPhotoCount * POINTS.PHOTO_APPROVED -
    summary.rejectedCount * POINTS.REJECTION_PENALTY
  );
}

async function fetchContributionSummaryWithClient(client: any, profileId: string): Promise<ContributionSummary> {
  const [approvedTemplesRes, approvedEditsRes, approvedPhotosRes, rejectedTemplesRes, rejectedEditsRes, rejectedPhotosRes] = await Promise.all([
    client.from('temples').select('id', { count: 'exact', head: true }).eq('created_by', profileId).eq('status', 'approved').is('deleted_at', null),
    client.from('temple_edits').select('id, temples!inner(id)', { count: 'exact', head: true }).eq('profile_id', profileId).eq('status', 'approved').is('temples.deleted_at', null),
    client.from('temple_photos').select('id, temples!inner(id)', { count: 'exact', head: true }).eq('profile_id', profileId).eq('status', 'approved').is('temples.deleted_at', null),
    client.from('temples').select('id', { count: 'exact', head: true }).eq('created_by', profileId).eq('status', 'rejected').is('deleted_at', null),
    client.from('temple_edits').select('id, temples!inner(id)', { count: 'exact', head: true }).eq('profile_id', profileId).eq('status', 'rejected').is('temples.deleted_at', null),
    client.from('temple_photos').select('id, temples!inner(id)', { count: 'exact', head: true }).eq('profile_id', profileId).eq('status', 'rejected').is('temples.deleted_at', null),
  ]);

  const summaryWithoutScore = {
    approvedTempleCount: approvedTemplesRes.count || 0,
    approvedEditCount: approvedEditsRes.count || 0,
    approvedPhotoCount: approvedPhotosRes.count || 0,
    rejectedCount: (rejectedTemplesRes.count || 0) + (rejectedEditsRes.count || 0) + (rejectedPhotosRes.count || 0),
  };

  return {
    ...summaryWithoutScore,
    score: scoreFromCounts(summaryWithoutScore),
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
    admin.from('temples').select('created_by, status').is('deleted_at', null),
    admin.from('temple_edits').select('profile_id, status, temples!inner(id)').is('temples.deleted_at', null),
    admin.from('temple_photos').select('profile_id, status, temples!inner(id)').is('temples.deleted_at', null),
  ]);

  const templeData = temples.data || [];
  const editData = edits.data || [];
  const photoData = photos.data || [];

  // 3. Map outcomes to profiles
  const leaderboard = profiles.map(profile => {
    const userTemples = templeData.filter(t => t.created_by === profile.id);
    const userEdits = editData.filter(e => e.profile_id === profile.id);
    const userPhotos = photoData.filter(p => p.profile_id === profile.id);

    const approvedTemples = userTemples.filter(t => t.status === 'approved').length;
    const approvedEdits = userEdits.filter(e => e.status === 'approved').length;
    const approvedPhotos = userPhotos.filter(p => p.status === 'approved').length;
    
    const rejectedTemples = userTemples.filter(t => t.status === 'rejected').length;
    const rejectedEdits = userEdits.filter(e => e.status === 'rejected').length;
    const rejectedPhotos = userPhotos.filter(p => p.status === 'rejected').length;
    const rejectedCount = rejectedTemples + rejectedEdits + rejectedPhotos;

    const score = (approvedTemples * POINTS.TEMPLE_ADD) + 
                  (approvedEdits * POINTS.EDIT_APPROVED) + 
                  (approvedPhotos * POINTS.PHOTO_APPROVED) - 
                  (rejectedCount * POINTS.REJECTION_PENALTY);

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
