import webpush from 'web-push';
import { getSupabaseAdmin } from '@/lib/supabase';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:joymkrishna@gmail.com', // fallback mail
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function checkRateLimit(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const today = new Date().toISOString().split('T')[0];

  const { data: settings } = await admin.from('app_settings').select('push_rate_limit').single();
  const maxLimit = settings?.push_rate_limit || 5;

  const { data, error } = await admin
    .from('push_logs')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    return false; // Error other than not found
  }

  if (data && data.count >= maxLimit) {
    return false; // Exhausted
  }

  return true;
}

export async function incrementPushCount(userId: string) {
  const admin = getSupabaseAdmin();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await admin
    .from('push_logs')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (error && error.code === 'PGRST116') {
    // Insert new
    await admin.from('push_logs').insert({ user_id: userId, date: today, count: 1 });
  } else if (data) {
    // Update
    await admin.from('push_logs').update({ count: data.count + 1 }).eq('user_id', userId).eq('date', today);
  }
}

export async function sendPushToUser(userId: string, title: string, body: string, url?: string) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not set. Skipping push.');
    return;
  }

  const canSend = await checkRateLimit(userId);
  if (!canSend) return;

  const admin = getSupabaseAdmin();
  const { data: subData } = await admin
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
    .single();

  if (subData?.subscription) {
    try {
      await webpush.sendNotification(
        subData.subscription,
        JSON.stringify({ title, body, url: url || '/' })
      );
      await incrementPushCount(userId);
    } catch (err: any) {
      if (err.statusCode === 410) {
         // Gone - remove subscription
         await admin.from('push_subscriptions').delete().eq('user_id', userId);
      }
      console.error('Error sending push notification', err);
    }
  }
}

export async function sendPushToAll(title: string, body: string, url?: string) {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const admin = getSupabaseAdmin();
  // We need chunks in production, but let's do a simple one for now.
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('user_id, subscription')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (!subs || subs.length === 0) {
      hasMore = false;
      break;
    }

    for (const sub of subs) {
      const canSend = await checkRateLimit(sub.user_id);
      if (canSend) {
        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({ title, body, url: url || '/' })
          );
          await incrementPushCount(sub.user_id);
        } catch (err: any) {
          if (err.statusCode === 410) {
            await admin.from('push_subscriptions').delete().eq('user_id', sub.user_id);
          }
        }
      }
    }
    page++;
  }
}

export async function createNotification(
  userIds: string[] | 'all',
  title: string,
  body: string,
  type: string = 'system',
  url?: string,
  sendPush: boolean = true
) {
  const admin = getSupabaseAdmin();
  
  // 1. Create the notification entity
  const { data: notifData, error: notifError } = await admin
    .from('notifications')
    .insert({ title, body, type, url })
    .select()
    .single();

  if (notifError || !notifData) {
    console.error('Error creating notification', notifError);
    return;
  }

  // 2. Link to users
  if (userIds === 'all') {
    // In a real large app, this might be a background job.
    // For now, we fetch all profiles.
    let page = 0;
    while (true) {
      const { data: profiles } = await admin.from('profiles').select('id').range(page * 1000, (page + 1) * 1000 - 1);
      if (!profiles || profiles.length === 0) break;
      
      const userNotifs = profiles.map(p => ({
        user_id: p.id,
        notification_id: notifData.id
      }));
      await admin.from('user_notifications').insert(userNotifs);
      page++;
    }
    
    if (sendPush) {
      await sendPushToAll(title, body, url);
    }
    
  } else if (Array.isArray(userIds) && userIds.length > 0) {
    const userNotifs = userIds.map(id => ({
      user_id: id,
      notification_id: notifData.id
    }));
    await admin.from('user_notifications').insert(userNotifs);

    if (sendPush) {
      for (const uid of userIds) {
        await sendPushToUser(uid, title, body, url);
      }
    }
  }
}
