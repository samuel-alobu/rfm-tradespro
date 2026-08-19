import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Signal, User } from '@/db/models';

// Check admin middleware
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user || !['admin', 'super_admin'].includes(user.role)) return null;
  
  return user;
}

// GET - Fetch all signals
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (market && market !== 'all') query.market = market;
    if (status && status !== 'all') query.status = status;

    const signals = await Signal.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      total: await Signal.countDocuments(),
      active: await Signal.countDocuments({ isActive: true, status: 'active' }),
      premium: await Signal.countDocuments({ isPremium: true }),
    };

    return NextResponse.json({ signals, stats });
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create signal
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const signal = await Signal.create(body);
    return NextResponse.json({ signal, message: 'Signal created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating signal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update signal
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { signalId, ...updates } = body;

    if (!signalId) {
      return NextResponse.json({ error: 'Signal ID required' }, { status: 400 });
    }

    const signal = await Signal.findByIdAndUpdate(signalId, updates, { new: true });
    if (!signal) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }

    return NextResponse.json({ signal, message: 'Signal updated successfully' });
  } catch (error) {
    console.error('Error updating signal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete signal
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const signalId = searchParams.get('id');

    if (!signalId) {
      return NextResponse.json({ error: 'Signal ID required' }, { status: 400 });
    }

    const signal = await Signal.findByIdAndDelete(signalId);
    if (!signal) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Signal deleted successfully' });
  } catch (error) {
    console.error('Error deleting signal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
