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

// GET - Fetch user profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const user = await User.findById(userId).select('firstName lastName email phone country avatar verificationStatus').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      country: user.country || '',
      avatar: user.avatar || '',
      verificationStatus: user.verificationStatus,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const formData = await request.formData();

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phone = formData.get('phone') as string;
    const country = formData.get('country') as string;
    const avatarFile = formData.get('avatar') as File | null;

    // Build update object
    const updates: Record<string, unknown> = {};

    if (firstName) updates.firstName = firstName.trim();
    if (lastName) updates.lastName = lastName.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (country !== undefined) updates.country = country.trim();

    // Handle avatar upload to Cloudinary
    if (avatarFile && avatarFile.size > 0) {
      try {
        // Convert File to base64
        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = `data:${avatarFile.type};base64,${buffer.toString('base64')}`;

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(base64, {
          folder: 'rfm-tradepro/avatars',
          public_id: `avatar_${userId}`,
          overwrite: true,
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        });

        updates.avatar = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true })
      .select('firstName lastName email phone country avatar');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        country: user.country || '',
        avatar: user.avatar || '',
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
