'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Percent, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn, formatPercentage } from '@/utils';

// ============================================
// Signal Stats Component
// ============================================

interface SignalStatsProps {
  totalSignals: number;
  hitRate: number;
  avgProfit: number;
  activeSignals: number;
  className?: string;
}

export const SignalStats: React.FC<SignalStatsProps> = ({
  totalSignals,
  hitRate,
  avgProfit,
  activeSignals,
  className,
}) => {
  const stats = [
    {
      label: 'Total Signals',
      value: totalSignals.toString(),
      icon: BarChart3,
      color: 'text-[var(--color-primary)]',
      bg: 'bg-[var(--color-primary-muted)]',
    },
    {
      label: 'Hit Rate',
      value: formatPercentage(hitRate),
      icon: Target,
      color: 'text-[var(--color-success)]',
      bg: 'bg-[var(--color-success-bg)]',
    },
    {
      label: 'Avg. Profit',
      value: `+${formatPercentage(avgProfit)}`,
      icon: TrendingUp,
      color: 'text-[var(--color-success)]',
      bg: 'bg-[var(--color-success-bg)]',
    },
    {
      label: 'Active Now',
      value: activeSignals.toString(),
      icon: Percent,
      color: 'text-[var(--color-warning)]',
      bg: 'bg-[var(--color-warning-bg)]',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', stat.bg)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default SignalStats;
