import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('amarmondir-auth-token')?.value;

  if (!token) {
    redirect('/');
  }

  // Double check admin status on server to prevent UI render bypass
  const admin = getSupabaseAdmin();
  
  // Verify token and get user ID
  const { data: { user }, error } = await admin.auth.getUser(token);
  
  if (error || !user) {
    redirect('/');
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/');
  }

  return <>{children}</>;
}
