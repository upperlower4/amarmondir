import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

cloudinary.config({
  cloud_name: process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'] as string,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = new Set(['cover', 'gallery', 'avatar']);

const FOLDER_BY_TYPE: Record<string, string> = {
  cover: 'amarmondir/covers',
  gallery: 'amarmondir/gallery',
  avatar: 'amarmondir/avatars',
};

const TRANSFORM_BY_TYPE: Record<string, string> = {
  cover: 'c_limit,w_1920,q_74,f_webp',
  gallery: 'c_limit,w_1200,q_70,f_webp',
  avatar: 'c_fill,w_160,h_160,g_face,q_50,f_webp',
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] as string;
    const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    const { type } = await req.json();
    if (!type || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    const folder = FOLDER_BY_TYPE[type];
    const transformation = TRANSFORM_BY_TYPE[type];
    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign: Record<string, any> = {
      folder,
      timestamp,
      transformation,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET as string
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      transformation,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'],
    });
  } catch (err: any) {
    console.error('Sign error:', err?.message);
    return NextResponse.json({ error: 'Signature failed' }, { status: 500 });
  }
}
