import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/db/models';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET - Fetch user's KYC status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const user = await User.findById(userId)
      .select('verificationStatus kycDocuments')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      verificationStatus: user.verificationStatus,
      documents: user.kycDocuments || [],
    });
  } catch (error) {
    console.error('Error fetching KYC status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Submit KYC documents
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already verified or pending
    if (user.verificationStatus === 'verified') {
      return NextResponse.json({ error: 'Account already verified' }, { status: 400 });
    }

    if (user.verificationStatus === 'pending') {
      return NextResponse.json({ error: 'Verification already pending review' }, { status: 400 });
    }

    const formData = await request.formData();
    const documentType = formData.get('documentType') as string;
    const frontImage = formData.get('frontImage') as File | null;
    const backImage = formData.get('backImage') as File | null;
    const selfieImage = formData.get('selfieImage') as File | null;

    if (!documentType || !frontImage) {
      return NextResponse.json({ error: 'Document type and front image are required' }, { status: 400 });
    }

    // Map document type to enum
    const docTypeMap: Record<string, string> = {
      'drivers_license': 'drivers_license',
      'passport': 'passport',
      'national_id': 'id_card',
      'state_id': 'id_card',
    };

    const kycType = docTypeMap[documentType] || 'id_card';

    // Upload documents to Cloudinary
    const uploadFile = async (file: File, suffix: string): Promise<string> => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

      const result = await cloudinary.uploader.upload(base64, {
        folder: 'rfm-tradepro/kyc',
        public_id: `kyc_${userId}_${suffix}_${Date.now()}`,
        transformation: [
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      });

      return result.secure_url;
    };

    const documents: Array<{
      type: 'id_card' | 'passport' | 'drivers_license' | 'proof_of_address';
      url: string;
      status: 'pending' | 'approved' | 'rejected';
      uploadedAt: Date;
    }> = [];

    try {
      // Upload front image
      const frontUrl = await uploadFile(frontImage, 'front');
      documents.push({
        type: kycType as 'id_card' | 'passport' | 'drivers_license' | 'proof_of_address',
        url: frontUrl,
        status: 'pending',
        uploadedAt: new Date(),
      });

      // Upload back image if provided
      if (backImage && backImage.size > 0) {
        const backUrl = await uploadFile(backImage, 'back');
        documents.push({
          type: kycType as 'id_card' | 'passport' | 'drivers_license' | 'proof_of_address',
          url: backUrl,
          status: 'pending',
          uploadedAt: new Date(),
        });
      }

      // Upload selfie if provided
      if (selfieImage && selfieImage.size > 0) {
        const selfieUrl = await uploadFile(selfieImage, 'selfie');
        documents.push({
          type: 'proof_of_address', // Using this type for selfie since model has limited types
          url: selfieUrl,
          status: 'pending',
          uploadedAt: new Date(),
        });
      }
    } catch (uploadError) {
      console.error('Document upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload documents' }, { status: 500 });
    }

    // Update user with KYC documents and set status to pending
    user.kycDocuments = documents as any;
    user.verificationStatus = 'pending';
    await user.save();

    // Add notification
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          $each: [{
            type: 'kyc',
            title: 'Verification Submitted',
            message: 'Your identity verification documents have been submitted and are under review. You will be notified once the review is complete.',
            read: false,
            createdAt: new Date(),
          }],
          $position: 0,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Documents submitted successfully',
      verificationStatus: 'pending',
    });
  } catch (error) {
    console.error('Error submitting KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
