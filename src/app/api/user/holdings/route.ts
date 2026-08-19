import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { UserHolding, DepositToken } from '@/db/models';

// ============================================
// GET - Fetch user holdings with balance > 0
// Returns tokens the user can withdraw
// ============================================

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Get all user holdings with balance > 0
    const holdings = await UserHolding.find({
      userId,
      amount: { $gt: 0 },
    })
      .select('symbol name icon amount amountUsd type')
      .lean();

    // Get deposit tokens to map networks for crypto holdings
    const depositTokens = await DepositToken.find({ isActive: true })
      .select('symbol name image networks')
      .lean();

    // Create a map of symbol to networks
    const tokenNetworks: Record<string, { name: string; networks: string[] }> = {};
    depositTokens.forEach((token: any) => {
      const activeNetworks = token.networks
        .filter((n: any) => n.isActive)
        .map((n: any) => n.name);
      tokenNetworks[token.symbol] = {
        name: token.name,
        networks: activeNetworks,
      };
    });

    // Enhance holdings with network info
    const enhancedHoldings = holdings.map((holding: any) => {
      const tokenInfo = tokenNetworks[holding.symbol];
      return {
        id: holding._id.toString(),
        symbol: holding.symbol,
        name: holding.name,
        icon: holding.icon,
        type: holding.type,
        amount: holding.amount,
        amountUsd: holding.amountUsd,
        networks: tokenInfo?.networks || getDefaultNetworks(holding.symbol),
      };
    });

    // Sort by USD value descending
    enhancedHoldings.sort((a: any, b: any) => b.amountUsd - a.amountUsd);

    return NextResponse.json({ 
      holdings: enhancedHoldings,
      count: enhancedHoldings.length,
    });
  } catch (error) {
    console.error('Holdings fetch error:', (error as Error).message);
    return NextResponse.json({ holdings: [], count: 0 });
  }
}

// Default networks for common tokens if not in DepositToken collection
function getDefaultNetworks(symbol: string): string[] {
  const defaults: Record<string, string[]> = {
    BTC: ['Bitcoin'],
    ETH: ['ERC20', 'Arbitrum', 'Optimism'],
    USDT: ['ERC20', 'TRC20', 'BEP20'],
    USDC: ['ERC20', 'Solana', 'Polygon'],
    BNB: ['BEP20', 'BEP2'],
    SOL: ['Solana'],
    XRP: ['Ripple'],
    DOGE: ['Dogecoin'],
    ADA: ['Cardano'],
    AVAX: ['Avalanche C-Chain'],
    DOT: ['Polkadot'],
    MATIC: ['Polygon', 'ERC20'],
    LINK: ['ERC20'],
    LTC: ['Litecoin'],
    UNI: ['ERC20'],
    AAVE: ['ERC20'],
    ATOM: ['Cosmos'],
    NEAR: ['NEAR'],
    FTM: ['Fantom'],
    ALGO: ['Algorand'],
    SHIB: ['ERC20'],
  };
  return defaults[symbol] || ['ERC20'];
}
