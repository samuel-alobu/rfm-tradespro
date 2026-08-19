import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { UserHolding, StockPosition, User } from '@/db/models';

// ============================================
// GET - Fetch all user assets (crypto + stocks)
// ============================================

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Get crypto holdings
    const cryptoHoldings = await UserHolding.find({
      userId,
      amount: { $gt: 0 },
    })
      .select('symbol name icon amount amountUsd type')
      .lean();

    // Get stock positions
    const stockPositions = await StockPosition.find({
      userId,
      status: 'active',
      quantity: { $gt: 0 },
    })
      .select('symbol name icon quantity currentPrice currentValue')
      .lean();

    // Get user for recent activities
    const user = await User.findById(userId)
      .select('notifications createdAt')
      .lean();

    // Transform crypto holdings
    const cryptoAssets = cryptoHoldings.map((holding: any) => ({
      id: holding._id.toString(),
      symbol: holding.symbol,
      name: holding.name,
      logo: holding.icon || '',
      type: 'Crypto' as const,
      currentPrice: holding.amount > 0 ? holding.amountUsd / holding.amount : 0,
      balance: holding.amount,
      value: holding.amountUsd,
    }));

    // Transform stock positions
    const stockAssets = stockPositions.map((position: any) => ({
      id: position._id.toString(),
      symbol: position.symbol,
      name: position.name,
      logo: position.icon || '',
      type: 'Stocks' as const,
      currentPrice: position.currentPrice,
      balance: position.quantity,
      value: position.currentValue,
    }));

    // Combine all assets
    const allAssets = [...cryptoAssets, ...stockAssets];

    // Calculate total balance
    const totalBalance = allAssets.reduce((sum, asset) => sum + asset.value, 0);

    // Get recent activities from notifications
    const recentActivities = (user?.notifications || [])
      .slice(0, 5)
      .map((n: any, index: number) => ({
        id: n._id?.toString() || `notif-${index}`,
        message: n.title || n.message,
        date: n.createdAt ? new Date(n.createdAt).toISOString() : null,
        type: n.type || 'info',
      }));

    // Add welcome message if no activities
    if (recentActivities.length === 0 && user?.createdAt) {
      recentActivities.push({
        id: 'welcome',
        message: 'Welcome to Rfm Tradepro!',
        date: new Date(user.createdAt).toISOString(),
        type: 'welcome',
      });
    }

    return NextResponse.json({
      assets: allAssets,
      totalBalance,
      recentActivities,
      counts: {
        crypto: cryptoAssets.length,
        stocks: stockAssets.length,
        total: allAssets.length,
      },
    });
  } catch (error) {
    console.error('Assets fetch error:', (error as Error).message);
    return NextResponse.json({
      assets: [],
      totalBalance: 0,
      recentActivities: [{
        id: 'welcome',
        message: 'Welcome to Rfm Tradepro!',
        date: null,
        type: 'welcome',
      }],
      counts: { crypto: 0, stocks: 0, total: 0 },
    });
  }
}
