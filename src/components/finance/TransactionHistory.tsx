'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Calendar,
  ChevronDown,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Transaction History Component
// ============================================

type TransactionType = 'all' | 'deposit' | 'withdrawal' | 'trade' | 'profit' | 'referral';
type TransactionStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell' | 'profit' | 'referral';
  title: string;
  description: string;
  amount: number;
  status: TransactionStatus;
  timestamp: Date;
  txHash?: string;
  method?: string;
}

interface TransactionHistoryProps {
  className?: string;
  showFilters?: boolean;
  limit?: number;
}

// Mock transactions
const generateMockTransactions = (): Transaction[] => {
  const now = new Date();
  return [
    {
      id: 'tx1',
      type: 'deposit',
      title: 'Deposit',
      description: 'Bank Transfer - Wells Fargo',
      amount: 5000,
      status: 'completed',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      method: 'Bank Wire',
    },
    {
      id: 'tx2',
      type: 'trade_buy',
      title: 'Buy BTC',
      description: '0.0234 BTC at $86,234.00',
      amount: -2018.28,
      status: 'completed',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      id: 'tx3',
      type: 'profit',
      title: 'Copy Trading Profit',
      description: 'From Alex Thompson',
      amount: 234.56,
      status: 'completed',
      timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      id: 'tx4',
      type: 'withdrawal',
      title: 'Withdrawal',
      description: 'To Bank ****4523',
      amount: -2000,
      status: 'pending',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      method: 'Bank Wire',
    },
    {
      id: 'tx5',
      type: 'trade_sell',
      title: 'Sell ETH',
      description: '1.5 ETH at $3,245.00',
      amount: 4867.50,
      status: 'completed',
      timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000),
    },
    {
      id: 'tx6',
      type: 'deposit',
      title: 'Deposit',
      description: 'Bitcoin - 0.05 BTC',
      amount: 4312.50,
      status: 'completed',
      timestamp: new Date(now.getTime() - 72 * 60 * 60 * 1000),
      txHash: '3a1b2c3d4e5f...',
      method: 'Crypto',
    },
    {
      id: 'tx7',
      type: 'referral',
      title: 'Referral Bonus',
      description: 'New user signup bonus',
      amount: 50,
      status: 'completed',
      timestamp: new Date(now.getTime() - 96 * 60 * 60 * 1000),
    },
    {
      id: 'tx8',
      type: 'withdrawal',
      title: 'Withdrawal',
      description: 'USDT to wallet 0x742d...',
      amount: -1500,
      status: 'failed',
      timestamp: new Date(now.getTime() - 120 * 60 * 60 * 1000),
      method: 'Crypto',
    },
    {
      id: 'tx9',
      type: 'trade_buy',
      title: 'Buy SOL',
      description: '10 SOL at $145.32',
      amount: -1453.20,
      status: 'completed',
      timestamp: new Date(now.getTime() - 144 * 60 * 60 * 1000),
    },
    {
      id: 'tx10',
      type: 'deposit',
      title: 'Deposit',
      description: 'Card ending ****4242',
      amount: 1000,
      status: 'completed',
      timestamp: new Date(now.getTime() - 168 * 60 * 60 * 1000),
      method: 'Card',
    },
  ];
};

const transactionConfig = {
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
    icon: TrendingUp,
    color: 'text-[var(--color-warning)]',
    bgColor: 'bg-[var(--color-warning-bg)]',
  },
  referral: {
    icon: ArrowDownToLine,
    color: 'text-[var(--color-accent-purple)]',
    bgColor: 'bg-[var(--color-accent-purple)]/10',
  },
};

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: 'text-[var(--color-success)]',
    variant: 'success' as const,
  },
  pending: {
    icon: Loader2,
    color: 'text-[var(--color-warning)]',
    variant: 'warning' as const,
  },
  failed: {
    icon: XCircle,
    color: 'text-[var(--color-error)]',
    variant: 'error' as const,
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
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const filterOptions: { value: TransactionType; label: string }[] = [
  { value: 'all', label: 'All Transactions' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'withdrawal', label: 'Withdrawals' },
  { value: 'trade', label: 'Trades' },
  { value: 'profit', label: 'Profits' },
  { value: 'referral', label: 'Referrals' },
];

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  className,
  showFilters = true,
  limit,
}) => {
  const [transactions] = useState<Transaction[]>(generateMockTransactions);
  const [filter, setFilter] = useState<TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const filteredTransactions = transactions
    .filter((tx) => {
      if (filter === 'all') return true;
      if (filter === 'trade') return tx.type === 'trade_buy' || tx.type === 'trade_sell';
      return tx.type === filter;
    })
    .filter((tx) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        tx.title.toLowerCase().includes(query) ||
        tx.description.toLowerCase().includes(query)
      );
    })
    .slice(0, limit);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CardTitle>Transaction History</CardTitle>
        
        {showFilters && (
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent w-48"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>{filterOptions.find((f) => f.value === filter)?.label}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-1 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg z-10 py-1"
                  >
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilter(option.value);
                          setShowFilterDropdown(false);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm transition-colors',
                          filter === option.value
                            ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4" />
            <p className="text-[var(--color-text-muted)]">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx, index) => {
              const config = transactionConfig[tx.type];
              const status = statusConfig[tx.status];
              const Icon = config.icon;
              const StatusIcon = status.icon;
              const isExpanded = expandedTx === tx.id;

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <div
                    onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                        config.bgColor
                      )}
                    >
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--color-text-primary)] truncate">
                          {tx.title}
                        </p>
                        <Badge variant={status.variant} size="sm">
                          {tx.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-[var(--color-text-muted)] truncate">
                        {tx.description}
                      </p>
                    </div>

                    {/* Amount & Time */}
                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          'font-medium',
                          tx.amount >= 0
                            ? 'text-[var(--color-success)]'
                            : 'text-[var(--color-text-primary)]'
                        )}
                      >
                        {tx.amount >= 0 ? '+' : ''}
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatTimeAgo(tx.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 ml-14 space-y-2">
                          <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg text-sm space-y-2">
                            <div className="flex justify-between">
                              <span className="text-[var(--color-text-muted)]">Date & Time</span>
                              <span className="text-[var(--color-text-primary)]">
                                {tx.timestamp.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--color-text-muted)]">Transaction ID</span>
                              <span className="text-[var(--color-text-primary)] font-mono">
                                {tx.id.toUpperCase()}
                              </span>
                            </div>
                            {tx.method && (
                              <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Method</span>
                                <span className="text-[var(--color-text-primary)]">{tx.method}</span>
                              </div>
                            )}
                            {tx.txHash && (
                              <div className="flex justify-between items-center">
                                <span className="text-[var(--color-text-muted)]">TX Hash</span>
                                <a
                                  href="#"
                                  className="flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                                >
                                  <span className="font-mono">{tx.txHash}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
