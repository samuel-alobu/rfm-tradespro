import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/db/models';

// Check admin middleware
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user || !['admin', 'super_admin'].includes(user.role)) return null;
  
  return user;
}

// GET - Fetch all KYC submissions
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Build query
    const query: Record<string, unknown> = {
      kycDocuments: { $exists: true, $ne: [] },
    };

    if (status !== 'all') {
      query.verificationStatus = status;
    }

    const users = await User.find(query)
      .select('firstName lastName email verificationStatus kycDocuments country createdAt')
      .sort({ 'kycDocuments.uploadedAt': -1 })
      .lean();

    // Map to KYC submissions
    const submissions = users.map((user) => {
      const docs = user.kycDocuments || [];
      const firstDoc = docs[0];
      
      // Get document type label
      const docTypeLabels: Record<string, string> = {
        'id_card': 'National ID',
        'passport': 'Passport',
        'drivers_license': "Driver's License",
        'proof_of_address': 'Selfie',
      };

      return {
        _id: user._id.toString(),
        user: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        status: user.verificationStatus,
        submittedAt: firstDoc?.uploadedAt || user.createdAt,
        documents: {
          idType: docTypeLabels[firstDoc?.type] || 'Unknown',
          images: docs.map((d: any) => ({
            type: d.type,
            url: d.url,
            status: d.status,
            uploadedAt: d.uploadedAt,
          })),
        },
        country: user.country || 'Not specified',
      };
    });

    // Calculate stats
    const allUsers = await User.find({ kycDocuments: { $exists: true, $ne: [] } })
      .select('verificationStatus')
      .lean();

    const stats = {
      total: allUsers.length,
      pending: allUsers.filter((u) => u.verificationStatus === 'pending').length,
      approved: allUsers.filter((u) => u.verificationStatus === 'verified').length,
      rejected: allUsers.filter((u) => u.verificationStatus === 'rejected').length,
    };

    return NextResponse.json({ submissions, stats });
  } catch (error) {
    console.error('Error fetching KYC submissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Approve or reject KYC
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, action, rejectionReason } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.verificationStatus !== 'pending') {
      return NextResponse.json({ error: 'KYC is not pending review' }, { status: 400 });
    }

    // Update verification status
    if (action === 'approve') {
      user.verificationStatus = 'verified';
      
      // Update all document statuses
      if (user.kycDocuments) {
        user.kycDocuments = user.kycDocuments.map((doc: any) => ({
          ...doc,
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: admin._id,
        }));
      }

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'kyc',
              title: 'Verification Approved',
              message: 'Congratulations! Your identity verification has been approved. You now have full access to all platform features.',
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });
    } else {
      user.verificationStatus = 'rejected';
      
      // Update all document statuses with rejection reason
      if (user.kycDocuments) {
        user.kycDocuments = user.kycDocuments.map((doc: any) => ({
          ...doc,
          status: 'rejected',
          reviewedAt: new Date(),
          reviewedBy: admin._id,
          rejectionReason: rejectionReason || 'Documents did not meet verification requirements',
        }));
      }

      // Add notification
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'kyc',
              title: 'Verification Rejected',
              message: rejectionReason || 'Your identity verification was not approved. Please resubmit with clear, valid documents.',
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'KYC approved successfully' : 'KYC rejected',
      verificationStatus: user.verificationStatus,
    });
  } catch (error) {
    console.error('Error updating KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
