import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Subscription, User, Transaction } from '@/db/models';

// GET - Fetch all subscriptions with user details
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check admin role
    const adminUser = await User.findById(session.user.id).select('role');
    if (!adminUser || !['admin', 'superadmin', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all subscriptions with user info
    const subscriptions = await Subscription.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          planName: 1,
          amount: 1,
          roiPercent: 1,
          expectedReturn: 1,
          currentReturn: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          completedAt: 1,
          releasedAt: 1,
          releasedBy: 1,
          releaseNote: 1,
          createdAt: 1,
          'user._id': 1,
          'user.email': 1,
          'user.firstName': 1,
          'user.lastName': 1,
          'user.subscribeBalance': 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    // Calculate stats
    const stats = {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
      completedSubscriptions: subscriptions.filter(s => s.status === 'completed').length,
      totalInvested: subscriptions.reduce((acc, s) => acc + s.amount, 0),
      totalExpectedReturns: subscriptions
        .filter(s => s.status === 'active')
        .reduce((acc, s) => acc + s.expectedReturn, 0),
      totalReleasedReturns: subscriptions
        .filter(s => s.status === 'completed')
        .reduce((acc, s) => acc + s.currentReturn, 0),
    };

    return NextResponse.json({ subscriptions, stats });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Release funds for a subscription
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check admin role
    const adminUser = await User.findById(session.user.id).select('role email');
    if (!adminUser || !['admin', 'superadmin', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { subscriptionId, action, note } = body;

    if (!subscriptionId || action !== 'release') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscription.status !== 'active') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 });
    }

    // Calculate total payout: principal + ROI
    const totalPayout = subscription.amount + subscription.expectedReturn;

    // Get the user
    const user = await User.findById(subscription.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Credit the subscribe balance
    const balanceBefore = user.subscribeBalance || 0;
    user.subscribeBalance = balanceBefore + totalPayout;
    
    // Remove from locked balance
    user.lockedBalance = Math.max(0, (user.lockedBalance || 0) - subscription.amount);
    
    // Add profit to total profit
    user.totalProfit = (user.totalProfit || 0) + subscription.expectedReturn;
    
    await user.save();

    // Update subscription
    subscription.status = 'completed';
    subscription.currentReturn = subscription.expectedReturn;
    subscription.completedAt = new Date();
    subscription.releasedAt = new Date();
    subscription.releasedBy = new mongoose.Types.ObjectId(session.user.id);
    subscription.releaseNote = note || '';
    await subscription.save();

    // Create transaction record
    await Transaction.create({
      userId: subscription.userId,
      type: 'subscription',
      amount: totalPayout,
      balanceBefore,
      balanceAfter: user.subscribeBalance,
      status: 'completed',
      description: `${subscription.planName} plan completed - Principal: $${subscription.amount.toLocaleString()} + ROI: $${subscription.expectedReturn.toLocaleString()}`,
      relatedId: subscription._id,
      relatedModel: 'Subscription',
    });

    // Add notification to user
    await User.findByIdAndUpdate(subscription.userId, {
      $push: {
        notifications: {
          $each: [{
            type: 'subscription',
            title: 'Subscription Completed',
            message: `Your ${subscription.planName} plan has been completed. $${totalPayout.toLocaleString()} (Principal + ROI) has been credited to your subscribe balance.`,
            read: false,
            createdAt: new Date(),
          }],
          $position: 0,
        },
      },
    });

    console.log(`Admin ${adminUser.email} released funds for subscription ${subscriptionId}: $${totalPayout}`);

    return NextResponse.json({
      success: true,
      message: `Released $${totalPayout.toLocaleString()} to user's subscribe balance`,
      subscription,
    });
  } catch (error) {
    console.error('Error releasing subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
