import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    let userId = null;

    if (token) {
      const authClient = createClient(process.env['NEXT_PUBLIC_SUPABASE_URL'] as string, process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data } = await authClient.auth.getUser();
      userId = data.user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // all, unread, read
    const page = parseInt(searchParams.get('page') || '0', 10);
    const pageSize = 20;

    const admin = getSupabaseAdmin();
    let query = admin
      .from('user_notifications')
      .select('id, is_read, created_at, notifications(title, body, url, type)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (filter === 'unread') {
      query = query.eq('is_read', false);
    } else if (filter === 'read') {
      query = query.eq('is_read', true);
    }

    const { data: dbData, error, count } = await query;

    if (error) throw error;

    // Format output
    const formatted = (dbData || []).map((x: any) => ({
      id: x.id,
      is_read: x.is_read,
      created_at: x.created_at,
      title: x.notifications?.title,
      body: x.notifications?.body,
      url: x.notifications?.url,
      type: x.notifications?.type
    }));

    return NextResponse.json({ notifications: formatted, count, page, hasMore: (page + 1) * pageSize < (count || 0) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    let userId = null;

    if (token) {
      const authClient = createClient(process.env['NEXT_PUBLIC_SUPABASE_URL'] as string, process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data } = await authClient.auth.getUser();
      userId = data.user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, notification_id } = await req.json();
    const admin = getSupabaseAdmin();

    if (action === 'mark_read') {
      const { error } = await admin
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('id', notification_id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
