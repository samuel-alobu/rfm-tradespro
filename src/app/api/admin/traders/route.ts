import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Trader, User } from '@/db/models';

// Check admin middleware
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user || !['admin', 'super_admin'].includes(user.role)) return null;
  
  return user;
}

// GET - Fetch all traders
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const style = searchParams.get('style');
    const isActive = searchParams.get('isActive');

    const query: Record<string, unknown> = {};
    if (style && style !== 'all') query.tradingStyle = style;
    if (isActive === 'true') query.isActive = true;
    if (isActive === 'false') query.isActive = false;

    const traders = await Trader.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const stats = {
      total: await Trader.countDocuments(),
      active: await Trader.countDocuments({ isActive: true }),
      verified: await Trader.countDocuments({ isVerified: true }),
      featured: await Trader.countDocuments({ isFeatured: true }),
    };

    return NextResponse.json({ traders, stats });
  } catch (error) {
    console.error('Error fetching traders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create trader
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check for duplicate username
    const existing = await Trader.findOne({ username: body.username });
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const trader = await Trader.create(body);
    return NextResponse.json({ trader, message: 'Trader created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating trader:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update trader
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { traderId, ...updates } = body;

    if (!traderId) {
      return NextResponse.json({ error: 'Trader ID required' }, { status: 400 });
    }

    // Check username uniqueness if updating
    if (updates.username) {
      const existing = await Trader.findOne({ 
        username: updates.username, 
        _id: { $ne: traderId } 
      });
      if (existing) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }
    }

    const trader = await Trader.findByIdAndUpdate(traderId, updates, { new: true });
    if (!trader) {
      return NextResponse.json({ error: 'Trader not found' }, { status: 404 });
    }

    return NextResponse.json({ trader, message: 'Trader updated successfully' });
  } catch (error) {
    console.error('Error updating trader:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete trader
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const traderId = searchParams.get('id');

    if (!traderId) {
      return NextResponse.json({ error: 'Trader ID required' }, { status: 400 });
    }

    const trader = await Trader.findByIdAndDelete(traderId);
    if (!trader) {
      return NextResponse.json({ error: 'Trader not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Trader deleted successfully' });
  } catch (error) {
    console.error('Error deleting trader:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
