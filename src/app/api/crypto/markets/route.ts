import { NextResponse } from 'next/server';
import { getMarketsData, MOCK_MARKETS } from '@/lib/coingecko';

// ============================================
// GET /api/crypto/markets - Fetch market data
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency') || 'usd';
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // Try to fetch from CoinGecko API
    try {
      const markets = await getMarketsData(currency, perPage, page);
      return NextResponse.json(markets);
    } catch (apiError) {
      console.error('CoinGecko API error, using mock data:', apiError);
      // Return mock data if API fails
      return NextResponse.json(MOCK_MARKETS);
    }
  } catch (error) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
