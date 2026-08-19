import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Upload image to Cloudinary
export async function uploadImage(
  file: string | Buffer,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'image' | 'raw' | 'video' | 'auto';
  } = {}
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/png;base64,${file.toString('base64')}`,
    {
      folder: options.folder || 'elite-pro-capital',
      public_id: options.public_id,
      resource_type: options.resource_type || 'auto',
    }
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

// Upload PDF to Cloudinary
export async function uploadPDF(
  file: string | Buffer,
  options: {
    folder?: string;
    public_id?: string;
  } = {}
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:application/pdf;base64,${file.toString('base64')}`,
    {
      folder: options.folder || 'elite-pro-capital/documents',
      public_id: options.public_id,
      resource_type: 'raw',
    }
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

// Delete from Cloudinary
export async function deleteAsset(publicId: string, resourceType: 'image' | 'raw' = 'image'): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

// Generate optimized image URL
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}
): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: 'fill',
        quality: options.quality || 'auto',
        format: options.format || 'auto',
      },
    ],
  });
}
