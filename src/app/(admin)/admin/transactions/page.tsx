'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Transactions Page
// ============================================

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'transfer';
  user: { name: string; email: string };
  amount: number;
  fee: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  method: string;
  timestamp: Date;
  reference: string;
}

const mockTransactions: Transaction[] = [
  { id: 'TXN001', type: 'deposit', user: { name: 'John Smith', email: 'john@example.com' }, amount: 50000, fee: 0, status: 'completed', method: 'Wire Transfer', timestamp: new Date(Date.now() - 30 * 60 * 1000), reference: 'DEP-2026-001234' },
  { id: 'TXN002', type: 'withdrawal', user: { name: 'Sarah Johnson', email: 'sarah@example.com' }, amount: 15000, fee: 25, status: 'pending', method: 'Bank Transfer', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), reference: 'WTH-2026-005678' },
  { id: 'TXN003', type: 'trade', user: { name: 'Mike Chen', email: 'mike@example.com' }, amount: 8500, fee: 8.50, status: 'completed', method: 'BTC/USDT', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), reference: 'TRD-2026-009012' },
  { id: 'TXN004', type: 'deposit', user: { name: 'Emily Davis', email: 'emily@example.com' }, amount: 25000, fee: 0, status: 'failed', method: 'Credit Card', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), reference: 'DEP-2026-003456' },
  { id: 'TXN005', type: 'withdrawal', user: { name: 'Alex Wilson', email: 'alex@example.com' }, amount: 75000, fee: 50, status: 'completed', method: 'Crypto (BTC)', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), reference: 'WTH-2026-007890' },
];

const typeIcons = {
  deposit: <ArrowDownRight className="h-4 w-4" />,
  withdrawal: <ArrowUpRight className="h-4 w-4" />,
  trade: <ArrowLeftRight className="h-4 w-4" />,
  transfer: <ArrowLeftRight className="h-4 w-4" />,
};

const typeColors = {
  deposit: 'text-[var(--color-success)] bg-[var(--color-success-bg)]',
  withdrawal: 'text-[var(--color-error)] bg-[var(--color-error-bg)]',
  trade: 'text-[var(--color-info)] bg-[var(--color-info-bg)]',
  transfer: 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]',
};

const statusIcons = {
  completed: <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />,
  pending: <Clock className="h-4 w-4 text-[var(--color-warning)]" />,
  failed: <XCircle className="h-4 w-4 text-[var(--color-error)]" />,
  cancelled: <AlertCircle className="h-4 w-4 text-[var(--color-text-muted)]" />,
};

export default function AdminTransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredTransactions = mockTransactions.filter((txn) => {
    const matchesSearch =
      txn.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Transactions</h1>
          <p className="text-sm text-[var(--color-text-muted)]">View and manage all platform transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Calendar className="h-4 w-4" />}>Date Range</Button>
          <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />}>Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume (24h)', value: '$2.4M' },
          { label: 'Total Fees (24h)', value: '$12,450' },
          { label: 'Transactions (24h)', value: '1,247' },
          { label: 'Pending', value: '23' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search by user or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)]"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="trade">Trades</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                <th className="text-left py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">Type</th>
                <th className="text-left py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">User</th>
                <th className="text-right py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">Amount</th>
                <th className="text-right py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">Fee</th>
                <th className="text-left py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">Status</th>
                <th className="text-left py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">Time</th>
                <th className="text-right py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn, index) => (
                <motion.tr
                  key={txn.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', typeColors[txn.type])}>
                        {typeIcons[txn.type]}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)] capitalize">{txn.type}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{txn.reference}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium text-[var(--color-text-primary)]">{txn.user.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{txn.user.email}</p>
                  </td>
                  <td className="py-4 px-6 text-right font-medium text-[var(--color-text-primary)]">
                    {formatCurrency(txn.amount)}
                  </td>
                  <td className="py-4 px-6 text-right text-[var(--color-text-muted)]">
                    {txn.fee > 0 ? formatCurrency(txn.fee) : '-'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {statusIcons[txn.status]}
                      <span className="capitalize text-[var(--color-text-primary)]">{txn.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-[var(--color-text-muted)]">{formatTime(txn.timestamp)}</td>
                  <td className="py-4 px-6">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
