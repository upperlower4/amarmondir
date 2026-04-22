import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase';
import { safeJsonStringify } from '@/lib/utils';

async function getUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) return { user: null };
  const authClient = createClient(process.env['NEXT_PUBLIC_SUPABASE_URL'] as string, process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await authClient.auth.getUser();
  return { user };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user } = await getUser(req);
    const body = await req.json();
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from('temple_reports').insert({
      temple_id: id,
      profile_id: user?.id || null,
      report_type: body?.reportType || 'other',
      details: body?.details || '',
      related_photo_id: body?.relatedPhotoId || null,
      status: 'pending',
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, report: data });
  } catch (error: any) {
    console.error('Temple report submit error:', safeJsonStringify(error));
    return NextResponse.json({ error: error?.message || 'Failed to report' }, { status: 500 });
  }
}
