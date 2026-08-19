'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Quick Trade Widget
// ============================================

interface QuickTradeProps {
  className?: string;
}

const popularPairs = [
  { symbol: 'BTC/USD', price: 86423.12, change: 2.45 },
  { symbol: 'ETH/USD', price: 3264.78, change: -1.23 },
  { symbol: 'SOL/USD', price: 145.32, change: 5.67 },
];

export const QuickTrade: React.FC<QuickTradeProps> = ({ className }) => {
  const [selectedPair, setSelectedPair] = useState(popularPairs[0]);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateQuantity = () => {
    const amountNum = parseFloat(amount) || 0;
    return amountNum / selectedPair.price;
  };

  const handleTrade = async () => {
    setIsSubmitting(true);
    // Simulate trade execution
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setAmount('');
    // Show success toast (would integrate with toast system)
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Quick Trade
          <button className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors">
            <RefreshCw className="h-4 w-4 text-[var(--color-text-muted)]" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pair Selection */}
        <div className="flex gap-2">
          {popularPairs.map((pair) => (
            <button
              key={pair.symbol}
              onClick={() => setSelectedPair(pair)}
              className={cn(
                'flex-1 p-2 rounded-lg border transition-all',
                selectedPair.symbol === pair.symbol
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-light)]'
              )}
            >
              <p className="text-xs font-medium text-[var(--color-text-primary)]">
                {pair.symbol.split('/')[0]}
              </p>
              <p
                className={cn(
                  'text-xs',
                  pair.change >= 0
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-error)]'
                )}
              >
                {pair.change >= 0 ? '+' : ''}
                {pair.change}%
              </p>
            </button>
          ))}
        </div>

        {/* Price Display */}
        <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">
                {selectedPair.symbol}
              </p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                {formatCurrency(selectedPair.price)}
              </p>
            </div>
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium',
                selectedPair.change >= 0
                  ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                  : 'bg-[var(--color-error-bg)] text-[var(--color-error)]'
              )}
            >
              {selectedPair.change >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(selectedPair.change)}%
            </div>
          </div>
        </div>

        {/* Buy/Sell Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--color-surface-elevated)] rounded-lg">
          <button
            onClick={() => setTradeType('buy')}
            className={cn(
              'py-2 rounded-md font-medium transition-all',
              tradeType === 'buy'
                ? 'bg-[var(--color-success)] text-white'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            )}
          >
            <TrendingUp className="h-4 w-4 inline-block mr-1" />
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={cn(
              'py-2 rounded-md font-medium transition-all',
              tradeType === 'sell'
                ? 'bg-[var(--color-error)] text-white'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            )}
          >
            <TrendingDown className="h-4 w-4 inline-block mr-1" />
            Sell
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <Input
            label="Amount (USD)"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            leftIcon={<span className="text-[var(--color-text-muted)]">$</span>}
          />
          {amount && parseFloat(amount) > 0 && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              ≈ {calculateQuantity().toFixed(8)} {selectedPair.symbol.split('/')[0]}
            </p>
          )}
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {['100', '250', '500', '1000'].map((value) => (
            <button
              key={value}
              onClick={() => setAmount(value)}
              className="py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
            >
              ${value}
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <Button
          fullWidth
          size="lg"
          onClick={handleTrade}
          isLoading={isSubmitting}
          disabled={!amount || parseFloat(amount) <= 0}
          className={cn(
            tradeType === 'buy'
              ? 'bg-[var(--color-success)] hover:bg-[var(--color-success)]/90'
              : 'bg-[var(--color-error)] hover:bg-[var(--color-error)]/90'
          )}
        >
          {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedPair.symbol.split('/')[0]}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickTrade;
