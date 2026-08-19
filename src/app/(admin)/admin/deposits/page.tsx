'use client';

import React, { useState, useEffect, useId } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
  Check,
  X,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowDownRight,
  FileImage,
  RefreshCw,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Deposits Management Page (API Connected)
// ============================================

interface DepositRecord {
  _id: string;
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  reference: string;
  method: string;
  token?: string;
  network?: string;
  type: 'regular' | 'subscribe' | 'signal';
  amount: number;
  totalUsd: number;
  status: 'pending' | 'approved' | 'declined';
  walletAddress?: string;
  paymentProof?: string;
  notes?: string;
}

type FilterType = 'all' | 'pending' | 'approved' | 'declined';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function AdminDepositsPage() {
  const toastIdPrefix = useId();
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [declineNotes, setDeclineNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    declined: 0,
    totalApproved: 0,
  });

  // Fetch deposits from API
  const fetchDeposits = async () => {
    try {
      console.log('🔍 Fetching admin deposits...');
      const res = await fetch('/api/admin/deposits');
      const data = await res.json();
      
      console.log('📦 Admin deposits response:', { status: res.status, ok: res.ok, data });
      
      if (res.ok) {
        setDeposits(data.deposits || []);
        setStats(data.stats || { pending: 0, approved: 0, declined: 0, totalApproved: 0 });
        console.log(`✅ Loaded ${data.deposits?.length || 0} deposits`);
      } else {
        console.error('❌ Admin deposits API error:', data.error);
        addToast('error', data.error || 'Failed to fetch deposits');
      }
    } catch (error) {
      console.error('❌ Failed to fetch deposits:', error);
      addToast('error', 'Failed to fetch deposits');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'declined', label: 'Declined' },
  ];

  // Filter deposits
  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch =
      deposit.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.reference.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === 'all') return matchesSearch;
    return matchesSearch && deposit.status === filterType;
  });

  const addToast = (type: Toast['type'], message: string) => {
    const id = `${toastIdPrefix}-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (dateStr: string) => {
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

  const handleViewDetails = (deposit: DepositRecord) => {
    setSelectedDeposit(deposit);
    setDeclineNotes('');
    setShowDetailModal(true);
  };

  const handleApprove = async (deposit: DepositRecord) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/deposits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId: deposit._id,
          action: 'approve',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast('success', `Deposit ${deposit.reference} approved successfully`);
        setShowDetailModal(false);
        fetchDeposits();
      } else {
        addToast('error', data.error || 'Failed to approve deposit');
      }
    } catch {
      addToast('error', 'Failed to approve deposit');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async (deposit: DepositRecord) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/deposits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId: deposit._id,
          action: 'decline',
          declineReason: declineNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast('success', `Deposit ${deposit.reference} declined`);
        setShowDetailModal(false);
        fetchDeposits();
      } else {
        addToast('error', data.error || 'Failed to decline deposit');
      }
    } catch {
      addToast('error', 'Failed to decline deposit');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Deposits</h1>
          <p className="text-[#6b7a90] text-sm">Manage and approve user deposits</p>
        </div>
        <button
          onClick={() => { setIsLoading(true); fetchDeposits(); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a2332] hover:bg-[#2a3441] text-white rounded-lg transition-colors"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#6b7a90] text-sm">Pending</span>
            <Clock className="h-4 w-4 text-[#f59e0b]" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.pending}</p>
        </div>
        <div className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#6b7a90] text-sm">Approved</span>
            <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.approved}</p>
        </div>
        <div className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#6b7a90] text-sm">Declined</span>
            <XCircle className="h-4 w-4 text-[#ef4444]" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.declined}</p>
        </div>
        <div className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#6b7a90] text-sm">Total Approved</span>
            <ArrowDownRight className="h-4 w-4 text-[#22c55e]" />
          </div>
          <p className="text-2xl font-bold text-[#22c55e]">{formatCurrency(stats.totalApproved)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
          <input
            type="text"
            placeholder="Search by name, email, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white hover:bg-[#1a2332] transition-colors"
          >
            <Filter className="h-4 w-4" />
            {filterOptions.find(f => f.value === filterType)?.label}
            <ChevronDown className="h-4 w-4" />
          </button>
          {showFilters && (
            <div className="absolute right-0 mt-2 w-40 bg-[#0f1419] border border-[#1e2733] rounded-lg shadow-xl z-10 overflow-hidden">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => { setFilterType(option.value); setShowFilters(false); }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm transition-colors',
                    filterType === option.value
                      ? 'bg-[#22c55e] text-white'
                      : 'text-white hover:bg-[#1a2332]'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-[#0f1419] border border-[#1e2733] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2733]">
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7a90] uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7a90] uppercase">Reference</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7a90] uppercase">Method</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7a90] uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7a90] uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7a90] uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7a90] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2733]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 text-[#22c55e] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#6b7a90]">
                    No deposits found
                  </td>
                </tr>
              ) : (
                filteredDeposits.map(deposit => (
                  <tr key={deposit._id} className="hover:bg-[#0c1320] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-[#22c55e]" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{deposit.userName}</p>
                          <p className="text-[#6b7a90] text-xs">{deposit.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-mono text-sm">{deposit.reference}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm">{deposit.method}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#22c55e] font-semibold">{formatCurrency(deposit.totalUsd)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-2.5 py-1 rounded text-xs font-medium capitalize',
                        deposit.status === 'pending' && 'bg-[#f59e0b]/10 text-[#f59e0b]',
                        deposit.status === 'approved' && 'bg-[#22c55e]/10 text-[#22c55e]',
                        deposit.status === 'declined' && 'bg-[#ef4444]/10 text-[#ef4444]'
                      )}>
                        {deposit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#6b7a90] text-sm">{formatTimeAgo(deposit.date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {deposit.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(deposit)}
                              className="p-1.5 bg-[#22c55e]/10 rounded-lg text-[#22c55e] hover:bg-[#22c55e]/20 transition-colors"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleViewDetails(deposit)}
                              className="p-1.5 bg-[#ef4444]/10 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors"
                              title="Decline"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleViewDetails(deposit)}
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
        {showDetailModal && selectedDeposit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0f1419] rounded-xl border border-[#1e2733] shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                <h2 className="text-xl font-semibold text-white">Deposit Details</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-[#6b7a90] hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 bg-[#0a0e14] rounded-xl">
                  <div className="h-12 w-12 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-[#22c55e]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedDeposit.userName}</p>
                    <p className="text-sm text-[#6b7a90]">{selectedDeposit.userEmail}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#6b7a90] mb-1">Reference</p>
                    <p className="text-white font-mono text-sm">{selectedDeposit.reference}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7a90] mb-1">Date</p>
                    <p className="text-white text-sm">{formatDate(selectedDeposit.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7a90] mb-1">Method</p>
                    <p className="text-white text-sm">{selectedDeposit.method}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7a90] mb-1">Type</p>
                    <p className="text-white text-sm capitalize">{selectedDeposit.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7a90] mb-1">Amount</p>
                    <p className="text-white text-sm">{selectedDeposit.amount} {selectedDeposit.token}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7a90] mb-1">Total USD</p>
                    <p className="text-[#22c55e] font-semibold">{formatCurrency(selectedDeposit.totalUsd)}</p>
                  </div>
                </div>

                {/* Wallet Address */}
                {selectedDeposit.walletAddress && (
                  <div>
                    <p className="text-xs text-[#6b7a90] mb-1">Deposit Address</p>
                    <p className="text-white text-sm font-mono bg-[#0a0e14] p-3 rounded-lg break-all">
                      {selectedDeposit.walletAddress}
                    </p>
                  </div>
                )}

                {/* Payment Proof */}
                {selectedDeposit.paymentProof && (
                  <div>
                    <p className="text-xs text-[#6b7a90] mb-1">Payment Proof</p>
                    {selectedDeposit.paymentProof.startsWith('data:image') ? (
                      <div className="relative w-full h-48 bg-[#0a0e14] rounded-lg overflow-hidden">
                        <Image
                          src={selectedDeposit.paymentProof}
                          alt="Payment proof"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-[#0a0e14] rounded-lg">
                        <FileImage className="h-5 w-5 text-[#22c55e]" />
                        <span className="text-white text-sm">Payment proof uploaded</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status */}
                <div>
                  <p className="text-xs text-[#6b7a90] mb-1">Status</p>
                  <span className={cn(
                    'inline-flex px-3 py-1 rounded text-sm font-medium capitalize',
                    selectedDeposit.status === 'pending' && 'bg-[#f59e0b]/10 text-[#f59e0b]',
                    selectedDeposit.status === 'approved' && 'bg-[#22c55e]/10 text-[#22c55e]',
                    selectedDeposit.status === 'declined' && 'bg-[#ef4444]/10 text-[#ef4444]'
                  )}>
                    {selectedDeposit.status}
                  </span>
                </div>

                {/* Notes */}
                {selectedDeposit.notes && (
                  <div>
                    <p className="text-xs text-[#6b7a90] mb-1">Notes</p>
                    <p className="text-white text-sm bg-[#0a0e14] p-3 rounded-lg">{selectedDeposit.notes}</p>
                  </div>
                )}

                {/* Decline Notes Input (for pending) */}
                {selectedDeposit.status === 'pending' && (
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
                {selectedDeposit.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-[#1e2733]">
                    <button
                      onClick={() => handleApprove(selectedDeposit)}
                      disabled={isProcessing}
                      className="flex-1 py-3 bg-[#22c55e] hover:bg-[#1ea550] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleDecline(selectedDeposit)}
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
