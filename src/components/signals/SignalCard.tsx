'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Signal Card Component
// ============================================

export interface Signal {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  status: 'active' | 'hit' | 'missed' | 'expired';
  entryPrice: number;
  currentPrice: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  timeframe: string;
  createdAt: Date;
  expiresAt: Date;
  analysis: string;
  riskReward: number;
}

interface SignalCardProps {
  signal: Signal;
  onTrade?: (signal: Signal) => void;
  className?: string;
}

const statusConfig = {
  active: { icon: Clock, color: 'text-[var(--color-info)]', bg: 'bg-[var(--color-info-bg)]', label: 'Active' },
  hit: { icon: CheckCircle, color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-bg)]', label: 'Target Hit' },
  missed: { icon: XCircle, color: 'text-[var(--color-error)]', bg: 'bg-[var(--color-error-bg)]', label: 'Stop Hit' },
  expired: { icon: Clock, color: 'text-[var(--color-text-muted)]', bg: 'bg-[var(--color-surface-elevated)]', label: 'Expired' },
};

export const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  onTrade,
  className,
}) => {
  const status = statusConfig[signal.status];
  const StatusIcon = status.icon;
  
  const priceChange = ((signal.currentPrice - signal.entryPrice) / signal.entryPrice) * 100;
  const isProfit = signal.type === 'buy' ? priceChange > 0 : priceChange < 0;
  
  const targetDistance = ((signal.targetPrice - signal.currentPrice) / signal.currentPrice) * 100;
  const stopDistance = ((signal.stopLoss - signal.currentPrice) / signal.currentPrice) * 100;

  const formatTimeRemaining = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'bg-[var(--color-surface)] border rounded-xl overflow-hidden',
        signal.status === 'active' 
          ? 'border-[var(--color-primary)]' 
          : 'border-[var(--color-border)]',
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        'px-4 py-3 flex items-center justify-between',
        signal.type === 'buy' ? 'bg-[var(--color-success)]/10' : 'bg-[var(--color-error)]/10'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center',
            signal.type === 'buy' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'
          )}>
            {signal.type === 'buy' ? (
              <TrendingUp className="h-5 w-5 text-white" />
            ) : (
              <TrendingDown className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--color-text-primary)]">
                {signal.symbol}
              </span>
              <Badge 
                variant={signal.type === 'buy' ? 'success' : 'error'} 
                size="sm"
              >
                {signal.type.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {signal.timeframe}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={status.color.includes('success') ? 'success' : status.color.includes('error') ? 'error' : status.color.includes('info') ? 'info' : 'default'} size="sm">
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Prices */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Entry</p>
            <p className="font-semibold text-[var(--color-text-primary)] font-mono">
              {formatCurrency(signal.entryPrice)}
            </p>
          </div>
          <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Current</p>
            <p className={cn(
              'font-semibold font-mono',
              isProfit ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
            )}>
              {formatCurrency(signal.currentPrice)}
            </p>
          </div>
          <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">P/L</p>
            <p className={cn(
              'font-semibold font-mono',
              isProfit ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
            )}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Target & Stop Loss */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-[var(--color-text-muted)] flex items-center gap-1">
                <Target className="h-3 w-3" /> Target
              </span>
              <span className="font-mono text-[var(--color-success)]">
                {formatCurrency(signal.targetPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)] flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Stop Loss
              </span>
              <span className="font-mono text-[var(--color-error)]">
                {formatCurrency(signal.stopLoss)}
              </span>
            </div>
          </div>
          <div className="text-center px-4 py-2 bg-[var(--color-surface-elevated)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)]">R:R</p>
            <p className="font-bold text-[var(--color-primary)]">
              1:{signal.riskReward.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Progress to Target */}
        {signal.status === 'active' && (
          <div>
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1">
              <span>Stop: {stopDistance.toFixed(1)}%</span>
              <span>Target: {targetDistance >= 0 ? '+' : ''}{targetDistance.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden relative">
              <div
                className="absolute inset-y-0 left-0 bg-[var(--color-error)]/30"
                style={{ width: '30%' }}
              />
              <div
                className="absolute inset-y-0 right-0 bg-[var(--color-success)]/30"
                style={{ width: '40%' }}
              />
              <div
                className="absolute top-0 bottom-0 w-1 bg-[var(--color-primary)]"
                style={{ left: '50%', transform: 'translateX(-50%)' }}
              />
            </div>
          </div>
        )}

        {/* Confidence */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-muted)]">Confidence</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'w-4 h-2 rounded-sm',
                    i <= Math.ceil(signal.confidence / 20)
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-[var(--color-border)]'
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {signal.confidence}%
            </span>
          </div>
          {signal.status === 'active' && (
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <Clock className="h-3 w-3" />
              {formatTimeRemaining(signal.expiresAt)}
            </div>
          )}
        </div>

        {/* Analysis */}
        <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
          {signal.analysis}
        </p>

        {/* Action */}
        {signal.status === 'active' && (
          <Button
            fullWidth
            onClick={() => onTrade?.(signal)}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className={cn(
              signal.type === 'buy'
                ? 'bg-[var(--color-success)] hover:bg-[var(--color-success)]/90'
                : 'bg-[var(--color-error)] hover:bg-[var(--color-error)]/90'
            )}
          >
            Trade Now
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default SignalCard;
