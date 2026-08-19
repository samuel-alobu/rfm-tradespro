'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  Shield,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatCurrency, formatPercentage } from '@/utils';
import { Trader } from './TraderCard';

// ============================================
// Trader Leaderboard Component
// ============================================

interface TraderLeaderboardProps {
  traders: Trader[];
  onViewTrader?: (trader: Trader) => void;
  onCopyTrader?: (trader: Trader) => void;
  className?: string;
}

type SortOption = 'profit' | 'winRate' | 'copiers' | 'trades';
type TimeframeOption = '7d' | '30d' | '90d' | 'all';

export const TraderLeaderboard: React.FC<TraderLeaderboardProps> = ({
  traders,
  onViewTrader,
  onCopyTrader,
  className,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('profit');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('30d');

  const sortedTraders = [...traders].sort((a, b) => {
    switch (sortBy) {
      case 'profit':
        return b.profitPercentage - a.profitPercentage;
      case 'winRate':
        return b.winRate - a.winRate;
      case 'copiers':
        return b.copiers - a.copiers;
      case 'trades':
        return b.trades - a.trades;
      default:
        return 0;
    }
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-[var(--color-warning)]" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-[var(--color-text-muted)]">
            {index + 1}
          </span>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[var(--color-warning)]" />
          Top Traders
        </CardTitle>

        <div className="flex items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-[var(--color-surface-elevated)] p-1 rounded-lg">
            {(['7d', '30d', '90d', 'all'] as TimeframeOption[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded transition-colors',
                  timeframe === tf
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                )}
              >
                {tf === 'all' ? 'All' : tf.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 text-sm bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="profit">By Profit</option>
            <option value="winRate">By Win Rate</option>
            <option value="copiers">By Copiers</option>
            <option value="trades">By Trades</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {/* Header Row */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Trader</div>
          <div className="col-span-2 text-right">Profit</div>
          <div className="col-span-2 text-right">Win Rate</div>
          <div className="col-span-2 text-right">Copiers</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* Trader Rows */}
        <div className="divide-y divide-[var(--color-border)]">
          {sortedTraders.slice(0, 10).map((trader, index) => (
            <motion.div
              key={trader.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="grid grid-cols-12 gap-4 items-center py-4 px-4 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              onClick={() => onViewTrader?.(trader)}
            >
              {/* Rank */}
              <div className="col-span-1">
                {getRankIcon(index)}
              </div>

              {/* Trader Info */}
              <div className="col-span-5 md:col-span-3 flex items-center gap-3">
                <Avatar
                  src={trader.avatar}
                  fallback={trader.name.slice(0, 2)}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">
                      {trader.name}
                    </p>
                    {trader.verified && (
                      <Shield className="h-3.5 w-3.5 text-[var(--color-primary)] shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                    <Star className="h-3 w-3 text-[var(--color-warning)] fill-[var(--color-warning)]" />
                    {trader.rating.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Profit */}
              <div className="col-span-3 md:col-span-2 text-right">
                <p className={cn(
                  'font-semibold',
                  trader.profitPercentage >= 0
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-error)]'
                )}>
                  {trader.profitPercentage >= 0 ? '+' : ''}
                  {formatPercentage(trader.profitPercentage)}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] hidden md:block">
                  {formatCurrency(trader.totalProfit)}
                </p>
              </div>

              {/* Win Rate - Hidden on mobile */}
              <div className="hidden md:block col-span-2 text-right">
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {formatPercentage(trader.winRate)}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {trader.trades} trades
                </p>
              </div>

              {/* Copiers - Hidden on mobile */}
              <div className="hidden md:block col-span-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {trader.copiers.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="col-span-3 md:col-span-2 text-right">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyTrader?.(trader);
                  }}
                  disabled={trader.isCopying}
                >
                  {trader.isCopying ? 'Copying' : 'Copy'}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Link */}
        <div className="pt-4 text-center">
          <Button variant="ghost" rightIcon={<ChevronRight className="h-4 w-4" />}>
            View All Traders
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TraderLeaderboard;
