'use client';

import React, { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Search, ChevronDown, Calendar, DollarSign, Clock, 
  CheckCircle2, AlertCircle, X, Loader2, TrendingUp, Users, Wallet
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Investments Page
// ============================================

interface Investment {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  propertyId: string;
  propertyName: string;
  propertyImage: string;
  amount: number;
  expectedReturn: number;
  roi: number;
  durationDays: number;
  status: 'active' | 'matured' | 'cashed_out' | 'withdrawn' | 'cancelled';
  investedAt: string;
  expiresAt: string;
  releasedAt?: string;
  releasedAmount?: number;
  releaseNote?: string;
}

interface Stats {
  total: number;
  active: number;
  cashedOut: number;
  totalInvested: number;
  totalExpectedReturns: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl min-w-[300px]',
              toast.type === 'success' && 'bg-[#22c55e] text-white',
              toast.type === 'error' && 'bg-[#ef4444] text-white',
              toast.type === 'info' && 'bg-[#3b82f6] text-white'
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5" />}
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button onClick={() => onDismiss(toast.id)} className="hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function AdminInvestmentsPage() {
  const toastId = useId();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modal states
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [modalType, setModalType] = useState<'duration' | 'release' | null>(null);
  const [newDuration, setNewDuration] = useState('');
  const [releaseNote, setReleaseNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const addToast = (type: Toast['type'], message: string) => {
    const id = `${toastId}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchInvestments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const res = await fetch(`/api/admin/investments?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setInvestments(data.investments || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch investments:', error);
      addToast('error', 'Failed to load investments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [statusFilter]);

  const handleUpdateDuration = async () => {
    if (!selectedInvestment || !newDuration) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/investments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investmentId: selectedInvestment._id,
          action: 'update_duration',
          durationDays: parseInt(newDuration),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast('success', 'Duration updated successfully');
        setModalType(null);
        setSelectedInvestment(null);
        setNewDuration('');
        fetchInvestments();
      } else {
        addToast('error', data.error || 'Failed to update duration');
      }
    } catch {
      addToast('error', 'Failed to update duration');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRelease = async () => {
    if (!selectedInvestment) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/investments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investmentId: selectedInvestment._id,
          action: 'release',
          releaseNote,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast('success', 'Investment released successfully');
        setModalType(null);
        setSelectedInvestment(null);
        setReleaseNote('');
        fetchInvestments();
      } else {
        addToast('error', data.error || 'Failed to release investment');
      }
    } catch {
      addToast('error', 'Failed to release investment');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredInvestments = investments.filter((inv) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      inv.userName.toLowerCase().includes(search) ||
      inv.userEmail.toLowerCase().includes(search) ||
      inv.propertyName.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-[#22c55e]/20 text-[#22c55e]">Active</span>;
      case 'cashed_out':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">Cashed Out</span>;
      case 'matured':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">Matured</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-400">{status}</span>;
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) <= new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Real Estate Investments</h1>
          <p className="text-[#6b7a90] text-sm mt-1">Manage user property investments</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <div className="p-4 bg-[#0f1419] border border-[#1e2733] rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-[#6b7a90]" />
              <span className="text-xs text-[#6b7a90]">Total Investments</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="p-4 bg-[#0f1419] border border-[#1e2733] rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-[#22c55e]" />
              <span className="text-xs text-[#6b7a90]">Active</span>
            </div>
            <p className="text-2xl font-bold text-[#22c55e]">{stats.active}</p>
          </div>
          <div className="p-4 bg-[#0f1419] border border-[#1e2733] rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-[#6b7a90]">Cashed Out</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.cashedOut}</p>
          </div>
          <div className="p-4 bg-[#0f1419] border border-[#1e2733] rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-[#6b7a90]" />
              <span className="text-xs text-[#6b7a90]">Total Invested</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalInvested)}</p>
          </div>
          <div className="p-4 bg-[#0f1419] border border-[#1e2733] rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-[#22c55e]" />
              <span className="text-xs text-[#6b7a90]">Expected Returns</span>
            </div>
            <p className="text-2xl font-bold text-[#22c55e]">{formatCurrency(stats.totalExpectedReturns)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
          <input
            type="text"
            placeholder="Search by user or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="matured">Matured</option>
          <option value="cashed_out">Cashed Out</option>
        </select>
      </div>

      {/* Investments Table */}
      <div className="bg-[#0f1419] border border-[#1e2733] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2733]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase">ROI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a90] uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7a90] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2733]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#22c55e] mx-auto" />
                  </td>
                </tr>
              ) : filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#6b7a90]">
                    No investments found
                  </td>
                </tr>
              ) : (
                filteredInvestments.map((investment) => (
                  <tr key={investment._id} className="hover:bg-[#0c1320]">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-white font-medium">{investment.userName}</p>
                        <p className="text-xs text-[#6b7a90]">{investment.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {investment.propertyImage && (
                          <div className="h-10 w-10 rounded-lg bg-[#1a2332] overflow-hidden">
                            <img src={investment.propertyImage} alt="" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <span className="text-white">{investment.propertyName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-white font-medium">{formatCurrency(investment.amount)}</p>
                        <p className="text-xs text-[#22c55e]">+{formatCurrency(investment.expectedReturn)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[#22c55e] font-medium">{investment.roi}%</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-white">{investment.durationDays} days</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-[#6b7a90]" />
                        <span className={cn(
                          'text-sm',
                          isExpired(investment.expiresAt) && investment.status === 'active' ? 'text-yellow-400' : 'text-white'
                        )}>
                          {new Date(investment.expiresAt).toLocaleDateString()}
                        </span>
                        {isExpired(investment.expiresAt) && investment.status === 'active' && (
                          <span className="ml-1 px-1 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">Ready</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(investment.status)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {investment.status === 'active' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedInvestment(investment);
                              setNewDuration(investment.durationDays.toString());
                              setModalType('duration');
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-[#1a2332] rounded-lg hover:bg-[#2a3441] transition-colors"
                          >
                            <Clock className="h-3 w-3 inline mr-1" />
                            Duration
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInvestment(investment);
                              setReleaseNote('');
                              setModalType('release');
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-[#22c55e] rounded-lg hover:bg-[#1ea550] transition-colors"
                          >
                            <DollarSign className="h-3 w-3 inline mr-1" />
                            Release
                          </button>
                        </div>
                      )}
                      {investment.status === 'cashed_out' && investment.releasedAmount && (
                        <span className="text-xs text-[#6b7a90]">
                          Released: {formatCurrency(investment.releasedAmount)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Duration Modal */}
      <AnimatePresence>
        {modalType === 'duration' && selectedInvestment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setModalType(null)}
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
                  <h3 className="text-lg font-semibold text-white">Update Duration</h3>
                  <button onClick={() => setModalType(null)} className="text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-[#0a0e14] rounded-lg">
                  <p className="text-sm text-[#6b7a90]">Investment</p>
                  <p className="text-white font-medium">{selectedInvestment.propertyName}</p>
                  <p className="text-xs text-[#6b7a90]">{selectedInvestment.userName} - {formatCurrency(selectedInvestment.amount)}</p>
                </div>
                <div>
                  <label className="block text-sm text-[#6b7a90] mb-2">New Duration (Days)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    min="1"
                    className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalType(null)}
                    className="flex-1 py-3 rounded-lg border border-[#2a3441] text-white font-medium hover:bg-[#1a2332] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateDuration}
                    disabled={isProcessing || !newDuration}
                    className="flex-1 py-3 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#1ea550] transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Update'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Release ROI Modal */}
      <AnimatePresence>
        {modalType === 'release' && selectedInvestment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setModalType(null)}
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
                  <h3 className="text-lg font-semibold text-white">Release Investment</h3>
                  <button onClick={() => setModalType(null)} className="text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-[#0a0e14] rounded-lg space-y-2">
                  <p className="text-sm text-[#6b7a90]">Investment Details</p>
                  <p className="text-white font-medium">{selectedInvestment.propertyName}</p>
                  <p className="text-xs text-[#6b7a90]">{selectedInvestment.userName}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[#0a0e14] rounded-lg text-center">
                    <p className="text-xs text-[#6b7a90]">Principal</p>
                    <p className="text-white font-medium">{formatCurrency(selectedInvestment.amount)}</p>
                  </div>
                  <div className="p-3 bg-[#0a0e14] rounded-lg text-center">
                    <p className="text-xs text-[#6b7a90]">ROI ({selectedInvestment.roi}%)</p>
                    <p className="text-[#22c55e] font-medium">{formatCurrency(selectedInvestment.expectedReturn)}</p>
                  </div>
                  <div className="p-3 bg-[#22c55e]/10 rounded-lg text-center border border-[#22c55e]/20">
                    <p className="text-xs text-[#6b7a90]">Total Release</p>
                    <p className="text-[#22c55e] font-bold">
                      {formatCurrency(selectedInvestment.amount + selectedInvestment.expectedReturn)}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#6b7a90] mb-2">Admin Note (Optional)</label>
                  <textarea
                    value={releaseNote}
                    onChange={(e) => setReleaseNote(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e] resize-none"
                    placeholder="Add a note about this release..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalType(null)}
                    className="flex-1 py-3 rounded-lg border border-[#2a3441] text-white font-medium hover:bg-[#1a2332] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRelease}
                    disabled={isProcessing}
                    className="flex-1 py-3 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#1ea550] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Release Funds'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
