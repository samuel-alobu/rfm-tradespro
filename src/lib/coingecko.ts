import type { CoinGeckoMarket, CoinGeckoPrice, CoinGeckoOHLC } from '@/types';

// ============================================
// CoinGecko API Service
// ============================================

const COINGECKO_API_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';

// Rate limiting - Free tier: 30 calls/min
let lastCallTime = 0;
const MIN_INTERVAL = 2000; // 2 seconds between calls

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < MIN_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL - timeSinceLastCall));
  }
  
  lastCallTime = Date.now();
  return fetch(url);
}

// ============================================
// API Functions
// ============================================

/**
 * Get current price for multiple coins
 */
export async function getCoinPrices(
  coinIds: string[],
  currency: string = 'usd'
): Promise<CoinGeckoPrice> {
  try {
    const ids = coinIds.join(',');
    const response = await rateLimitedFetch(
      `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=${currency}&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching coin prices:', error);
    throw error;
  }
}

/**
 * Get market data for coins (for tables/listings)
 */
export async function getMarketsData(
  currency: string = 'usd',
  perPage: number = 50,
  page: number = 1,
  sparkline: boolean = false
): Promise<CoinGeckoMarket[]> {
  try {
    const response = await rateLimitedFetch(
      `${COINGECKO_API_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=${sparkline}&price_change_percentage=24h`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching markets data:', error);
    throw error;
  }
}

/**
 * Get OHLC data for charts
 */
export async function getOHLCData(
  coinId: string,
  currency: string = 'usd',
  days: number = 7
): Promise<CoinGeckoOHLC[]> {
  try {
    const response = await rateLimitedFetch(
      `${COINGECKO_API_URL}/coins/${coinId}/ohlc?vs_currency=${currency}&days=${days}`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to our format
    return data.map((item: number[]) => ({
      time: item[0],
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
    }));
  } catch (error) {
    console.error('Error fetching OHLC data:', error);
    throw error;
  }
}

/**
 * Get historical market chart data
 */
export async function getMarketChart(
  coinId: string,
  currency: string = 'usd',
  days: number = 7
): Promise<{ prices: [number, number][]; market_caps: [number, number][]; total_volumes: [number, number][] }> {
  try {
    const response = await rateLimitedFetch(
      `${COINGECKO_API_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching market chart:', error);
    throw error;
  }
}

/**
 * Search for coins
 */
export async function searchCoins(query: string): Promise<{
  coins: Array<{
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    market_cap_rank: number;
  }>;
}> {
  try {
    const response = await rateLimitedFetch(
      `${COINGECKO_API_URL}/search?query=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching coins:', error);
    throw error;
  }
}

/**
 * Get trending coins
 */
export async function getTrendingCoins(): Promise<{
  coins: Array<{
    item: {
      id: string;
      name: string;
      symbol: string;
      thumb: string;
      market_cap_rank: number;
      price_btc: number;
    };
  }>;
}> {
  try {
    const response = await rateLimitedFetch(`${COINGECKO_API_URL}/search/trending`);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    throw error;
  }
}

/**
 * Get global market data
 */
export async function getGlobalData(): Promise<{
  data: {
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    active_cryptocurrencies: number;
    markets: number;
  };
}> {
  try {
    const response = await rateLimitedFetch(`${COINGECKO_API_URL}/global`);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching global data:', error);
    throw error;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Map common symbols to CoinGecko IDs
 */
export const COIN_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  AVAX: 'avalanche-2',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  TRX: 'tron',
  NEAR: 'near',
  APT: 'aptos',
  ARB: 'arbitrum',
  OP: 'optimism',
  USDT: 'tether',
  USDC: 'usd-coin',
};

/**
 * Get CoinGecko ID from symbol
 */
export function getCoinId(symbol: string): string {
  return COIN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
}

/**
 * Format price based on value
 */
export function formatCryptoPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (price >= 1) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  } else if (price >= 0.0001) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    });
  } else {
    return price.toExponential(4);
  }
}

// ============================================
// Mock Data for Development (fallback)
// ============================================

export const MOCK_MARKETS: CoinGeckoMarket[] = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    current_price: 67245.32,
    market_cap: 1324567890123,
    market_cap_rank: 1,
    total_volume: 28456789012,
    high_24h: 68100,
    low_24h: 66500,
    price_change_24h: 1234.56,
    price_change_percentage_24h: 1.87,
    circulating_supply: 19600000,
    total_supply: 21000000,
    ath: 73750,
    ath_change_percentage: -8.82,
    ath_date: '2024-03-14',
    last_updated: new Date().toISOString(),
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    current_price: 3456.78,
    market_cap: 415678901234,
    market_cap_rank: 2,
    total_volume: 15678901234,
    high_24h: 3520,
    low_24h: 3400,
    price_change_24h: -45.67,
    price_change_percentage_24h: -1.3,
    circulating_supply: 120000000,
    total_supply: 120000000,
    ath: 4878,
    ath_change_percentage: -29.14,
    ath_date: '2021-11-10',
    last_updated: new Date().toISOString(),
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    current_price: 145.23,
    market_cap: 67890123456,
    market_cap_rank: 5,
    total_volume: 3456789012,
    high_24h: 148,
    low_24h: 142,
    price_change_24h: 3.45,
    price_change_percentage_24h: 2.43,
    circulating_supply: 467000000,
    total_supply: 578000000,
    ath: 260,
    ath_change_percentage: -44.14,
    ath_date: '2021-11-06',
    last_updated: new Date().toISOString(),
  },
];
