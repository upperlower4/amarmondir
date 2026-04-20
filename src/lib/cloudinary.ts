import { v2 as cloudinary } from 'cloudinary';
import { safeJsonStringify } from '@/lib/utils';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  file: string, // base64 string
  folder: string,
  targetSizeKB: number
) => {
  try {
    // Cloudinary manages optimization via transformations
    // We targeting specific sizes by adjusting quality and fetching the result
    const result = await cloudinary.uploader.upload(file, {
      folder,
      format: 'webp',
      transformation: [
        { quality: 'auto:best' }, // Cloudinary will try to optimize
      ],
    });

    return result.secure_url;
  } catch (error: any) {
    console.error('Cloudinary upload error:', safeJsonStringify(error));
    throw new Error('Image upload failed');
  }
};

export default cloudinary;
