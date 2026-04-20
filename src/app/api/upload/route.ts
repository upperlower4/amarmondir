import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const { image, folder, type } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Set target sizes based on type
    // Cover: 80-120KB, Gallery: 50-80KB, Avatar: 10KB
    let transformation = '';
    if (type === 'cover') {
        // Broadly targeting the size range with quality and width
        transformation = 'w_1920,c_limit,q_auto:best,f_webp';
    } else if (type === 'gallery') {
        transformation = 'w_1200,c_limit,q_auto:best,f_webp';
    } else {
        transformation = 'w_200,h_200,c_fill,q_auto:eco,f_webp';
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: folder || 'amarmondir/general',
      transformation: transformation,
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error: any) {
    console.error('Upload error:', String(error?.message || error));
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
