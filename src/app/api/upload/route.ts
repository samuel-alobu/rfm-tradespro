import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/db/models';
import { uploadImage, uploadPDF } from '@/lib/cloudinary';

// Check admin middleware
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user || !['admin', 'super_admin'].includes(user.role)) return null;
  
  return user;
}

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string; // 'image' | 'pdf' | 'document'
    const folder = formData.get('folder') as string || 'general';
    const customName = formData.get('name') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate public_id from custom name or file name
    const baseName = customName || file.name.replace(/\.[^/.]+$/, '');
    const sanitizedName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    
    const timestamp = Date.now();
    const publicId = `${sanitizedName}-${timestamp}`;

    let result;

    if (type === 'pdf' || type === 'document' || file.type === 'application/pdf') {
      // Upload PDF
      const base64 = buffer.toString('base64');
      const dataUri = `data:application/pdf;base64,${base64}`;
      
      result = await uploadPDF(dataUri, {
        folder: `elite-pro-capital/${folder}`,
        public_id: publicId,
      });
    } else {
      // Upload image
      const base64 = buffer.toString('base64');
      const mimeType = file.type || 'image/jpeg';
      const dataUri = `data:${mimeType};base64,${base64}`;
      
      result = await uploadImage(dataUri, {
        folder: `elite-pro-capital/${folder}`,
        public_id: publicId,
      });
    }

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// DELETE - Delete file from Cloudinary
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');
    const resourceType = searchParams.get('resourceType') as 'image' | 'raw' || 'image';

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID required' }, { status: 400 });
    }

    const { cloudinary } = await import('@/lib/cloudinary');
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
