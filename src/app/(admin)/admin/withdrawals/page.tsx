'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Check,
  X,
  Download,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  Building2,
  Wallet,
  Home,
  Users,
  RefreshCw,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Withdrawals Management Page (API Connected)
// ============================================

interface WithdrawalRecord {
  id: string;
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userCountry?: string;
  userAvatar?: string;
  userVerificationStatus?: string;
  userBalance?: number;
  userTotalBalance?: number;
  userRole?: string;
  userJoinedAt?: string;
  date: Date;
  reference: string;
  method: string;
  methodType: 'bank_transfer' | 'crypto' | 'real_estate' | 'referral';
  token?: string;
  tokenAmount?: number;
  tokenIcon?: string;
  network?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  walletAddress?: string;
  amount: number;
  totalUsd: number;
  fee: number;
  netAmount?: number;
  status: 'pending' | 'approved' | 'declined';
  notes?: string;
  txHash?: string;
  processedAt?: string;
}

type FilterType = 'all' | 'pending' | 'approved' | 'declined' | 'bank_transfer' | 'crypto' | 'real_estate' | 'referral';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [declineNotes, setDeclineNotes] = useState('');
  const [stats, setStats] = useState({ pending: 0, approved: 0, declined: 0, totalApproved: 0 });

  // Fetch withdrawals from API
  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals');
      const data = await res.json();
      if (res.ok && data.withdrawals) {
        const mapped = data.withdrawals.map((w: any) => ({
          ...w,
          id: w._id,
          date: new Date(w.date || w.createdAt),
          methodType: w.method?.includes('Bank') ? 'bank_transfer' : 
                      w.method?.includes('Real Estate') ? 'real_estate' :
                      w.method?.includes('Referral') ? 'referral' : 'crypto',
          totalUsd: w.amountUsd || w.amount,
          tokenIcon: w.token ? `https://assets.coingecko.com/coins/images/1/small/${w.token?.toLowerCase()}.png` : undefined,
          // User details from API
          userPhone: w.userPhone || 'N/A',
          userCountry: w.userCountry || 'N/A',
          userAvatar: w.userAvatar,
          userVerificationStatus: w.userVerificationStatus || 'unverified',
          userBalance: w.userBalance || 0,
          userTotalBalance: w.userTotalBalance || 0,
          userRole: w.userRole || 'user',
          userJoinedAt: w.userJoinedAt,
          // Transaction details
          tokenAmount: w.tokenAmount,
          accountName: w.accountName,
          routingNumber: w.routingNumber,
          swiftCode: w.swiftCode,
          netAmount: w.netAmount,
          txHash: w.txHash,
          processedAt: w.processedAt,
        }));
        setWithdrawals(mapped);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  // Calculate stats from local data
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const todayWithdrawals = withdrawals.filter(w => {
    const today = new Date();
    return w.date.toDateString() === today.toDateString() && w.status === 'approved';
  });
  const totalPending = pendingWithdrawals.reduce((sum, w) => sum + w.totalUsd, 0);
  const totalToday = todayWithdrawals.reduce((sum, w) => sum + w.totalUsd, 0);

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'declined', label: 'Declined' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'referral', label: 'Referral' },
  ];

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch =
      withdrawal.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.reference.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === 'all') return matchesSearch;
    if (['pending', 'approved', 'declined'].includes(filterType)) {
      return matchesSearch && withdrawal.status === filterType;
    }
    return matchesSearch && withdrawal.methodType === filterType;
  });

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getMethodIcon = (methodType: string) => {
    switch (methodType) {
      case 'bank_transfer':
        return <Building2 className="h-4 w-4 text-[#3b82f6]" />;
      case 'crypto':
        return <Wallet className="h-4 w-4 text-[#f59e0b]" />;
      case 'real_estate':
        return <Home className="h-4 w-4 text-[#8b5cf6]" />;
      case 'referral':
        return <Users className="h-4 w-4 text-[#22c55e]" />;
      default:
        return <Wallet className="h-4 w-4 text-[#6b7a90]" />;
    }
  };

  const handleApprove = async (withdrawal: WithdrawalRecord) => {
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: withdrawal._id || withdrawal.id,
          action: 'approve',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setWithdrawals(prev => prev.map(w => {
          if (w.id === withdrawal.id) {
            return { ...w, status: 'approved' as const };
          }
          return w;
        }));
        addToast('success', `Withdrawal ${withdrawal.reference} approved successfully`);
        setShowDetailModal(false);
      } else {
        addToast('error', data.error || 'Failed to approve withdrawal');
      }
    } catch (error) {
      addToast('error', 'Failed to approve withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async (withdrawal: WithdrawalRecord) => {
    setIsProcessing(true);

    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: withdrawal._id || withdrawal.id,
          action: 'decline',
          declineReason: declineNotes || 'Declined by admin',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setWithdrawals(prev => prev.map(w => {
          if (w.id === withdrawal.id) {
            return { ...w, status: 'declined' as const, notes: declineNotes || 'Declined by admin' };
          }
          return w;
        }));
        addToast('success', `Withdrawal ${withdrawal.reference} declined`);
        setShowDetailModal(false);
        setDeclineNotes('');
      } else {
        addToast('error', data.error || 'Failed to decline withdrawal');
      }
    } catch (error) {
      addToast('error', 'Failed to decline withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDetails = (withdrawal: WithdrawalRecord) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailModal(true);
    setDeclineNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="h-6 w-6 text-[#ef4444]" />
            Withdrawals Management
          </h1>
          <p className="text-sm text-[#6b7a90] mt-1">Review and approve withdrawal requests</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1e2733] rounded-lg text-white hover:bg-[#2a3441] transition-colors">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Pending Alert */}
      {pendingWithdrawals.length > 0 && (
        <div className="mb-6 p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[#f59e0b]" />
            <div>
              <p className="font-medium text-white">{pendingWithdrawals.length} withdrawals awaiting approval</p>
              <p className="text-sm text-[#6b7a90]">Total: {formatCurrency(totalPending)}</p>
            </div>
          </div>
          <button
            onClick={() => setFilterType('pending')}
            className="px-4 py-2 bg-[#f59e0b] text-white font-semibold rounded-lg hover:bg-[#d97706] transition-colors"
          >
            Review All
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <p className="text-sm text-[#6b7a90] mb-1">Today</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalToday)}</p>
          <p className="text-xs text-[#6b7a90]">{todayWithdrawals.length} withdrawals</p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <p className="text-sm text-[#6b7a90] mb-1">Pending</p>
          <p className="text-xl font-bold text-[#f59e0b]">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-[#6b7a90]">{pendingWithdrawals.length} withdrawals</p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <p className="text-sm text-[#6b7a90] mb-1">Approved (All Time)</p>
          <p className="text-xl font-bold text-[#22c55e]">
            {formatCurrency(withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.totalUsd, 0))}
          </p>
          <p className="text-xs text-[#6b7a90]">{withdrawals.filter(w => w.status === 'approved').length} withdrawals</p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <p className="text-sm text-[#6b7a90] mb-1">Declined</p>
          <p className="text-xl font-bold text-[#ef4444]">
            {formatCurrency(withdrawals.filter(w => w.status === 'declined').reduce((sum, w) => sum + w.totalUsd, 0))}
          </p>
          <p className="text-xs text-[#6b7a90]">{withdrawals.filter(w => w.status === 'declined').length} withdrawals</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
            <input
              type="text"
              placeholder="Search by user, email, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-sm placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e2733] rounded-lg text-white hover:bg-[#2a3441] transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#1e2733]">
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFilterType(option.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      filterType === option.value
                        ? 'bg-[#22c55e] text-white'
                        : 'bg-[#1e2733] text-[#6b7a90] hover:text-white'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2733]">
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">Reference</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">Method</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">Destination</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">User Balance</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[#6b7a90]">
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map(withdrawal => (
                  <tr key={withdrawal.id} className="border-b border-[#1e2733] hover:bg-[#151c24]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#ef4444]/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-[#ef4444]" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{withdrawal.userName}</p>
                          <p className="text-xs text-[#6b7a90]">{withdrawal.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white text-sm font-mono">{withdrawal.reference}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(withdrawal.methodType)}
                        <span className="text-white text-sm capitalize">{withdrawal.methodType.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6b7a90] text-sm">
                      {withdrawal.walletAddress
                        ? `${withdrawal.walletAddress.slice(0, 6)}...${withdrawal.walletAddress.slice(-4)}`
                        : withdrawal.accountNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-[#ef4444] text-sm font-semibold">-{formatCurrency(withdrawal.totalUsd)}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-sm',
                        withdrawal.totalUsd > (withdrawal.userBalance || 0) ? 'text-[#ef4444]' : 'text-[#22c55e]'
                      )}>
                        {formatCurrency(withdrawal.userBalance || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium capitalize',
                        withdrawal.status === 'pending' && 'bg-[#f59e0b]/10 text-[#f59e0b]',
                        withdrawal.status === 'approved' && 'bg-[#22c55e]/10 text-[#22c55e]',
                        withdrawal.status === 'declined' && 'bg-[#ef4444]/10 text-[#ef4444]'
                      )}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6b7a90] text-sm">{formatTimeAgo(withdrawal.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {withdrawal.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(withdrawal)}
                              className="p-1.5 bg-[#22c55e]/10 rounded-lg text-[#22c55e] hover:bg-[#22c55e]/20 transition-colors"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleViewDetails(withdrawal)}
                              className="p-1.5 bg-[#ef4444]/10 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors"
                              title="Decline"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleViewDetails(withdrawal)}
                          className="p-1.5 bg-[#3b82f6]/10 rounded-lg text-[#3b82f6] hover:bg-[#3b82f6]/20 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedWithdrawal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0f1419] rounded-xl border border-[#1e2733] shadow-2xl overflow-hidden my-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                <h2 className="text-xl font-semibold text-white">Withdrawal Details</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-[#6b7a90] hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* User Info Card */}
                <div className="p-4 bg-[#0a0e14] rounded-xl">
                  <div className="flex items-center gap-4 mb-4">
                    {selectedWithdrawal.userAvatar ? (
                      <Image 
                        src={selectedWithdrawal.userAvatar} 
                        alt={selectedWithdrawal.userName} 
                        width={48} 
                        height={48} 
                        className="h-12 w-12 rounded-full object-cover" 
                        unoptimized 
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-[#ef4444]/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-[#ef4444]" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{selectedWithdrawal.userName}</p>
                        <span className={cn(
                          'px-2 py-0.5 text-xs rounded-full',
                          selectedWithdrawal.userVerificationStatus === 'verified' 
                            ? 'bg-[#22c55e]/10 text-[#22c55e]' 
                            : 'bg-[#f59e0b]/10 text-[#f59e0b]'
                        )}>
                          {selectedWithdrawal.userVerificationStatus === 'verified' ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      <p className="text-sm text-[#6b7a90]">{selectedWithdrawal.userEmail}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#6b7a90]">Phone</p>
                      <p className="text-white">{selectedWithdrawal.userPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[#6b7a90]">Country</p>
                      <p className="text-white">{selectedWithdrawal.userCountry || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[#6b7a90]">Available Balance</p>
                      <p className={cn(
                        'font-semibold',
                        selectedWithdrawal.totalUsd > (selectedWithdrawal.userBalance || 0) ? 'text-[#ef4444]' : 'text-[#22c55e]'
                      )}>
                        {formatCurrency(selectedWithdrawal.userBalance || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#6b7a90]">Total Balance</p>
                      <p className="text-white">{formatCurrency(selectedWithdrawal.userTotalBalance || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Balance Warning */}
                {selectedWithdrawal.totalUsd > (selectedWithdrawal.userBalance || 0) && (
                  <div className="flex items-center gap-3 p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0" />
                    <p className="text-sm text-[#ef4444]">
                      Insufficient balance! User is requesting {formatCurrency(selectedWithdrawal.totalUsd)} but only has {formatCurrency(selectedWithdrawal.userBalance || 0)}
                    </p>
                  </div>
                )}

                {/* Transaction Details */}
                <div className="p-4 bg-[#0a0e14] rounded-xl space-y-3">
                  <p className="text-sm font-medium text-white mb-3">Transaction Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#6b7a90]">Reference</p>
                      <p className="text-white font-mono text-xs">{selectedWithdrawal.reference}</p>
                    </div>
                    <div>
                      <p className="text-[#6b7a90]">Date</p>
                      <p className="text-white">{formatDate(selectedWithdrawal.date)}</p>
                    </div>
                    <div>
                      <p className="text-[#6b7a90]">Method</p>
                      <p className="text-white capitalize">{selectedWithdrawal.methodType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-[#6b7a90]">Token</p>
                      <p className="text-white">{selectedWithdrawal.token || 'USD'}</p>
                    </div>
                    <div>
                      <p className="text-[#6b7a90]">Gross Amount</p>
                      <p className="text-[#ef4444] font-semibold">-{formatCurrency(selectedWithdrawal.totalUsd)}</p>
                    </div>
                    <div>
                      <p className="text-[#6b7a90]">Fee</p>
                      <p className="text-white">{formatCurrency(selectedWithdrawal.fee || 0)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[#6b7a90]">Net Amount (User Receives)</p>
                      <p className="text-white font-semibold">{formatCurrency(selectedWithdrawal.netAmount || (selectedWithdrawal.totalUsd - (selectedWithdrawal.fee || 0)))}</p>
                    </div>
                  </div>
                </div>

                {/* Destination */}
                <div className="p-4 bg-[#0a0e14] rounded-xl">
                  <p className="text-sm font-medium text-white mb-3">Withdrawal Destination</p>
                  {selectedWithdrawal.methodType === 'crypto' ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {selectedWithdrawal.tokenIcon && (
                          <Image src={selectedWithdrawal.tokenIcon} alt={selectedWithdrawal.token || ''} width={20} height={20} className="rounded-full" unoptimized />
                        )}
                        <span className="text-white font-medium">{selectedWithdrawal.token} ({selectedWithdrawal.network})</span>
                      </div>
                      <div>
                        <p className="text-[#6b7a90]">Wallet Address</p>
                        <p className="text-white font-mono text-xs break-all bg-[#1e2733] p-2 rounded mt-1">{selectedWithdrawal.walletAddress}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[#6b7a90]">Bank Name</p>
                          <p className="text-white">{selectedWithdrawal.bankName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[#6b7a90]">Account Name</p>
                          <p className="text-white">{selectedWithdrawal.accountName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[#6b7a90]">Account Number</p>
                          <p className="text-white font-mono">{selectedWithdrawal.accountNumber || 'N/A'}</p>
                        </div>
                        {selectedWithdrawal.routingNumber && (
                          <div>
                            <p className="text-[#6b7a90]">Routing Number</p>
                            <p className="text-white font-mono">{selectedWithdrawal.routingNumber}</p>
                          </div>
                        )}
                        {selectedWithdrawal.swiftCode && (
                          <div>
                            <p className="text-[#6b7a90]">SWIFT Code</p>
                            <p className="text-white font-mono">{selectedWithdrawal.swiftCode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-[#0a0e14] rounded-xl">
                  <div>
                    <p className="text-[#6b7a90] text-sm">Status</p>
                    <span className={cn(
                      'inline-flex px-3 py-1 rounded text-sm font-medium capitalize mt-1',
                      selectedWithdrawal.status === 'pending' && 'bg-[#f59e0b]/10 text-[#f59e0b]',
                      selectedWithdrawal.status === 'approved' && 'bg-[#22c55e]/10 text-[#22c55e]',
                      selectedWithdrawal.status === 'declined' && 'bg-[#ef4444]/10 text-[#ef4444]'
                    )}>
                      {selectedWithdrawal.status}
                    </span>
                  </div>
                  {selectedWithdrawal.processedAt && (
                    <div className="text-right">
                      <p className="text-[#6b7a90] text-sm">Processed</p>
                      <p className="text-white text-sm">{formatDate(new Date(selectedWithdrawal.processedAt))}</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedWithdrawal.notes && (
                  <div className="p-4 bg-[#0a0e14] rounded-xl">
                    <p className="text-[#6b7a90] text-sm mb-1">Notes</p>
                    <p className="text-white text-sm">{selectedWithdrawal.notes}</p>
                  </div>
                )}

                {/* TX Hash */}
                {selectedWithdrawal.txHash && (
                  <div className="p-4 bg-[#0a0e14] rounded-xl">
                    <p className="text-[#6b7a90] text-sm mb-1">Transaction Hash</p>
                    <p className="text-white font-mono text-xs break-all">{selectedWithdrawal.txHash}</p>
                  </div>
                )}

                {/* Decline Notes Input (for pending) */}
                {selectedWithdrawal.status === 'pending' && (
                  <div>
                    <p className="text-xs text-[#6b7a90] mb-1">Decline Reason (optional)</p>
                    <input
                      type="text"
                      value={declineNotes}
                      onChange={(e) => setDeclineNotes(e.target.value)}
                      placeholder="Enter reason for declining..."
                      className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-sm focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                {selectedWithdrawal.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-[#1e2733]">
                    <button
                      onClick={() => handleApprove(selectedWithdrawal)}
                      disabled={isProcessing || selectedWithdrawal.totalUsd > (selectedWithdrawal.userBalance || 0)}
                      className={cn(
                        'flex-1 py-3 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2',
                        selectedWithdrawal.totalUsd > (selectedWithdrawal.userBalance || 0)
                          ? 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                          : 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                      )}
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleDecline(selectedWithdrawal)}
                      disabled={isProcessing}
                      className="flex-1 py-3 bg-[#ef4444] hover:bg-[#dc2626] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Messages */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl min-w-[280px]',
                toast.type === 'success' && 'bg-[#22c55e] text-white',
                toast.type === 'error' && 'bg-[#ef4444] text-white'
              )}
            >
              {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="text-sm font-medium flex-1">{toast.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
