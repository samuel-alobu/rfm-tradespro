import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Withdrawal, User, Transaction, UserHolding } from '@/db/models';

// GET - Fetch all withdrawals (admin)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check admin role
    const adminUserId = new mongoose.Types.ObjectId(session.user.id);
    const admin = await User.findById(adminUserId);
    if (!admin || !['admin', 'superadmin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all withdrawals with user info (extended fields)
    const withdrawals = await Withdrawal.find({})
      .populate('userId', 'firstName lastName email avatar phone country verificationStatus availableBalance totalBalance role createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats
    const stats = {
      pending: withdrawals.filter((w: any) => w.status === 'pending').length,
      approved: withdrawals.filter((w: any) => w.status === 'approved').length,
      declined: withdrawals.filter((w: any) => w.status === 'declined').length,
      totalApproved: withdrawals
        .filter((w: any) => w.status === 'approved')
        .reduce((sum: number, w: any) => sum + (w.amountUsd || w.amount || 0), 0),
      totalPending: withdrawals
        .filter((w: any) => w.status === 'pending')
        .reduce((sum: number, w: any) => sum + (w.amountUsd || w.amount || 0), 0),
    };

    // Map withdrawals with complete user info
    const mappedWithdrawals = withdrawals.map((w: any) => ({
      _id: w._id.toString(),
      id: w._id.toString(),
      userId: w.userId?._id?.toString() || w.userId?.toString() || '',
      userName: w.userId ? `${w.userId.firstName || ''} ${w.userId.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
      userEmail: w.userId?.email || 'N/A',
      userPhone: w.userId?.phone || 'N/A',
      userCountry: w.userId?.country || 'N/A',
      userAvatar: w.userId?.avatar || null,
      userVerificationStatus: w.userId?.verificationStatus || 'unverified',
      userBalance: w.userId?.availableBalance || 0,
      userTotalBalance: w.userId?.totalBalance || 0,
      userRole: w.userId?.role || 'user',
      userJoinedAt: w.userId?.createdAt || null,
      reference: w.reference,
      method: w.method,
      token: w.token,
      tokenAmount: w.amount, // Token amount
      network: w.network,
      walletAddress: w.walletAddress,
      bankName: w.bankName,
      accountName: w.accountName,
      accountNumber: w.accountNumber,
      routingNumber: w.routingNumber,
      swiftCode: w.swiftCode,
      amount: w.amountUsd || w.amount, // USD amount
      amountUsd: w.amountUsd || w.amount,
      fee: w.fee || 0,
      netAmount: w.netAmount || (w.amountUsd || w.amount) - (w.fee || 0),
      status: w.status,
      notes: w.notes,
      txHash: w.txHash,
      processedBy: w.processedBy,
      processedAt: w.processedAt,
      createdAt: w.createdAt,
      date: w.createdAt,
    }));

    return NextResponse.json({ withdrawals: mappedWithdrawals, stats });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Approve or decline withdrawal
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check admin role
    const adminUserId = new mongoose.Types.ObjectId(session.user.id);
    const admin = await User.findById(adminUserId);
    if (!admin || !['admin', 'superadmin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { withdrawalId, action, declineReason, txHash } = body;

    if (!withdrawalId || !['approve', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 });
    }

    // Find user
    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Get the USD amount for balance deduction
      const withdrawAmountUsd = withdrawal.amountUsd || withdrawal.amount;
      // Get the token amount for holding deduction
      const withdrawTokenAmount = withdrawal.amount;
      const token = withdrawal.token;
      
      const balanceBefore = user.availableBalance || 0;
      
      // Check if user has sufficient balance
      if (balanceBefore < withdrawAmountUsd) {
        return NextResponse.json({ 
          error: 'User has insufficient balance for this withdrawal',
          availableBalance: balanceBefore,
          withdrawAmount: withdrawAmountUsd,
        }, { status: 400 });
      }

      // Find the user's holding for this token
      const userHolding = await UserHolding.findOne({ 
        userId: withdrawal.userId, 
        symbol: token 
      });

      if (!userHolding) {
        return NextResponse.json({ 
          error: `User does not have any ${token} holdings`,
        }, { status: 400 });
      }

      // Check if holding has enough tokens
      if (userHolding.amount < withdrawTokenAmount) {
        return NextResponse.json({ 
          error: `Insufficient ${token} holdings. User has ${userHolding.amount} but trying to withdraw ${withdrawTokenAmount}`,
          availableTokens: userHolding.amount,
          requestedTokens: withdrawTokenAmount,
        }, { status: 400 });
      }

      // Deduct from user balance
      await User.findByIdAndUpdate(withdrawal.userId, {
        $inc: {
          availableBalance: -withdrawAmountUsd,
          totalBalance: -withdrawAmountUsd,
          totalWithdrawals: withdrawAmountUsd,
        },
        $push: {
          notifications: {
            $each: [{
              type: 'withdrawal_approved',
              title: 'Withdrawal Approved',
              message: `Your withdrawal of $${withdrawAmountUsd.toLocaleString()} (${withdrawTokenAmount} ${token}) has been approved and processed.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      // Deduct from user's token holding
      const newTokenAmount = userHolding.amount - withdrawTokenAmount;
      const newTokenUsdValue = userHolding.amountUsd - withdrawAmountUsd;

      if (newTokenAmount <= 0.00000001) {
        // If holding is depleted, remove it entirely
        await UserHolding.findByIdAndDelete(userHolding._id);
        console.log(`🗑️ Removed depleted ${token} holding for user ${user.email}`);
      } else {
        // Update the holding with reduced amounts
        await UserHolding.findByIdAndUpdate(userHolding._id, {
          $set: {
            amount: newTokenAmount,
            amountUsd: Math.max(0, newTokenUsdValue),
          }
        });
        console.log(`📉 Reduced ${token} holding: ${userHolding.amount} → ${newTokenAmount} for user ${user.email}`);
      }

      // Update withdrawal status
      withdrawal.status = 'approved';
      withdrawal.processedBy = adminUserId;
      withdrawal.processedAt = new Date();
      if (txHash) withdrawal.txHash = txHash;
      await withdrawal.save();

      // Create transaction record
      const newBalance = balanceBefore - withdrawAmountUsd;
      await Transaction.create({
        userId: withdrawal.userId,
        type: 'withdrawal',
        amount: -withdrawAmountUsd,
        balanceBefore,
        balanceAfter: newBalance,
        status: 'completed',
        description: `Withdrawal approved - ${withdrawTokenAmount} ${token} (${withdrawal.reference})`,
        reference: withdrawal.reference,
        relatedId: withdrawal._id,
        relatedModel: 'Withdrawal',
      });

      console.log(`✅ Withdrawal ${withdrawal.reference} approved. User ${user.email} debited $${withdrawAmountUsd} (${withdrawTokenAmount} ${token})`);

      return NextResponse.json({ 
        message: 'Withdrawal approved successfully',
        withdrawal,
        newBalance,
        tokenDeducted: {
          symbol: token,
          amount: withdrawTokenAmount,
          newHoldingAmount: newTokenAmount,
        },
      });
    } else {
      // Decline
      const withdrawAmountUsd = withdrawal.amountUsd || withdrawal.amount;
      
      withdrawal.status = 'declined';
      withdrawal.notes = declineReason || 'Withdrawal declined by admin';
      withdrawal.processedBy = adminUserId;
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      // Add notification using $push
      await User.findByIdAndUpdate(withdrawal.userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'withdrawal_declined',
              title: 'Withdrawal Declined',
              message: `Your withdrawal of $${withdrawAmountUsd.toLocaleString()} (${withdrawal.token}) was declined. ${declineReason || ''}`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      console.log(`❌ Withdrawal ${withdrawal.reference} declined`);

      return NextResponse.json({ 
        message: 'Withdrawal declined',
        withdrawal,
      });
    }
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
