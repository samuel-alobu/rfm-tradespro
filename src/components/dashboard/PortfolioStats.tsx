'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Percent
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn, formatCurrency, formatPercentage } from '@/utils';

// ============================================
// Portfolio Stats Component
// ============================================

interface PortfolioStat {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface PortfolioStatsProps {
  className?: string;
  balanceVisible?: boolean;
}

export const PortfolioStats: React.FC<PortfolioStatsProps> = ({
  className,
  balanceVisible = true,
}) => {
  const formatValue = (value: string | number) => {
    if (!balanceVisible) return '••••••';
    if (typeof value === 'number') return formatCurrency(value);
    return value;
  };

  const stats: PortfolioStat[] = [
    {
      label: 'Total Balance',
      value: 124567.89,
      change: 2.45,
      changeLabel: 'vs last month',
      icon: <Wallet className="h-5 w-5" />,
      color: 'text-[var(--color-primary)]',
      bgColor: 'bg-[var(--color-primary-muted)]',
    },
    {
      label: 'Invested',
      value: 98234.56,
      change: 12.5,
      changeLabel: 'total ROI',
      icon: <PiggyBank className="h-5 w-5" />,
      color: 'text-[var(--color-info)]',
      bgColor: 'bg-[var(--color-info-bg)]',
    },
    {
      label: 'Total Profit',
      value: 26333.33,
      change: 18.7,
      changeLabel: 'all time',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-[var(--color-success)]',
      bgColor: 'bg-[var(--color-success-bg)]',
    },
    {
      label: 'Today\'s P/L',
      value: 1234.56,
      change: 0.99,
      changeLabel: 'today',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-[var(--color-accent-orange)]',
      bgColor: 'bg-[var(--color-accent-orange)]/10',
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="h-full hover:border-[var(--color-border-light)] transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={cn('p-2.5 rounded-xl', stat.bgColor, stat.color)}>
                  {stat.icon}
                </div>
                {stat.change !== undefined && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                      stat.change >= 0
                        ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                        : 'bg-[var(--color-error-bg)] text-[var(--color-error)]'
                    )}
                  >
                    {stat.change >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {formatPercentage(Math.abs(stat.change))}
                  </div>
                )}
              </div>
              <p className="text-sm text-[var(--color-text-muted)] mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatValue(stat.value)}
              </p>
              {stat.changeLabel && (
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {stat.changeLabel}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default PortfolioStats;
