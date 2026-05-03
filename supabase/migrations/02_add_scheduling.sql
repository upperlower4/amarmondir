ALTER TABLE public.notifications ADD COLUMN scheduled_for TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.notifications ADD COLUMN expires_at TIMESTAMPTZ;
