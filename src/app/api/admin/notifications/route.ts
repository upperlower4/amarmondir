import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/push-utils';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const authClient = createClient(process.env['NEXT_PUBLIC_SUPABASE_URL'] as string, process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    
    const { data: userData } = await authClient.auth.getUser();
    if (!userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', userData.user.id).single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, body, url, target } = await req.json();

    if (target === 'all') {
      // Background execution for scaling could be needed but Vercel allows async if awaited
      await createNotification('all', title, body, 'system', url);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin send notification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
