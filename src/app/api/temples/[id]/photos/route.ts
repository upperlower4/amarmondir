import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase';
import { safeJsonStringify } from '@/lib/utils';

async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) return { error: 'Unauthorized' } as const;
  const authClient = createClient(process.env['NEXT_PUBLIC_SUPABASE_URL'] as string, process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string, {
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
    const admin = getSupabaseAdmin();

    const { data, error } = await admin.from('temple_photos').insert({
      temple_id: id,
      url: body?.url,
      caption: body?.caption || null,
      credit_name: body?.creditName || null,
      profile_id: auth.user.id,
      photo_type: body?.photoType === 'cover' ? 'cover' : 'gallery',
      status: 'pending',
      is_cover_requested: Boolean(body?.setAsCover),
    }).select().single();

    if (error) throw error;

    await admin.from('temple_contributors').insert({
      temple_id: id,
      profile_id: auth.user.id,
      contribution_type: 'photo',
    });

    return NextResponse.json({ success: true, photo: data });
  } catch (error: any) {
    console.error('Temple photo submit error:', safeJsonStringify(error));
    return NextResponse.json({ error: error?.message || 'Failed to submit photo' }, { status: 500 });
  }
}
