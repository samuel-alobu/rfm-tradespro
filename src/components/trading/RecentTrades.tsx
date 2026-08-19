'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils';

// ============================================
// Recent Trades Component
// ============================================

interface Trade {
  id: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  time: Date;
}

interface RecentTradesProps {
  symbol?: string;
  basePrice?: number;
  className?: string;
}

// Generate mock trades
const generateTrades = (basePrice: number, count: number = 20): Trade[] => {
  const trades: Trade[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const priceVariation = (Math.random() - 0.5) * 100;
    
    trades.push({
      id: `trade-${i}-${Date.now()}`,
      price: Math.round((basePrice + priceVariation) * 100) / 100,
      amount: Math.round((0.001 + Math.random() * 2) * 10000) / 10000,
      side,
      time: new Date(now.getTime() - i * 3000 - Math.random() * 2000),
    });
  }
  
  return trades;
};

export const RecentTrades: React.FC<RecentTradesProps> = ({
  symbol = 'BTC/USD',
  basePrice = 86423.12,
  className,
}) => {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    // Initial trades
    setTrades(generateTrades(basePrice));

    // Add new trades periodically
    const interval = setInterval(() => {
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const priceVariation = (Math.random() - 0.5) * 50;
      
      const newTrade: Trade = {
        id: `trade-${Date.now()}`,
        price: Math.round((basePrice + priceVariation) * 100) / 100,
        amount: Math.round((0.001 + Math.random() * 2) * 10000) / 10000,
        side,
        time: new Date(),
      };

      setTrades((prev) => [newTrade, ...prev.slice(0, 19)]);
    }, 1500 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [basePrice]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className={cn('bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]', className)}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-text-primary)]">Recent Trades</h3>
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-[var(--color-text-muted)]">
          <span>Price (USD)</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Time</span>
        </div>
      </div>

      {/* Trades List */}
      <div className="max-h-[350px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {trades.map((trade, index) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-3 gap-2 py-1.5 px-4 text-sm hover:bg-[var(--color-surface-hover)] cursor-pointer"
            >
              <span className={cn(
                'font-mono',
                trade.side === 'buy' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
              )}>
                {trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-right text-[var(--color-text-secondary)] font-mono">
                {trade.amount.toFixed(4)}
              </span>
              <span className="text-right text-[var(--color-text-muted)] font-mono text-xs">
                {formatTime(trade.time)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecentTrades;
