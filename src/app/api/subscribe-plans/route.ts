import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { SubscribePlan, Subscription, User, Transaction } from '@/db/models';

// GET - Fetch all active plans
export async function GET() {
  try {
    await connectToDatabase();

    const plans = await SubscribePlan.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Subscribe to a plan (uses subscribeBalance)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { planId, amount } = body;

    // Validate
    if (!planId || !amount) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Check plan exists
    const plan = await SubscribePlan.findById(planId);
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });
    }

    // Check amount within range
    if (amount < plan.minAmount || amount > plan.maxAmount) {
      return NextResponse.json({ 
        error: `Amount must be between $${plan.minAmount.toLocaleString()} and $${plan.maxAmount.toLocaleString()}` 
      }, { status: 400 });
    }

    // Check user subscribe balance
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if ((user.subscribeBalance || 0) < amount) {
      return NextResponse.json({ error: 'Insufficient subscribe balance. Please deposit funds first.' }, { status: 400 });
    }

    // Calculate returns
    const expectedReturn = amount * (plan.roiPercent / 100);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Deduct from subscribe balance (NOT availableBalance)
    const balanceBefore = user.subscribeBalance || 0;
    user.subscribeBalance = balanceBefore - amount;
    user.lockedBalance = (user.lockedBalance || 0) + amount;
    await user.save();

    // Create subscription
    const subscription = await Subscription.create({
      userId,
      planId,
      planName: plan.name,
      amount,
      roiPercent: plan.roiPercent,
      expectedReturn,
      currentReturn: 0,
      status: 'active',
      startDate: new Date(),
      endDate,
    });

    // Update plan subscribers count
    await SubscribePlan.findByIdAndUpdate(planId, { $inc: { totalSubscribers: 1 } });

    // Create transaction record
    await Transaction.create({
      userId,
      type: 'subscription',
      amount: -amount,
      balanceBefore,
      balanceAfter: user.subscribeBalance,
      status: 'completed',
      description: `Subscribed to ${plan.name} plan`,
      relatedId: subscription._id,
      relatedModel: 'Subscription',
    });

    // Add notification
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          $each: [{
            type: 'subscription',
            title: 'Plan Subscription',
            message: `You have successfully subscribed to ${plan.name} plan with $${amount.toLocaleString()}. Expected return: $${expectedReturn.toLocaleString()} after ${plan.durationDays} days.`,
            read: false,
            createdAt: new Date(),
          }],
          $position: 0,
        },
      },
    });

    console.log(`User ${user.email} subscribed to ${plan.name} for $${amount}`);

    return NextResponse.json({ 
      subscription, 
      message: 'Subscription successful',
      newBalance: user.subscribeBalance,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
