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
    client.from('temples').select('id', { count: 'exact', head: true }).eq('created_by', profileId).eq('status', 'approved'),
    client.from('temple_edits').select('id', { count: 'exact', head: true }).eq('profile_id', profileId).eq('status', 'approved'),
    client.from('temple_photos').select('id', { count: 'exact', head: true }).eq('profile_id', profileId).eq('status', 'approved'),
    client.from('temples').select('id', { count: 'exact', head: true }).eq('created_by', profileId).eq('status', 'rejected'),
    client.from('temple_edits').select('id', { count: 'exact', head: true }).eq('profile_id', profileId).eq('status', 'rejected'),
    client.from('temple_photos').select('id', { count: 'exact', head: true }).eq('profile_id', profileId).eq('status', 'rejected'),
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
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, badge, temples_added, edits_made');

  if (!profiles) return [];

  const summaries = await Promise.all(
    profiles.map(async (profile) => ({
      ...profile,
      contribution: await getContributionSummary(profile.id),
    }))
  );

  return summaries
    .map((profile) => ({
      ...profile,
      temples_added: profile.contribution.approvedTempleCount,
      edits_made: profile.contribution.approvedEditCount,
      photos_added: profile.contribution.approvedPhotoCount,
      rejected_count: profile.contribution.rejectedCount,
      score: profile.contribution.score,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.temples_added !== a.temples_added) return b.temples_added - a.temples_added;
      if (b.edits_made !== a.edits_made) return b.edits_made - a.edits_made;
      return b.photos_added - a.photos_added;
    });
}
