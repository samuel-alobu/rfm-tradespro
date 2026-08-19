import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, RealEstateInvestment, Transaction } from '@/db/models';

// Check admin middleware
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user || !['admin', 'super_admin'].includes(user.role)) return null;
  
  return user;
}

// GET - Fetch all investments (admin view)
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const query: Record<string, unknown> = {};
    if (status && status !== 'all') query.status = status;
    if (userId) query.userId = new mongoose.Types.ObjectId(userId);

    const investments = await RealEstateInvestment.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ investedAt: -1 })
      .lean();

    // Calculate stats
    const stats = {
      total: investments.length,
      active: investments.filter((i) => i.status === 'active').length,
      cashedOut: investments.filter((i) => i.status === 'cashed_out').length,
      totalInvested: investments.reduce((acc, i) => acc + i.amount, 0),
      totalExpectedReturns: investments.reduce((acc, i) => acc + i.expectedReturn, 0),
    };

    return NextResponse.json({
      investments: investments.map((inv: any) => ({
        _id: inv._id.toString(),
        userId: inv.userId?._id?.toString() || '',
        userName: inv.userId ? `${inv.userId.firstName} ${inv.userId.lastName}` : 'Unknown',
        userEmail: inv.userId?.email || '',
        propertyId: inv.propertyId.toString(),
        propertyName: inv.property?.name || 'Property',
        propertyImage: inv.property?.image || '',
        amount: inv.amount,
        expectedReturn: inv.expectedReturn,
        roi: inv.property?.roi || 0,
        durationDays: inv.durationDays,
        status: inv.status,
        investedAt: inv.investedAt,
        expiresAt: inv.expiresAt,
        releasedAt: inv.releasedAt,
        releasedAmount: inv.releasedAmount,
        releaseNote: inv.releaseNote,
      })),
      stats,
    });
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update investment (change duration, release ROI)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { investmentId, action, durationDays, releaseNote } = body;

    if (!investmentId) {
      return NextResponse.json({ error: 'Investment ID required' }, { status: 400 });
    }

    const investment = await RealEstateInvestment.findById(investmentId);
    if (!investment) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    // =====================
    // UPDATE DURATION Action
    // =====================
    if (action === 'update_duration') {
      if (!durationDays || durationDays < 1) {
        return NextResponse.json({ error: 'Valid duration required' }, { status: 400 });
      }

      // Update duration and recalculate expiry
      investment.durationDays = durationDays;
      investment.expiresAt = new Date(
        new Date(investment.investedAt).getTime() + durationDays * 24 * 60 * 60 * 1000
      );
      await investment.save();

      return NextResponse.json({
        success: true,
        message: 'Duration updated successfully',
        investment: {
          _id: investment._id.toString(),
          durationDays: investment.durationDays,
          expiresAt: investment.expiresAt,
        },
      });
    }

    // =====================
    // RELEASE ROI Action
    // =====================
    if (action === 'release') {
      if (investment.status === 'cashed_out') {
        return NextResponse.json({ error: 'Investment already cashed out' }, { status: 400 });
      }

      // Calculate total release amount (principal + ROI)
      const releaseAmount = investment.amount + investment.expectedReturn;

      // Get user and add to their real estate balance
      const user = await User.findById(investment.userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const realEstateBalanceBefore = user.realEstateBalance || 0;

      // Add released amount to user's real estate balance
      user.realEstateBalance = realEstateBalanceBefore + releaseAmount;
      user.availableBalance = (user.availableBalance || 0) + releaseAmount;
      await user.save();

      // Update investment status
      investment.status = 'cashed_out';
      investment.releasedAt = new Date();
      investment.releasedBy = admin._id;
      investment.releasedAmount = releaseAmount;
      investment.releaseNote = releaseNote || '';
      await investment.save();

      // Create transaction
      await Transaction.create({
        userId: investment.userId,
        type: 'bonus', // Using bonus for ROI release
        amount: releaseAmount,
        balanceBefore: realEstateBalanceBefore,
        balanceAfter: user.realEstateBalance,
        status: 'completed',
        description: `ROI Released - ${investment.property?.name || 'Property'} (Principal: $${investment.amount.toLocaleString()}, ROI: $${investment.expectedReturn.toLocaleString()})`,
        relatedId: investment._id,
        relatedModel: 'RealEstateInvestment',
      });

      // Add notification to user
      await User.findByIdAndUpdate(investment.userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'investment',
              title: 'Investment Released',
              message: `Your investment in ${investment.property?.name} has been released! Principal: $${investment.amount.toLocaleString()}, ROI: $${investment.expectedReturn.toLocaleString()}, Total: $${releaseAmount.toLocaleString()}`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Investment released successfully',
        investment: {
          _id: investment._id.toString(),
          status: investment.status,
          releasedAt: investment.releasedAt,
          releasedAmount: investment.releasedAmount,
        },
        userNewBalance: user.realEstateBalance,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating investment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
