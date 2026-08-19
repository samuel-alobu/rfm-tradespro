'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  Shield,
  Copy,
  Calendar,
  BarChart3,
  Target,
  Clock,
  Award,
  ExternalLink,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { cn, formatCurrency, formatPercentage } from '@/utils';
import { Trader } from './TraderCard';

// ============================================
// Trader Profile Modal Component
// ============================================

interface TraderProfileModalProps {
  trader: Trader | null;
  isOpen: boolean;
  onClose: () => void;
  onCopy?: (trader: Trader) => void;
}

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  profit: number;
  profitPercentage: number;
  date: Date;
}

// Mock trades
const mockTrades: Trade[] = [
  { id: '1', symbol: 'BTC/USD', side: 'buy', profit: 1234.56, profitPercentage: 5.67, date: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: '2', symbol: 'ETH/USD', side: 'sell', profit: -234.12, profitPercentage: -2.34, date: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: '3', symbol: 'SOL/USD', side: 'buy', profit: 567.89, profitPercentage: 8.90, date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: '4', symbol: 'BTC/USD', side: 'buy', profit: 890.12, profitPercentage: 3.45, date: new Date(Date.now() - 48 * 60 * 60 * 1000) },
  { id: '5', symbol: 'DOGE/USD', side: 'sell', profit: 123.45, profitPercentage: 12.34, date: new Date(Date.now() - 72 * 60 * 60 * 1000) },
];

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export const TraderProfileModal: React.FC<TraderProfileModalProps> = ({
  trader,
  isOpen,
  onClose,
  onCopy,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!trader) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <Avatar
            src={trader.avatar}
            fallback={trader.name.slice(0, 2)}
            size="xl"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                {trader.name}
              </h2>
              {trader.verified && (
                <Shield className="h-5 w-5 text-[var(--color-primary)]" />
              )}
            </div>
            <p className="text-[var(--color-text-muted)] mb-2">@{trader.username}</p>
            <div className="flex flex-wrap gap-1.5">
              {trader.tags.map((tag) => (
                <Badge key={tag} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-2">
              <Star className="h-5 w-5 text-[var(--color-warning)] fill-[var(--color-warning)]" />
              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                {trader.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              {trader.followers.toLocaleString()} followers
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl text-center">
            <p className="text-2xl font-bold text-[var(--color-success)]">
              +{formatPercentage(trader.profitPercentage)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">Total Return</p>
          </div>
          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {formatPercentage(trader.winRate)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">Win Rate</p>
          </div>
          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {trader.copiers.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">Copiers</p>
          </div>
          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {trader.trades.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">Total Trades</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trades">Recent Trades</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            {/* Performance Chart Placeholder */}
            <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-3">
                Monthly Performance
              </h4>
              <div className="h-32 flex items-end gap-1">
                {trader.monthlyReturns.map((ret, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 rounded-t transition-all',
                      ret >= 0 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'
                    )}
                    style={{ height: `${Math.min(100, Math.abs(ret) * 3 + 10)}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-[var(--color-text-muted)]">
                <span>12 months ago</span>
                <span>Now</span>
              </div>
            </div>

            {/* Trading Style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-[var(--color-primary)]" />
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    Trading Style
                  </span>
                </div>
                <p className="text-[var(--color-text-muted)] text-sm">
                  Swing trading with focus on major crypto pairs. Average holding period of 2-5 days.
                </p>
              </div>
              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-[var(--color-primary)]" />
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    Active Since
                  </span>
                </div>
                <p className="text-[var(--color-text-muted)] text-sm">
                  Trading on RFM TradePro since January 2023. 2+ years of experience.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trades" className="pt-4">
            <div className="space-y-2">
              {mockTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center',
                      trade.side === 'buy' ? 'bg-[var(--color-success-bg)]' : 'bg-[var(--color-error-bg)]'
                    )}>
                      {trade.side === 'buy' ? (
                        <TrendingUp className="h-4 w-4 text-[var(--color-success)]" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-[var(--color-error)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {trade.symbol}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatTimeAgo(trade.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'font-medium',
                      trade.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                    )}>
                      {trade.profit >= 0 ? '+' : ''}{formatCurrency(trade.profit)}
                    </p>
                    <p className={cn(
                      'text-xs',
                      trade.profitPercentage >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                    )}>
                      {trade.profitPercentage >= 0 ? '+' : ''}{trade.profitPercentage.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Avg. Profit per Trade</p>
                <p className="text-xl font-bold text-[var(--color-success)]">+$234.56</p>
              </div>
              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Avg. Loss per Trade</p>
                <p className="text-xl font-bold text-[var(--color-error)]">-$89.12</p>
              </div>
              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Best Month</p>
                <p className="text-xl font-bold text-[var(--color-success)]">+45.6%</p>
              </div>
              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Max Drawdown</p>
                <p className="text-xl font-bold text-[var(--color-error)]">-12.3%</p>
              </div>
              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Sharpe Ratio</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">2.34</p>
              </div>
              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Profit Factor</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">3.12</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Copy Settings */}
        <div className="p-4 bg-[var(--color-primary-muted)] border border-[var(--color-primary)]/20 rounded-xl">
          <h4 className="font-medium text-[var(--color-text-primary)] mb-3">
            Copy Trading Terms
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[var(--color-text-muted)]">Minimum Copy Amount</p>
              <p className="font-semibold text-[var(--color-text-primary)]">
                {formatCurrency(trader.minCopyAmount)}
              </p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)]">Profit Share</p>
              <p className="font-semibold text-[var(--color-text-primary)]">
                {trader.profitShare}%
              </p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)]">Risk Level</p>
              <Badge 
                variant={trader.riskLevel === 'low' ? 'success' : trader.riskLevel === 'medium' ? 'warning' : 'error'}
              >
                {trader.riskLevel.charAt(0).toUpperCase() + trader.riskLevel.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            className="flex-1"
            onClick={() => onCopy?.(trader)}
            leftIcon={<Copy className="h-4 w-4" />}
            disabled={trader.isCopying}
          >
            {trader.isCopying ? 'Already Copying' : 'Start Copying'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TraderProfileModal;
