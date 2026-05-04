import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase';
import { safeJsonStringify } from '@/lib/utils';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const authClient = createClient(process.env['NEXT_PUBLIC_SUPABASE_URL'] as string, process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authErr } = await authClient.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const suggestedData = body?.suggestedData || {};

    const admin = getSupabaseAdmin();
    const { data: templeData } = await admin.from('temples').select('title').eq('id', id).single();
    const { data, error } = await admin.from('temple_edits').insert({
      temple_id: id,
      profile_id: user.id,
      suggested_data: suggestedData,
      status: 'pending',
    }).select().single();

    if (error) throw error;

    // Send notification to admins
    const { data: admins } = await admin.from('profiles').select('id').eq('is_admin', true);
    const adminIds = admins?.map(a => a.id) || [];
    if (adminIds.length > 0) {
      const { createNotification } = await import('@/lib/push-utils');
      const templeTitle = templeData?.title || 'একটি নির্দিষ্ট মন্দির';
      await createNotification(adminIds, 'নতুন এডিট রিকোয়েস্ট', `"${templeTitle}" মন্দিরের জন্য একটি নতুন এডিট রিকোয়েস্ট এসেছে।`, 'system', '/admin');
    }

    return NextResponse.json({ success: true, edit: data });
  } catch (error: any) {
    console.error('Temple edit submit error:', safeJsonStringify(error));
    return NextResponse.json({ error: error?.message || 'Failed to submit edit' }, { status: 500 });
  }
}
