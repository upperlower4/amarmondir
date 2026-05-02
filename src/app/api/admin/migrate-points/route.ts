import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const admin = getSupabaseAdmin();
  const sql = `
ALTER TABLE public.temples ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;
ALTER TABLE public.temple_edits ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;
ALTER TABLE public.temple_photos ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS points_temple_add INTEGER DEFAULT 10;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS points_edit_approved INTEGER DEFAULT 5;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS points_photo_approved INTEGER DEFAULT 2;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS points_rejection_penalty INTEGER DEFAULT 5;

UPDATE public.temples SET points_awarded = 10 WHERE status = 'approved' AND points_awarded = 0;
UPDATE public.temple_edits SET points_awarded = 5 WHERE status = 'approved' AND points_awarded = 0;
UPDATE public.temple_photos SET points_awarded = 2 WHERE status = 'approved' AND points_awarded = 0;

UPDATE public.temples SET points_awarded = -5 WHERE status = 'rejected' AND points_awarded = 0;
UPDATE public.temple_edits SET points_awarded = -5 WHERE status = 'rejected' AND points_awarded = 0;
UPDATE public.temple_photos SET points_awarded = -5 WHERE status = 'rejected' AND points_awarded = 0;
  `;
  const { error } = await admin.rpc('exec_sql', { sql });
  return NextResponse.json({ success: true, error });
}
