'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Clock, TrendingUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency, formatPercentage } from '@/utils';

// ============================================
// Staking Card Component
// ============================================

export interface StakingPool {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  apy: number;
  minStake: number;
  maxStake: number;
  lockPeriod: number; // days
  totalStaked: number;
  yourStake: number;
  rewards: number;
  status: 'active' | 'full' | 'ended';
  flexible: boolean;
}

interface StakingCardProps {
  pool: StakingPool;
  onStake?: (pool: StakingPool) => void;
  onUnstake?: (pool: StakingPool) => void;
  onClaim?: (pool: StakingPool) => void;
  className?: string;
}

export const StakingCard: React.FC<StakingCardProps> = ({
  pool,
  onStake,
  onUnstake,
  onClaim,
  className,
}) => {
  const utilizationRate = (pool.totalStaked / pool.maxStake) * 100;
  const hasStake = pool.yourStake > 0;
  const hasRewards = pool.rewards > 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden hover:border-[var(--color-primary)] transition-all',
        className
      )}
    >
      {/* Header */}
      <div className="p-5 border-b border-[var(--color-border)]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center text-2xl">
              {pool.icon}
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text-primary)]">{pool.name}</h3>
              <p className="text-sm text-[var(--color-text-muted)]">{pool.symbol}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[var(--color-success)]">
              {formatPercentage(pool.apy)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">APY</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2">
          <Badge variant={pool.flexible ? 'success' : 'warning'} size="sm">
            {pool.flexible ? (
              <><Unlock className="h-3 w-3 mr-1" /> Flexible</>
            ) : (
              <><Lock className="h-3 w-3 mr-1" /> {pool.lockPeriod} Days</>
            )}
          </Badge>
          <Badge 
            variant={pool.status === 'active' ? 'success' : pool.status === 'full' ? 'warning' : 'default'} 
            size="sm"
          >
            {pool.status.charAt(0).toUpperCase() + pool.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Staked</p>
            <p className="font-semibold text-[var(--color-text-primary)]">
              {formatCurrency(pool.totalStaked)}
            </p>
          </div>
          <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Min / Max Stake</p>
            <p className="font-semibold text-[var(--color-text-primary)]">
              ${pool.minStake.toLocaleString()} / ${pool.maxStake.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Utilization Bar */}
        <div>
          <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1">
            <span>Pool Utilization</span>
            <span>{utilizationRate.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                utilizationRate > 90 ? 'bg-[var(--color-error)]' :
                utilizationRate > 70 ? 'bg-[var(--color-warning)]' :
                'bg-[var(--color-primary)]'
              )}
              style={{ width: `${Math.min(100, utilizationRate)}%` }}
            />
          </div>
        </div>

        {/* Your Position */}
        {hasStake && (
          <div className="p-4 bg-[var(--color-primary-muted)] border border-[var(--color-primary)]/20 rounded-xl">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Your Position</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {formatCurrency(pool.yourStake)}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">Staked</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[var(--color-success)]">
                  +{formatCurrency(pool.rewards)}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">Rewards</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {hasStake ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => onUnstake?.(pool)}
                disabled={!pool.flexible && pool.status === 'active'}
              >
                Unstake
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onClaim?.(pool)}
                disabled={!hasRewards}
              >
                Claim {hasRewards && formatCurrency(pool.rewards)}
              </Button>
            </>
          ) : (
            <Button
              fullWidth
              onClick={() => onStake?.(pool)}
              disabled={pool.status !== 'active'}
            >
              Stake {pool.symbol}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StakingCard;
