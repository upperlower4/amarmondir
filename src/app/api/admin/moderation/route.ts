import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase';
import { safeJsonStringify } from '@/lib/utils';
import { syncProfileStats } from '@/lib/contribution';

async function getAdminUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) return { error: 'Unauthorized' } as const;
  const authClient = createClient(process.env['NEXT_PUBLIC_SUPABASE_URL'] as string, process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string, {
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
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 });

    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { entity, action, id, ids = [], note } = body;
    const targetIds = ids.length ? ids : [id].filter(Boolean);

    if (entity === 'temple') {
      if (action === 'approve' || action === 'reject') {
        const status = action === 'approve' ? 'approved' : 'rejected';
        const { data: templesData } = await admin.from('temples').select('id, slug, created_by').in('id', targetIds);
        
        const { error } = await admin.from('temples').update({ status }).in('id', targetIds);
        if (error) throw error;

        for (const t of templesData || []) {
          if (action === 'approve') {
            if (t.created_by) {
              await admin.from('temple_contributors').upsert({
                temple_id: t.id,
                profile_id: t.created_by,
                contribution_type: 'original',
              }, { onConflict: 'temple_id, profile_id, contribution_type' as any });
            }
            
            // Ping IndexNow (Bing) when approved
            if (t.slug) {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.amarmondir.com';
              const urlToSubmit = `${baseUrl}/temple/${t.slug}`;
              const indexNowKey = '0357fa7ab2a145be93537558a14ad7fd';
              const host = baseUrl.replace(/^https?:\/\//, '').split('/')[0];
              try {
                await fetch('https://api.indexnow.org/IndexNow', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    host: host,
                    key: indexNowKey,
                    keyLocation: `${baseUrl}/${indexNowKey}.txt`,
                    urlList: [urlToSubmit],
                  }),
                });
              } catch (err) {
                console.error('Failed to notify IndexNow:', err);
              }
            }
          }
          if (t.created_by) {
            await syncProfileStats(t.created_by);
          }
        }
      }
 else if (action === 'feature') {
        const { error } = await admin.from('temples').update({ is_featured: true }).in('id', targetIds);
        if (error) throw error;
      } else if (action === 'unfeature') {
        const { error } = await admin.from('temples').update({ is_featured: false }).in('id', targetIds);
        if (error) throw error;
      } else if (action === 'soft_delete') {
        const { error } = await admin.from('temples').update({ deleted_at: new Date().toISOString(), deleted_by: auth.user.id }).in('id', targetIds);
        if (error) throw error;
      } else if (action === 'restore') {
        const { error } = await admin.from('temples').update({ deleted_at: null, deleted_by: null }).in('id', targetIds);
        if (error) throw error;
      }
    }

    if (entity === 'edit') {
      const { data: edits } = await admin.from('temple_edits').select('id, temple_id, profile_id, suggested_data, temple:temples(slug)').in('id', targetIds);
      if (action === 'approve' || action === 'reject') {
        const mappedStatus = action === 'approve' ? 'approved' : 'rejected';
        for (const edit of edits || []) {
          if (action === 'approve') {
            const suggested = edit.suggested_data || {};
            const cleaned = Object.fromEntries(Object.entries(suggested).filter(([k]) => !['duplicate_hint'].includes(k)));
            await admin.from('temples').update(cleaned).eq('id', edit.temple_id);
            
            // Add as contributor
            const { data: existingContrib } = await admin
              .from('temple_contributors')
              .select('id')
              .eq('temple_id', edit.temple_id)
              .eq('profile_id', edit.profile_id)
              .eq('contribution_type', 'edit')
              .maybeSingle();
              
            if (!existingContrib) {
              await admin.from('temple_contributors').insert({
                temple_id: edit.temple_id,
                profile_id: edit.profile_id,
                contribution_type: 'edit',
              });
            }

            // Ping IndexNow (Bing) when edit approved
            const slug = (edit.temple as any)?.slug;
            if (slug) {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.amarmondir.com';
              const urlToSubmit = `${baseUrl}/temple/${slug}`;
              const indexNowKey = '0357fa7ab2a145be93537558a14ad7fd';
              const host = baseUrl.replace(/^https?:\/\//, '').split('/')[0];
              try {
                await fetch('https://api.indexnow.org/IndexNow', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    host: host,
                    key: indexNowKey,
                    keyLocation: `${baseUrl}/${indexNowKey}.txt`,
                    urlList: [urlToSubmit],
                  }),
                });
              } catch (err) {
                console.error('Failed to notify IndexNow:', err);
              }
            }
          }
          
          if (edit.profile_id) {
            await syncProfileStats(edit.profile_id);
          }
        }
        const { error } = await admin.from('temple_edits').update({ status: mappedStatus, moderator_note: note || null }).in('id', targetIds);
        if (error) throw error;
      }
    }

    if (entity === 'report') {
      const mappedStatus = action === 'resolve' ? 'resolved' : action === 'reject' ? 'rejected' : 'reviewed';
      const { error } = await admin.from('temple_reports').update({ status: mappedStatus, moderator_note: note || null }).in('id', targetIds);
      if (error) throw error;
    }

    if (entity === 'photo') {
      if (action === 'approve' || action === 'reject') {
        const status = action === 'approve' ? 'approved' : 'rejected';
        const { data: photosData } = await admin.from('temple_photos').select('id, temple_id, profile_id').in('id', targetIds);
        
        const { error } = await admin.from('temple_photos').update({ status }).in('id', targetIds);
        if (error) throw error;

        for (const photo of photosData || []) {
          if (action === 'approve' && photo.profile_id) {
            await admin.from('temple_contributors').upsert({
              temple_id: photo.temple_id,
              profile_id: photo.profile_id,
              contribution_type: 'photo',
            }, { onConflict: 'temple_id, profile_id, contribution_type' as any });
          }
          if (photo.profile_id) {
            await syncProfileStats(photo.profile_id);
          }
        }
      } else if (action === 'set_cover') {
        const { data: photo } = await admin.from('temple_photos').select('id, temple_id, url').eq('id', targetIds[0]).single();
        if (photo) {
          await admin.from('temples').update({ cover_image: photo.url }).eq('id', photo.temple_id);
          await admin.from('temple_photos').update({ is_cover_requested: false, status: 'approved' }).eq('id', photo.id);
        }
      }
    }

    if (entity === 'user') {
      if (action === 'suspend' || action === 'ban') {
        const { error } = await admin.from('profiles').update({ is_suspended: true, suspension_reason: note || action }).in('id', targetIds);
        if (error) throw error;
      } else if (action === 'unsuspend') {
        const { error } = await admin.from('profiles').update({ is_suspended: false, suspension_reason: null }).in('id', targetIds);
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin moderation error:', safeJsonStringify(error));
    return NextResponse.json({ error: error?.message || 'Moderation failed' }, { status: 500 });
  }
}
