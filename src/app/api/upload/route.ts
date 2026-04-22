import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

cloudinary.config({
  cloud_name: process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'] as string,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = new Set(['cover', 'gallery', 'avatar']);
const ALLOWED_FOLDERS = new Set(['amarmondir/covers', 'amarmondir/gallery', 'amarmondir/avatars']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const UPLOAD_CONFIG = {
  cover: { width: 1920, crop: 'limit', minKB: 80, maxKB: 120, quality: 74 },
  gallery: { width: 1200, crop: 'limit', minKB: 50, maxKB: 80, quality: 70 },
  avatar: { width: 160, height: 160, crop: 'fill', gravity: 'face', minKB: 5, maxKB: 10, quality: 50 },
} as const;

function getMimeFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  return match?.[1]?.toLowerCase() || null;
}

function getApproxBytesFromDataUrl(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.floor((base64.length * 3) / 4);
}

function buildTransformation(type: keyof typeof UPLOAD_CONFIG, quality: number) {
  const config = UPLOAD_CONFIG[type] as any;
  return [
    {
      width: config.width,
      ...(config.height ? { height: config.height } : {}),
      crop: config.crop,
      ...(config.gravity ? { gravity: config.gravity } : {}),
      quality,
      fetch_format: 'webp',
    },
  ];
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] as string;
    const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    const body = await req.json();
    const { image, folder, type } = body || {};

    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET || !process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME']) {
      return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
    }

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!type || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    if (!folder || !ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: 'Invalid upload folder' }, { status: 400 });
    }

    const expectedFolderByType = {
      cover: 'amarmondir/covers',
      gallery: 'amarmondir/gallery',
      avatar: 'amarmondir/avatars',
    } as const;

    if (expectedFolderByType[type as keyof typeof expectedFolderByType] !== folder) {
      return NextResponse.json({ error: 'Folder does not match upload type' }, { status: 400 });
    }

    const mime = getMimeFromDataUrl(image);
    if (!mime || !ALLOWED_MIME_TYPES.has(mime)) {
      return NextResponse.json({ error: 'Only JPG, PNG, or WEBP image uploads are allowed' }, { status: 400 });
    }

    const approxBytes = getApproxBytesFromDataUrl(image);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large. Max 8MB allowed.' }, { status: 400 });
    }

    const config = UPLOAD_CONFIG[type as keyof typeof UPLOAD_CONFIG];
    let selectedQuality: number = config.quality;
    let selectedResult: any = null;

    const qualityAttempts = [config.quality, config.quality - 8, config.quality - 14, config.quality - 20, config.quality - 26].filter((value) => value > 18);

    for (const quality of qualityAttempts) {
      const result = await cloudinary.uploader.upload(image, {
        folder,
        transformation: buildTransformation(type, quality),
        format: 'webp',
        resource_type: 'image',
      });

      selectedQuality = quality;
      selectedResult = result;

      const bytes = Number(result.bytes || 0);
      if (!bytes || bytes <= config.maxKB * 1024) {
        break;
      }
    }

    if (!selectedResult?.secure_url) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({
      url: selectedResult.secure_url,
      format: 'webp',
      quality: selectedQuality,
      sizeKB: selectedResult?.bytes ? Math.round(selectedResult.bytes / 1024) : null,
      targetKB: `${config.minKB}-${config.maxKB}`,
    });
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    console.error('Upload error detail:', errorMessage);
    return NextResponse.json({ error: `Upload failed: ${errorMessage}` }, { status: 500 });
  }
}
