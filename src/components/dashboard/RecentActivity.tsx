'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  TrendingDown,
  Gift,
  Clock,
  ArrowRight,
  Users,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Recent Activity Component
// ============================================

interface Activity {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell' | 'profit' | 'referral';
  title: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
}

interface RecentActivityProps {
  className?: string;
  limit?: number;
}

// Mock activities
const generateMockActivities = (): Activity[] => {
  const now = new Date();
  return [
    {
      id: '1',
      type: 'trade_buy',
      title: 'Bought BTC',
      description: '0.0234 BTC at $86,234.00',
      amount: 2018.28,
      status: 'completed',
      timestamp: new Date(now.getTime() - 15 * 60 * 1000),
    },
    {
      id: '2',
      type: 'deposit',
      title: 'Deposit',
      description: 'Bank Transfer - Wells Fargo',
      amount: 5000,
      status: 'completed',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: '3',
      type: 'profit',
      title: 'Copy Trading Profit',
      description: 'From Alex Thompson',
      amount: 234.56,
      status: 'completed',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      id: '4',
      type: 'trade_sell',
      title: 'Sold ETH',
      description: '1.5 ETH at $3,245.00',
      amount: 4867.50,
      status: 'completed',
      timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      id: '5',
      type: 'withdrawal',
      title: 'Withdrawal',
      description: 'To Bank ****4523',
      amount: -2000,
      status: 'pending',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      id: '6',
      type: 'referral',
      title: 'Referral Bonus',
      description: 'New user signup bonus',
      amount: 50,
      status: 'completed',
      timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000),
    },
  ];
};

const activityConfig = {
  deposit: {
    icon: ArrowDownToLine,
    color: 'text-[var(--color-success)]',
    bgColor: 'bg-[var(--color-success-bg)]',
  },
  withdrawal: {
    icon: ArrowUpFromLine,
    color: 'text-[var(--color-info)]',
    bgColor: 'bg-[var(--color-info-bg)]',
  },
  trade_buy: {
    icon: TrendingUp,
    color: 'text-[var(--color-success)]',
    bgColor: 'bg-[var(--color-success-bg)]',
  },
  trade_sell: {
    icon: TrendingDown,
    color: 'text-[var(--color-error)]',
    bgColor: 'bg-[var(--color-error-bg)]',
  },
  profit: {
    icon: Gift,
    color: 'text-[var(--color-warning)]',
    bgColor: 'bg-[var(--color-warning-bg)]',
  },
  referral: {
    icon: Users,
    color: 'text-[var(--color-accent-purple)]',
    bgColor: 'bg-[var(--color-accent-purple)]/10',
  },
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

export const RecentActivity: React.FC<RecentActivityProps> = ({
  className,
  limit = 5,
}) => {
  const activities = generateMockActivities().slice(0, limit);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Link href="/transactions">
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              >
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('h-5 w-5', config.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">
                      {activity.title}
                    </p>
                    {activity.status === 'pending' && (
                      <Badge variant="warning" size="sm">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] truncate">
                    {activity.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      'font-medium',
                      activity.amount >= 0
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-text-primary)]'
                    )}
                  >
                    {activity.amount >= 0 ? '+' : ''}
                    {formatCurrency(activity.amount)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] flex items-center justify-end gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
