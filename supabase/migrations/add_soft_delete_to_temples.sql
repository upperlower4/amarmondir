-- Migration script for soft delete
ALTER TABLE public.temples ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.temples ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE OR REPLACE VIEW public.active_temples AS
SELECT * FROM public.temples WHERE deleted_at IS NULL;
