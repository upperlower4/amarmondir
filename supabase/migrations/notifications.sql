-- Migration script for Advanced Notification System

-- 1. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id SERIAL PRIMARY KEY,
    push_rate_limit INT DEFAULT 5,
    notify_on_new_temple BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row if empty
INSERT INTO public.app_settings (id, push_rate_limit, notify_on_new_temple)
VALUES (1, 5, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system',
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users only" ON public.notifications FOR READ USING (auth.role() = 'authenticated');


-- 3. User Notifications (Linking Table)
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_id)
);

-- Enable RLS and Realtime
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for users own notifications" ON public.user_notifications FOR READ USING (auth.uid() = user_id);
CREATE POLICY "Enable update for users own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);

-- Enable publication explicitly for user_notifications
begin;
  -- remove the supabase_realtime publication if it already exists, just in case, but usually we just add table
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.user_notifications;


-- 4. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for users own subscription" ON public.push_subscriptions USING (auth.uid() = user_id);

-- 5. Push Logs Table (for rate limiting)
CREATE TABLE IF NOT EXISTS public.push_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    count INT DEFAULT 1,
    UNIQUE(user_id, date)
);

-- 6. Scheduled Notifications Table
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_url TEXT,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'specific_date'
    schedule_value VARCHAR(100) NOT NULL, -- cron expression or date string
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
