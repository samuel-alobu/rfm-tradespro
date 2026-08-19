import { NextRequest, NextResponse } from 'next/server';

// ============================================
// Crypto Price API - Fetch real-time prices
// ============================================

// CoinGecko API for real-time prices
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Map common symbols to CoinGecko IDs
const symbolToId: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  LTC: 'litecoin',
  AVAX: 'avalanche-2',
  ATOM: 'cosmos',
  SHIB: 'shiba-inu',
  TRX: 'tron',
  ETC: 'ethereum-classic',
  XLM: 'stellar',
};

// Cache for prices (expires after 60 seconds)
let priceCache: { prices: Record<string, number>; timestamp: number } | null = null;
const CACHE_DURATION = 60000; // 60 seconds

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();
    const coingeckoId = searchParams.get('id'); // Support fetching by CoinGecko ID directly

    // If fetching a specific token by CoinGecko ID
    if (coingeckoId) {
      try {
        const response = await fetch(
          `${COINGECKO_API}/simple/price?ids=${coingeckoId}&vs_currencies=usd`,
          {
            headers: { Accept: 'application/json' },
            next: { revalidate: 60 },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const price = data[coingeckoId]?.usd || 0;
          return NextResponse.json({
            success: true,
            id: coingeckoId,
            price,
          });
        }
      } catch {
        // Fall through to return 0
      }
      return NextResponse.json({
        success: true,
        id: coingeckoId,
        price: 0,
        fallback: true,
      });
    }

    // Check if we have a valid cache
    const now = Date.now();
    if (priceCache && now - priceCache.timestamp < CACHE_DURATION) {
      if (symbol) {
        const price = priceCache.prices[symbol];
        return NextResponse.json({
          success: true,
          symbol,
          price: price || 0,
          cached: true,
        });
      }
      return NextResponse.json({
        success: true,
        prices: priceCache.prices,
        cached: true,
      });
    }

    // Fetch fresh prices from CoinGecko
    const ids = Object.values(symbolToId).join(',');
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd`,
      {
        headers: {
          Accept: 'application/json',
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      // Return fallback prices if API fails
      return NextResponse.json({
        success: true,
        prices: getFallbackPrices(),
        fallback: true,
      });
    }

    const data = await response.json();

    // Convert CoinGecko response to symbol-based prices
    const prices: Record<string, number> = {};
    for (const [sym, id] of Object.entries(symbolToId)) {
      if (data[id]?.usd) {
        prices[sym] = data[id].usd;
      }
    }

    // Update cache
    priceCache = { prices, timestamp: now };

    if (symbol) {
      return NextResponse.json({
        success: true,
        symbol,
        price: prices[symbol] || 0,
      });
    }

    return NextResponse.json({
      success: true,
      prices,
    });
  } catch (error) {
    console.error('Price fetch error:', error);
    // Return fallback prices on error
    return NextResponse.json({
      success: true,
      prices: getFallbackPrices(),
      fallback: true,
    });
  }
}

// Fallback prices in case API fails
function getFallbackPrices(): Record<string, number> {
  return {
    BTC: 67500,
    ETH: 3450,
    USDT: 1,
    USDC: 1,
    BNB: 580,
    SOL: 145,
    XRP: 0.52,
    ADA: 0.45,
    DOGE: 0.12,
    DOT: 7.20,
    MATIC: 0.58,
    LINK: 14.50,
    UNI: 7.80,
    LTC: 72,
    AVAX: 35,
    ATOM: 8.50,
    SHIB: 0.000024,
    TRX: 0.12,
    ETC: 26,
    XLM: 0.11,
  };
}
