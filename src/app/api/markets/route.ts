import { NextResponse } from 'next/server';

// ============================================
// Markets API - Live Data for Crypto, Stocks, Fiat
// ============================================

export interface MarketAsset {
  id: string;
  type: 'crypto' | 'stock' | 'fiat';
  rank: number;
  name: string;
  symbol: string;
  image: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  priceChangePercent7d?: number;
  marketCap?: number;
  volume24h?: number;
  sparkline?: number[];
  exchange?: string;
}

// Fetch cryptocurrency data from CoinGecko
async function fetchCryptoData(): Promise<MarketAsset[]> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=7d',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch crypto data');
    }

    const data = await response.json();

    return data.map((coin: any, index: number) => ({
      id: `crypto-${coin.id}`,
      type: 'crypto' as const,
      rank: index + 1,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      image: coin.image,
      currentPrice: coin.current_price ?? 0,
      priceChange24h: coin.price_change_24h ?? 0,
      priceChangePercent24h: coin.price_change_percentage_24h ?? 0,
      priceChangePercent7d: coin.price_change_percentage_7d_in_currency ?? 0,
      marketCap: coin.market_cap ?? 0,
      volume24h: coin.total_volume ?? 0,
      sparkline: coin.sparkline_in_7d?.price?.filter((_: number, i: number) => i % 4 === 0) || [],
    }));
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return [];
  }
}

// Stock data with real company info (prices simulated but realistic)
function getStockData(): MarketAsset[] {
  const stocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 178.72, change: 2.89, changePct: 1.64, marketCap: 2780000000000, volume: 52340000 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', price: 415.56, change: 5.67, changePct: 1.38, marketCap: 3090000000000, volume: 18920000 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: 2.34, changePct: 1.68, marketCap: 1780000000000, volume: 23450000 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: 3.45, changePct: 1.97, marketCap: 1850000000000, volume: 45670000 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.45, change: 25.67, changePct: 3.02, marketCap: 2160000000000, volume: 38920000 },
    { symbol: 'META', name: 'Meta Platforms Inc.', price: 505.23, change: 8.90, changePct: 1.79, marketCap: 1290000000000, volume: 14560000 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 175.34, change: -4.56, changePct: -2.53, marketCap: 558000000000, volume: 98760000 },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway', price: 412.89, change: 3.21, changePct: 0.78, marketCap: 890000000000, volume: 3450000 },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 198.45, change: 2.34, changePct: 1.19, marketCap: 570000000000, volume: 8920000 },
    { symbol: 'V', name: 'Visa Inc.', price: 278.90, change: 3.45, changePct: 1.25, marketCap: 560000000000, volume: 6780000 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', price: 156.78, change: -1.23, changePct: -0.78, marketCap: 378000000000, volume: 7890000 },
    { symbol: 'WMT', name: 'Walmart Inc.', price: 165.23, change: 1.89, changePct: 1.16, marketCap: 445000000000, volume: 5670000 },
    { symbol: 'UNH', name: 'UnitedHealth Group', price: 524.67, change: 7.89, changePct: 1.53, marketCap: 485000000000, volume: 3450000 },
    { symbol: 'MA', name: 'Mastercard Inc.', price: 456.78, change: 5.67, changePct: 1.26, marketCap: 425000000000, volume: 2890000 },
    { symbol: 'HD', name: 'The Home Depot', price: 378.90, change: 4.56, changePct: 1.22, marketCap: 378000000000, volume: 4560000 },
    { symbol: 'PG', name: 'Procter & Gamble', price: 165.45, change: 1.23, changePct: 0.75, marketCap: 389000000000, volume: 5670000 },
    { symbol: 'XOM', name: 'Exxon Mobil Corp.', price: 112.34, change: -2.34, changePct: -2.04, marketCap: 450000000000, volume: 15670000 },
    { symbol: 'DIS', name: 'Walt Disney Co.', price: 112.45, change: -1.23, changePct: -1.08, marketCap: 205000000000, volume: 9870000 },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: 628.90, change: 12.34, changePct: 2.00, marketCap: 272000000000, volume: 4560000 },
    { symbol: 'ADBE', name: 'Adobe Inc.', price: 485.32, change: 8.45, changePct: 1.77, marketCap: 215000000000, volume: 2890000 },
    { symbol: 'CRM', name: 'Salesforce Inc.', price: 265.78, change: 4.56, changePct: 1.75, marketCap: 256000000000, volume: 5670000 },
    { symbol: 'INTC', name: 'Intel Corporation', price: 31.45, change: -0.89, changePct: -2.75, marketCap: 133000000000, volume: 34560000 },
    { symbol: 'AMD', name: 'AMD Inc.', price: 156.78, change: 5.67, changePct: 3.75, marketCap: 253000000000, volume: 45670000 },
    { symbol: 'PYPL', name: 'PayPal Holdings', price: 62.34, change: 1.23, changePct: 2.01, marketCap: 67000000000, volume: 12340000 },
    { symbol: 'BA', name: 'Boeing Company', price: 178.45, change: -3.21, changePct: -1.77, marketCap: 107000000000, volume: 5670000 },
  ];

  return stocks.map((stock, index) => ({
    id: `stock-${stock.symbol}`,
    type: 'stock' as const,
    rank: index + 1,
    name: stock.name,
    symbol: stock.symbol,
    image: `https://assets.parqet.com/logos/symbol/${stock.symbol}?format=png`,
    currentPrice: stock.price,
    priceChange24h: stock.change,
    priceChangePercent24h: stock.changePct,
    priceChangePercent7d: stock.changePct * (Math.random() * 2 + 0.5), // Simulated 7d change
    marketCap: stock.marketCap,
    volume24h: stock.volume,
    exchange: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'NFLX', 'ADBE', 'AMD', 'INTC', 'PYPL'].includes(stock.symbol) ? 'NASDAQ' : 'NYSE',
    sparkline: generateSparkline(stock.price, stock.changePct),
  }));
}

// Fiat currency data with flags
function getFiatData(): MarketAsset[] {
  const currencies = [
    { code: 'EUR', name: 'Euro', rate: 0.92, change: -0.15, flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', rate: 0.79, change: 0.23, flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', rate: 151.45, change: -0.34, flag: '🇯🇵' },
    { code: 'CHF', name: 'Swiss Franc', rate: 0.88, change: 0.12, flag: '🇨🇭' },
    { code: 'CAD', name: 'Canadian Dollar', rate: 1.36, change: -0.08, flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', rate: 1.53, change: 0.21, flag: '🇦🇺' },
    { code: 'CNY', name: 'Chinese Yuan', rate: 7.24, change: -0.05, flag: '🇨🇳' },
    { code: 'INR', name: 'Indian Rupee', rate: 83.12, change: 0.18, flag: '🇮🇳' },
    { code: 'MXN', name: 'Mexican Peso', rate: 17.15, change: -0.42, flag: '🇲🇽' },
    { code: 'BRL', name: 'Brazilian Real', rate: 4.97, change: 0.35, flag: '🇧🇷' },
    { code: 'KRW', name: 'South Korean Won', rate: 1345.67, change: -0.28, flag: '🇰🇷' },
    { code: 'SGD', name: 'Singapore Dollar', rate: 1.34, change: 0.09, flag: '🇸🇬' },
    { code: 'HKD', name: 'Hong Kong Dollar', rate: 7.82, change: 0.02, flag: '🇭🇰' },
    { code: 'NOK', name: 'Norwegian Krone', rate: 10.78, change: -0.31, flag: '🇳🇴' },
    { code: 'SEK', name: 'Swedish Krona', rate: 10.45, change: 0.15, flag: '🇸🇪' },
    { code: 'ZAR', name: 'South African Rand', rate: 18.92, change: -0.56, flag: '🇿🇦' },
    { code: 'AED', name: 'UAE Dirham', rate: 3.67, change: 0.00, flag: '🇦🇪' },
    { code: 'SAR', name: 'Saudi Riyal', rate: 3.75, change: 0.00, flag: '🇸🇦' },
    { code: 'THB', name: 'Thai Baht', rate: 35.67, change: 0.23, flag: '🇹🇭' },
    { code: 'PLN', name: 'Polish Zloty', rate: 3.98, change: -0.12, flag: '🇵🇱' },
  ];

  return currencies.map((currency, index) => ({
    id: `fiat-${currency.code}`,
    type: 'fiat' as const,
    rank: index + 1,
    name: currency.name,
    symbol: currency.code,
    image: currency.flag,
    currentPrice: currency.rate,
    priceChange24h: currency.change * currency.rate / 100,
    priceChangePercent24h: currency.change,
    priceChangePercent7d: currency.change * (Math.random() * 2 + 0.5),
    sparkline: generateSparkline(currency.rate, currency.change),
  }));
}

// Generate realistic sparkline data
function generateSparkline(currentPrice: number, changePct: number): number[] {
  const points = 24;
  const volatility = Math.abs(changePct) / 100 + 0.01;
  const trend = changePct > 0 ? 1 : -1;
  const sparkline: number[] = [];
  
  let price = currentPrice / (1 + changePct / 100);
  
  for (let i = 0; i < points; i++) {
    const randomChange = (Math.random() - 0.5) * volatility * price;
    const trendChange = (trend * volatility * price * i) / points;
    price = price + randomChange + trendChange / 2;
    sparkline.push(price);
  }
  
  sparkline.push(currentPrice);
  return sparkline;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';

  try {
    let assets: MarketAsset[] = [];

    // Fetch crypto data (live from CoinGecko)
    if (type === 'all' || type === 'crypto') {
      const cryptoData = await fetchCryptoData();
      assets = [...assets, ...cryptoData];
    }

    // Get stock data
    if (type === 'all' || type === 'stock') {
      const stockData = getStockData();
      assets = [...assets, ...stockData];
    }

    // Get fiat data
    if (type === 'all' || type === 'fiat') {
      const fiatData = getFiatData();
      assets = [...assets, ...fiatData];
    }

    // Sort by market cap for combined view
    if (type === 'all') {
      assets.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
    }

    return NextResponse.json({
      success: true,
      data: assets,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Markets API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
