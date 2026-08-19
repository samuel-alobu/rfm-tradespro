'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn, formatCurrency, formatCompact, formatPercentage } from '@/utils';

// ============================================
// Markets Table Component - Mixed Crypto & Stocks
// ============================================

interface MarketItem {
  id: string;
  rank: number;
  name: string;
  symbol: string;
  image: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
  type: 'crypto' | 'stock';
}

// Static data for landing page - mix of crypto and stocks
const marketData: MarketItem[] = [
  { id: 'bitcoin', rank: 1, name: 'Bitcoin', symbol: 'BTC', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', price: 67234.50, change24h: 1.87, marketCap: 1320000000000, volume: 28460000000, type: 'crypto' },
  { id: 'ethereum', rank: 2, name: 'Ethereum', symbol: 'ETH', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', price: 3456.78, change24h: 1.30, marketCap: 415680000000, volume: 15680000000, type: 'crypto' },
  { id: 'apple', rank: 3, name: 'Apple Inc.', symbol: 'AAPL', image: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128', price: 178.72, change24h: 0.85, marketCap: 2780000000000, volume: 52340000000, type: 'stock' },
  { id: 'microsoft', rank: 4, name: 'Microsoft', symbol: 'MSFT', image: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128', price: 378.91, change24h: 1.23, marketCap: 2810000000000, volume: 21450000000, type: 'stock' },
  { id: 'solana', rank: 5, name: 'Solana', symbol: 'SOL', image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', price: 148.32, change24h: 2.43, marketCap: 67890000000, volume: 3460000000, type: 'crypto' },
  { id: 'nvidia', rank: 6, name: 'NVIDIA', symbol: 'NVDA', image: 'https://www.google.com/s2/favicons?domain=nvidia.com&sz=128', price: 875.28, change24h: 2.15, marketCap: 2160000000000, volume: 45670000000, type: 'stock' },
  { id: 'xrp', rank: 7, name: 'XRP', symbol: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', price: 0.52, change24h: -0.82, marketCap: 28900000000, volume: 1230000000, type: 'crypto' },
  { id: 'tesla', rank: 8, name: 'Tesla Inc.', symbol: 'TSLA', image: 'https://www.google.com/s2/favicons?domain=tesla.com&sz=128', price: 175.45, change24h: -1.45, marketCap: 558000000000, volume: 98760000000, type: 'stock' },
  { id: 'cardano', rank: 9, name: 'Cardano', symbol: 'ADA', image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', price: 0.45, change24h: 0.67, marketCap: 15800000000, volume: 456000000, type: 'crypto' },
  { id: 'amazon', rank: 10, name: 'Amazon', symbol: 'AMZN', image: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=128', price: 178.25, change24h: 0.92, marketCap: 1860000000000, volume: 32100000000, type: 'stock' },
  { id: 'dogecoin', rank: 11, name: 'Dogecoin', symbol: 'DOGE', image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', price: 0.125, change24h: 3.21, marketCap: 17900000000, volume: 1890000000, type: 'crypto' },
  { id: 'meta', rank: 12, name: 'Meta Platforms', symbol: 'META', image: 'https://www.google.com/s2/favicons?domain=meta.com&sz=128', price: 485.58, change24h: 1.78, marketCap: 1240000000000, volume: 18900000000, type: 'stock' },
  { id: 'polygon', rank: 13, name: 'Polygon', symbol: 'MATIC', image: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png', price: 0.58, change24h: -0.45, marketCap: 5400000000, volume: 234000000, type: 'crypto' },
  { id: 'google', rank: 14, name: 'Alphabet Inc.', symbol: 'GOOGL', image: 'https://www.google.com/s2/favicons?domain=google.com&sz=128', price: 153.51, change24h: 0.56, marketCap: 1920000000000, volume: 21300000000, type: 'stock' },
  { id: 'avalanche', rank: 15, name: 'Avalanche', symbol: 'AVAX', image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', price: 35.67, change24h: 1.89, marketCap: 13400000000, volume: 567000000, type: 'crypto' },
];

interface MarketsTableProps {
  className?: string;
  limit?: number;
}

export const MarketsTable: React.FC<MarketsTableProps> = ({
  className,
  limit = 15,
}) => {
  const displayMarkets = marketData.slice(0, limit);

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="text-right py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="text-right py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              24h %
            </th>
            <th className="text-right py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Market Cap
            </th>
            <th className="text-right py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Volume (24h)
            </th>
          </tr>
        </thead>
        <tbody>
          {displayMarkets.map((item) => {
            const isPositive = item.change24h >= 0;
            return (
              <tr
                key={item.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="py-4 px-4 text-sm" style={{ color: '#6b7280' }}>
                  {item.rank}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="32px"
                        className="rounded-full object-cover bg-gray-100"
                      />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#111827' }}>
                        {item.name}
                      </p>
                      <p className="text-xs uppercase" style={{ color: '#6b7280' }}>
                        {item.symbol}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium" style={{ color: '#111827' }}>
                    {formatCurrency(item.price)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span
                    className="inline-flex items-center gap-1 font-medium"
                    style={{ color: isPositive ? '#16a34a' : '#dc2626' }}
                  >
                    {isPositive ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {formatPercentage(Math.abs(item.change24h))}
                  </span>
                </td>
                <td className="py-4 px-4 text-right hidden md:table-cell">
                  <span style={{ color: '#4b5563' }}>
                    {formatCompact(item.marketCap)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right hidden lg:table-cell">
                  <span style={{ color: '#4b5563' }}>
                    {formatCompact(item.volume)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MarketsTable;
