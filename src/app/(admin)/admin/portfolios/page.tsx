'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Snowflake,
  Building2,
  Coins,
  Users,
  X,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Portfolios Management Page
// ============================================

interface Holding {
  symbol: string;
  name: string;
  amount: number;
  amountUsd: number;
}

interface StockPosition {
  symbol: string;
  name: string;
  quantity: number;
  currentValue: number;
  pnl: number;
}

interface ColdStorageItem {
  symbol: string;
  quantity: number;
  currentValue: number;
}

interface UserPortfolio {
  id: string;
  name: string;
  email: string;
  availableBalance: number;
  totalBalance: number;
  portfolio: {
    totalValue: number;
    cryptoValue: number;
    stocksValue: number;
    coldStorageValue: number;
    realEstateValue: number;
  };
  holdings: Holding[];
  stocks: StockPosition[];
  coldStorage: ColdStorageItem[];
  realEstateCount: number;
  realEstateValue: number;
  createdAt: string;
}

interface PlatformStats {
  totalUsers: number;
  totalCryptoValue: number;
  totalStocksValue: number;
  totalColdStorageValue: number;
  totalRealEstateValue: number;
  totalPortfolioValue: number;
  totalAvailableBalance: number;
}

export default function AdminPortfoliosPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [portfolios, setPortfolios] = useState<UserPortfolio[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const fetchData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    
    try {
      const res = await fetch('/api/admin/portfolios');
      const data = await res.json();

      if (res.ok) {
        setPortfolios(data.portfolios || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.log('Portfolios fetch error:', (error as Error).message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPortfolios = portfolios.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-[#3b82f6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">User Portfolios</h1>
            <p className="text-sm text-[#6b7a90]">View all users&apos; investment breakdowns</p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e2733] text-white rounded-lg hover:bg-[#2a3441] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-[#6b7a90]" />
            <span className="text-xs text-[#6b7a90]">Users</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isLoading ? <span className="inline-block w-12 h-6 bg-[#1e2733] rounded animate-pulse" /> : stats?.totalUsers || 0}
          </p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-4 w-4 text-[#3b82f6]" />
            <span className="text-xs text-[#6b7a90]">Total Portfolio</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isLoading ? <span className="inline-block w-20 h-6 bg-[#1e2733] rounded animate-pulse" /> : formatCurrency(stats?.totalPortfolioValue || 0)}
          </p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="h-4 w-4 text-[#f59e0b]" />
            <span className="text-xs text-[#6b7a90]">Crypto</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isLoading ? <span className="inline-block w-20 h-6 bg-[#1e2733] rounded animate-pulse" /> : formatCurrency(stats?.totalCryptoValue || 0)}
          </p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-[#22c55e]" />
            <span className="text-xs text-[#6b7a90]">Stocks</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isLoading ? <span className="inline-block w-20 h-6 bg-[#1e2733] rounded animate-pulse" /> : formatCurrency(stats?.totalStocksValue || 0)}
          </p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Snowflake className="h-4 w-4 text-[#06b6d4]" />
            <span className="text-xs text-[#6b7a90]">Cold Storage</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isLoading ? <span className="inline-block w-20 h-6 bg-[#1e2733] rounded animate-pulse" /> : formatCurrency(stats?.totalColdStorageValue || 0)}
          </p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-[#8b5cf6]" />
            <span className="text-xs text-[#6b7a90]">Real Estate</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isLoading ? <span className="inline-block w-20 h-6 bg-[#1e2733] rounded animate-pulse" /> : formatCurrency(stats?.totalRealEstateValue || 0)}
          </p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-[#6b7a90]">Available</span>
          </div>
          <p className="text-xl font-bold text-[#22c55e]">
            {isLoading ? <span className="inline-block w-20 h-6 bg-[#1e2733] rounded animate-pulse" /> : formatCurrency(stats?.totalAvailableBalance || 0)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder:text-[#6b7a90] focus:outline-none focus:border-[#3b82f6]"
        />
      </div>

      {/* Portfolios List */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
              <div className="h-16 bg-[#1e2733] rounded animate-pulse" />
            </div>
          ))
        ) : filteredPortfolios.length === 0 ? (
          <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-8 text-center text-[#6b7a90]">
            {searchQuery ? 'No users match your search' : 'No user portfolios found'}
          </div>
        ) : (
          filteredPortfolios.map((portfolio) => (
            <div key={portfolio.id} className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
              {/* Main Row */}
              <button
                onClick={() => toggleExpand(portfolio.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#151c24] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#1e2733] flex items-center justify-center text-white font-medium">
                    {portfolio.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">{portfolio.name}</p>
                    <p className="text-sm text-[#6b7a90]">{portfolio.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-sm text-[#6b7a90]">Portfolio Value</p>
                    <p className="font-semibold text-white">{formatCurrency(portfolio.portfolio.totalValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#6b7a90]">Available</p>
                    <p className="font-semibold text-[#22c55e]">{formatCurrency(portfolio.availableBalance)}</p>
                  </div>
                  {expandedUserId === portfolio.id ? (
                    <ChevronUp className="h-5 w-5 text-[#6b7a90]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#6b7a90]" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedUserId === portfolio.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-[#1e2733]"
                  >
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-[#151c24] rounded-lg p-3">
                        <p className="text-xs text-[#6b7a90] mb-1">Crypto Holdings</p>
                        <p className="font-semibold text-[#f59e0b]">{formatCurrency(portfolio.portfolio.cryptoValue)}</p>
                      </div>
                      <div className="bg-[#151c24] rounded-lg p-3">
                        <p className="text-xs text-[#6b7a90] mb-1">Stocks</p>
                        <p className="font-semibold text-[#22c55e]">{formatCurrency(portfolio.portfolio.stocksValue)}</p>
                      </div>
                      <div className="bg-[#151c24] rounded-lg p-3">
                        <p className="text-xs text-[#6b7a90] mb-1">Cold Storage</p>
                        <p className="font-semibold text-[#06b6d4]">{formatCurrency(portfolio.portfolio.coldStorageValue)}</p>
                      </div>
                      <div className="bg-[#151c24] rounded-lg p-3">
                        <p className="text-xs text-[#6b7a90] mb-1">Real Estate</p>
                        <p className="font-semibold text-[#8b5cf6]">{formatCurrency(portfolio.portfolio.realEstateValue)}</p>
                      </div>
                    </div>

                    {/* Crypto Holdings */}
                    {portfolio.holdings.length > 0 && (
                      <div className="px-4 pb-4">
                        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          <Coins className="h-4 w-4 text-[#f59e0b]" />
                          Crypto Holdings
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {portfolio.holdings.map((h, i) => (
                            <div key={i} className="bg-[#151c24] rounded-lg p-2 text-sm">
                              <span className="text-white font-medium">{h.symbol}</span>
                              <p className="text-[#6b7a90]">{h.amount.toFixed(4)}</p>
                              <p className="text-[#22c55e]">{formatCurrency(h.amountUsd)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stock Positions */}
                    {portfolio.stocks.length > 0 && (
                      <div className="px-4 pb-4">
                        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-[#22c55e]" />
                          Stock Positions
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {portfolio.stocks.map((s, i) => (
                            <div key={i} className="bg-[#151c24] rounded-lg p-2 text-sm">
                              <span className="text-white font-medium">{s.symbol}</span>
                              <p className="text-[#6b7a90]">{s.quantity.toFixed(2)} shares</p>
                              <p className="text-[#22c55e]">{formatCurrency(s.currentValue)}</p>
                              <p className={cn('text-xs', s.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                                {s.pnl >= 0 ? '+' : ''}{formatCurrency(s.pnl)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cold Storage */}
                    {portfolio.coldStorage.length > 0 && (
                      <div className="px-4 pb-4">
                        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          <Snowflake className="h-4 w-4 text-[#06b6d4]" />
                          Cold Storage
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {portfolio.coldStorage.map((c, i) => (
                            <div key={i} className="bg-[#151c24] rounded-lg p-2 text-sm">
                              <span className="text-white font-medium">{c.symbol}</span>
                              <p className="text-[#6b7a90]">{c.quantity.toFixed(4)}</p>
                              <p className="text-[#06b6d4]">{formatCurrency(c.currentValue)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Real Estate */}
                    {portfolio.realEstateCount > 0 && (
                      <div className="px-4 pb-4">
                        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#8b5cf6]" />
                          Real Estate Investments
                        </h4>
                        <div className="bg-[#151c24] rounded-lg p-2 text-sm inline-block">
                          <span className="text-white font-medium">{portfolio.realEstateCount} properties</span>
                          <p className="text-[#8b5cf6]">{formatCurrency(portfolio.realEstateValue)}</p>
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {portfolio.holdings.length === 0 && portfolio.stocks.length === 0 && portfolio.coldStorage.length === 0 && portfolio.realEstateCount === 0 && (
                      <div className="px-4 pb-4 text-[#6b7a90] text-sm">
                        No investments yet
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
