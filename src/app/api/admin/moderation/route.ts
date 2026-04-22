import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase';
import { safeJsonStringify } from '@/lib/utils';
import { syncProfileStats } from '@/lib/contribution';

async function getAdminUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) return { error: 'Unauthorized' } as const;

  const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return { error: 'Invalid token' } as const;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return { error: 'Forbidden' } as const;

  return { user } as const;
}

export async function POST(req: Request) {
  try {
    const auth = await getAdminUser(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 });
    }

    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { entity, action, id } = body || {};

    if (!entity || !action || !id) {
      return NextResponse.json({ error: 'Missing moderation payload' }, { status: 400 });
    }

    if (entity === 'temple') {
      const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : null;
      if (!status) return NextResponse.json({ error: 'Invalid temple action' }, { status: 400 });

      const { data: templeBefore } = await admin.from('temples').select('id, created_by').eq('id', id).single();
      const { error } = await admin.from('temples').update({ status }).eq('id', id);
      if (error) throw error;

      if (templeBefore?.created_by) {
        if (status === 'approved') {
          await admin.from('temple_contributors').upsert({
            temple_id: templeBefore.id,
            profile_id: templeBefore.created_by,
            contribution_type: 'original',
          }, { onConflict: 'temple_id, profile_id, contribution_type' as any });
        }
        await syncProfileStats(templeBefore.created_by);
      }
    }

    if (entity === 'edit') {
      const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : null;
      if (!status) return NextResponse.json({ error: 'Invalid edit action' }, { status: 400 });

      const { data: edit } = await admin
        .from('temple_edits')
        .select('id, temple_id, profile_id, suggested_data')
        .eq('id', id)
        .single();

      if (!edit) {
        return NextResponse.json({ error: 'Edit request not found' }, { status: 404 });
      }

      if (status === 'approved') {
        const suggested = edit.suggested_data || {};
        await admin.from('temples').update(suggested).eq('id', edit.temple_id);
        await admin.from('temple_contributors').upsert({
          temple_id: edit.temple_id,
          profile_id: edit.profile_id,
          contribution_type: 'edit',
        }, { onConflict: 'temple_id, profile_id, contribution_type' as any });
      }

      const { error } = await admin.from('temple_edits').update({ status }).eq('id', id);
      if (error) throw error;

      if (edit.profile_id) {
        await syncProfileStats(edit.profile_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin moderation error:', safeJsonStringify(error));
    return NextResponse.json({ error: error?.message || 'Moderation failed' }, { status: 500 });
  }
}
