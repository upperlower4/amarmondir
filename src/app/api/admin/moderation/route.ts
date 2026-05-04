import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase';
import { safeJsonStringify } from '@/lib/utils';
import { syncProfileStats } from '@/lib/contribution';
import { createNotification } from '@/lib/push-utils';

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

    // Fetch settings to know how many points to award/deduct
    const { data: settings } = await admin.from('app_settings').select('*').single();
    const pTempleAdd = settings?.points_temple_add ?? 10;
    const pEditApprove = settings?.points_edit_approved ?? 5;
    const pPhotoApprove = settings?.points_photo_approved ?? 2;
    const pPenalty = settings?.points_rejection_penalty ?? 5;

    if (entity === 'temple') {
      if (action === 'approve' || action === 'reject') {
        const status = action === 'approve' ? 'approved' : 'rejected';
        const points_awarded = action === 'approve' ? pTempleAdd : -pPenalty;
        
        const { data: templesData } = await admin.from('temples').select('id, slug, created_by').in('id', targetIds);
        
        const { error } = await admin.from('temples').update({ status, points_awarded, moderation_reason: note }).in('id', targetIds);
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
            
            const title = action === 'approve' ? 'মন্দির অ্যাপ্রুভ হয়েছে!' : 'মন্দির রিজেক্ট হয়েছে';
            const body = action === 'approve' 
              ? `আপনার দেওয়া মন্দিরটি অ্যাপ্রুভ করা হয়েছে।` 
              : `আপনার দেওয়া মন্দিরটি রিজেক্ট হয়েছে। কারণ: ${note || 'অজানা'}`;
            
            await createNotification([t.created_by], title, body, 'system', action === 'approve' ? `/temple/${t.slug}` : undefined);
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
        const { data: templesToDel } = await admin.from('temples').select('id, created_by').in('id', targetIds);
        const { data: editsToDel } = await admin.from('temple_edits').select('profile_id').in('temple_id', targetIds);
        const { data: photosToDel } = await admin.from('temple_photos').select('profile_id').in('temple_id', targetIds);
        
        const affectedProfiles = new Set<string>();
        templesToDel?.forEach(t => t.created_by && affectedProfiles.add(t.created_by));
        editsToDel?.forEach(e => e.profile_id && affectedProfiles.add(e.profile_id));
        photosToDel?.forEach(p => p.profile_id && affectedProfiles.add(p.profile_id));

        const { error } = await admin.from('temples').update({ deleted_at: new Date().toISOString(), deleted_by: auth.user.id }).in('id', targetIds);
        if (error) throw error;
        
        for (const uid of Array.from(affectedProfiles)) {
          await syncProfileStats(uid);
        }
      } else if (action === 'restore') {
        const { data: templesToRes } = await admin.from('temples').select('id, created_by').in('id', targetIds);
        const { data: editsToRes } = await admin.from('temple_edits').select('profile_id').in('temple_id', targetIds);
        const { data: photosToRes } = await admin.from('temple_photos').select('profile_id').in('temple_id', targetIds);

        const affectedProfiles = new Set<string>();
        templesToRes?.forEach(t => t.created_by && affectedProfiles.add(t.created_by));
        editsToRes?.forEach(e => e.profile_id && affectedProfiles.add(e.profile_id));
        photosToRes?.forEach(p => p.profile_id && affectedProfiles.add(p.profile_id));

        const { error } = await admin.from('temples').update({ deleted_at: null, deleted_by: null }).in('id', targetIds);
        if (error) throw error;
        
        for (const uid of Array.from(affectedProfiles)) {
          await syncProfileStats(uid);
        }
      }
    }

    if (entity === 'edit') {
      const { data: edits } = await admin.from('temple_edits').select('id, temple_id, profile_id, suggested_data, temple:temples(slug)').in('id', targetIds);
      if (action === 'approve' || action === 'reject') {
        const mappedStatus = action === 'approve' ? 'approved' : 'rejected';
        const points_awarded = action === 'approve' ? pEditApprove : -pPenalty;
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
            
            const slug = (edit.temple as any)?.slug;
            const title = action === 'approve' ? 'এডিট অ্যাপ্রুভ হয়েছে!' : 'এডিট রিজেক্ট হয়েছে';
            const body = action === 'approve' 
              ? `আপনার দেওয়া এডিট রিকোয়েস্টটি অ্যাপ্রুভ করা হয়েছে। ধন্যবাদ!` 
              : `আপনার দেওয়া এডিট রিকোয়েস্টটি রিজেক্ট হয়েছে। কারণ: ${note || 'অজানা'}`;
            
            await createNotification([edit.profile_id], title, body, 'system', action === 'approve' && slug ? `/temple/${slug}` : undefined);
          }
        }
        const { error } = await admin.from('temple_edits').update({ status: mappedStatus, points_awarded, moderator_note: note || null }).in('id', targetIds);
        if (error) throw error;
      }
    }

    if (entity === 'report') {
      const mappedStatus = action === 'resolve' ? 'resolved' : action === 'reject' ? 'rejected' : 'reviewed';
      const { data: reportsData } = await admin.from('temple_reports').select('id, temple_id, profile_id').in('id', targetIds);
      
      const { error } = await admin.from('temple_reports').update({ status: mappedStatus, moderator_note: note || null }).in('id', targetIds);
      if (error) throw error;

      for (const report of reportsData || []) {
        if (report.profile_id) {
          const { data: templeInfo } = await admin.from('temples').select('slug').eq('id', report.temple_id).single();
          const slug = templeInfo?.slug;
          
          const title = 'রিপোর্ট আপডেট';
          const body = action === 'resolve' 
            ? `আপনার রিপোর্টটি সমাধান করা হয়েছে।` 
            : action === 'reject'
              ? `আপনার রিপোর্টটি বাতিল করা হয়েছে। কারণ: ${note || 'প্রযোজ্য নয়'}`
              : `আপনার রিপোর্টটি রিভিউ করা হয়েছে।`;
          
          await createNotification([report.profile_id], title, body, 'system', slug ? `/temple/${slug}` : undefined);
        }
      }
    }

    if (entity === 'photo') {
      if (action === 'approve' || action === 'reject') {
        const status = action === 'approve' ? 'approved' : 'rejected';
        const points_awarded = action === 'approve' ? pPhotoApprove : -pPenalty;
        const { data: photosData } = await admin.from('temple_photos').select('id, temple_id, profile_id').in('id', targetIds);
        
        const { error } = await admin.from('temple_photos').update({ status, points_awarded }).in('id', targetIds);
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
            const { data: templeInfo } = await admin.from('temples').select('slug').eq('id', photo.temple_id).single();
            const slug = templeInfo?.slug;
            
            const title = action === 'approve' ? 'ছবি অ্যাপ্রুভ হয়েছে!' : 'ছবি রিজেক্ট হয়েছে';
            const body = action === 'approve' 
              ? `আপনার আপলোড করা ছবিটি অ্যাপ্রুভ করা হয়েছে। ধন্যবাদ!` 
              : `আপনার আপলোড করা ছবিটি রিজেক্ট হয়েছে। কারণ: ${note || 'উপযুক্ত না'}`;
            
            await createNotification([photo.profile_id], title, body, 'system', action === 'approve' && slug ? `/temple/${slug}` : undefined);
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
