'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  BarChart3,
  DollarSign,
  Coins,
  Building2,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { useLanguage } from '@/lib/i18n';
import { TranslationKeys } from '@/lib/i18n/translations';

// ============================================
// Professional Markets Page - Live Data
// ============================================

interface MarketAsset {
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

type FilterType = 'all' | 'crypto' | 'stock' | 'fiat';
type SortKey = 'rank' | 'name' | 'currentPrice' | 'priceChangePercent24h' | 'priceChangePercent7d' | 'marketCap';
type SortOrder = 'asc' | 'desc';

// Asset Logo Component
function AssetLogo({ asset, size = 36 }: { asset: MarketAsset; size?: number }) {
  const [imageError, setImageError] = useState(false);

  // For fiat currencies, we use flag emojis stored in image field
  if (asset.type === 'fiat') {
    return (
      <div 
        className="rounded-full bg-[#1a2332] flex items-center justify-center text-xl"
        style={{ width: size, height: size }}
      >
        {asset.image}
      </div>
    );
  }

  if (imageError) {
    // Fallback to colored initials
    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
    const colorIndex = asset.symbol.charCodeAt(0) % colors.length;
    return (
      <div 
        className="rounded-full flex items-center justify-center text-white font-bold"
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: colors[colorIndex],
          fontSize: size * 0.35
        }}
      >
        {asset.symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <div 
      className="rounded-full overflow-hidden bg-white flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Image
        src={asset.image}
        alt={asset.symbol}
        width={size}
        height={size}
        className="object-contain"
        onError={() => setImageError(true)}
        unoptimized
      />
    </div>
  );
}

// Sparkline Chart Component
function SparklineChart({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="h-10 w-24" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={positive ? '#22c55e' : '#ef4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Format large numbers
function formatLargeNumber(num: number): string {
  if (!num) return '-';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

// Type badge component
function TypeBadge({ type, small = false, t }: { type: 'crypto' | 'stock' | 'fiat'; small?: boolean; t: TranslationKeys }) {
  const config = {
    crypto: { icon: Coins, label: t.markets.crypto, color: 'bg-[#f59e0b]/10 text-[#f59e0b]' },
    stock: { icon: Building2, label: t.markets.stock, color: 'bg-[#3b82f6]/10 text-[#3b82f6]' },
    fiat: { icon: Globe, label: t.markets.fiat, color: 'bg-[#8b5cf6]/10 text-[#8b5cf6]' },
  };

  const { icon: Icon, label, color } = config[type];

  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 rounded-full font-medium',
      small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs gap-1',
      color
    )}>
      <Icon className={small ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {label}
    </span>
  );
}

export default function MarketsPage() {
  // Translation hook
  const { t } = useLanguage();
  
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch market data
  const fetchMarketData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch('/api/markets?type=all');
      const result = await response.json();

      if (result.success) {
        setAssets(result.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchMarketData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchMarketData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle sort
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'name' ? 'asc' : 'desc');
    }
  };

  // Filter and sort assets
  const filteredAssets = assets
    .filter((asset) => {
      // Type filter
      if (activeFilter !== 'all' && asset.type !== activeFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          asset.name.toLowerCase().includes(query) ||
          asset.symbol.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];

      // Handle string sorting
      if (sortKey === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }

      // Handle undefined values
      if (aVal === undefined) aVal = 0;
      if (bVal === undefined) bVal = 0;

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  // Stats calculations
  const cryptoCount = assets.filter(a => a.type === 'crypto').length;
  const stockCount = assets.filter(a => a.type === 'stock').length;
  const fiatCount = assets.filter(a => a.type === 'fiat').length;
  const avgChange = assets.length > 0 
    ? assets.reduce((sum, a) => sum + (a.priceChangePercent24h ?? 0), 0) / assets.length 
    : 0;

  const filters: { id: FilterType; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'all', label: t.markets.allMarkets, icon: BarChart3, count: assets.length },
    { id: 'crypto', label: t.markets.crypto, icon: Coins, count: cryptoCount },
    { id: 'stock', label: t.markets.stocks, icon: Building2, count: stockCount },
    { id: 'fiat', label: t.markets.fiat, icon: Globe, count: fiatCount },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">{t.markets.title}</h1>
          <p className="text-sm text-[#6b7a90] hidden sm:block">
            {t.markets.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-[#6b7a90] hidden sm:inline">
              {t.markets.updated} {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchMarketData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0f1419] border border-[#1e2733] text-white text-sm hover:bg-[#1a2332] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            <span className="hidden sm:inline">{t.markets.refresh}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Hide on mobile */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-[#22c55e]" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{assets.length}</p>
              <p className="text-xs text-[#6b7a90]">{t.markets.totalAssets}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center',
              avgChange >= 0 ? 'bg-[#22c55e]/10' : 'bg-[#ef4444]/10'
            )}>
              {avgChange >= 0 ? (
                <TrendingUp className="h-5 w-5 text-[#22c55e]" />
              ) : (
                <TrendingDown className="h-5 w-5 text-[#ef4444]" />
              )}
            </div>
            <div>
              <p className={cn(
                'text-lg font-bold',
                avgChange >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
              )}>
                {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
              </p>
              <p className="text-xs text-[#6b7a90]">{t.markets.avg24hChange}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-[#f59e0b]" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{cryptoCount}</p>
              <p className="text-xs text-[#6b7a90]">{t.markets.cryptocurrencies}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[#3b82f6]" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{stockCount}</p>
              <p className="text-xs text-[#6b7a90]">{t.markets.stocks}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
          <input
            type="text"
            placeholder={t.markets.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#0f1419] border border-[#1e2733] rounded-xl text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
                  activeFilter === filter.id
                    ? 'bg-[#22c55e] text-white'
                    : 'bg-[#0f1419] border border-[#1e2733] text-[#6b7a90] hover:text-white hover:border-[#2a3441]'
                )}
              >
                <filter.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{filter.label}</span>
                <span className="sm:hidden">{filter.id === 'all' ? t.common.all : filter.label}</span>
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-xs',
                  activeFilter === filter.id
                    ? 'bg-white/20 text-white'
                    : 'bg-[#1a2332] text-[#6b7a90]'
                )}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
          {/* Mobile scroll indicator */}
          <div className="sm:hidden absolute bottom-0 left-4 right-4 h-1 bg-[#1e2733] rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-[#22c55e]/50 rounded-full" />
          </div>
        </div>
      </div>

      {/* Market Table */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-[#0c1320] border-b border-[#1e2733] text-xs font-medium text-[#6b7a90]">
          <div className="col-span-1 flex items-center">
            <button onClick={() => handleSort('rank')} className="flex items-center gap-1 hover:text-white">
              {t.markets.rank} <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>
          <div className="col-span-3 lg:col-span-3">
            <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-white">
              {t.markets.name} <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>
          <div className="col-span-2 text-right">
            <button onClick={() => handleSort('currentPrice')} className="flex items-center gap-1 justify-end w-full hover:text-white">
              {t.markets.price} <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>
          <div className="col-span-2 text-right">
            <button onClick={() => handleSort('priceChangePercent24h')} className="flex items-center gap-1 justify-end w-full hover:text-white">
              {t.markets.change24h} <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>
          <div className="col-span-2 text-right">
            <button onClick={() => handleSort('marketCap')} className="flex items-center gap-1 justify-end w-full hover:text-white">
              {t.markets.marketCap} <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>
          <div className="col-span-2 text-right hidden lg:block">
            {t.markets.chart7d}
          </div>
        </div>

        {/* Mobile Table Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0c1320] border-b border-[#1e2733] text-xs font-medium text-[#6b7a90]">
          <div className="flex items-center gap-1">
            <button onClick={() => handleSort('rank')} className="hover:text-white flex items-center">
              {t.markets.rank} <ArrowUpDown className="h-3 w-3 ml-0.5" />
            </button>
            <button onClick={() => handleSort('name')} className="hover:text-white flex items-center ml-3">
              {t.markets.name} <ArrowUpDown className="h-3 w-3 ml-0.5" />
            </button>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => handleSort('currentPrice')} className="hover:text-white">
              {t.markets.price}
            </button>
            <button onClick={() => handleSort('priceChangePercent24h')} className="hover:text-white flex items-center">
              {t.markets.change24h} <ArrowUpDown className="h-3 w-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-[#22c55e] animate-spin mb-3" />
            <p className="text-[#6b7a90]">{t.markets.loadingMarketData}</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Coins className="h-12 w-12 text-[#6b7a90] mb-3" />
            <p className="text-[#6b7a90]">{t.markets.noAssetsFound}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2733]">
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.5) }}
                className="hover:bg-[#0c1320] transition-colors cursor-pointer group"
              >
                {/* Desktop Row */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-4 items-center">
                  {/* Rank & Favorite */}
                  <div className="col-span-1 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(asset.id);
                      }}
                      className="text-[#6b7a90] hover:text-[#f59e0b] transition-colors"
                    >
                      <Star className={cn(
                        'h-4 w-4',
                        favorites.has(asset.id) && 'fill-[#f59e0b] text-[#f59e0b]'
                      )} />
                    </button>
                    <span className="text-[#6b7a90] text-sm">{index + 1}</span>
                  </div>

                  {/* Name */}
                  <div className="col-span-3 lg:col-span-3 flex items-center gap-3">
                    <AssetLogo asset={asset} size={36} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">{asset.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#6b7a90]">{asset.symbol}</span>
                        <TypeBadge type={asset.type} t={t} />
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-right">
                    <p className="font-mono font-medium text-white">
                      {asset.type === 'fiat' 
                        ? (asset.currentPrice ?? 0).toFixed(4)
                        : formatCurrency(asset.currentPrice ?? 0)
                      }
                    </p>
                  </div>

                  {/* 24h Change */}
                  <div className="col-span-2 text-right">
                    <span className={cn(
                      'font-medium',
                      (asset.priceChangePercent24h ?? 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                    )}>
                      {(asset.priceChangePercent24h ?? 0) >= 0 ? '+' : ''}
                      {(asset.priceChangePercent24h ?? 0).toFixed(2)}%
                    </span>
                  </div>

                  {/* Market Cap */}
                  <div className="col-span-2 text-right text-[#6b7a90]">
                    {formatLargeNumber(asset.marketCap || 0)}
                  </div>

                  {/* Sparkline */}
                  <div className="col-span-2 justify-end hidden lg:flex">
                    {asset.sparkline && asset.sparkline.length > 0 && (
                      <SparklineChart 
                        data={asset.sparkline} 
                        positive={(asset.priceChangePercent24h ?? 0) >= 0} 
                      />
                    )}
                  </div>
                </div>

                {/* Mobile Row */}
                <div className="md:hidden px-4 py-3">
                  <div className="flex items-center justify-between">
                    {/* Left: Favorite + Logo + Name */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(asset.id);
                        }}
                        className="text-[#6b7a90] hover:text-[#f59e0b] transition-colors flex-shrink-0"
                      >
                        <Star className={cn(
                          'h-4 w-4',
                          favorites.has(asset.id) && 'fill-[#f59e0b] text-[#f59e0b]'
                        )} />
                      </button>
                      <AssetLogo asset={asset} size={32} />
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm truncate max-w-[100px]">{asset.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-[#6b7a90]">{asset.symbol}</span>
                          <TypeBadge type={asset.type} small t={t} />
                        </div>
                      </div>
                    </div>

                    {/* Right: Price + Change */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="font-mono text-sm font-medium text-white text-right">
                        {asset.type === 'fiat' 
                          ? (asset.currentPrice ?? 0).toFixed(4)
                          : formatCurrency(asset.currentPrice ?? 0)
                        }
                      </p>
                      <span className={cn(
                        'text-sm font-medium min-w-[60px] text-right',
                        (asset.priceChangePercent24h ?? 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                      )}>
                        {(asset.priceChangePercent24h ?? 0) >= 0 ? '+' : ''}
                        {(asset.priceChangePercent24h ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
