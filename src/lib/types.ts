export type BadgeType = 'নতুন অবদানকারী' | 'উদীয়মান অবদানকারী' | 'নিবেদিত অবদানকারী' | 'মন্দির রক্ষক';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  temples_added: number;
  edits_made: number;
  badge: BadgeType;
  is_admin: boolean;
  is_suspended?: boolean;
  suspension_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Temple {
  id: string;
  slug: string;
  title: string;
  english_name: string;
  division: string;
  district: string;
  upazila: string;
  deity: string | null;
  temple_type: string;
  established_year: string | null;
  open_hours: string | null;
  short_bio: string | null;
  cover_image: string | null;
  map_link: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string;
  article_content: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  is_featured?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
  moderation_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplePhoto {
  id: string;
  temple_id: string;
  url: string;
  photo_type: 'cover' | 'gallery';
  caption?: string | null;
  credit_name?: string | null;
  profile_id?: string | null;
  status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface TempleContributor {
  id: string;
  temple_id: string;
  profile_id: string;
  contribution_type: 'original' | 'edit' | 'photo';
  created_at: string;
  profile?: Profile;
}

export interface TempleFestival {
  id: string;
  temple_id: string;
  name: string;
  description: string | null;
  date_info: string | null;
}

export interface TempleTag {
  id: string;
  temple_id: string;
  tag: string;
}

export interface EditSuggestion {
  id: string;
  temple_id: string;
  profile_id: string;
  suggested_data: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  moderator_note: string | null;
  created_at: string;
}

export interface TempleReport {
  id: string;
  temple_id: string;
  profile_id: string | null;
  report_type: 'incorrect_info' | 'wrong_photo' | 'duplicate' | 'other';
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  created_at: string;
}
