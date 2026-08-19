'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Check,
  X,
  Clock,
  DollarSign,
  Award,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Referrals Page
// ============================================

interface Referral {
  _id: string;
  referrer: {
    _id: string;
    name: string;
    email: string;
    referralCode: string;
  };
  referredUser: {
    firstName: string;
    lastName: string;
    email: string;
    name: string;
  };
  rewardAmount: number;
  tier: string;
  status: 'pending' | 'active' | 'completed';
  createdAt: string;
  approvedAt?: string;
  adminNote?: string;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  completed: number;
  totalPending: number;
  totalApproved: number;
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchReferrals = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/referrals?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok) {
        setReferrals(data.referrals);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openActionModal = (referral: Referral, action: 'approve' | 'reject') => {
    setSelectedReferral(referral);
    setModalAction(action);
    setAdminNote('');
    setModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedReferral) return;

    try {
      setProcessingId(selectedReferral._id);
      const res = await fetch('/api/admin/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralId: selectedReferral._id,
          action: modalAction,
          adminNote,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast({
          message: modalAction === 'approve' 
            ? `Referral approved! $${selectedReferral.rewardAmount} added to referrer's balance.`
            : 'Referral rejected.',
          type: 'success',
        });
        fetchReferrals();
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

  // Filter referrals by search
  const filteredReferrals = referrals.filter((r) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      r.referrer.name.toLowerCase().includes(searchLower) ||
      r.referrer.email.toLowerCase().includes(searchLower) ||
      r.referredUser.name.toLowerCase().includes(searchLower) ||
      r.referredUser.email.toLowerCase().includes(searchLower) ||
      r.referrer.referralCode.toLowerCase().includes(searchLower)
    );
  });

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    active: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20',
    completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Referrals</h1>
        <p className="text-[#6b7a90]">Manage user referrals and approve rewards</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-[#6b7a90]" />
            <span className="text-sm text-[#6b7a90]">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
        </div>

        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-[#6b7a90]">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500">{stats?.pending || 0}</p>
        </div>

        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-[#22c55e]" />
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
            <DollarSign className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-[#6b7a90]">Pending $</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500">{formatCurrency(stats?.totalPending || 0)}</p>
        </div>

        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-[#22c55e]" />
            <span className="text-sm text-[#6b7a90]">Approved $</span>
          </div>
          <p className="text-2xl font-bold text-[#22c55e]">{formatCurrency(stats?.totalApproved || 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
          <input
            type="text"
            placeholder="Search by name, email, or referral code..."
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
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-[#22c55e] animate-spin" />
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-[#6b7a90] mx-auto mb-3" />
            <p className="text-[#6b7a90]">No referrals found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2733]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">Referrer</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">Referred User</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">Reward</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">Tier</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7a90]">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-[#6b7a90]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.map((referral) => (
                  <tr key={referral._id} className="border-b border-[#1e2733] hover:bg-[#151c24]">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{referral.referrer.name}</p>
                        <p className="text-sm text-[#6b7a90]">{referral.referrer.email}</p>
                        <code className="text-xs text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded">
                          {referral.referrer.referralCode}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{referral.referredUser.name}</p>
                        <p className="text-sm text-[#6b7a90]">{referral.referredUser.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#22c55e] font-bold">{formatCurrency(referral.rewardAmount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{referral.tier}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                      {referral.approvedAt && (
                        <p className="text-xs text-[#6b7a90]">
                          Approved: {new Date(referral.approvedAt).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', statusColors[referral.status])}>
                        {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {referral.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openActionModal(referral, 'approve')}
                            disabled={processingId === referral._id}
                            className="p-2 bg-[#22c55e]/10 text-[#22c55e] rounded-lg hover:bg-[#22c55e]/20 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openActionModal(referral, 'reject')}
                            disabled={processingId === referral._id}
                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-[#6b7a90]">
                          {referral.adminNote || '-'}
                        </span>
                      )}
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
        {modalOpen && selectedReferral && (
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
                      modalAction === 'approve' ? 'bg-[#22c55e]/10' : 'bg-red-500/10'
                    )}>
                      {modalAction === 'approve' ? (
                        <CheckCircle className="h-5 w-5 text-[#22c55e]" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {modalAction === 'approve' ? 'Approve Referral' : 'Reject Referral'}
                      </h3>
                      <p className="text-sm text-[#6b7a90]">
                        {modalAction === 'approve' ? 'Add reward to referrer balance' : 'Decline this referral'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-[#0a0e14] rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#6b7a90]">Referrer:</span>
                    <span className="text-white">{selectedReferral.referrer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7a90]">Referred:</span>
                    <span className="text-white">{selectedReferral.referredUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7a90]">Reward:</span>
                    <span className="text-[#22c55e] font-bold">{formatCurrency(selectedReferral.rewardAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7a90]">Tier:</span>
                    <span className="text-white">{selectedReferral.tier}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#6b7a90] mb-2">Admin Note (optional)</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e] resize-none"
                  />
                </div>

                <button
                  onClick={handleAction}
                  disabled={processingId === selectedReferral._id}
                  className={cn(
                    'w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2',
                    modalAction === 'approve'
                      ? 'bg-[#22c55e] text-white hover:bg-[#1ea550]'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  )}
                >
                  {processingId === selectedReferral._id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : modalAction === 'approve' ? (
                    <>
                      <Check className="h-4 w-4" />
                      Approve & Credit {formatCurrency(selectedReferral.rewardAmount)}
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      Reject Referral
                    </>
                  )}
                </button>
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
