import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase';
import { safeJsonStringify, similarityScore } from '@/lib/utils';

async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) return { error: 'Unauthorized' } as const;

  const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return { error: 'Invalid token' } as const;
  return { user } as const;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthedUser(req);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const suggestedData = body?.suggestedData || {};

    const admin = getSupabaseAdmin();
    const { data: temple, error: templeError } = await admin.from('temples').select('*').eq('id', id).single();
    if (templeError || !temple) return NextResponse.json({ error: 'Temple not found' }, { status: 404 });

    const titleSimilarity = Math.max(similarityScore(temple.title, suggestedData.title), similarityScore(temple.english_name, suggestedData.english_name));
    const duplicateHint = titleSimilarity > 0.8 && (suggestedData.district ? suggestedData.district === temple.district : true);

    const { data, error } = await admin.from('temple_edits').insert({
      temple_id: id,
      profile_id: auth.user.id,
      suggested_data: { ...suggestedData, duplicate_hint: duplicateHint },
      status: 'pending',
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, edit: data, duplicateHint });
  } catch (error: any) {
    console.error('Temple edit submit error:', safeJsonStringify(error));
    return NextResponse.json({ error: error?.message || 'Failed to submit edit' }, { status: 500 });
  }
}
