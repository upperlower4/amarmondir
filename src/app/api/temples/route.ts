import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { cleanValues, slug, urls } = body;

    const adminClient = getSupabaseAdmin();

    // 1. Insert Temple
    const { data: temple, error: templeError } = await adminClient
      .from('temples')
      .insert({
        ...cleanValues,
        slug,
        cover_image: urls.cover || null,
        created_by: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (templeError) throw templeError;

    // 2. Insert Gallery Photos
    if (urls.gallery && urls.gallery.length > 0) {
      const { error: photoError } = await adminClient.from('temple_photos').insert(
        urls.gallery.map((url: string) => ({
          temple_id: temple.id,
          url,
          photo_type: 'gallery'
        }))
      );
      if (photoError) console.error('Photo insert error', String(photoError?.message || photoError));
    }

    // 3. Add Contributor Credit
    const { error: contributorError } = await adminClient.from('temple_contributors').insert({
      temple_id: temple.id,
      profile_id: user.id,
      contribution_type: 'original'
    });
    if (contributorError) console.error('Contributor insert error', String(contributorError?.message || contributorError));

    return NextResponse.json({ success: true, temple });
  } catch (err: any) {
    console.error('Temple API Error:', String(err?.message || err));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
