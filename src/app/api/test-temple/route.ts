import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || 'test-slug';
  
  const query = supabase
    .from('temples')
    .select('*, profiles(username, avatar_url)')
    .eq('status', 'approved')
    .limit(1);
    
  const { data, error } = await query;
  return NextResponse.json({ data, error });
}
