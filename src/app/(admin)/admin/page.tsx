'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  UserPlus,
  CheckCircle,
  Clock,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Wallet,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Dashboard Page - Real Data Connected
// ============================================

interface DashboardStats {
  totalUsers: number;
  usersThisMonth: number;
  userChange: number;
  activeUsers: number;
  verifiedUsers: number;
  totalDeposits: number;
  depositsThisMonth: number;
  depositChange: number;
  pendingDeposits: number;
  totalWithdrawals: number;
  withdrawalsThisMonth: number;
  withdrawalChange: number;
  pendingWithdrawals: number;
  pendingKyc: number;
  netVolume: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'verified' | 'pending' | 'unverified';
  balance: number;
  joinedAt: string;
}

interface PendingAction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'kyc';
  user: string;
  userEmail: string;
  amount?: number;
  token?: string;
  reference?: string;
  time: string;
}

interface TopHolder {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  balance: number;
}

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [topHolders, setTopHolders] = useState<TopHolder[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      
      if (data.success) {
        setStats(data.stats);
        setRecentUsers(data.recentUsers);
        setPendingActions(data.pendingActions);
        setTopHolders(data.topHolders);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchDashboardData(), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-[var(--color-text-muted)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = stats ? [
    { 
      title: 'Total Users', 
      value: formatNumber(stats.totalUsers), 
      change: stats.userChange, 
      icon: <Users className="h-6 w-6" />, 
      trend: stats.userChange >= 0 ? 'up' : 'down' as const,
      subtitle: `${stats.usersThisMonth} new this month`,
    },
    { 
      title: 'Total Deposits', 
      value: `$${formatNumber(stats.totalDeposits)}`, 
      change: stats.depositChange, 
      icon: <TrendingUp className="h-6 w-6" />, 
      trend: stats.depositChange >= 0 ? 'up' : 'down' as const,
      subtitle: `$${formatNumber(stats.depositsThisMonth)} this month`,
    },
    { 
      title: 'Total Withdrawals', 
      value: `$${formatNumber(stats.totalWithdrawals)}`, 
      change: stats.withdrawalChange, 
      icon: <TrendingDown className="h-6 w-6" />, 
      trend: 'down' as const,
      subtitle: `$${formatNumber(stats.withdrawalsThisMonth)} this month`,
    },
    { 
      title: 'Net Volume', 
      value: `$${formatNumber(stats.netVolume)}`, 
      change: 0, 
      icon: <DollarSign className="h-6 w-6" />, 
      trend: stats.netVolume >= 0 ? 'up' : 'down' as const,
      subtitle: `${stats.verifiedUsers} verified users`,
    },
  ] : [];

  const quickActions = stats ? [
    { 
      label: 'Pending Withdrawals', 
      count: stats.pendingWithdrawals, 
      color: 'error',
      href: '/admin/withdrawals',
      icon: <ArrowUpRight className="h-5 w-5" />,
    },
    { 
      label: 'Pending Deposits', 
      count: stats.pendingDeposits, 
      color: 'success',
      href: '/admin/deposits',
      icon: <ArrowDownRight className="h-5 w-5" />,
    },
    { 
      label: 'KYC Requests', 
      count: stats.pendingKyc, 
      color: 'warning',
      href: '/admin/kyc',
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    { 
      label: 'Active Users', 
      count: stats.activeUsers, 
      color: 'primary',
      href: '/admin/users',
      icon: <Activity className="h-5 w-5" />,
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Platform overview and key metrics
            {lastUpdated && (
              <span className="ml-2 text-xs">
                • Updated {formatTimeAgo(lastUpdated.toISOString())}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    'h-12 w-12 rounded-xl flex items-center justify-center',
                    stat.trend === 'up' ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'bg-[var(--color-error-bg)] text-[var(--color-error)]'
                  )}>
                    {stat.icon}
                  </div>
                  {stat.change !== 0 && (
                    <div className={cn(
                      'flex items-center gap-1 text-sm font-medium',
                      stat.change >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                    )}>
                      {stat.change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {Math.abs(stat.change)}%
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{stat.title}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="cursor-pointer hover:border-[var(--color-primary)] transition-colors h-full">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center',
                    action.color === 'error' && 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
                    action.color === 'success' && 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
                    action.color === 'warning' && 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
                    action.color === 'primary' && 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]',
                  )}>
                    {action.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{action.count}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{action.label}</p>
                  </div>
                </div>
                <Eye className="h-5 w-5 text-[var(--color-text-muted)]" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Recent Users
              </CardTitle>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-text-muted)]">
                  No users yet
                </div>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center">
                            <span className="text-sm font-semibold text-[var(--color-primary)]">
                              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">{user.name}</p>
                          <p className="text-sm text-[var(--color-text-muted)]">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-[var(--color-text-primary)]">
                            {formatCurrency(user.balance)}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">{formatTimeAgo(user.joinedAt)}</p>
                        </div>
                        <Badge
                          variant={user.status === 'verified' ? 'success' : user.status === 'pending' ? 'warning' : 'default'}
                          size="sm"
                        >
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Actions */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Actions
              </CardTitle>
              <Badge variant="warning">{pendingActions.length}</Badge>
            </CardHeader>
            <CardContent>
              {pendingActions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-[var(--color-success)] mx-auto mb-3" />
                  <p className="text-[var(--color-text-muted)]">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingActions.map((action) => (
                    <Link 
                      key={action.id} 
                      href={action.type === 'withdrawal' ? '/admin/withdrawals' : action.type === 'deposit' ? '/admin/deposits' : '/admin/kyc'}
                    >
                      <div className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-xl hover:bg-[var(--color-surface-elevated)]/80 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center',
                            action.type === 'withdrawal' ? 'bg-[var(--color-error-bg)]' :
                            action.type === 'deposit' ? 'bg-[var(--color-success-bg)]' :
                            'bg-[var(--color-info-bg)]'
                          )}>
                            {action.type === 'withdrawal' ? (
                              <ArrowUpRight className="h-4 w-4 text-[var(--color-error)]" />
                            ) : action.type === 'deposit' ? (
                              <ArrowDownRight className="h-4 w-4 text-[var(--color-success)]" />
                            ) : (
                              <ShieldCheck className="h-4 w-4 text-[var(--color-info)]" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              {action.user}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] capitalize">
                              {action.type} {action.token && `• ${action.token}`} • {formatTimeAgo(action.time)}
                            </p>
                          </div>
                        </div>
                        {action.amount && (
                          <span className={cn(
                            'font-medium',
                            action.type === 'withdrawal' ? 'text-[var(--color-error)]' : 'text-[var(--color-success)]'
                          )}>
                            {action.type === 'withdrawal' ? '-' : '+'}{formatCurrency(action.amount)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Holders */}
      {topHolders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Top Balance Holders
            </CardTitle>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">View All Users</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {topHolders.map((holder, index) => (
                <div
                  key={holder.id}
                  className="flex items-center gap-3 p-4 bg-[var(--color-surface-elevated)] rounded-xl"
                >
                  <div className="relative">
                    <div className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    {holder.avatar ? (
                      <Image
                        src={holder.avatar}
                        alt={holder.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center">
                        <span className="text-sm font-semibold text-[var(--color-primary)]">
                          {holder.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">{holder.name}</p>
                    <p className="text-sm font-semibold text-[var(--color-success)]">
                      {formatCurrency(holder.balance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
