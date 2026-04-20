-- amarmondir Database Schema

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  temples_added INTEGER DEFAULT 0,
  edits_made INTEGER DEFAULT 0,
  badge TEXT DEFAULT 'নতুন অবদানকারী',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Temples Table
CREATE TABLE temples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  english_name TEXT NOT NULL,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  deity TEXT,
  temple_type TEXT NOT NULL,
  established_year TEXT,
  open_hours TEXT,
  short_bio TEXT,
  cover_image TEXT,
  map_link TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  address TEXT NOT NULL,
  article_content TEXT, -- Long form details
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Temple Photos (Gallery)
CREATE TABLE temple_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  temple_id UUID REFERENCES temples(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'gallery' CHECK (photo_type IN ('cover', 'gallery')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Temple Contributors (Tracking who helped)
CREATE TABLE temple_contributors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  temple_id UUID REFERENCES temples(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contribution_type TEXT DEFAULT 'original' CHECK (contribution_type IN ('original', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Temple Edits (Moderation Queue for Suggestions)
CREATE TABLE temple_edits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  temple_id UUID REFERENCES temples(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  suggested_data JSONB NOT NULL, -- The fields Being updated
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderator_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Temple Festivals
CREATE TABLE temple_festivals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  temple_id UUID REFERENCES temples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  date_info TEXT, -- e.g. "Bengali month Falgun"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Temple Tags
CREATE TABLE temple_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  temple_id UUID REFERENCES temples(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);

-- 8. Leaderboard View (Optional but efficient)
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  temples_added,
  edits_made,
  badge
FROM profiles
ORDER BY temples_added DESC, edits_made DESC;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE temples ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Anyone can view, only owner can edit
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Temples: Anyone can view approved, only admins can view all, users can create
CREATE POLICY "Approved temples are viewable by everyone" ON temples FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can see all temples" ON temples FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Logged in users can insert temples" ON temples FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Photos: Viewable if temple is approved or user is admin
CREATE POLICY "Photos viewable if temple approved" ON temple_photos FOR SELECT USING (EXISTS (SELECT 1 FROM temples WHERE id = temple_id AND status = 'approved'));
CREATE POLICY "Users can insert photos" ON temple_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Contributors: Viewable by anyone
CREATE POLICY "Contributors viewable by everyone" ON temple_contributors FOR SELECT USING (true);

-- Edits: Only admins can see all, users can see own
CREATE POLICY "Users can see own edits" ON temple_edits FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Admins see all edits" ON temple_edits FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Users can suggest edits" ON temple_edits FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Functions & Triggers

-- Handle Badge Updates (Simple logic)
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles 
    SET temples_added = temples_added + 1,
        badge = CASE 
          WHEN temples_added + 1 >= 10 THEN 'মন্দির রক্ষক'
          WHEN temples_added + 1 >= 5 THEN 'নিবেদিত অবদানকারী'
          WHEN temples_added + 1 >= 2 THEN 'উদীয়মান অবদানকারী'
          ELSE 'নতুন অবদানকারী'
        END
    WHERE id = NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_temple_approved
AFTER UPDATE ON temples
FOR EACH ROW
WHEN (OLD.status = 'pending' AND NEW.status = 'approved')
EXECUTE FUNCTION update_user_stats();

-- Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(CAST(NEW.id AS TEXT), 1, 4),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
