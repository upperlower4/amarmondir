-- Phase 2 moderation, reporting, gallery, contributor, SEO support

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE temples
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

ALTER TABLE temple_photos
  ADD COLUMN IF NOT EXISTS caption TEXT,
  ADD COLUMN IF NOT EXISTS credit_name TEXT,
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS is_cover_requested BOOLEAN DEFAULT FALSE;

ALTER TABLE temple_contributors DROP CONSTRAINT IF EXISTS temple_contributors_contribution_type_check;
ALTER TABLE temple_contributors
  ADD CONSTRAINT temple_contributors_contribution_type_check
  CHECK (contribution_type IN ('original', 'edit', 'photo'));

CREATE TABLE IF NOT EXISTS temple_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  temple_id UUID REFERENCES temples(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  related_photo_id UUID REFERENCES temple_photos(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL DEFAULT 'incorrect_info' CHECK (report_type IN ('incorrect_info', 'wrong_photo', 'duplicate', 'other')),
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
  moderator_note TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS temple_edit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  temple_id UUID REFERENCES temples(id) ON DELETE CASCADE,
  edit_id UUID REFERENCES temple_edits(id) ON DELETE SET NULL,
  previous_data JSONB,
  approved_data JSONB,
  moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE temple_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_edit_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins manage temple reports" ON temple_reports FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users insert temple reports" ON temple_reports FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read edit history" ON temple_edit_history FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_temples_title_district ON temples (lower(title), lower(district));
CREATE INDEX IF NOT EXISTS idx_temples_slug ON temples (lower(slug));
CREATE INDEX IF NOT EXISTS idx_temples_featured ON temples (is_featured);
CREATE INDEX IF NOT EXISTS idx_temples_deleted_at ON temples (deleted_at);
CREATE INDEX IF NOT EXISTS idx_temple_reports_status ON temple_reports (status, created_at);
CREATE INDEX IF NOT EXISTS idx_temple_edits_status ON temple_edits (status, created_at);
CREATE INDEX IF NOT EXISTS idx_temple_photos_status ON temple_photos (status, created_at);
