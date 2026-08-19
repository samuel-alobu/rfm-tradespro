'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Open Orders Component
// ============================================

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'stop' | 'market';
  price: number;
  amount: number;
  filled: number;
  status: 'open' | 'partial' | 'cancelled';
  createdAt: Date;
}

interface OpenOrdersProps {
  className?: string;
}

const mockOrders: Order[] = [
  {
    id: 'ord1',
    symbol: 'BTC/USD',
    side: 'buy',
    type: 'limit',
    price: 85000,
    amount: 0.5,
    filled: 0,
    status: 'open',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'ord2',
    symbol: 'ETH/USD',
    side: 'sell',
    type: 'limit',
    price: 3400,
    amount: 2.0,
    filled: 0.5,
    status: 'partial',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 'ord3',
    symbol: 'SOL/USD',
    side: 'buy',
    type: 'stop',
    price: 150,
    amount: 10,
    filled: 0,
    status: 'open',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

export const OpenOrders: React.FC<OpenOrdersProps> = ({ className }) => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setCancellingId(null);
  };

  const handleCancelAll = async () => {
    setCancellingId('all');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setOrders([]);
    setCancellingId(null);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Open Orders</CardTitle>
          <Badge variant="primary">{orders.length}</Badge>
        </div>
        {orders.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelAll}
            isLoading={cancellingId === 'all'}
            className="text-[var(--color-error)]"
          >
            Cancel All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-[var(--color-text-muted)]">No open orders</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Your open orders will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="p-4 bg-[var(--color-surface-elevated)] rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center',
                        order.side === 'buy'
                          ? 'bg-[var(--color-success-bg)]'
                          : 'bg-[var(--color-error-bg)]'
                      )}>
                        {order.side === 'buy' ? (
                          <TrendingUp className={cn('h-4 w-4', 'text-[var(--color-success)]')} />
                        ) : (
                          <TrendingDown className={cn('h-4 w-4', 'text-[var(--color-error)]')} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            {order.symbol}
                          </span>
                          <Badge
                            variant={order.side === 'buy' ? 'success' : 'error'}
                            size="sm"
                          >
                            {order.side.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" size="sm">
                            {order.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {formatTimeAgo(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancelOrder(order.id)}
                      isLoading={cancellingId === order.id}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)]"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Price</p>
                      <p className="font-medium text-[var(--color-text-primary)] font-mono">
                        {formatCurrency(order.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Amount</p>
                      <p className="font-medium text-[var(--color-text-primary)] font-mono">
                        {order.amount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Filled</p>
                      <p className="font-medium text-[var(--color-text-primary)] font-mono">
                        {order.filled} ({((order.filled / order.amount) * 100).toFixed(0)}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Total</p>
                      <p className="font-medium text-[var(--color-text-primary)] font-mono">
                        {formatCurrency(order.price * order.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar for partial fills */}
                  {order.filled > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                          style={{ width: `${(order.filled / order.amount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenOrders;
