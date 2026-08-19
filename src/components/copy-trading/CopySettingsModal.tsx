'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info, AlertTriangle, Check, Wallet } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatCurrency } from '@/utils';
import { Trader } from './TraderCard';

// ============================================
// Copy Settings Modal Component
// ============================================

interface CopySettingsModalProps {
  trader: Trader | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (settings: CopySettings) => void;
  availableBalance?: number;
}

interface CopySettings {
  traderId: string;
  copyAmount: number;
  maxDrawdown: number;
  copyRatio: number;
  stopLoss: boolean;
  takeProfit: boolean;
  stopLossPercentage?: number;
  takeProfitPercentage?: number;
}

const copySettingsSchema = z.object({
  copyAmount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 100,
    'Minimum copy amount is $100'
  ),
  maxDrawdown: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 5 && Number(val) <= 100,
    'Drawdown must be between 5% and 100%'
  ),
  copyRatio: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0.1 && Number(val) <= 10,
    'Copy ratio must be between 0.1x and 10x'
  ),
});

type CopySettingsFormData = z.infer<typeof copySettingsSchema>;

export const CopySettingsModal: React.FC<CopySettingsModalProps> = ({
  trader,
  isOpen,
  onClose,
  onConfirm,
  availableBalance = 89234.56,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stopLoss, setStopLoss] = useState(false);
  const [takeProfit, setTakeProfit] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CopySettingsFormData>({
    resolver: zodResolver(copySettingsSchema),
    defaultValues: {
      copyAmount: trader?.minCopyAmount.toString() || '500',
      maxDrawdown: '20',
      copyRatio: '1',
    },
  });

  const copyAmount = parseFloat(watch('copyAmount')) || 0;
  const copyRatio = parseFloat(watch('copyRatio')) || 1;

  const handleClose = () => {
    setSuccess(false);
    reset();
    onClose();
  };

  const onSubmit = async (data: CopySettingsFormData) => {
    if (!trader) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const settings: CopySettings = {
      traderId: trader.id,
      copyAmount: parseFloat(data.copyAmount),
      maxDrawdown: parseFloat(data.maxDrawdown),
      copyRatio: parseFloat(data.copyRatio),
      stopLoss,
      takeProfit,
    };

    onConfirm?.(settings);
    setIsSubmitting(false);
    setSuccess(true);

    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  if (!trader) return null;

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Success" size="md">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-success-bg)] mb-4">
            <Check className="h-8 w-8 text-[var(--color-success)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Copy Trading Activated!
          </h3>
          <p className="text-[var(--color-text-muted)]">
            You are now copying {trader.name}&apos;s trades.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Copy Trading Settings" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Trader Info */}
        <div className="flex items-center gap-3 p-4 bg-[var(--color-surface-elevated)] rounded-xl">
          <Avatar
            src={trader.avatar}
            fallback={trader.name.slice(0, 2)}
            size="lg"
          />
          <div className="flex-1">
            <p className="font-semibold text-[var(--color-text-primary)]">{trader.name}</p>
            <p className="text-sm text-[var(--color-text-muted)]">@{trader.username}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[var(--color-success)]">
              +{trader.profitPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">Total Return</p>
          </div>
        </div>

        {/* Available Balance */}
        <div className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span className="text-sm text-[var(--color-text-muted)]">Available Balance</span>
          </div>
          <span className="font-semibold text-[var(--color-text-primary)]">
            {formatCurrency(availableBalance)}
          </span>
        </div>

        {/* Copy Amount */}
        <div>
          <Input
            label="Copy Amount (USD)"
            type="number"
            placeholder="Enter amount"
            leftIcon={<span className="text-[var(--color-text-muted)]">$</span>}
            error={errors.copyAmount?.message}
            {...register('copyAmount')}
          />
          <div className="flex gap-2 mt-2">
            {[500, 1000, 2500, 5000].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setValue('copyAmount', amount.toString())}
                className="flex-1 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
              >
                ${amount.toLocaleString()}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Minimum: {formatCurrency(trader.minCopyAmount)}
          </p>
        </div>

        {/* Copy Ratio */}
        <div>
          <Input
            label="Copy Ratio"
            type="number"
            step="0.1"
            placeholder="1.0"
            rightIcon={<span className="text-[var(--color-text-muted)]">x</span>}
            error={errors.copyRatio?.message}
            {...register('copyRatio')}
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            At {copyRatio}x ratio, a $100 trade by {trader.name} will be {formatCurrency(100 * copyRatio)} in your account.
          </p>
        </div>

        {/* Max Drawdown */}
        <div>
          <Input
            label="Max Drawdown (%)"
            type="number"
            placeholder="20"
            rightIcon={<span className="text-[var(--color-text-muted)]">%</span>}
            error={errors.maxDrawdown?.message}
            {...register('maxDrawdown')}
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Copy trading will pause if losses exceed this percentage.
          </p>
        </div>

        {/* Risk Controls */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            Risk Controls
          </p>
          
          <label className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Stop Loss</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Automatically stop copying if total loss reaches a threshold
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStopLoss(!stopLoss)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                stopLoss ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
                  stopLoss && 'translate-x-5'
                )}
              />
            </button>
          </label>

          <label className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Take Profit</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Automatically stop copying after reaching profit target
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTakeProfit(!takeProfit)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                takeProfit ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
                  takeProfit && 'translate-x-5'
                )}
              />
            </button>
          </label>
        </div>

        {/* Summary */}
        <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Copy Amount</span>
            <span className="text-[var(--color-text-primary)]">{formatCurrency(copyAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Profit Share to Trader</span>
            <span className="text-[var(--color-text-primary)]">{trader.profitShare}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Risk Level</span>
            <Badge 
              variant={trader.riskLevel === 'low' ? 'success' : trader.riskLevel === 'medium' ? 'warning' : 'error'}
              size="sm"
            >
              {trader.riskLevel.charAt(0).toUpperCase() + trader.riskLevel.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/20 rounded-xl">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--color-warning)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--color-warning)]">
                Copy Trading Risk Warning
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Past performance does not guarantee future results. You may lose some or all of your invested capital. Only invest what you can afford to lose.
              </p>
            </div>
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
            disabled={copyAmount < trader.minCopyAmount || copyAmount > availableBalance}
          >
            Start Copying
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CopySettingsModal;
