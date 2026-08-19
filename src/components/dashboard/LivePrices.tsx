'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SparklineChart, generateSparklineData } from '@/components/charts';
import { cn, formatCurrency, formatPercentage } from '@/utils';

// ============================================
// Live Prices Component
// ============================================

interface LivePrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  sparklineData: number[];
}

interface LivePricesProps {
  className?: string;
  limit?: number;
}

// Mock data generator
const generateMockPrices = (): LivePrice[] => {
  return [
    {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 86423.12 + (Math.random() - 0.5) * 500,
      change24h: 2.45 + (Math.random() - 0.5) * 0.5,
      sparklineData: generateSparklineData(24, 0.01),
    },
    {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      price: 3264.78 + (Math.random() - 0.5) * 50,
      change24h: -1.23 + (Math.random() - 0.5) * 0.5,
      sparklineData: generateSparklineData(24, 0.015),
    },
    {
      id: 'solana',
      symbol: 'SOL',
      name: 'Solana',
      price: 145.32 + (Math.random() - 0.5) * 5,
      change24h: 5.67 + (Math.random() - 0.5) * 0.5,
      sparklineData: generateSparklineData(24, 0.02),
    },
    {
      id: 'ripple',
      symbol: 'XRP',
      name: 'XRP',
      price: 0.5234 + (Math.random() - 0.5) * 0.02,
      change24h: 3.21 + (Math.random() - 0.5) * 0.5,
      sparklineData: generateSparklineData(24, 0.018),
    },
    {
      id: 'cardano',
      symbol: 'ADA',
      name: 'Cardano',
      price: 0.4523 + (Math.random() - 0.5) * 0.01,
      change24h: -0.89 + (Math.random() - 0.5) * 0.5,
      sparklineData: generateSparklineData(24, 0.02),
    },
    {
      id: 'dogecoin',
      symbol: 'DOGE',
      name: 'Dogecoin',
      price: 0.0834 + (Math.random() - 0.5) * 0.005,
      change24h: 8.45 + (Math.random() - 0.5) * 0.5,
      sparklineData: generateSparklineData(24, 0.025),
    },
  ];
};

export const LivePrices: React.FC<LivePricesProps> = ({ className, limit = 6 }) => {
  const [prices, setPrices] = useState<LivePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch prices
  const fetchPrices = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setPrices(generateMockPrices().slice(0, limit));
    setLastUpdate(new Date());
    setIsLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchPrices();
  }, [limit]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Update prices with small random changes
      setPrices((prev) =>
        prev.map((price) => ({
          ...price,
          price: price.price * (1 + (Math.random() - 0.5) * 0.002),
          change24h: price.change24h + (Math.random() - 0.5) * 0.1,
        }))
      );
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Live Prices</CardTitle>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Updated {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchPrices}
          disabled={isLoading}
          className={cn(isLoading && 'animate-spin')}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {prices.map((price, index) => (
              <motion.div
                key={price.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center justify-between py-2 hover:bg-[var(--color-surface-hover)] px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center">
                    <span className="text-xs font-bold text-[var(--color-primary)]">
                      {price.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {price.symbol}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {price.name}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block">
                  <SparklineChart
                    data={price.sparklineData}
                    width={80}
                    height={32}
                    positive={price.change24h >= 0}
                  />
                </div>

                <div className="text-right">
                  <motion.p
                    key={price.price}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    className="font-medium text-[var(--color-text-primary)]"
                  >
                    {formatCurrency(price.price)}
                  </motion.p>
                  <p
                    className={cn(
                      'text-xs flex items-center justify-end gap-0.5',
                      price.change24h >= 0
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-error)]'
                    )}
                  >
                    {price.change24h >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {formatPercentage(Math.abs(price.change24h))}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default LivePrices;
