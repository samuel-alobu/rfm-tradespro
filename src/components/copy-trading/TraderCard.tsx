'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Star, 
  Shield, 
  Copy,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatCurrency, formatPercentage } from '@/utils';

// ============================================
// Trader Card Component
// ============================================

export interface Trader {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  verified: boolean;
  rating: number;
  followers: number;
  copiers: number;
  totalProfit: number;
  profitPercentage: number;
  winRate: number;
  trades: number;
  riskLevel: 'low' | 'medium' | 'high';
  minCopyAmount: number;
  profitShare: number;
  monthlyReturns: number[];
  tags: string[];
  isFollowing?: boolean;
  isCopying?: boolean;
}

interface TraderCardProps {
  trader: Trader;
  onViewProfile?: (trader: Trader) => void;
  onFollow?: (trader: Trader) => void;
  onCopy?: (trader: Trader) => void;
  className?: string;
}

const riskColors = {
  low: 'text-[var(--color-success)] bg-[var(--color-success-bg)]',
  medium: 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]',
  high: 'text-[var(--color-error)] bg-[var(--color-error-bg)]',
};

export const TraderCard: React.FC<TraderCardProps> = ({
  trader,
  onViewProfile,
  onFollow,
  onCopy,
  className,
}) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-primary)] transition-all',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={trader.avatar}
            fallback={trader.name.slice(0, 2)}
            size="lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[var(--color-text-primary)]">
                {trader.name}
              </h3>
              {trader.verified && (
                <Shield className="h-4 w-4 text-[var(--color-primary)]" />
              )}
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">@{trader.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-[var(--color-warning)] fill-[var(--color-warning)]" />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {trader.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {trader.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" size="sm">
            {tag}
          </Badge>
        ))}
        <Badge variant={riskColors[trader.riskLevel].includes('success') ? 'success' : riskColors[trader.riskLevel].includes('warning') ? 'warning' : 'error'} size="sm">
          {trader.riskLevel.charAt(0).toUpperCase() + trader.riskLevel.slice(1)} Risk
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Profit</p>
          <p className={cn(
            'text-lg font-bold',
            trader.profitPercentage >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
          )}>
            {trader.profitPercentage >= 0 ? '+' : ''}{formatPercentage(trader.profitPercentage)}
          </p>
        </div>
        <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Win Rate</p>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">
            {formatPercentage(trader.winRate)}
          </p>
        </div>
        <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Copiers</p>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
            <p className="text-lg font-bold text-[var(--color-text-primary)]">
              {trader.copiers.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Trades</p>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">
            {trader.trades.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="h-12 mb-4 flex items-end gap-0.5">
        {trader.monthlyReturns.map((ret, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-t transition-all',
              ret >= 0 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'
            )}
            style={{ height: `${Math.min(100, Math.abs(ret) * 2 + 20)}%` }}
          />
        ))}
      </div>

      {/* Copy Info */}
      <div className="flex items-center justify-between text-sm mb-4 py-3 border-t border-b border-[var(--color-border)]">
        <div>
          <span className="text-[var(--color-text-muted)]">Min. Copy: </span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {formatCurrency(trader.minCopyAmount)}
          </span>
        </div>
        <div>
          <span className="text-[var(--color-text-muted)]">Profit Share: </span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {trader.profitShare}%
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => onViewProfile?.(trader)}
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          View
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onCopy?.(trader)}
          leftIcon={<Copy className="h-4 w-4" />}
          disabled={trader.isCopying}
        >
          {trader.isCopying ? 'Copying' : 'Copy'}
        </Button>
      </div>
    </motion.div>
  );
};

export default TraderCard;
