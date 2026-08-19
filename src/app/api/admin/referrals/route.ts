import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, Referral } from '@/db/models';

// Check admin middleware
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user || !['admin', 'super_admin'].includes(user.role)) return null;
  
  return user;
}

// GET - Fetch all referrals (admin view)
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (status && status !== 'all') query.status = status;

    const referrals = await Referral.find(query)
      .populate('referrerId', 'firstName lastName email referralCode')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats
    const allReferrals = await Referral.find().lean();
    const stats = {
      total: allReferrals.length,
      pending: allReferrals.filter((r) => r.status === 'pending').length,
      active: allReferrals.filter((r) => r.status === 'active').length,
      completed: allReferrals.filter((r) => r.status === 'completed').length,
      totalPending: allReferrals
        .filter((r) => r.status === 'pending')
        .reduce((acc, r) => acc + r.rewardAmount, 0),
      totalApproved: allReferrals
        .filter((r) => r.status === 'active' || r.status === 'completed')
        .reduce((acc, r) => acc + r.rewardAmount, 0),
    };

    return NextResponse.json({
      referrals: referrals.map((r: any) => ({
        _id: r._id.toString(),
        referrer: {
          _id: r.referrerId?._id?.toString() || '',
          name: r.referrerId ? `${r.referrerId.firstName} ${r.referrerId.lastName}` : 'Unknown',
          email: r.referrerId?.email || '',
          referralCode: r.referrerId?.referralCode || '',
        },
        referredUser: {
          firstName: r.referredUser.firstName,
          lastName: r.referredUser.lastName,
          email: r.referredUser.email,
          name: `${r.referredUser.firstName} ${r.referredUser.lastName}`,
        },
        rewardAmount: r.rewardAmount,
        tier: r.tier,
        status: r.status,
        createdAt: r.createdAt,
        approvedAt: r.approvedAt,
        adminNote: r.adminNote,
      })),
      stats,
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Approve or reject referral
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { referralId, action, adminNote } = body;

    if (!referralId) {
      return NextResponse.json({ error: 'Referral ID required' }, { status: 400 });
    }

    const referral = await Referral.findById(referralId);
    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    // =====================
    // APPROVE Action
    // =====================
    if (action === 'approve') {
      if (referral.status !== 'pending') {
        return NextResponse.json({ error: 'Referral is not pending' }, { status: 400 });
      }

      // Get the referrer and add reward to their referral balance
      const referrer = await User.findById(referral.referrerId);
      if (!referrer) {
        return NextResponse.json({ error: 'Referrer not found' }, { status: 404 });
      }

      // Add reward to referrer's referral balance
      referrer.referralBalance = (referrer.referralBalance || 0) + referral.rewardAmount;
      await referrer.save();

      // Update referral status
      referral.status = 'active';
      referral.approvedAt = new Date();
      referral.approvedBy = admin._id;
      referral.adminNote = adminNote || '';
      await referral.save();

      // Add notification to referrer
      await User.findByIdAndUpdate(referral.referrerId, {
        $push: {
          notifications: {
            $each: [{
              type: 'referral',
              title: 'Referral Approved',
              message: `Your referral of ${referral.referredUser.firstName} has been approved! $${referral.rewardAmount} has been added to your referral balance.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Referral approved successfully',
        referral: {
          _id: referral._id.toString(),
          status: referral.status,
          approvedAt: referral.approvedAt,
        },
        referrerNewBalance: referrer.referralBalance,
      });
    }

    // =====================
    // REJECT Action
    // =====================
    if (action === 'reject') {
      if (referral.status !== 'pending') {
        return NextResponse.json({ error: 'Referral is not pending' }, { status: 400 });
      }

      // Just update the status - no reward given
      referral.status = 'completed'; // Mark as completed but with $0
      referral.rewardAmount = 0;
      referral.adminNote = adminNote || 'Referral rejected';
      await referral.save();

      return NextResponse.json({
        success: true,
        message: 'Referral rejected',
        referral: {
          _id: referral._id.toString(),
          status: referral.status,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
