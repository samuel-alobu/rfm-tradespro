'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  X,
  Settings,
  MoreVertical,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatCurrency, formatPercentage } from '@/utils';

// ============================================
// Active Copies Component
// ============================================

interface ActiveCopy {
  id: string;
  trader: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  copyAmount: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
  status: 'active' | 'paused' | 'stopped';
  trades: number;
  startDate: Date;
}

interface ActiveCopiesProps {
  className?: string;
}

const mockActiveCopies: ActiveCopy[] = [
  {
    id: '1',
    trader: {
      id: 't1',
      name: 'Alex Thompson',
      username: 'alexcrypto',
    },
    copyAmount: 5000,
    currentValue: 5834.56,
    profit: 834.56,
    profitPercentage: 16.69,
    status: 'active',
    trades: 47,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    trader: {
      id: 't2',
      name: 'Sarah Chen',
      username: 'sarahdefi',
    },
    copyAmount: 2500,
    currentValue: 2234.12,
    profit: -265.88,
    profitPercentage: -10.64,
    status: 'active',
    trades: 23,
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    trader: {
      id: 't3',
      name: 'Michael Rodriguez',
      username: 'miketrader',
    },
    copyAmount: 1000,
    currentValue: 1000,
    profit: 0,
    profitPercentage: 0,
    status: 'paused',
    trades: 5,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

export const ActiveCopies: React.FC<ActiveCopiesProps> = ({ className }) => {
  const [copies, setCopies] = useState<ActiveCopy[]>(mockActiveCopies);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const toggleStatus = (id: string) => {
    setCopies((prev) =>
      prev.map((copy) =>
        copy.id === id
          ? { ...copy, status: copy.status === 'active' ? 'paused' : 'active' }
          : copy
      )
    );
  };

  const removeCopy = (id: string) => {
    setCopies((prev) => prev.filter((copy) => copy.id !== id));
  };

  const totalInvested = copies.reduce((acc, copy) => acc + copy.copyAmount, 0);
  const totalValue = copies.reduce((acc, copy) => acc + copy.currentValue, 0);
  const totalProfit = copies.reduce((acc, copy) => acc + copy.profit, 0);

  const formatDaysAgo = (date: Date): string => {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return `${days}d`;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Active Copy Trading</CardTitle>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {copies.filter((c) => c.status === 'active').length} active, {copies.filter((c) => c.status === 'paused').length} paused
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
            <p className="text-sm text-[var(--color-text-muted)] mb-1">Total Invested</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">
              {formatCurrency(totalInvested)}
            </p>
          </div>
          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
            <p className="text-sm text-[var(--color-text-muted)] mb-1">Current Value</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
            <p className="text-sm text-[var(--color-text-muted)] mb-1">Total P/L</p>
            <p className={cn(
              'text-xl font-bold',
              totalProfit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
            )}>
              {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
            </p>
          </div>
        </div>

        {/* Active Copies List */}
        {copies.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-[var(--color-text-muted)]">No active copy trading</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Start by copying a trader from the marketplace
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {copies.map((copy) => (
                <motion.div
                  key={copy.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={cn(
                    'p-4 bg-[var(--color-surface-elevated)] rounded-xl border',
                    copy.status === 'paused'
                      ? 'border-[var(--color-warning)]/30'
                      : 'border-transparent'
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={copy.trader.avatar}
                        fallback={copy.trader.name.slice(0, 2)}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[var(--color-text-primary)]">
                            {copy.trader.name}
                          </h4>
                          <Badge
                            variant={copy.status === 'active' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {copy.status.charAt(0).toUpperCase() + copy.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          @{copy.trader.username} • Started {formatDaysAgo(copy.startDate)} ago
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(showMenu === copy.id ? null : copy.id)}
                        className="p-2 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-[var(--color-text-muted)]" />
                      </button>

                      <AnimatePresence>
                        {showMenu === copy.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg z-10 py-1"
                          >
                            <button
                              onClick={() => {
                                toggleStatus(copy.id);
                                setShowMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                            >
                              {copy.status === 'active' ? (
                                <>
                                  <Pause className="h-4 w-4" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4" />
                                  Resume
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => setShowMenu(null)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                            >
                              <Settings className="h-4 w-4" />
                              Settings
                            </button>
                            <button
                              onClick={() => {
                                removeCopy(copy.id);
                                setShowMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error-bg)]"
                            >
                              <X className="h-4 w-4" />
                              Stop Copying
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Invested</p>
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {formatCurrency(copy.copyAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Current Value</p>
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {formatCurrency(copy.currentValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">P/L</p>
                      <div className="flex items-center gap-1">
                        {copy.profit >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-[var(--color-success)]" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-[var(--color-error)]" />
                        )}
                        <p className={cn(
                          'font-semibold',
                          copy.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                        )}>
                          {copy.profit >= 0 ? '+' : ''}{formatCurrency(copy.profit)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Trades</p>
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {copy.trades}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          copy.profitPercentage >= 0
                            ? 'bg-[var(--color-success)]'
                            : 'bg-[var(--color-error)]'
                        )}
                        style={{
                          width: `${Math.min(100, Math.abs(copy.profitPercentage) + 50)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-[var(--color-text-muted)]">
                      <span>ROI</span>
                      <span className={cn(
                        copy.profitPercentage >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                      )}>
                        {copy.profitPercentage >= 0 ? '+' : ''}{formatPercentage(copy.profitPercentage)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveCopies;
