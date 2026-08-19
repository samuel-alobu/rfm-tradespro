import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/connection';
import { DepositToken } from '@/db/models';

// Fallback tokens if DB is unavailable
const fallbackTokens = [
  { _id: 'btc', symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', networks: [{ name: 'Bitcoin', address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', isActive: true }], isActive: true, order: 1 },
  { _id: 'eth', symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', networks: [{ name: 'ERC20', address: '0x86eE640C10769C154c1a509042E4eE9215343AE2', isActive: true }], isActive: true, order: 2 },
  { _id: 'usdt', symbol: 'USDT', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', networks: [{ name: 'ERC20', address: '0x86eE640C10769C154c1a509042E4eE9215343AE2', isActive: true }, { name: 'TRC20', address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9', isActive: true }], isActive: true, order: 3 },
];

// GET - Fetch active deposit tokens (public)
export async function GET() {
  try {
    await connectToDatabase();

    const tokens = await DepositToken.find({ isActive: true })
      .select('symbol name image networks isActive order')
      .sort({ order: 1 })
      .lean();

    // Filter to only show active networks
    const tokensWithActiveNetworks = tokens.map(token => ({
      ...token,
      networks: token.networks?.filter((n: { isActive: boolean }) => n.isActive) || [],
    }));

    return NextResponse.json({ tokens: tokensWithActiveNetworks });
  } catch (error) {
    console.error('Deposit tokens error:', (error as Error).message);
    // Graceful degradation - return fallback tokens
    return NextResponse.json({ tokens: fallbackTokens });
  }
}
