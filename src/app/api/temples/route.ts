import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { safeJsonStringify, generateSlug, normalizeSearchText } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';
import { DISTRICTS } from '@/lib/constants';
import { UPAZILAS } from '@/lib/upazilas';

function makeTempleSlug(rawSlug: string, englishName: string) {
  const base = generateSlug(rawSlug || englishName || 'temple');
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] as string;
    const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { cleanValues, slug, urls } = body || {};

    if (!cleanValues?.title || !cleanValues?.english_name || !cleanValues?.division || !cleanValues?.district || !cleanValues?.upazila || !cleanValues?.temple_type || !cleanValues?.address) {
      return NextResponse.json({ error: 'Missing required temple fields' }, { status: 400 });
    }

    const selectedDistricts = DISTRICTS[String(cleanValues.division)] || [];
    const selectedUpazilas = UPAZILAS[String(cleanValues.district)] || [];

    if (!selectedDistricts.includes(String(cleanValues.district))) {
      return NextResponse.json({ error: 'বিভাগ অনুযায়ী সঠিক জেলা নির্বাচন করুন' }, { status: 400 });
    }

    if (!selectedUpazilas.includes(String(cleanValues.upazila))) {
      return NextResponse.json({ error: 'জেলা অনুযায়ী সঠিক উপজেলা নির্বাচন করুন' }, { status: 400 });
    }

    const adminClient = getSupabaseAdmin();

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, is_suspended')
      .eq('id', user.id)
      .maybeSingle();

    if ((profile as any)?.is_suspended) {
      return NextResponse.json({ error: 'Suspended users cannot submit temples' }, { status: 403 });
    }

    const normalizedTitle = normalizeSearchText(String(cleanValues.title));
    const normalizedEnglishName = normalizeSearchText(String(cleanValues.english_name));

    const { data: possibleDuplicates, error: duplicateError } = await adminClient
      .from('temples')
      .select('id, slug, title, english_name, district, upazila, status')
      .in('status', ['pending', 'approved']);

    if (duplicateError) throw duplicateError;

    const duplicateTemple = (possibleDuplicates || []).find((temple: any) => {
      const sameTitle = normalizeSearchText(String(temple.title || '')) === normalizedTitle;
      const sameEnglish = normalizeSearchText(String(temple.english_name || '')) === normalizedEnglishName;
      const sameLocation = String(temple.district || '').trim() === String(cleanValues.district).trim() && String(temple.upazila || '').trim() === String(cleanValues.upazila).trim();
      return (sameTitle && sameLocation) || sameEnglish;
    });

    if (duplicateTemple) {
      return NextResponse.json(
        {
          error: `সম্ভবত এই মন্দিরটি আগেই আছে: ${duplicateTemple.title}`,
          duplicateSlug: duplicateTemple.slug,
        },
        { status: 409 }
      );
    }

    const templeSlug = makeTempleSlug(String(slug || ''), String(cleanValues.english_name || ''));

    const { data: temple, error: templeError } = await adminClient
      .from('temples')
      .insert({
        ...cleanValues,
        slug: templeSlug,
        cover_image: urls?.cover || null,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (templeError) throw templeError;

    if (Array.isArray(urls?.gallery) && urls.gallery.length > 0) {
      const { error: photoError } = await adminClient.from('temple_photos').insert(
        urls.gallery.map((url: string) => ({
          temple_id: temple.id,
          url,
          photo_type: 'gallery',
        }))
      );
      if (photoError) console.error('Photo insert error', safeJsonStringify(photoError));
    }

    const { error: contributorError } = await adminClient.from('temple_contributors').insert({
      temple_id: temple.id,
      profile_id: user.id,
      contribution_type: 'original',
    });
    if (contributorError) console.error('Contributor insert error', safeJsonStringify(contributorError));

    const { data: settings } = await adminClient.from('app_settings').select('notify_on_new_temple').single();
    if (settings?.notify_on_new_temple) {
      const { data: admins } = await adminClient.from('profiles').select('id').eq('is_admin', true);
      const adminIds = admins?.map(a => a.id) || [];
      if (adminIds.length > 0) {
        const { createNotification } = await import('@/lib/push-utils');
        await createNotification(adminIds, 'নতুন মন্দির আপলোড করা হয়েছে', `"${temple.title}" মন্দিরটি রিভিউয়ের অপেক্ষায় আছে।`, 'system', '/admin');
      }
    }

    return NextResponse.json({ success: true, temple });
  } catch (err: any) {
    console.error('Temple API Error:', safeJsonStringify(err));
    return NextResponse.json({ error: err?.message || 'Temple submission failed' }, { status: 500 });
  }
}
