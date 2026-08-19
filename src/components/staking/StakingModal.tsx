'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Unlock, Info, Check, AlertTriangle, TrendingUp } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency, formatPercentage } from '@/utils';
import { StakingPool } from './StakingCard';

// ============================================
// Staking Modal Component
// ============================================

interface StakingModalProps {
  pool: StakingPool | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (poolId: string, amount: number) => void;
  availableBalance?: number;
}

const stakeSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be greater than 0'
  ),
});

type StakeFormData = z.infer<typeof stakeSchema>;

export const StakingModal: React.FC<StakingModalProps> = ({
  pool,
  isOpen,
  onClose,
  onConfirm,
  availableBalance = 25000,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StakeFormData>({
    resolver: zodResolver(stakeSchema),
    defaultValues: {
      amount: '',
    },
  });

  const amount = parseFloat(watch('amount')) || 0;

  const handleClose = () => {
    setSuccess(false);
    reset();
    onClose();
  };

  const onSubmit = async (data: StakeFormData) => {
    if (!pool) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    onConfirm?.(pool.id, parseFloat(data.amount));
    setIsSubmitting(false);
    setSuccess(true);

    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  if (!pool) return null;

  // Calculate estimated rewards
  const dailyRate = pool.apy / 365 / 100;
  const estimatedDaily = amount * dailyRate;
  const estimatedMonthly = estimatedDaily * 30;
  const estimatedYearly = amount * (pool.apy / 100);

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Success" size="md">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-success-bg)] mb-4">
            <Check className="h-8 w-8 text-[var(--color-success)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Staking Successful!
          </h3>
          <p className="text-[var(--color-text-muted)]">
            You have staked {formatCurrency(amount)} in {pool.name}
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Stake ${pool.symbol}`} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Pool Info */}
        <div className="flex items-center gap-4 p-4 bg-[var(--color-surface-elevated)] rounded-xl">
          <div className="h-14 w-14 rounded-xl bg-[var(--color-surface)] flex items-center justify-center text-3xl">
            {pool.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[var(--color-text-primary)]">{pool.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={pool.flexible ? 'success' : 'warning'} size="sm">
                {pool.flexible ? 'Flexible' : `${pool.lockPeriod} Days Lock`}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[var(--color-success)]">
              {formatPercentage(pool.apy)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">APY</p>
          </div>
        </div>

        {/* Available Balance */}
        <div className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg">
          <span className="text-sm text-[var(--color-text-muted)]">Available Balance</span>
          <span className="font-semibold text-[var(--color-text-primary)]">
            {formatCurrency(availableBalance)}
          </span>
        </div>

        {/* Amount Input */}
        <div>
          <Input
            label="Stake Amount"
            type="number"
            placeholder="Enter amount"
            leftIcon={<span className="text-[var(--color-text-muted)]">$</span>}
            error={errors.amount?.message}
            {...register('amount')}
          />
          <div className="flex gap-2 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setValue('amount', ((availableBalance * pct) / 100).toString())}
                className="flex-1 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Min: {formatCurrency(pool.minStake)} • Max: {formatCurrency(pool.maxStake)}
          </p>
        </div>

        {/* Estimated Returns */}
        {amount > 0 && (
          <div className="p-4 bg-[var(--color-success-bg)] border border-[var(--color-success)]/20 rounded-xl">
            <h4 className="font-medium text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--color-success)]" />
              Estimated Returns
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Daily</p>
                <p className="font-semibold text-[var(--color-success)]">
                  +{formatCurrency(estimatedDaily)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Monthly</p>
                <p className="font-semibold text-[var(--color-success)]">
                  +{formatCurrency(estimatedMonthly)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Yearly</p>
                <p className="font-semibold text-[var(--color-success)]">
                  +{formatCurrency(estimatedYearly)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lock Period Warning */}
        {!pool.flexible && (
          <div className="p-4 bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/20 rounded-xl">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-[var(--color-warning)] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--color-warning)]">
                  {pool.lockPeriod}-Day Lock Period
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Your funds will be locked for {pool.lockPeriod} days. Early withdrawal is not available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Terms */}
        <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Stake Amount</span>
            <span className="text-[var(--color-text-primary)]">{formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Lock Period</span>
            <span className="text-[var(--color-text-primary)]">
              {pool.flexible ? 'Flexible (No Lock)' : `${pool.lockPeriod} Days`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">APY</span>
            <span className="text-[var(--color-success)]">{formatPercentage(pool.apy)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={isSubmitting}
            disabled={amount < pool.minStake || amount > pool.maxStake || amount > availableBalance}
          >
            Stake Now
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StakingModal;
