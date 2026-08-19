import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Subscription } from '@/db/models';

// GET - Fetch user's subscriptions (active and history)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Get all user subscriptions
    const subscriptions = await Subscription.find({ userId })
      .populate('planId', 'name durationDays')
      .sort({ createdAt: -1 })
      .lean();

    // Separate active and completed/cancelled
    const active = subscriptions.filter((s: any) => s.status === 'active');
    const history = subscriptions.filter((s: any) => s.status !== 'active');

    return NextResponse.json({ 
      subscriptions,
      active,
      history,
      stats: {
        totalActive: active.length,
        totalCompleted: history.filter((s: any) => s.status === 'completed').length,
        totalInvested: active.reduce((acc: number, s: any) => acc + s.amount, 0),
        expectedReturns: active.reduce((acc: number, s: any) => acc + s.expectedReturn, 0),
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
