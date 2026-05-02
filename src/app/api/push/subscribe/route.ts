import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// We need the user's ID, which we can get via token or session
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    
    // We can also extract cookies if they use that, but token header is safe
    // Since it's a client call, maybe it passes the session token or we use supabase auth
    // Let's rely on standard Supabase auth cookie for next server if possible, or Bearer token
    let userId = null;

    if (token) {
      const authClient = createClient(process.env['NEXT_PUBLIC_SUPABASE_URL'] as string, process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data } = await authClient.auth.getUser();
      userId = data.user?.id;
    } else {
       // if they using cookie auth, they would use the route handler from next/server
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await req.json();

    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from('push_subscriptions')
      .upsert({ user_id: userId, subscription }, { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
