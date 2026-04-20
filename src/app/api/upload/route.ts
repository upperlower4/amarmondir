import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = new Set(['cover', 'gallery', 'avatar']);
const ALLOWED_FOLDERS = new Set([
  'amarmondir/covers',
  'amarmondir/gallery',
  'amarmondir/avatars',
]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function getMimeFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  return match?.[1] || null;
}

function getApproxBytesFromDataUrl(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.floor((base64.length * 3) / 4);
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    const { image, folder, type } = await req.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!type || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    if (!folder || !ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: 'Invalid upload folder' }, { status: 400 });
    }

    const mime = getMimeFromDataUrl(image);
    if (!mime || !mime.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are allowed' }, { status: 400 });
    }

    const approxBytes = getApproxBytesFromDataUrl(image);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large. Max 8MB allowed.' }, { status: 400 });
    }

    let transformation = '';
    if (type === 'cover') {
      transformation = 'w_1920,c_limit,q_auto:best,f_webp';
    } else if (type === 'gallery') {
      transformation = 'w_1200,c_limit,q_auto:best,f_webp';
    } else {
      transformation = 'w_200,h_200,c_fill,q_auto:eco,f_webp';
    }

    const result = await cloudinary.uploader.upload(image, {
      folder,
      transformation,
      resource_type: 'image',
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error: any) {
    console.error('Upload error:', String(error?.message || error));
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}