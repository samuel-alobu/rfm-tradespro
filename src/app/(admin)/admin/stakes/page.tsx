'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  Users,
  DollarSign,
  X,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Stakes Management Page
// ============================================

interface UserStake {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  asset: {
    name: string;
    symbol: string;
    image: string;
  };
  amount: number;
  amountUsd: number;
  cycleDays: number;
  apy: number;
  expectedReward: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'withdrawn' | 'cancelled';
  earnedReward: number;
  releasedAmount?: number;
  releasedAt?: string;
  releaseNote?: string;
  isExpired: boolean;
}

interface Stats {
  total: number;
  active: number;
  completed: number;
  totalStakedUsd: number;
  totalExpectedRewards: number;
  readyForRelease: number;
}

// Helper to get cycle label
function getCycleLabel(days: number): string {
  if (days === 1) return 'Daily';
  if (days === 7) return 'Weekly';
  if (days === 30) return 'Monthly';
  return `${days} Days`;
}

// Crypto Logo Component
function CryptoLogo({ src, symbol, size = 32 }: { src: string; symbol: string; size?: number }) {
  const [error, setError] = useState(false);

  const colors: Record<string, string> = {
    AVAX: '#E84142',
    ETH: '#627EEA',
    MATIC: '#8247E5',
    SOL: '#14F195',
    USDT: '#26A17B',
    BTC: '#F7931A',
    BNB: '#F3BA2F',
    ADA: '#0033AD',
    DOT: '#E6007A',
    ATOM: '#2E3148',
  };

  if (error || !src) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, backgroundColor: colors[symbol] || '#6b7a90', fontSize: size * 0.4 }}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <div className="rounded-full overflow-hidden bg-white flex items-center justify-center" style={{ width: size, height: size }}>
      <Image src={src} alt={symbol} width={size} height={size} className="object-contain" onError={() => setError(true)} unoptimized />
    </div>
  );
}

export default function AdminStakesPage() {
  const [stakes, setStakes] = useState<UserStake[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'release' | 'cancel' | 'view'>('view');
  const [selectedStake, setSelectedStake] = useState<UserStake | null>(null);
  const [releaseNote, setReleaseNote] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchStakes();
  }, [statusFilter]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchStakes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/stakes?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok) {
        setStakes(data.stakes);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stakes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (stake: UserStake, action: 'release' | 'cancel' | 'view') => {
    setSelectedStake(stake);
    setModalAction(action);
    setReleaseNote('');
    setModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedStake || modalAction === 'view') return;

    try {
      setProcessingId(selectedStake._id);
      const res = await fetch('/api/admin/stakes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stakeId: selectedStake._id,
          action: modalAction,
          releaseNote,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast({
          message: modalAction === 'release' 
            ? `Stake released! ${selectedStake.amount + selectedStake.expectedReward} ${selectedStake.asset.symbol} added to user's balance.`
            : 'Stake cancelled and principal returned.',
          type: 'success',
        });
        fetchStakes();
        setModalOpen(false);
      } else {
        setToast({ message: data.error || 'Action failed', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'An error occurred', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  // Filter stakes by search
  const filteredStakes = stakes.filter((s) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      s.user.name.toLowerCase().includes(searchLower) ||
      s.user.email.toLowerCase().includes(searchLower) ||
      s.asset.name.toLowerCase().includes(searchLower) ||
      s.asset.symbol.toLowerCase().includes(searchLower)
    );
  });

  const statusColors = {
    active: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20',
    completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    withdrawn: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Stakes Management</h1>
        <p className="text-[#6b7a90]">View and release user stakes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4 text-[#6b7a90]" />
            <span className="text-sm text-[#6b7a90]">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
        </div>

        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-[#22c55e]" />
            <span className="text-sm text-[#6b7a90]">Active</span>
          </div>
          <p className="text-2xl font-bold text-[#22c55e]">{stats?.active || 0}</p>
        </div>

        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-[#6b7a90]">Completed</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">{stats?.completed || 0}</p>
        </div>

        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-white" />
            <span className="text-sm text-[#6b7a90]">Total Staked</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats?.totalStakedUsd || 0)}</p>
        </div>

        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-[#22c55e]" />
            <span className="text-sm text-[#6b7a90]">Expected Rewards</span>
          </div>
          <p className="text-2xl font-bold text-[#22c55e]">{formatCurrency(stats?.totalExpectedRewards || 0)}</p>
        </div>

        <div className="bg-[#0f1419] rounded-xl border border-yellow-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-[#6b7a90]">Ready to Release</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500">{stats?.readyForRelease || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
          <input
            type="text"
            placeholder="Search by user or asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#6b7a90]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-[#22c55e] animate-spin" />
          </div>
        ) : filteredStakes.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="h-12 w-12 text-[#6b7a90] mx-auto mb-3" />
            <p className="text-[#6b7a90]">No stakes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2733]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">User</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">Asset</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">Cycle</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">APY</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">Expected Reward</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">End Date</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-[#6b7a90]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStakes.map((stake) => (
                  <tr key={stake._id} className="border-b border-[#1e2733] hover:bg-[#151c24]">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{stake.user.name}</p>
                        <p className="text-sm text-[#6b7a90]">{stake.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CryptoLogo src={stake.asset.image} symbol={stake.asset.symbol} size={28} />
                        <span className="text-white">{stake.asset.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{stake.amount} {stake.asset.symbol}</p>
                      <p className="text-xs text-[#6b7a90]">{formatCurrency(stake.amountUsd)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{getCycleLabel(stake.cycleDays)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#22c55e]">{stake.apy}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#22c55e]">+{stake.expectedReward.toFixed(6)} {stake.asset.symbol}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">
                        {new Date(stake.endDate).toLocaleDateString()}
                      </p>
                      {stake.isExpired && stake.status === 'active' && (
                        <span className="text-xs text-yellow-500">Expired</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', statusColors[stake.status])}>
                        {stake.status.charAt(0).toUpperCase() + stake.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(stake, 'view')}
                          className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {stake.status === 'active' && (
                          <>
                            <button
                              onClick={() => openModal(stake, 'release')}
                              disabled={processingId === stake._id}
                              className="p-2 bg-[#22c55e]/10 text-[#22c55e] rounded-lg hover:bg-[#22c55e]/20 transition-colors disabled:opacity-50"
                              title="Release Funds"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal(stake, 'cancel')}
                              disabled={processingId === stake._id}
                              className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                              title="Cancel Stake"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {modalOpen && selectedStake && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] rounded-xl border border-[#1e2733] w-full max-w-md"
            >
              <div className="p-6 border-b border-[#1e2733]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center',
                      modalAction === 'view' ? 'bg-blue-500/10' : modalAction === 'release' ? 'bg-[#22c55e]/10' : 'bg-red-500/10'
                    )}>
                      {modalAction === 'view' ? (
                        <Eye className="h-5 w-5 text-blue-500" />
                      ) : modalAction === 'release' ? (
                        <CheckCircle className="h-5 w-5 text-[#22c55e]" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {modalAction === 'view' ? 'Stake Details' : modalAction === 'release' ? 'Release Stake' : 'Cancel Stake'}
                      </h3>
                      <p className="text-sm text-[#6b7a90]">
                        {modalAction === 'view' ? 'View stake information' : modalAction === 'release' ? 'Release funds to user' : 'Return principal only'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Stake Info */}
                <div className="flex items-center gap-4 p-4 bg-[#0a0e14] rounded-lg">
                  <CryptoLogo src={selectedStake.asset.image} symbol={selectedStake.asset.symbol} size={48} />
                  <div>
                    <p className="font-medium text-white">{selectedStake.asset.name}</p>
                    <p className="text-sm text-[#6b7a90]">{selectedStake.asset.symbol}</p>
                  </div>
                  <span className={cn('ml-auto px-3 py-1 rounded-full text-xs font-medium border', statusColors[selectedStake.status])}>
                    {selectedStake.status.charAt(0).toUpperCase() + selectedStake.status.slice(1)}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-[#1e2733]">
                    <span className="text-[#6b7a90]">User</span>
                    <span className="text-white">{selectedStake.user.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e2733]">
                    <span className="text-[#6b7a90]">Email</span>
                    <span className="text-white text-sm">{selectedStake.user.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e2733]">
                    <span className="text-[#6b7a90]">Amount</span>
                    <span className="text-white font-medium">{selectedStake.amount} {selectedStake.asset.symbol}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e2733]">
                    <span className="text-[#6b7a90]">Value</span>
                    <span className="text-white">{formatCurrency(selectedStake.amountUsd)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e2733]">
                    <span className="text-[#6b7a90]">Cycle</span>
                    <span className="text-white">{getCycleLabel(selectedStake.cycleDays)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e2733]">
                    <span className="text-[#6b7a90]">APY</span>
                    <span className="text-[#22c55e]">{selectedStake.apy}%</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e2733]">
                    <span className="text-[#6b7a90]">Expected Reward</span>
                    <span className="text-[#22c55e]">+{selectedStake.expectedReward.toFixed(6)} {selectedStake.asset.symbol}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1e2733]">
                    <span className="text-[#6b7a90]">Start Date</span>
                    <span className="text-white">{new Date(selectedStake.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6b7a90]">End Date</span>
                    <span className={cn('text-white', selectedStake.isExpired && 'text-yellow-500')}>
                      {new Date(selectedStake.endDate).toLocaleDateString()}
                      {selectedStake.isExpired && ' (Expired)'}
                    </span>
                  </div>
                </div>

                {/* Release Summary */}
                {modalAction === 'release' && (
                  <div className="p-4 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg">
                    <p className="text-sm text-[#22c55e] mb-2 font-medium">Release Summary</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6b7a90]">Principal</span>
                        <span className="text-white">{selectedStake.amount} {selectedStake.asset.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b7a90]">Reward</span>
                        <span className="text-[#22c55e]">+{selectedStake.expectedReward.toFixed(6)} {selectedStake.asset.symbol}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#22c55e]/30">
                        <span className="text-white font-medium">Total to Release</span>
                        <span className="text-[#22c55e] font-bold">
                          {(selectedStake.amount + selectedStake.expectedReward).toFixed(6)} {selectedStake.asset.symbol}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancel Warning */}
                {modalAction === 'cancel' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-500 mb-2 font-medium">Cancel Warning</p>
                    <p className="text-sm text-[#6b7a90]">
                      Only the principal ({selectedStake.amount} {selectedStake.asset.symbol}) will be returned. No rewards will be given.
                    </p>
                  </div>
                )}

                {/* Admin Note */}
                {modalAction !== 'view' && (
                  <div>
                    <label className="block text-sm text-[#6b7a90] mb-2">Admin Note (optional)</label>
                    <textarea
                      value={releaseNote}
                      onChange={(e) => setReleaseNote(e.target.value)}
                      placeholder="Add a note..."
                      rows={2}
                      className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e] resize-none"
                    />
                  </div>
                )}

                {/* Actions */}
                {modalAction === 'view' ? (
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-full py-3 rounded-lg bg-[#1e2733] text-white font-medium hover:bg-[#2a3744] transition-colors"
                  >
                    Close
                  </button>
                ) : (
                  <button
                    onClick={handleAction}
                    disabled={processingId === selectedStake._id}
                    className={cn(
                      'w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2',
                      modalAction === 'release'
                        ? 'bg-[#22c55e] text-white hover:bg-[#1ea550]'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    )}
                  >
                    {processingId === selectedStake._id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : modalAction === 'release' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Release {(selectedStake.amount + selectedStake.expectedReward).toFixed(6)} {selectedStake.asset.symbol}
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        Cancel & Return Principal
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              'fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2',
              toast.type === 'success' ? 'bg-[#22c55e] text-white' : 'bg-red-500 text-white'
            )}
          >
            {toast.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
