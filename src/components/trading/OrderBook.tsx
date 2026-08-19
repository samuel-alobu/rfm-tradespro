'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Order Book Component
// ============================================

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface OrderBookProps {
  symbol?: string;
  basePrice?: number;
  className?: string;
  depth?: number;
}

// Generate mock order book data
const generateOrderBookData = (
  basePrice: number,
  depth: number
): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } => {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];

  let bidTotal = 0;
  let askTotal = 0;

  for (let i = 0; i < depth; i++) {
    // Bids (buy orders) - below current price
    const bidPrice = basePrice - (i + 1) * (basePrice * 0.0002) - Math.random() * 10;
    const bidAmount = 0.1 + Math.random() * 2;
    bidTotal += bidAmount;
    bids.push({
      price: Math.round(bidPrice * 100) / 100,
      amount: Math.round(bidAmount * 10000) / 10000,
      total: Math.round(bidTotal * 10000) / 10000,
    });

    // Asks (sell orders) - above current price
    const askPrice = basePrice + (i + 1) * (basePrice * 0.0002) + Math.random() * 10;
    const askAmount = 0.1 + Math.random() * 2;
    askTotal += askAmount;
    asks.push({
      price: Math.round(askPrice * 100) / 100,
      amount: Math.round(askAmount * 10000) / 10000,
      total: Math.round(askTotal * 10000) / 10000,
    });
  }

  return { bids, asks: asks.reverse() };
};

export const OrderBook: React.FC<OrderBookProps> = ({
  symbol = 'BTC/USD',
  basePrice = 86423.12,
  className,
  depth = 12,
}) => {
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookEntry[]; asks: OrderBookEntry[] }>({
    bids: [],
    asks: [],
  });
  const [view, setView] = useState<'both' | 'bids' | 'asks'>('both');

  // Generate initial data
  useEffect(() => {
    setOrderBook(generateOrderBookData(basePrice, depth));

    // Simulate real-time updates
    const interval = setInterval(() => {
      setOrderBook(generateOrderBookData(basePrice + (Math.random() - 0.5) * 50, depth));
    }, 2000);

    return () => clearInterval(interval);
  }, [basePrice, depth]);

  const maxTotal = useMemo(() => {
    const maxBid = orderBook.bids[orderBook.bids.length - 1]?.total || 0;
    const maxAsk = orderBook.asks[0]?.total || 0;
    return Math.max(maxBid, maxAsk);
  }, [orderBook]);

  const spread = useMemo(() => {
    if (orderBook.asks.length && orderBook.bids.length) {
      const lowestAsk = orderBook.asks[orderBook.asks.length - 1]?.price || 0;
      const highestBid = orderBook.bids[0]?.price || 0;
      return lowestAsk - highestBid;
    }
    return 0;
  }, [orderBook]);

  const spreadPercentage = (spread / basePrice) * 100;

  return (
    <div className={cn('bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]', className)}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[var(--color-text-primary)]">Order Book</h3>
          <div className="flex items-center gap-1 bg-[var(--color-surface-elevated)] p-1 rounded-lg">
            <button
              onClick={() => setView('both')}
              className={cn(
                'px-2 py-1 text-xs font-medium rounded transition-colors',
                view === 'both'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              )}
            >
              Both
            </button>
            <button
              onClick={() => setView('bids')}
              className={cn(
                'px-2 py-1 text-xs font-medium rounded transition-colors',
                view === 'bids'
                  ? 'bg-[var(--color-success)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              )}
            >
              Bids
            </button>
            <button
              onClick={() => setView('asks')}
              className={cn(
                'px-2 py-1 text-xs font-medium rounded transition-colors',
                view === 'asks'
                  ? 'bg-[var(--color-error)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              )}
            >
              Asks
            </button>
          </div>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-3 gap-2 text-xs text-[var(--color-text-muted)]">
          <span>Price (USD)</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Total</span>
        </div>
      </div>

      {/* Order Book Content */}
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {/* Asks (Sells) */}
        {(view === 'both' || view === 'asks') && (
          <div className="space-y-0.5">
            <AnimatePresence mode="popLayout">
              {orderBook.asks.map((ask, index) => (
                <motion.div
                  key={`ask-${index}-${ask.price}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative grid grid-cols-3 gap-2 py-1 px-2 text-sm hover:bg-[var(--color-surface-hover)] rounded cursor-pointer"
                >
                  {/* Background bar */}
                  <div
                    className="absolute inset-y-0 right-0 bg-[var(--color-error)]/10"
                    style={{ width: `${(ask.total / maxTotal) * 100}%` }}
                  />
                  <span className="relative text-[var(--color-error)] font-mono">
                    {ask.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="relative text-right text-[var(--color-text-secondary)] font-mono">
                    {ask.amount.toFixed(4)}
                  </span>
                  <span className="relative text-right text-[var(--color-text-muted)] font-mono">
                    {ask.total.toFixed(4)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Spread */}
        {view === 'both' && (
          <div className="my-2 py-2 px-2 bg-[var(--color-surface-elevated)] rounded-lg text-center">
            <span className="text-lg font-bold text-[var(--color-text-primary)]">
              ${basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="ml-2 text-xs text-[var(--color-text-muted)]">
              Spread: ${spread.toFixed(2)} ({spreadPercentage.toFixed(3)}%)
            </span>
          </div>
        )}

        {/* Bids (Buys) */}
        {(view === 'both' || view === 'bids') && (
          <div className="space-y-0.5">
            <AnimatePresence mode="popLayout">
              {orderBook.bids.map((bid, index) => (
                <motion.div
                  key={`bid-${index}-${bid.price}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative grid grid-cols-3 gap-2 py-1 px-2 text-sm hover:bg-[var(--color-surface-hover)] rounded cursor-pointer"
                >
                  {/* Background bar */}
                  <div
                    className="absolute inset-y-0 right-0 bg-[var(--color-success)]/10"
                    style={{ width: `${(bid.total / maxTotal) * 100}%` }}
                  />
                  <span className="relative text-[var(--color-success)] font-mono">
                    {bid.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="relative text-right text-[var(--color-text-secondary)] font-mono">
                    {bid.amount.toFixed(4)}
                  </span>
                  <span className="relative text-right text-[var(--color-text-muted)] font-mono">
                    {bid.total.toFixed(4)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderBook;
