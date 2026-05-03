import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createNotification } from '@/lib/push-utils';

export async function GET(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    const now = new Date();

    // Fetch active scheduled notifications
    const { data: scheduled } = await admin
      .from('scheduled_notifications')
      .select('*')
      .eq('is_active', true);

    if (!scheduled || scheduled.length === 0) {
      return NextResponse.json({ success: true, message: 'No active scheduled notifications' });
    }

    for (const notif of (scheduled as any[])) {
      let runNow = false;
      let expiresAt: Date | null = null;

      try {
        if (notif.schedule_type === 'specific_date') {
          // Parse JSON if possible
          if (notif.schedule_value.startsWith('{')) {
            const val = JSON.parse(notif.schedule_value);
            const targetDate = new Date(val.scheduledFor);
            if (val.expiresAt) expiresAt = new Date(val.expiresAt);
            if (now >= targetDate) {
              runNow = true;
            }
          } else {
            const targetDate = new Date(notif.schedule_value);
            if (now >= targetDate) runNow = true;
          }
        }
      } catch (e) {
        console.error('Error parsing schedule value', e);
      }

      if (runNow) {
        // Create the actual notification now
        const target = notif.target_user_id ? [notif.target_user_id] : 'all';
        
        // Check expiration
        if (expiresAt && now > expiresAt) {
          // expired, just mark inactive
        } else {
           // We will store expiresAt dynamically in the URL or type?
           // Actually, if we just want it to expire in the future, we can still use the scheduled_notifications table or just let it go out. For real expiration, let's just let it be a normal notification once dispatched, but we can append ?expiresAt= to URL.
           const finalUrl = expiresAt ? `${notif.target_url || ''}?expiresAt=${expiresAt.toISOString()}` : notif.target_url;
           await createNotification(target, notif.title, notif.body, 'system', finalUrl);
        }

        // Mark as processed
        await admin.from('scheduled_notifications').update({
          is_active: false,
          last_sent_at: now.toISOString()
        }).eq('id', notif.id);
      }
    }

    return NextResponse.json({ success: true, processed: scheduled.length });
  } catch (error: any) {
    console.error('Cron process-notifications error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
