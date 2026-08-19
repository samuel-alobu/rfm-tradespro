'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  AlertCircle,
  Send,
  Eye,
  X,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Subscriptions Management Page
// ============================================

interface Subscription {
  _id: string;
  planName: string;
  amount: number;
  roiPercent: number;
  expectedReturn: number;
  currentReturn: number;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  completedAt?: string;
  releasedAt?: string;
  releasedBy?: string;
  releaseNote?: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    subscribeBalance: number;
  };
}

interface Stats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  completedSubscriptions: number;
  totalInvested: number;
  totalExpectedReturns: number;
  totalReleasedReturns: number;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [releaseModal, setReleaseModal] = useState<Subscription | null>(null);
  const [releaseNote, setReleaseNote] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/subscriptions');
      const data = await res.json();
      if (res.ok) {
        setSubscriptions(data.subscriptions || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleReleaseFunds = async () => {
    if (!releaseModal) return;

    setProcessingId(releaseModal._id);

    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: releaseModal._id,
          action: 'release',
          note: releaseNote,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('success', data.message || 'Funds released successfully');
        setReleaseModal(null);
        setReleaseNote('');
        await fetchData();
      } else {
        showToast('error', data.error || 'Failed to release funds');
      }
    } catch {
      showToast('error', 'Failed to release funds');
    } finally {
      setProcessingId(null);
    }
  };

  const getDaysElapsed = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const getTotalDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getProgress = (startDate: string, endDate: string) => {
    const total = getTotalDays(startDate, endDate);
    const elapsed = getDaysElapsed(startDate);
    return Math.min(100, (elapsed / total) * 100);
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#22c55e]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl',
            toast.type === 'success' ? 'bg-[#22c55e] text-white' : 'bg-[#ef4444] text-white'
          )}
        >
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription Management</h1>
          <p className="text-[#6b7a90] text-sm mt-1">Monitor and manage user subscriptions</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]">
            <div className="flex items-center gap-2 text-[#6b7a90] text-sm mb-2">
              <Users className="h-4 w-4" />
              Total
            </div>
            <p className="text-xl font-bold text-white">{stats.totalSubscriptions}</p>
          </div>
          <div className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]">
            <div className="flex items-center gap-2 text-[#6b7a90] text-sm mb-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Active
            </div>
            <p className="text-xl font-bold text-yellow-500">{stats.activeSubscriptions}</p>
          </div>
          <div className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]">
            <div className="flex items-center gap-2 text-[#6b7a90] text-sm mb-2">
              <CheckCircle className="h-4 w-4 text-[#22c55e]" />
              Completed
            </div>
            <p className="text-xl font-bold text-[#22c55e]">{stats.completedSubscriptions}</p>
          </div>
          <div className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]">
            <div className="flex items-center gap-2 text-[#6b7a90] text-sm mb-2">
              <DollarSign className="h-4 w-4" />
              Invested
            </div>
            <p className="text-xl font-bold text-white">{formatCurrency(stats.totalInvested)}</p>
          </div>
          <div className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]">
            <div className="flex items-center gap-2 text-[#6b7a90] text-sm mb-2">
              <TrendingUp className="h-4 w-4 text-[#22c55e]" />
              Expected ROI
            </div>
            <p className="text-xl font-bold text-[#22c55e]">{formatCurrency(stats.totalExpectedReturns)}</p>
          </div>
          <div className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]">
            <div className="flex items-center gap-2 text-[#6b7a90] text-sm mb-2">
              <Send className="h-4 w-4 text-blue-500" />
              Released
            </div>
            <p className="text-xl font-bold text-blue-500">{formatCurrency(stats.totalReleasedReturns)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
          <input
            type="text"
            placeholder="Search by user or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white text-sm focus:outline-none focus:border-[#22c55e]"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'completed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-[#0f1419] text-[#6b7a90] hover:text-white border border-[#1e2733]'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#1e2733]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase whitespace-nowrap">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase whitespace-nowrap">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase whitespace-nowrap">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase whitespace-nowrap">ROI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase whitespace-nowrap">Expected Return</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase whitespace-nowrap">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase whitespace-nowrap">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[#6b7a90]">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub._id} className="border-b border-[#1e2733] hover:bg-[#151c24]">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-white font-medium text-sm">
                          {sub.user.firstName} {sub.user.lastName}
                        </p>
                        <p className="text-[#6b7a90] text-xs">{sub.user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[#22c55e] font-medium">{sub.planName}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-white font-medium">{formatCurrency(sub.amount)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[#22c55e] font-medium">{sub.roiPercent}%</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[#22c55e]">+{formatCurrency(sub.expectedReturn)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <p className="text-white">{getTotalDays(sub.startDate, sub.endDate)} days</p>
                        <p className="text-[#6b7a90] text-xs">
                          {getDaysElapsed(sub.startDate)} elapsed
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 min-w-[150px]">
                      {sub.status === 'active' ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#6b7a90]">
                              {getDaysRemaining(sub.endDate)} days left
                            </span>
                            <span className="text-xs text-white">
                              {Math.round(getProgress(sub.startDate, sub.endDate))}%
                            </span>
                          </div>
                          <div className="h-2 bg-[#1e2733] rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                getProgress(sub.startDate, sub.endDate) >= 100
                                  ? 'bg-[#22c55e]'
                                  : 'bg-yellow-500'
                              )}
                              style={{ width: `${getProgress(sub.startDate, sub.endDate)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#6b7a90]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          sub.status === 'active'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : sub.status === 'completed'
                            ? 'bg-[#22c55e]/10 text-[#22c55e]'
                            : 'bg-red-500/10 text-red-500'
                        )}
                      >
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {sub.status === 'active' && (
                        <button
                          onClick={() => setReleaseModal(sub)}
                          disabled={processingId === sub._id}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                            getProgress(sub.startDate, sub.endDate) >= 100
                              ? 'bg-[#22c55e] text-white hover:bg-[#1ea550]'
                              : 'bg-[#1a2332] text-[#6b7a90] hover:text-white border border-[#2a3441]'
                          )}
                        >
                          {processingId === sub._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5" />
                              Release
                            </>
                          )}
                        </button>
                      )}
                      {sub.status === 'completed' && sub.releasedAt && (
                        <div className="text-xs text-[#6b7a90]">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(sub.releasedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Release Modal */}
      {releaseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] w-full max-w-md">
            <div className="p-6 border-b border-[#1e2733]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Release Funds</h3>
                <button
                  onClick={() => setReleaseModal(null)}
                  className="text-[#6b7a90] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#0a0e14] rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#6b7a90]">User</span>
                  <span className="text-white">
                    {releaseModal.user.firstName} {releaseModal.user.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7a90]">Plan</span>
                  <span className="text-[#22c55e]">{releaseModal.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7a90]">Principal</span>
                  <span className="text-white">{formatCurrency(releaseModal.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7a90]">ROI ({releaseModal.roiPercent}%)</span>
                  <span className="text-[#22c55e]">+{formatCurrency(releaseModal.expectedReturn)}</span>
                </div>
                <div className="border-t border-[#1e2733] pt-3 flex justify-between">
                  <span className="text-white font-medium">Total Payout</span>
                  <span className="text-[#22c55e] font-bold">
                    {formatCurrency(releaseModal.amount + releaseModal.expectedReturn)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#6b7a90] mb-2">Note (optional)</label>
                <textarea
                  value={releaseNote}
                  onChange={(e) => setReleaseNote(e.target.value)}
                  placeholder="Add a note for this release..."
                  className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-sm focus:outline-none focus:border-[#22c55e] resize-none"
                  rows={3}
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-yellow-500 text-sm">
                  This will credit {formatCurrency(releaseModal.amount + releaseModal.expectedReturn)} to the user's subscribe balance.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-[#1e2733] flex gap-3">
              <button
                onClick={() => setReleaseModal(null)}
                className="flex-1 py-2.5 rounded-lg border border-[#2a3441] text-[#6b7a90] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseFunds}
                disabled={processingId === releaseModal._id}
                className="flex-1 py-2.5 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#1ea550] transition-colors flex items-center justify-center gap-2"
              >
                {processingId === releaseModal._id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Release Funds
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
