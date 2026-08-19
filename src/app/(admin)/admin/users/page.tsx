'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MoreVertical,
  Download,
  Ban,
  CheckCircle,
  Eye,
  Shield,
  DollarSign,
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Coins,
  RefreshCw,
  ShieldCheck,
  Crown,
  User as UserIcon,
  ArrowRightLeft,
  Settings2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Users Page - Full User Management
// ============================================

interface UserHolding {
  _id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  icon: string;
  amount: number;
  amountUsd: number;
  coingeckoId?: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'pending' | 'active' | 'suspended' | 'banned' | 'deleted';
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  accountLevel: 'starter' | 'bronze' | 'silver' | 'gold' | 'vip';
  totalBalance: number;
  availableBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalProfit: number;
  referralCode: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  holdings: UserHolding[];
  totalHoldingsValue: number;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  pendingKYC: number;
  verifiedKYC: number;
  totalAdmins: number;
  todayUsers: number;
  totalBalance: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

const statusColors = {
  active: 'success',
  pending: 'warning',
  suspended: 'error',
  banned: 'error',
  deleted: 'default',
} as const;

const kycColors = {
  verified: 'success',
  pending: 'warning',
  rejected: 'error',
  unverified: 'default',
} as const;

const roleColors = {
  user: 'default',
  admin: 'warning',
  super_admin: 'error',
} as const;

interface TokenPreset {
  symbol: string;
  name: string;
  icon: string;
  coingeckoId: string;
}

const commonTokens: TokenPreset[] = [
  { symbol: 'BTC', name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', coingeckoId: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', coingeckoId: 'ethereum' },
  { symbol: 'USDT', name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', coingeckoId: 'tether' },
  { symbol: 'USDC', name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', coingeckoId: 'usd-coin' },
  { symbol: 'BNB', name: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', coingeckoId: 'binancecoin' },
  { symbol: 'SOL', name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', coingeckoId: 'solana' },
  { symbol: 'XRP', name: 'XRP', icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', coingeckoId: 'ripple' },
  { symbol: 'ADA', name: 'Cardano', icon: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', coingeckoId: 'cardano' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showHoldingsModal, setShowHoldingsModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('user');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Holdings form states
  const [isCustomToken, setIsCustomToken] = useState(false);
  const [holdingSymbol, setHoldingSymbol] = useState('');
  const [holdingName, setHoldingName] = useState('');
  const [holdingIcon, setHoldingIcon] = useState('');
  const [holdingCoingeckoId, setHoldingCoingeckoId] = useState('');
  const [inputMode, setInputMode] = useState<'usd' | 'token'>('usd');
  const [inputValue, setInputValue] = useState('');
  const [calculatedValue, setCalculatedValue] = useState('');
  const [holdingMode, setHoldingMode] = useState<'add' | 'set'>('set');
  const [selectedTokenPreset, setSelectedTokenPreset] = useState<TokenPreset | null>(null);
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [currentTokenPrice, setCurrentTokenPrice] = useState<number>(0);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // Fetch token prices
  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices');
      const data = await res.json();
      if (data.success) {
        setTokenPrices(data.prices);
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }
  }, []);

  // Fetch price by CoinGecko ID
  const fetchPriceByCoingeckoId = async (coingeckoId: string): Promise<number> => {
    try {
      setIsFetchingPrice(true);
      const res = await fetch(`/api/prices?id=${coingeckoId}`);
      const data = await res.json();
      if (data.success) {
        return data.price || 0;
      }
    } catch (error) {
      console.error('Failed to fetch price:', error);
    } finally {
      setIsFetchingPrice(false);
    }
    return 0;
  };

  // Calculate the other value when input changes
  useEffect(() => {
    if (!inputValue || currentTokenPrice === 0) {
      setCalculatedValue('');
      return;
    }

    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      setCalculatedValue('');
      return;
    }

    if (inputMode === 'usd') {
      // Calculate token amount from USD
      const tokenAmount = numValue / currentTokenPrice;
      setCalculatedValue(tokenAmount.toFixed(8));
    } else {
      // Calculate USD from token amount
      const usdAmount = numValue * currentTokenPrice;
      setCalculatedValue(usdAmount.toFixed(2));
    }
  }, [inputValue, inputMode, currentTokenPrice]);

  const fetchUsers = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchQuery,
        status: statusFilter,
        role: roleFilter,
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setStats(data.stats);
        setTotalPages(data.pagination.pages);
        setTotalUsers(data.pagination.total);
      } else {
        addToast('error', data.error || 'Failed to fetch users');
      }
    } catch {
      addToast('error', 'Failed to fetch users');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchQuery, statusFilter, roleFilter]);

  useEffect(() => { fetchUsers(); fetchPrices(); }, [fetchUsers, fetchPrices]);

  const formatDate = (dateStr: string): string => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatLastActive = (dateStr?: string): string => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
  const getInitials = (firstName: string, lastName: string) => `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const viewUser = (user: User) => { setSelectedUser(user); setShowUserModal(true); setShowActionMenu(null); };
  const openRoleModal = (user: User) => { setSelectedUser(user); setNewRole(user.role); setShowRoleModal(true); setShowActionMenu(null); };
  
  const resetHoldingsForm = () => {
    setIsCustomToken(false);
    setHoldingSymbol('');
    setHoldingName('');
    setHoldingIcon('');
    setHoldingCoingeckoId('');
    setInputValue('');
    setCalculatedValue('');
    setInputMode('usd');
    setHoldingMode('set');
    setSelectedTokenPreset(null);
    setCurrentTokenPrice(0);
  };
  
  const openHoldingsModal = async (user: User) => {
    setSelectedUser(user);
    resetHoldingsForm();
    setShowHoldingsModal(true);
    setShowActionMenu(null);
    await fetchPrices();
  };

  const toggleSuspend = async (user: User) => {
    setIsProcessing(true); setShowActionMenu(null);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend' }),
      });
      const data = await res.json();
      if (data.success) { addToast('success', data.message); fetchUsers(true); }
      else addToast('error', data.error || 'Failed to update user');
    } catch { addToast('error', 'Failed to update user'); }
    finally { setIsProcessing(false); }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_role', role: newRole }),
      });
      const data = await res.json();
      if (data.success) { addToast('success', data.message); setShowRoleModal(false); fetchUsers(true); }
      else addToast('error', data.error || 'Failed to change role');
    } catch { addToast('error', 'Failed to change role'); }
    finally { setIsProcessing(false); }
  };

  const handleAddHolding = async () => {
    if (!selectedUser || !holdingSymbol || !inputValue) return;
    
    // Calculate final values
    let tokenAmount: number;
    let usdAmount: number;
    
    if (inputMode === 'usd') {
      usdAmount = parseFloat(inputValue);
      tokenAmount = currentTokenPrice > 0 ? usdAmount / currentTokenPrice : 0;
    } else {
      tokenAmount = parseFloat(inputValue);
      usdAmount = tokenAmount * currentTokenPrice;
    }

    if (isNaN(tokenAmount) || isNaN(usdAmount)) {
      addToast('error', 'Invalid amount');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}/holdings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: holdingSymbol.toUpperCase(),
          name: holdingName || holdingSymbol.toUpperCase(),
          type: 'crypto',
          icon: holdingIcon || selectedTokenPreset?.icon || '',
          amount: tokenAmount,
          amountUsd: usdAmount,
          mode: holdingMode,
          coingeckoId: holdingCoingeckoId || selectedTokenPreset?.coingeckoId || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        resetHoldingsForm();
        fetchUsers(true);
        // Refresh selected user
        const userRes = await fetch(`/api/admin/users/${selectedUser._id}`);
        const userData = await userRes.json();
        if (userData.success) setSelectedUser(userData.user);
      } else addToast('error', data.error || 'Failed to add holding');
    } catch { addToast('error', 'Failed to add holding'); }
    finally { setIsProcessing(false); }
  };

  const handleDeleteHolding = async (symbol: string) => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}/holdings?symbol=${symbol}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message); fetchUsers(true);
        const userRes = await fetch(`/api/admin/users/${selectedUser._id}`);
        const userData = await userRes.json();
        if (userData.success) setSelectedUser(userData.user);
      } else addToast('error', data.error || 'Failed to delete holding');
    } catch { addToast('error', 'Failed to delete holding'); }
    finally { setIsProcessing(false); }
  };

  const selectTokenPreset = async (token: TokenPreset) => {
    setIsCustomToken(false);
    setSelectedTokenPreset(token);
    setHoldingSymbol(token.symbol);
    setHoldingName(token.name);
    setHoldingIcon(token.icon);
    setHoldingCoingeckoId(token.coingeckoId);
    setInputValue('');
    setCalculatedValue('');
    
    // Set price from cache or fetch
    if (tokenPrices[token.symbol]) {
      setCurrentTokenPrice(tokenPrices[token.symbol]);
    } else {
      const price = await fetchPriceByCoingeckoId(token.coingeckoId);
      setCurrentTokenPrice(price);
      setTokenPrices(prev => ({ ...prev, [token.symbol]: price }));
    }
  };

  const selectCustomToken = () => {
    setIsCustomToken(true);
    setSelectedTokenPreset(null);
    setHoldingSymbol('');
    setHoldingName('');
    setHoldingIcon('');
    setHoldingCoingeckoId('');
    setInputValue('');
    setCalculatedValue('');
    setCurrentTokenPrice(0);
  };

  const fetchCustomTokenPrice = async () => {
    if (!holdingCoingeckoId) {
      addToast('error', 'Please enter a CoinGecko ID');
      return;
    }
    const price = await fetchPriceByCoingeckoId(holdingCoingeckoId);
    if (price > 0) {
      setCurrentTokenPrice(price);
      addToast('success', `Price fetched: $${price.toFixed(price < 1 ? 8 : 2)}`);
    } else {
      addToast('error', 'Could not fetch price. Check the CoinGecko ID.');
    }
  };

  const toggleInputMode = () => {
    const temp = inputValue;
    setInputValue(calculatedValue);
    setCalculatedValue(temp);
    setInputMode(inputMode === 'usd' ? 'token' : 'usd');
  };

  const canSubmitHolding = () => {
    if (!inputValue || parseFloat(inputValue) <= 0) return false;
    if (isCustomToken) {
      return holdingSymbol && holdingName && currentTokenPrice > 0;
    }
    return selectedTokenPreset && currentTokenPrice > 0;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div key={toast.id} initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn('fixed top-4 left-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2', toast.type === 'success' ? 'bg-[#22c55e] text-white' : 'bg-[#ef4444] text-white')}>
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Users</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Manage platform users and their accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />} onClick={() => fetchUsers(true)} disabled={isRefreshing}>Refresh</Button>
          <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />}>Export</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><div className="h-4 w-20 bg-[var(--color-surface-elevated)] rounded animate-pulse mb-2" /><div className="h-8 w-16 bg-[var(--color-surface-elevated)] rounded animate-pulse mb-1" /><div className="h-3 w-24 bg-[var(--color-surface-elevated)] rounded animate-pulse" /></CardContent></Card>
        )) : (
          <>
            <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-[var(--color-primary)]" /><p className="text-sm text-[var(--color-text-muted)]">Total Users</p></div><p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats?.totalUsers.toLocaleString()}</p><p className="text-xs text-[var(--color-success)]">+{stats?.todayUsers} today</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><UserCheck className="h-4 w-4 text-[var(--color-success)]" /><p className="text-sm text-[var(--color-text-muted)]">Active Users</p></div><p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats?.activeUsers.toLocaleString()}</p><p className="text-xs text-[var(--color-text-muted)]">{stats?.totalUsers ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-[var(--color-warning)]" /><p className="text-sm text-[var(--color-text-muted)]">Pending KYC</p></div><p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats?.pendingKYC.toLocaleString()}</p><p className="text-xs text-[var(--color-text-muted)]">{stats?.verifiedKYC} verified</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-[var(--color-primary)]" /><p className="text-sm text-[var(--color-text-muted)]">Total Balance</p></div><p className="text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(stats?.totalBalance || 0)}</p><p className="text-xs text-[var(--color-text-muted)]">{stats?.totalAdmins} admins</p></CardContent></Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <input type="text" placeholder="Search users by name or email..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-[var(--color-surface-elevated)] rounded-lg p-1">
              {['all', 'active', 'pending', 'suspended'].map((status) => (
                <button key={status} onClick={() => { setStatusFilter(status); setPage(1); }}
                  className={cn('px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize', statusFilter === status ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]')}>{status}</button>
              ))}
            </div>
            <div className="flex gap-1 bg-[var(--color-surface-elevated)] rounded-lg p-1">
              {['all', 'user', 'admin'].map((role) => (
                <button key={role} onClick={() => { setRoleFilter(role); setPage(1); }}
                  className={cn('px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize', roleFilter === role ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]')}>{role === 'all' ? 'All Roles' : role}</button>
              ))}
            </div>
          </div>
        </div>
      </CardContent></Card>

      {/* Users Table */}
      <Card><CardContent className="p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--color-primary)]" /><p className="mt-2 text-[var(--color-text-muted)]">Loading users...</p></div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center"><Users className="h-12 w-12 mx-auto text-[var(--color-text-muted)] mb-2" /><p className="text-[var(--color-text-muted)]">No users found</p></div>
        ) : (
          <table className="w-full min-w-[1100px]">
            <thead><tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
              <th className="text-left py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">User</th>
              <th className="text-left py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">Role</th>
              <th className="text-left py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">Status</th>
              <th className="text-left py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">KYC</th>
              <th className="text-right py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">Balance</th>
              <th className="text-right py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">Holdings</th>
              <th className="text-left py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">Joined</th>
              <th className="text-right py-4 px-6 text-xs font-medium text-[var(--color-text-muted)] uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {users.map((user, index) => (
                <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {user.avatar ? <Image src={user.avatar} alt={`${user.firstName} ${user.lastName}`} width={40} height={40} className="rounded-full" unoptimized /> : (
                        <div className="h-10 w-10 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center"><span className="text-sm font-semibold text-[var(--color-primary)]">{getInitials(user.firstName, user.lastName)}</span></div>
                      )}
                      <div><p className="font-medium text-[var(--color-text-primary)]">{user.firstName} {user.lastName}</p><p className="text-sm text-[var(--color-text-muted)]">{user.email}</p></div>
                    </div>
                  </td>
                  <td className="py-4 px-6"><Badge variant={roleColors[user.role]} size="sm">{user.role === 'super_admin' ? 'Super Admin' : user.role}</Badge></td>
                  <td className="py-4 px-6"><Badge variant={statusColors[user.status]} size="sm">{user.status}</Badge></td>
                  <td className="py-4 px-6"><Badge variant={kycColors[user.verificationStatus]} size="sm">{user.verificationStatus}</Badge></td>
                  <td className="py-4 px-6 text-right font-medium text-[var(--color-text-primary)]">{formatCurrency(user.availableBalance)}</td>
                  <td className="py-4 px-6 text-right"><span className="text-[var(--color-text-primary)]">{formatCurrency(user.totalHoldingsValue)}</span><span className="text-xs text-[var(--color-text-muted)] ml-1">({user.holdings?.length || 0})</span></td>
                  <td className="py-4 px-6 text-[var(--color-text-muted)]">{formatDate(user.createdAt)}</td>
                  <td className="py-4 px-6">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => viewUser(user)} title="View Details"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openHoldingsModal(user)} title="Manage Holdings"><Coins className="h-4 w-4" /></Button>
                      <div className="relative">
                        <Button variant="ghost" size="sm" onClick={() => setShowActionMenu(showActionMenu === user._id ? null : user._id)}><MoreVertical className="h-4 w-4" /></Button>
                        <AnimatePresence>
                          {showActionMenu === user._id && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-full mt-1 w-52 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg z-20 overflow-hidden">
                              <button onClick={() => openRoleModal(user)} className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--color-surface-hover)] flex items-center gap-2 text-[var(--color-text-primary)]"><Shield className="h-4 w-4" /> Change Role</button>
                              <button onClick={() => toggleSuspend(user)} className={cn('w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--color-surface-hover)] flex items-center gap-2', user.status === 'suspended' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]')}>
                                {user.status === 'suspended' ? <><ShieldCheck className="h-4 w-4" /> Activate User</> : <><Ban className="h-4 w-4" /> Suspend User</>}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent></Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, totalUsers)} of {totalUsers} users</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-3 py-2 text-sm text-[var(--color-text-primary)]">{page} / {totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title="User Details" size="lg">
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {selectedUser.avatar ? <Image src={selectedUser.avatar} alt={`${selectedUser.firstName} ${selectedUser.lastName}`} width={64} height={64} className="rounded-full" unoptimized /> : (
                <div className="h-16 w-16 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center"><span className="text-xl font-semibold text-[var(--color-primary)]">{getInitials(selectedUser.firstName, selectedUser.lastName)}</span></div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{selectedUser.firstName} {selectedUser.lastName}</h3>
                <p className="text-[var(--color-text-muted)]">{selectedUser.email}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={roleColors[selectedUser.role]} size="sm">{selectedUser.role}</Badge>
                  <Badge variant={statusColors[selectedUser.status]} size="sm">{selectedUser.status}</Badge>
                  <Badge variant={kycColors[selectedUser.verificationStatus]} size="sm">KYC: {selectedUser.verificationStatus}</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl"><p className="text-xs text-[var(--color-text-muted)]">Available Balance</p><p className="text-lg font-semibold text-[var(--color-text-primary)]">{formatCurrency(selectedUser.availableBalance)}</p></div>
              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl"><p className="text-xs text-[var(--color-text-muted)]">Total Holdings</p><p className="text-lg font-semibold text-[var(--color-primary)]">{formatCurrency(selectedUser.totalHoldingsValue)}</p></div>
              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl"><p className="text-xs text-[var(--color-text-muted)]">Total Deposits</p><p className="text-lg font-semibold text-[var(--color-success)]">{formatCurrency(selectedUser.totalDeposits)}</p></div>
              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl"><p className="text-xs text-[var(--color-text-muted)]">Total Withdrawals</p><p className="text-lg font-semibold text-[var(--color-error)]">{formatCurrency(selectedUser.totalWithdrawals)}</p></div>
            </div>
            {selectedUser.holdings && selectedUser.holdings.length > 0 && (
              <div><h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Token Holdings</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedUser.holdings.map((holding) => (
                    <div key={holding._id} className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg">
                      <div className="flex items-center gap-3">
                        {holding.icon ? <Image src={holding.icon} alt={holding.symbol} width={32} height={32} className="rounded-full" unoptimized /> : (
                          <div className="h-8 w-8 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center"><span className="text-xs font-semibold text-[var(--color-primary)]">{holding.symbol.charAt(0)}</span></div>
                        )}
                        <div><p className="font-medium text-[var(--color-text-primary)]">{holding.name}</p><p className="text-xs text-[var(--color-text-muted)]">{holding.symbol}</p></div>
                      </div>
                      <div className="text-right"><p className="font-medium text-[var(--color-text-primary)]">{formatCurrency(holding.amountUsd)}</p><p className="text-xs text-[var(--color-text-muted)]">{holding.amount.toFixed(6)} {holding.symbol}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div><p className="text-sm text-[var(--color-text-muted)]">Phone</p><p className="text-[var(--color-text-primary)]">{selectedUser.phone || 'Not provided'}</p></div>
              <div><p className="text-sm text-[var(--color-text-muted)]">Country</p><p className="text-[var(--color-text-primary)]">{selectedUser.country || 'Not provided'}</p></div>
              <div><p className="text-sm text-[var(--color-text-muted)]">Joined</p><p className="text-[var(--color-text-primary)]">{formatDate(selectedUser.createdAt)}</p></div>
              <div><p className="text-sm text-[var(--color-text-muted)]">Last Login</p><p className="text-[var(--color-text-primary)]">{formatLastActive(selectedUser.lastLoginAt)}</p></div>
              <div><p className="text-sm text-[var(--color-text-muted)]">Referral Code</p><p className="text-[var(--color-text-primary)] font-mono">{selectedUser.referralCode}</p></div>
              <div><p className="text-sm text-[var(--color-text-muted)]">Account Level</p><p className="text-[var(--color-text-primary)] capitalize">{selectedUser.accountLevel}</p></div>
            </div>
            <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--color-border)]">
              <Button variant="secondary" leftIcon={<Coins className="h-4 w-4" />} onClick={() => { setShowUserModal(false); openHoldingsModal(selectedUser); }}>Manage Holdings</Button>
              <Button variant="secondary" leftIcon={<Shield className="h-4 w-4" />} onClick={() => { setShowUserModal(false); openRoleModal(selectedUser); }}>Change Role</Button>
              <Button variant="secondary" className={selectedUser.status === 'suspended' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'} leftIcon={selectedUser.status === 'suspended' ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />} onClick={() => { setShowUserModal(false); toggleSuspend(selectedUser); }}>{selectedUser.status === 'suspended' ? 'Activate' : 'Suspend'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Change Role Modal */}
      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="Change User Role" size="sm">
        {selectedUser && (
          <div className="space-y-4">
            <div><p className="text-sm text-[var(--color-text-muted)]">User</p><p className="font-medium text-[var(--color-text-primary)]">{selectedUser.firstName} {selectedUser.lastName}</p><p className="text-sm text-[var(--color-text-muted)]">Current Role: <span className="capitalize">{selectedUser.role}</span></p></div>
            <div><label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">New Role</label>
              <div className="space-y-2">
                {[{ value: 'user', label: 'User', icon: UserIcon, desc: 'Standard user access' }, { value: 'admin', label: 'Admin', icon: Shield, desc: 'Admin panel access' }, { value: 'super_admin', label: 'Super Admin', icon: Crown, desc: 'Full system access' }].map((role) => (
                  <button key={role.value} onClick={() => setNewRole(role.value)} className={cn('w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-colors', newRole === role.value ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]')}>
                    <role.icon className={cn('h-5 w-5', newRole === role.value ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]')} />
                    <div><p className="font-medium text-[var(--color-text-primary)]">{role.label}</p><p className="text-xs text-[var(--color-text-muted)]">{role.desc}</p></div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="secondary" onClick={() => setShowRoleModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleChangeRole} disabled={newRole === selectedUser.role || isProcessing} className="flex-1">{isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Role'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Manage Holdings Modal */}
      <Modal isOpen={showHoldingsModal} onClose={() => setShowHoldingsModal(false)} title="Manage Token Holdings" size="lg">
        {selectedUser && (
          <div className="space-y-6">
            <div><p className="text-sm text-[var(--color-text-muted)]">User</p><p className="font-medium text-[var(--color-text-primary)]">{selectedUser.firstName} {selectedUser.lastName}</p></div>
            
            {/* Current Holdings */}
            <div><h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Current Holdings ({selectedUser.holdings?.length || 0})</h4>
              {selectedUser.holdings && selectedUser.holdings.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedUser.holdings.map((holding) => (
                    <div key={holding._id} className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg">
                      <div className="flex items-center gap-3">
                        {holding.icon ? <Image src={holding.icon} alt={holding.symbol} width={32} height={32} className="rounded-full" unoptimized /> : (
                          <div className="h-8 w-8 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center"><span className="text-xs font-semibold text-[var(--color-primary)]">{holding.symbol.charAt(0)}</span></div>
                        )}
                        <div><p className="font-medium text-[var(--color-text-primary)]">{holding.name}</p><p className="text-xs text-[var(--color-text-muted)]">{holding.amount.toFixed(6)} {holding.symbol}</p></div>
                      </div>
                      <div className="flex items-center gap-3"><p className="font-medium text-[var(--color-text-primary)]">{formatCurrency(holding.amountUsd)}</p>
                        <Button variant="ghost" size="sm" className="text-[var(--color-error)]" onClick={() => handleDeleteHolding(holding.symbol)} disabled={isProcessing}><X className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center py-4 text-[var(--color-text-muted)]">No holdings yet</p>}
            </div>
            
            {/* Add/Update Holding */}
            <div className="border-t border-[var(--color-border)] pt-6">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Fund Token Balance</h4>
              
              {/* Token Selection */}
              <div className="mb-4">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">Select Token</p>
                <div className="flex flex-wrap gap-2">
                  {commonTokens.map((token) => (
                    <button key={token.symbol} onClick={() => selectTokenPreset(token)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors', !isCustomToken && selectedTokenPreset?.symbol === token.symbol ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]')}>
                      <Image src={token.icon} alt={token.symbol} width={18} height={18} className="rounded-full" unoptimized />{token.symbol}
                    </button>
                  ))}
                  <button onClick={selectCustomToken} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors', isCustomToken ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]')}>
                    <Settings2 className="h-4 w-4" /> Custom
                  </button>
                </div>
              </div>

              {/* Custom Token Form */}
              {isCustomToken && (
                <div className="mb-4 p-4 bg-[var(--color-surface-elevated)] rounded-xl space-y-3">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Custom Token Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)]">Symbol *</label>
                      <input type="text" value={holdingSymbol} onChange={(e) => setHoldingSymbol(e.target.value.toUpperCase())} placeholder="e.g. PEPE" className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)]">Name *</label>
                      <input type="text" value={holdingName} onChange={(e) => setHoldingName(e.target.value)} placeholder="e.g. Pepe" className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)]">Icon URL (optional)</label>
                    <input type="text" value={holdingIcon} onChange={(e) => setHoldingIcon(e.target.value)} placeholder="https://..." className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)]">CoinGecko ID * <span className="text-[var(--color-text-muted)]">(for real-time price)</span></label>
                    <div className="flex gap-2 mt-1">
                      <input type="text" value={holdingCoingeckoId} onChange={(e) => setHoldingCoingeckoId(e.target.value.toLowerCase())} placeholder="e.g. pepe" className="flex-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                      <Button variant="secondary" size="sm" onClick={fetchCustomTokenPrice} disabled={!holdingCoingeckoId || isFetchingPrice}>
                        {isFetchingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch Price'}
                      </Button>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Find the ID on <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">coingecko.com</a> in the API section of any coin page</p>
                  </div>
                  {currentTokenPrice > 0 && (
                    <div className="p-2 bg-[var(--color-success)]/10 rounded-lg">
                      <p className="text-sm text-[var(--color-success)]">✓ Price loaded: 1 {holdingSymbol || 'TOKEN'} = {formatCurrency(currentTokenPrice)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Preset Token Price Info */}
              {!isCustomToken && selectedTokenPreset && (
                <div className="mb-4 p-3 bg-[var(--color-surface-elevated)] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image src={selectedTokenPreset.icon} alt={selectedTokenPreset.symbol} width={24} height={24} className="rounded-full" unoptimized />
                      <span className="font-medium text-[var(--color-text-primary)]">{selectedTokenPreset.name}</span>
                    </div>
                    <div className="text-right">
                      {isFetchingPrice ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
                      ) : (
                        <p className="text-sm text-[var(--color-text-primary)]">
                          1 {selectedTokenPreset.symbol} = {formatCurrency(currentTokenPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              {(selectedTokenPreset || (isCustomToken && currentTokenPrice > 0)) && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-[var(--color-text-muted)]">
                        {inputMode === 'usd' ? 'Amount in USD' : `Amount in ${holdingSymbol}`}
                      </label>
                      <button onClick={toggleInputMode} className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">
                        <ArrowRightLeft className="h-3 w-3" />
                        Switch to {inputMode === 'usd' ? 'Token' : 'USD'}
                      </button>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                        {inputMode === 'usd' ? '$' : holdingSymbol}
                      </div>
                      <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="0.00"
                        step="any"
                        className="w-full pl-12 pr-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                    
                    {calculatedValue && (
                      <p className="text-sm text-[var(--color-text-muted)]">
                        ≈ {inputMode === 'usd' ? `${calculatedValue} ${holdingSymbol}` : formatCurrency(parseFloat(calculatedValue))}
                      </p>
                    )}
                  </div>

                  {/* Mode Toggle */}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setHoldingMode('set')} className={cn('flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors', holdingMode === 'set' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]')}>Set Exact Value</button>
                    <button onClick={() => setHoldingMode('add')} className={cn('flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors', holdingMode === 'add' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]')}>Add to Existing</button>
                  </div>

                  <Button onClick={handleAddHolding} disabled={!canSubmitHolding() || isProcessing} className="w-full mt-4">
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" />{holdingMode === 'set' ? 'Set Holding' : 'Add to Holding'}</>}
                  </Button>
                </>
              )}
              
              {!selectedTokenPreset && !isCustomToken && (
                <p className="text-center py-6 text-[var(--color-text-muted)]">Select a token above or add a custom token to fund this user&apos;s balance</p>
              )}
              
              {isCustomToken && currentTokenPrice === 0 && (
                <p className="text-center py-4 text-[var(--color-text-muted)]">Enter token details and fetch price to continue</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
