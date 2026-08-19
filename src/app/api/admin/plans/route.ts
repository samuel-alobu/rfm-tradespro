import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { SubscribePlan, User } from '@/db/models';

// Check admin middleware
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user || !['admin', 'super_admin'].includes(user.role)) return null;
  
  return user;
}

// GET - Fetch all plans
export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await SubscribePlan.find()
      .sort({ sortOrder: 1 })
      .lean();

    const stats = {
      total: plans.length,
      active: plans.filter(p => p.isActive).length,
      totalSubscribers: plans.reduce((sum, p) => sum + (p.totalSubscribers || 0), 0),
    };

    return NextResponse.json({ plans, stats });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create plan
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const plan = await SubscribePlan.create(body);
    return NextResponse.json({ plan, message: 'Plan created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update plan
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, ...updates } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    const plan = await SubscribePlan.findByIdAndUpdate(planId, updates, { new: true });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ plan, message: 'Plan updated successfully' });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete plan
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('id');

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    const plan = await SubscribePlan.findByIdAndDelete(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
