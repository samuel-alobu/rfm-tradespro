'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, TrendingUp, TrendingDown, ChevronDown, X } from 'lucide-react';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Trading Pair Selector Component
// ============================================

interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  isFavorite?: boolean;
}

interface TradingPairSelectorProps {
  selectedPair: TradingPair;
  onSelectPair: (pair: TradingPair) => void;
  className?: string;
}

const mockPairs: TradingPair[] = [
  { symbol: 'BTC/USD', baseAsset: 'BTC', quoteAsset: 'USD', price: 86423.12, change24h: 2.45, volume24h: 28500000000, isFavorite: true },
  { symbol: 'ETH/USD', baseAsset: 'ETH', quoteAsset: 'USD', price: 3264.78, change24h: -1.23, volume24h: 15200000000, isFavorite: true },
  { symbol: 'SOL/USD', baseAsset: 'SOL', quoteAsset: 'USD', price: 145.32, change24h: 5.67, volume24h: 2800000000, isFavorite: false },
  { symbol: 'XRP/USD', baseAsset: 'XRP', quoteAsset: 'USD', price: 0.5234, change24h: 3.21, volume24h: 1500000000, isFavorite: false },
  { symbol: 'ADA/USD', baseAsset: 'ADA', quoteAsset: 'USD', price: 0.4523, change24h: -0.89, volume24h: 890000000, isFavorite: false },
  { symbol: 'DOGE/USD', baseAsset: 'DOGE', quoteAsset: 'USD', price: 0.0834, change24h: 8.45, volume24h: 1200000000, isFavorite: false },
  { symbol: 'DOT/USD', baseAsset: 'DOT', quoteAsset: 'USD', price: 7.23, change24h: 1.56, volume24h: 450000000, isFavorite: false },
  { symbol: 'AVAX/USD', baseAsset: 'AVAX', quoteAsset: 'USD', price: 35.67, change24h: 4.32, volume24h: 680000000, isFavorite: false },
  { symbol: 'LINK/USD', baseAsset: 'LINK', quoteAsset: 'USD', price: 14.89, change24h: -2.15, volume24h: 520000000, isFavorite: false },
  { symbol: 'MATIC/USD', baseAsset: 'MATIC', quoteAsset: 'USD', price: 0.9123, change24h: 0.78, volume24h: 340000000, isFavorite: false },
  { symbol: 'BTC/ETH', baseAsset: 'BTC', quoteAsset: 'ETH', price: 26.48, change24h: 1.12, volume24h: 120000000, isFavorite: false },
  { symbol: 'ETH/BTC', baseAsset: 'ETH', quoteAsset: 'BTC', price: 0.0378, change24h: -1.08, volume24h: 95000000, isFavorite: false },
];

const formatVolume = (volume: number): string => {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
  return `$${volume.toFixed(2)}`;
};

type FilterCategory = 'all' | 'favorites' | 'usd' | 'btc' | 'eth';

export const TradingPairSelector: React.FC<TradingPairSelectorProps> = ({
  selectedPair,
  onSelectPair,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [pairs, setPairs] = useState<TradingPair[]>(mockPairs);

  const filteredPairs = useMemo(() => {
    return pairs
      .filter((pair) => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            pair.symbol.toLowerCase().includes(query) ||
            pair.baseAsset.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .filter((pair) => {
        // Category filter
        switch (filter) {
          case 'favorites':
            return pair.isFavorite;
          case 'usd':
            return pair.quoteAsset === 'USD';
          case 'btc':
            return pair.quoteAsset === 'BTC';
          case 'eth':
            return pair.quoteAsset === 'ETH';
          default:
            return true;
        }
      })
      .sort((a, b) => b.volume24h - a.volume24h);
  }, [pairs, searchQuery, filter]);

  const toggleFavorite = (symbol: string) => {
    setPairs((prev) =>
      prev.map((pair) =>
        pair.symbol === symbol ? { ...pair, isFavorite: !pair.isFavorite } : pair
      )
    );
  };

  return (
    <div className={cn('relative', className)}>
      {/* Selected Pair Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center">
            <span className="text-xs font-bold text-[var(--color-primary)]">
              {selectedPair.baseAsset.slice(0, 2)}
            </span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-[var(--color-text-primary)]">
              {selectedPair.symbol}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {formatCurrency(selectedPair.price)}
            </p>
          </div>
        </div>
        <ChevronDown className={cn(
          'h-4 w-4 text-[var(--color-text-muted)] transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-[400px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-3 border-b border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[var(--color-text-primary)]">Select Pair</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-[var(--color-surface-hover)] rounded-md transition-colors"
                  >
                    <X className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </button>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search pairs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    autoFocus
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 mt-3">
                  {(['all', 'favorites', 'usd', 'btc', 'eth'] as FilterCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={cn(
                        'px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize',
                        filter === cat
                          ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                      )}
                    >
                      {cat === 'favorites' ? '★' : cat.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pairs List */}
              <div className="max-h-[350px] overflow-y-auto">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)]">
                  <span className="col-span-1"></span>
                  <span className="col-span-4">Pair</span>
                  <span className="col-span-3 text-right">Price</span>
                  <span className="col-span-2 text-right">24h</span>
                  <span className="col-span-2 text-right">Volume</span>
                </div>

                {filteredPairs.length === 0 ? (
                  <div className="py-8 text-center text-[var(--color-text-muted)]">
                    No pairs found
                  </div>
                ) : (
                  filteredPairs.map((pair) => (
                    <button
                      key={pair.symbol}
                      onClick={() => {
                        onSelectPair(pair);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full grid grid-cols-12 gap-2 px-3 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors items-center',
                        selectedPair.symbol === pair.symbol && 'bg-[var(--color-primary-muted)]'
                      )}
                    >
                      {/* Favorite */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(pair.symbol);
                        }}
                        className="col-span-1"
                      >
                        <Star
                          className={cn(
                            'h-4 w-4 transition-colors',
                            pair.isFavorite
                              ? 'fill-[var(--color-warning)] text-[var(--color-warning)]'
                              : 'text-[var(--color-text-muted)] hover:text-[var(--color-warning)]'
                          )}
                        />
                      </button>

                      {/* Pair Info */}
                      <div className="col-span-4 flex items-center gap-2 text-left">
                        <div className="h-6 w-6 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-[var(--color-primary)]">
                            {pair.baseAsset.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">
                            {pair.baseAsset}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {pair.quoteAsset}
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <span className="col-span-3 text-right text-sm font-mono text-[var(--color-text-primary)]">
                        {pair.price < 1 
                          ? pair.price.toFixed(4)
                          : pair.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        }
                      </span>

                      {/* 24h Change */}
                      <span className={cn(
                        'col-span-2 text-right text-sm font-medium flex items-center justify-end gap-0.5',
                        pair.change24h >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                      )}>
                        {pair.change24h >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(pair.change24h).toFixed(2)}%
                      </span>

                      {/* Volume */}
                      <span className="col-span-2 text-right text-xs text-[var(--color-text-muted)]">
                        {formatVolume(pair.volume24h)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TradingPairSelector;
