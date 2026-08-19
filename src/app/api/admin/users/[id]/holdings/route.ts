import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, UserHolding } from '@/db/models';

// ============================================
// Admin User Holdings API - Manage user token balances
// ============================================

// Helper function to recalculate and update user balance from holdings
async function syncUserBalanceFromHoldings(userId: string) {
  const holdings = await UserHolding.find({ userId }).lean();
  const totalHoldingsValue = holdings.reduce((sum, h) => sum + (h.amountUsd || 0), 0);
  
  // Update user's balance to match total holdings value
  await User.findByIdAndUpdate(userId, {
    $set: {
      totalBalance: totalHoldingsValue,
      availableBalance: totalHoldingsValue,
    }
  });
  
  return totalHoldingsValue;
}

// GET - Get all holdings for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify admin role
    const adminUser = await User.findById(session.user.id);
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    
    const holdings = await UserHolding.find({ userId: id }).lean();
    const totalValue = holdings.reduce((sum, h) => sum + h.amountUsd, 0);

    return NextResponse.json({
      success: true,
      holdings,
      totalValue,
    });
  } catch (error) {
    console.error('Admin user holdings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holdings' },
      { status: 500 }
    );
  }
}

// POST - Add or update a holding
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify admin role
    const adminUser = await User.findById(session.user.id);
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { symbol, name, type, icon, amount, amountUsd, mode, coingeckoId } = body;

    // Validate required fields
    if (!symbol || amount === undefined || amountUsd === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, amount, amountUsd' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find existing holding or create new
    const existingHolding = await UserHolding.findOne({ 
      userId: id, 
      symbol: symbol.toUpperCase() 
    });

    let holding;
    let message;

    if (existingHolding) {
      // Update existing holding
      if (mode === 'set') {
        // Set exact values
        existingHolding.amount = parseFloat(amount);
        existingHolding.amountUsd = parseFloat(amountUsd);
        if (name) existingHolding.name = name;
        if (icon) existingHolding.icon = icon;
        if (coingeckoId) existingHolding.coingeckoId = coingeckoId;
        message = `${symbol} holding set to ${amount} ($${parseFloat(amountUsd).toFixed(2)})`;
      } else {
        // Add to existing (default mode)
        existingHolding.amount += parseFloat(amount);
        existingHolding.amountUsd += parseFloat(amountUsd);
        message = `Added $${parseFloat(amountUsd).toFixed(2)} worth of ${symbol} to holdings`;
      }
      
      // Calculate average price
      if (existingHolding.amount > 0) {
        existingHolding.averagePrice = existingHolding.amountUsd / existingHolding.amount;
      }
      
      await existingHolding.save();
      holding = existingHolding;
    } else {
      // Create new holding
      holding = await UserHolding.create({
        userId: id,
        symbol: symbol.toUpperCase(),
        name: name || symbol.toUpperCase(),
        type: type || 'crypto',
        icon: icon || '',
        amount: parseFloat(amount),
        amountUsd: parseFloat(amountUsd),
        averagePrice: parseFloat(amount) > 0 ? parseFloat(amountUsd) / parseFloat(amount) : 0,
        coingeckoId: coingeckoId || '',
      });
      message = `Created ${symbol} holding with $${parseFloat(amountUsd).toFixed(2)}`;
    }

    // Sync user balance to match total holdings
    const newTotalBalance = await syncUserBalanceFromHoldings(id);

    return NextResponse.json({
      success: true,
      message,
      holding,
      newTotalBalance,
    });
  } catch (error) {
    console.error('Admin user holdings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update holding' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a holding
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify admin role
    const adminUser = await User.findById(session.user.id);
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    await UserHolding.findOneAndDelete({ 
      userId: id, 
      symbol: symbol.toUpperCase() 
    });

    // Sync user balance to match total holdings
    const newTotalBalance = await syncUserBalanceFromHoldings(id);

    return NextResponse.json({
      success: true,
      message: `${symbol} holding removed`,
      newTotalBalance,
    });
  } catch (error) {
    console.error('Admin user holding delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete holding' },
      { status: 500 }
    );
  }
}
