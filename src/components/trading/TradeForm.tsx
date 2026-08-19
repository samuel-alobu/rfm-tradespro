'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Info, Percent, DollarSign, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Trade Form Component
// ============================================

type OrderType = 'market' | 'limit' | 'stop';
type TradeSide = 'buy' | 'sell';

interface TradeFormProps {
  symbol?: string;
  baseAsset?: string;
  quoteAsset?: string;
  currentPrice?: number;
  availableBalance?: number;
  availableAsset?: number;
  className?: string;
  onTrade?: (trade: TradeData) => void;
}

interface TradeData {
  side: TradeSide;
  orderType: OrderType;
  amount: number;
  price?: number;
  stopPrice?: number;
  total: number;
}

const tradeSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be greater than 0'
  ),
  price: z.string().optional(),
  stopPrice: z.string().optional(),
});

type TradeFormData = z.infer<typeof tradeSchema>;

const leverageOptions = [1, 2, 5, 10, 20, 50, 100];

export const TradeForm: React.FC<TradeFormProps> = ({
  symbol = 'BTC/USD',
  baseAsset = 'BTC',
  quoteAsset = 'USD',
  currentPrice = 86423.12,
  availableBalance = 89234.56,
  availableAsset = 0.5,
  className,
  onTrade,
}) => {
  const [side, setSide] = useState<TradeSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [leverage, setLeverage] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeverage, setShowLeverage] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      amount: '',
      price: currentPrice.toString(),
    },
  });

  const amount = parseFloat(watch('amount')) || 0;
  const price = parseFloat(watch('price') || '') || currentPrice;
  
  // Calculate totals
  const total = side === 'buy' ? amount * price : amount;
  const estimatedReceive = side === 'buy' ? amount : amount * price;
  const fee = total * 0.001; // 0.1% fee
  const maxBuy = availableBalance / price;
  const maxSell = availableAsset;

  // Update price when currentPrice changes
  useEffect(() => {
    if (orderType === 'market') {
      setValue('price', currentPrice.toString());
    }
  }, [currentPrice, orderType, setValue]);

  const setPercentage = (percent: number) => {
    if (side === 'buy') {
      const maxAmount = (availableBalance * percent) / 100 / price;
      setValue('amount', maxAmount.toFixed(8));
    } else {
      const maxAmount = (availableAsset * percent) / 100;
      setValue('amount', maxAmount.toFixed(8));
    }
  };

  const onSubmit = async (data: TradeFormData) => {
    setIsSubmitting(true);
    
    // Simulate trade execution
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const trade: TradeData = {
      side,
      orderType,
      amount: parseFloat(data.amount),
      price: orderType !== 'market' ? parseFloat(data.price || '') : undefined,
      stopPrice: orderType === 'stop' ? parseFloat(data.stopPrice || '') : undefined,
      total,
    };
    
    onTrade?.(trade);
    setIsSubmitting(false);
    reset();
  };

  return (
    <div className={cn('bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]', className)}>
      {/* Buy/Sell Toggle */}
      <div className="grid grid-cols-2 p-1 m-2 bg-[var(--color-surface-elevated)] rounded-lg">
        <button
          onClick={() => setSide('buy')}
          className={cn(
            'py-3 rounded-md font-semibold transition-all flex items-center justify-center gap-2',
            side === 'buy'
              ? 'bg-[var(--color-success)] text-white'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          )}
        >
          <TrendingUp className="h-4 w-4" />
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={cn(
            'py-3 rounded-md font-semibold transition-all flex items-center justify-center gap-2',
            side === 'sell'
              ? 'bg-[var(--color-error)] text-white'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          )}
        >
          <TrendingDown className="h-4 w-4" />
          Sell
        </button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--color-border)]">
        {(['market', 'limit', 'stop'] as OrderType[]).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize',
              orderType === type
                ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            )}
          >
            {type}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowLeverage(!showLeverage)}
          className={cn(
            'px-2 py-1 text-xs font-medium rounded transition-colors',
            showLeverage
              ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          )}
        >
          {leverage}x
        </button>
      </div>

      {/* Leverage Selector */}
      {showLeverage && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 py-2 border-b border-[var(--color-border)]"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--color-text-muted)]">Leverage:</span>
            {leverageOptions.map((lev) => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded transition-colors',
                  leverage === lev
                    ? 'bg-[var(--color-warning)] text-white'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                )}
              >
                {lev}x
              </button>
            ))}
          </div>
          {leverage > 1 && (
            <p className="text-xs text-[var(--color-warning)] mt-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Leveraged trading carries high risk
            </p>
          )}
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
        {/* Available Balance */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-muted)] flex items-center gap-1">
            <Wallet className="h-4 w-4" />
            Available
          </span>
          <span className="text-[var(--color-text-primary)] font-medium">
            {side === 'buy' 
              ? `${formatCurrency(availableBalance)} ${quoteAsset}`
              : `${availableAsset.toFixed(8)} ${baseAsset}`
            }
          </span>
        </div>

        {/* Price Input (for limit/stop orders) */}
        {orderType !== 'market' && (
          <Input
            label={orderType === 'stop' ? 'Stop Price' : 'Limit Price'}
            type="number"
            step="0.01"
            placeholder="0.00"
            rightIcon={<span className="text-[var(--color-text-muted)]">{quoteAsset}</span>}
            error={errors.price?.message}
            {...register('price')}
          />
        )}

        {/* Stop Price (for stop orders) */}
        {orderType === 'stop' && (
          <Input
            label="Trigger Price"
            type="number"
            step="0.01"
            placeholder="0.00"
            rightIcon={<span className="text-[var(--color-text-muted)]">{quoteAsset}</span>}
            {...register('stopPrice')}
          />
        )}

        {/* Amount Input */}
        <div>
          <Input
            label={`Amount (${baseAsset})`}
            type="number"
            step="0.00000001"
            placeholder="0.00"
            rightIcon={<span className="text-[var(--color-text-muted)]">{baseAsset}</span>}
            error={errors.amount?.message}
            {...register('amount')}
          />
          {/* Percentage buttons */}
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                type="button"
                onClick={() => setPercentage(percent)}
                className="py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] rounded transition-colors"
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        {amount > 0 && (
          <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Price</span>
              <span className="text-[var(--color-text-primary)] font-mono">
                {orderType === 'market' ? 'Market' : formatCurrency(price)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Amount</span>
              <span className="text-[var(--color-text-primary)] font-mono">
                {amount.toFixed(8)} {baseAsset}
              </span>
            </div>
            {leverage > 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">Leverage</span>
                <span className="text-[var(--color-warning)] font-medium">
                  {leverage}x
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Fee (0.1%)</span>
              <span className="text-[var(--color-text-primary)] font-mono">
                ~{formatCurrency(fee)}
              </span>
            </div>
            <div className="pt-2 border-t border-[var(--color-border)] flex justify-between">
              <span className="font-medium text-[var(--color-text-primary)]">
                {side === 'buy' ? 'Total Cost' : 'Total Receive'}
              </span>
              <span className="font-bold text-[var(--color-text-primary)]">
                {side === 'buy' 
                  ? `~${formatCurrency(total + fee)}`
                  : `~${formatCurrency(estimatedReceive - fee)}`
                }
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          disabled={amount <= 0 || (side === 'buy' && total > availableBalance) || (side === 'sell' && amount > availableAsset)}
          className={cn(
            side === 'buy'
              ? 'bg-[var(--color-success)] hover:bg-[var(--color-success)]/90'
              : 'bg-[var(--color-error)] hover:bg-[var(--color-error)]/90'
          )}
        >
          {side === 'buy' ? 'Buy' : 'Sell'} {baseAsset}
        </Button>

        {/* Insufficient Balance Warning */}
        {((side === 'buy' && total > availableBalance) || (side === 'sell' && amount > availableAsset)) && (
          <p className="text-xs text-[var(--color-error)] text-center">
            Insufficient {side === 'buy' ? quoteAsset : baseAsset} balance
          </p>
        )}
      </form>
    </div>
  );
};

export default TradeForm;
