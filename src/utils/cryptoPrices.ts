// ============================================
// Crypto Price Utilities - Real Price Fetching
// ============================================

// CoinGecko ID mapping for symbols
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LTC: 'litecoin',
  TRX: 'tron',
  SHIB: 'shiba-inu',
};

// Fallback prices (used when API fails)
const FALLBACK_PRICES: Record<string, number> = {
  BTC: 87000,
  ETH: 3200,
  USDT: 1,
  USDC: 1,
  BNB: 590,
  SOL: 180,
  XRP: 0.52,
  DOGE: 0.08,
  ADA: 0.45,
  AVAX: 35,
  DOT: 7.5,
  MATIC: 0.85,
  LTC: 85,
  TRX: 0.11,
  SHIB: 0.000022,
};

// Cache for prices (5 minute TTL)
let priceCache: { prices: Record<string, number>; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch real crypto prices from CoinGecko API
 */
export async function fetchCryptoPrices(): Promise<Record<string, number>> {
  // Check cache first
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_TTL) {
    return priceCache.prices;
  }

  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      console.warn('CoinGecko API failed, using fallback prices');
      return FALLBACK_PRICES;
    }

    const data = await response.json();
    
    // Map CoinGecko response to our symbol format
    const prices: Record<string, number> = {};
    for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
      if (data[geckoId]?.usd) {
        prices[symbol] = data[geckoId].usd;
      } else {
        prices[symbol] = FALLBACK_PRICES[symbol] || 1;
      }
    }

    // Update cache
    priceCache = { prices, timestamp: Date.now() };
    
    return prices;
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    return FALLBACK_PRICES;
  }
}

/**
 * Get current price for a cryptocurrency (sync version using cache/fallback)
 */
export function getCryptoPrice(symbol: string): number {
  const upperSymbol = symbol.toUpperCase();
  
  // Use cached price if available
  if (priceCache?.prices[upperSymbol]) {
    return priceCache.prices[upperSymbol];
  }
  
  return FALLBACK_PRICES[upperSymbol] || 1;
}

/**
 * Get current price for a cryptocurrency (async version with fresh fetch)
 */
export async function getCryptoPriceAsync(symbol: string): Promise<number> {
  const prices = await fetchCryptoPrices();
  const upperSymbol = symbol.toUpperCase();
  return prices[upperSymbol] || FALLBACK_PRICES[upperSymbol] || 1;
}

/**
 * Convert USD amount to token amount
 */
export function usdToToken(usdAmount: number, tokenSymbol: string): number {
  const price = getCryptoPrice(tokenSymbol);
  return usdAmount / price;
}

/**
 * Convert USD amount to token amount (async with fresh price)
 */
export async function usdToTokenAsync(usdAmount: number, tokenSymbol: string): Promise<number> {
  const price = await getCryptoPriceAsync(tokenSymbol);
  return usdAmount / price;
}

/**
 * Convert token amount to USD
 */
export function tokenToUsd(tokenAmount: number, tokenSymbol: string): number {
  const price = getCryptoPrice(tokenSymbol);
  return tokenAmount * price;
}

/**
 * Format token amount with appropriate decimal places
 */
export function formatTokenAmount(amount: number, tokenSymbol: string): string {
  const upperSymbol = tokenSymbol.toUpperCase();
  
  // Determine decimal places based on token value
  let decimals = 8;
  
  if (['USDT', 'USDC', 'BUSD', 'DAI'].includes(upperSymbol)) {
    decimals = 2; // Stablecoins
  } else if (['SHIB', 'PEPE'].includes(upperSymbol)) {
    decimals = 0; // Very small value tokens
  } else if (['BTC'].includes(upperSymbol)) {
    decimals = 8; // Bitcoin - high precision
  } else if (['ETH', 'BNB', 'SOL'].includes(upperSymbol)) {
    decimals = 6; // Medium value tokens
  } else {
    decimals = 4;
  }
  
  // Format with appropriate decimals, removing trailing zeros
  const formatted = amount.toFixed(decimals);
  return formatted.replace(/\.?0+$/, '');
}

/**
 * Get all available crypto prices
 */
export function getAllCryptoPrices(): Record<string, number> {
  return priceCache?.prices || { ...FALLBACK_PRICES };
}

export default {
  fetchCryptoPrices,
  getCryptoPrice,
  getCryptoPriceAsync,
  usdToToken,
  usdToTokenAsync,
  tokenToUsd,
  formatTokenAmount,
  getAllCryptoPrices,
};

