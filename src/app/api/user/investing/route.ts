import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, UserHolding, StockPosition, RealEstateInvestment } from '@/db/models';

// GET - Fetch user's complete portfolio
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Fetch all data in parallel
    const [user, holdings, stockPositions, realEstateInvestments] = await Promise.all([
      User.findById(userId).select('availableBalance totalBalance').lean(),
      UserHolding.find({ userId, amountUsd: { $gt: 0 } }).sort({ amountUsd: -1 }).lean(),
      StockPosition.find({ userId, status: 'active' }).sort({ currentValue: -1 }).lean(),
      RealEstateInvestment.find({ userId, status: 'active' })
        .populate('propertyId', 'title location images targetAmount currentAmount status expectedReturn')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate totals
    const cryptoValue = holdings.reduce((sum: number, h: any) => sum + (h.amountUsd || 0), 0);
    const stocksValue = stockPositions.reduce((sum: number, s: any) => sum + (s.currentValue || 0), 0);
    const realEstateValue = realEstateInvestments.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    const portfolioValue = cryptoValue + stocksValue + realEstateValue;

    return NextResponse.json({
      portfolio: {
        totalValue: portfolioValue,
        availableBalance: user.availableBalance || 0,
        totalBalance: user.totalBalance || 0,
        cryptoValue,
        stocksValue,
        realEstateValue,
      },
      holdings: holdings.map((h: any) => ({
        id: h._id.toString(),
        symbol: h.symbol,
        name: h.name,
        type: h.type,
        icon: h.icon,
        amount: h.amount,
        amountUsd: h.amountUsd,
        averagePrice: h.averagePrice,
        currentPrice: h.amount > 0 ? h.amountUsd / h.amount : 0,
      })),
      stocks: stockPositions.map((s: any) => ({
        id: s._id.toString(),
        symbol: s.symbol,
        name: s.name,
        icon: s.icon,
        quantity: s.quantity,
        purchasePrice: s.purchasePrice,
        currentPrice: s.currentPrice,
        currentValue: s.currentValue,
        totalInvested: s.totalInvested,
        pnl: s.currentValue - s.totalInvested,
        pnlPercent: s.totalInvested > 0 ? ((s.currentValue - s.totalInvested) / s.totalInvested) * 100 : 0,
      })),
      realEstate: realEstateInvestments.map((r: any) => ({
        id: r._id.toString(),
        propertyId: r.propertyId?._id?.toString() || '',
        title: r.propertyId?.title || 'Property',
        location: r.propertyId?.location || '',
        image: r.propertyId?.images?.[0] || '',
        amount: r.amount,
        expectedReturn: r.propertyId?.expectedReturn || 0,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Investing portfolio fetch error:', (error as Error).message);
    return NextResponse.json({
      portfolio: {
        totalValue: 0,
        availableBalance: 0,
        totalBalance: 0,
        cryptoValue: 0,
        stocksValue: 0,
        realEstateValue: 0,
      },
      holdings: [],
      stocks: [],
      realEstate: [],
    });
  }
}
