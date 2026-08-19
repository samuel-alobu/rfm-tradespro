import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, UserHolding, StockPosition, ColdStorage, RealEstateInvestment } from '@/db/models';

// GET - Fetch all users' portfolio breakdowns (admin)
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
    const validAdminRoles = ['admin', 'superadmin', 'super_admin'];
    if (!admin || !validAdminRoles.includes(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all users with their basic info
    const users = await User.find({ role: 'user' })
      .select('firstName lastName email availableBalance totalBalance createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // For each user, get their portfolio breakdown
    const portfolios = await Promise.all(
      users.map(async (user: any) => {
        const userId = user._id;

        // Fetch all portfolio components in parallel
        const [holdings, stocks, coldStorage, realEstate] = await Promise.all([
          UserHolding.find({ userId, amountUsd: { $gt: 0 } }).lean(),
          StockPosition.find({ userId, status: 'active' }).lean(),
          ColdStorage.find({ userId, status: 'active' }).lean(),
          RealEstateInvestment.find({ userId, status: 'active' }).lean(),
        ]);

        // Calculate totals
        const cryptoValue = holdings.reduce((sum: number, h: any) => sum + (h.amountUsd || 0), 0);
        const stocksValue = stocks.reduce((sum: number, s: any) => sum + (s.currentValue || 0), 0);
        const coldStorageValue = coldStorage.reduce((sum: number, c: any) => sum + (c.currentValue || 0), 0);
        const realEstateValue = realEstate.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
        const totalPortfolioValue = cryptoValue + stocksValue + coldStorageValue + realEstateValue;

        return {
          id: user._id.toString(),
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
          email: user.email,
          availableBalance: user.availableBalance || 0,
          totalBalance: user.totalBalance || 0,
          portfolio: {
            totalValue: totalPortfolioValue,
            cryptoValue,
            stocksValue,
            coldStorageValue,
            realEstateValue,
          },
          holdings: holdings.map((h: any) => ({
            symbol: h.symbol,
            name: h.name,
            amount: h.amount,
            amountUsd: h.amountUsd,
          })),
          stocks: stocks.map((s: any) => ({
            symbol: s.symbol,
            name: s.name,
            quantity: s.quantity,
            currentValue: s.currentValue,
            pnl: s.currentValue - s.totalInvested,
          })),
          coldStorage: coldStorage.map((c: any) => ({
            symbol: c.symbol,
            quantity: c.quantity,
            currentValue: c.currentValue,
          })),
          realEstateCount: realEstate.length,
          realEstateValue,
          createdAt: user.createdAt,
        };
      })
    );

    // Calculate platform totals
    const platformStats = {
      totalUsers: portfolios.length,
      totalCryptoValue: portfolios.reduce((sum, p) => sum + p.portfolio.cryptoValue, 0),
      totalStocksValue: portfolios.reduce((sum, p) => sum + p.portfolio.stocksValue, 0),
      totalColdStorageValue: portfolios.reduce((sum, p) => sum + p.portfolio.coldStorageValue, 0),
      totalRealEstateValue: portfolios.reduce((sum, p) => sum + p.portfolio.realEstateValue, 0),
      totalPortfolioValue: portfolios.reduce((sum, p) => sum + p.portfolio.totalValue, 0),
      totalAvailableBalance: portfolios.reduce((sum, p) => sum + p.availableBalance, 0),
    };

    return NextResponse.json({
      portfolios,
      stats: platformStats,
    });
  } catch (error) {
    console.error('Admin portfolios fetch error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
