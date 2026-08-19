'use client';

import React, { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Activity,
  Users,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Signals Management Page
// ============================================

interface Signal {
  _id: string;
  title: string;
  price: number;
  strength: number;
  amount: number;
  durationDays: number;
  isActive: boolean;
  subscribers: number;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  premium: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg',
              toast.type === 'success' && 'bg-green-500/20 border border-green-500/30',
              toast.type === 'error' && 'bg-red-500/20 border border-red-500/30',
              toast.type === 'info' && 'bg-blue-500/20 border border-blue-500/30'
            )}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-500" />}
            <span className="text-white text-sm">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Strength bar component - matches the screenshot style
function StrengthBar({ strength }: { strength: number }) {
  const totalBars = 20;
  const filledBars = Math.round((strength / 100) * totalBars);
  const isLow = strength < 50;
  
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        'text-sm font-medium min-w-[40px]',
        isLow ? 'text-red-500' : 'text-green-500'
      )}>
        {strength}%
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: totalBars }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1.5 h-4 rounded-sm',
              i < filledBars
                ? isLow
                  ? 'bg-red-500'
                  : 'bg-green-500'
                : 'bg-[#1e2733]'
            )}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminSignalsPage() {
  const toastId = useId();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, premium: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [signalToDelete, setSignalToDelete] = useState<Signal | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    price: 0,
    strength: 50,
    amount: 0,
    durationDays: 30,
  });

  const addToast = (type: Toast['type'], message: string) => {
    const id = `${toastId}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch signals
  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/admin/signals');
      const data = await res.json();
      if (res.ok) {
        setSignals(data.signals || []);
        setStats(data.stats || { total: 0, active: 0, premium: 0 });
      }
    } catch (error) {
      console.error('Error fetching signals:', error);
      addToast('error', 'Failed to fetch signals');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  // Open create modal
  const openCreateModal = () => {
    setEditingSignal(null);
    setFormData({
      title: '',
      price: 0,
      strength: 50,
      amount: 0,
      durationDays: 30,
    });
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (signal: Signal) => {
    setEditingSignal(signal);
    setFormData({
      title: signal.title,
      price: signal.price,
      strength: signal.strength,
      amount: signal.amount,
      durationDays: signal.durationDays || 30,
    });
    setIsModalOpen(true);
  };

  // Handle form submit (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      addToast('error', 'Signal name is required');
      return;
    }

    if (formData.price <= 0) {
      addToast('error', 'Price must be greater than 0');
      return;
    }

    if (formData.strength < 0 || formData.strength > 100) {
      addToast('error', 'Strength must be between 0 and 100');
      return;
    }

    if (formData.amount <= 0) {
      addToast('error', 'Amount must be greater than 0');
      return;
    }

    setIsLoading(true);

    try {
      if (editingSignal) {
        // Update existing signal
        const res = await fetch('/api/admin/signals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signalId: editingSignal._id,
            title: formData.title,
            price: formData.price,
            strength: formData.strength,
            amount: formData.amount,
            durationDays: formData.durationDays,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          addToast('success', 'Signal updated successfully');
          setIsModalOpen(false);
          await fetchSignals();
        } else {
          addToast('error', data.error || 'Failed to update signal');
        }
      } else {
        // Create new signal
        const res = await fetch('/api/admin/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            pair: formData.title,
            type: 'buy',
            price: formData.price,
            strength: formData.strength,
            amount: formData.amount,
            durationDays: formData.durationDays,
            entryPrice: formData.price,
            stopLoss: formData.price * 0.95,
            takeProfit1: formData.price * 1.05,
            market: 'crypto',
            isActive: true,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          addToast('success', 'Signal created successfully');
          setIsModalOpen(false);
          await fetchSignals();
        } else {
          addToast('error', data.error || 'Failed to create signal');
        }
      }
    } catch {
      addToast('error', 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!signalToDelete) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/signals?id=${signalToDelete._id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        addToast('success', 'Signal deleted successfully');
        setIsDeleteModalOpen(false);
        setSignalToDelete(null);
        await fetchSignals();
      } else {
        addToast('error', data.error || 'Failed to delete signal');
      }
    } catch {
      addToast('error', 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle signal active status
  const toggleActive = async (signal: Signal) => {
    try {
      const res = await fetch('/api/admin/signals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signalId: signal._id,
          isActive: !signal.isActive,
        }),
      });

      if (res.ok) {
        addToast('success', `Signal ${signal.isActive ? 'deactivated' : 'activated'}`);
        await fetchSignals();
      }
    } catch {
      addToast('error', 'Failed to update signal');
    }
  };

  // Filter signals by search
  const filteredSignals = signals.filter((signal) =>
    signal.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Signal Management</h1>
          <p className="text-[#6b7a90] text-sm mt-1">Create and manage trading signals</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Signal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Radio className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[#6b7a90] text-sm">Total Signals</p>
              <p className="text-xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-[#6b7a90] text-sm">Active Signals</p>
              <p className="text-xl font-bold text-green-500">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-[#6b7a90] text-sm">Premium Signals</p>
              <p className="text-xl font-bold text-yellow-500">{stats.premium}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
        <input
          type="text"
          placeholder="Search signals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Signals Table */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2733]">
                <th className="px-6 py-4 text-left text-xs font-medium text-[#6b7a90] uppercase">Signal Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#6b7a90] uppercase">Signal Price</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#6b7a90] uppercase">Signal Strength</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#6b7a90] uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#6b7a90] uppercase">Subscribers</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#6b7a90] uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-[#6b7a90] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSignals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Radio className="w-12 h-12 text-[#1e2733] mx-auto mb-3" />
                    <p className="text-[#6b7a90]">No signals found</p>
                    <button
                      onClick={openCreateModal}
                      className="mt-3 text-green-500 hover:text-green-400 text-sm"
                    >
                      Create your first signal
                    </button>
                  </td>
                </tr>
              ) : (
                filteredSignals.map((signal) => (
                  <tr key={signal._id} className="border-b border-[#1e2733] hover:bg-[#151c24]">
                    <td className="px-6 py-4">
                      <span className="text-green-500 font-semibold">{signal.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{formatCurrency(signal.price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StrengthBar strength={signal.strength} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{formatCurrency(signal.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#6b7a90]" />
                        <span className="text-white">{signal.subscribers || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(signal)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                          signal.isActive
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                        )}
                      >
                        {signal.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(signal)}
                          className="p-2 text-[#6b7a90] hover:text-white hover:bg-[#1e2733] rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSignalToDelete(signal);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-[#6b7a90] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] border border-[#1e2733] rounded-xl w-full max-w-md"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                <h2 className="text-xl font-bold text-white">
                  {editingSignal ? 'Edit Signal' : 'Add New Signal'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-[#6b7a90] hover:text-white hover:bg-[#1e2733] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Signal Name */}
                <div>
                  <label className="block text-[#6b7a90] text-sm mb-2">Signal Name *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., CD V5 Pro"
                    className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>

                {/* Signal Price */}
                <div>
                  <label className="block text-[#6b7a90] text-sm mb-2">Signal Price (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7a90]">$</span>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      placeholder="3000"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Signal Strength */}
                <div>
                  <label className="block text-[#6b7a90] text-sm mb-2">
                    Signal Strength: <span className={cn(
                      'font-medium',
                      formData.strength >= 50 ? 'text-green-500' : 'text-red-500'
                    )}>{formData.strength}%</span>
                  </label>
                  <input
                    type="range"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: parseInt(e.target.value) })}
                    min="0"
                    max="100"
                    className="w-full h-2 bg-[#1e2733] rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <div className="flex justify-between text-xs text-[#6b7a90] mt-1">
                    <span>0% (Weak)</span>
                    <span>50%</span>
                    <span>100% (Strong)</span>
                  </div>
                  {/* Strength Preview */}
                  <div className="mt-3">
                    <StrengthBar strength={formData.strength} />
                  </div>
                </div>

                {/* Signal Amount */}
                <div>
                  <label className="block text-[#6b7a90] text-sm mb-2">Signal Amount (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7a90]">$</span>
                    <input
                      type="number"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="5000"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <p className="text-xs text-[#6b7a90] mt-1">Minimum investment amount for this signal</p>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-[#6b7a90] text-sm mb-2">Duration (Days) *</label>
                  <input
                    type="number"
                    value={formData.durationDays || ''}
                    onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 30 })}
                    placeholder="30"
                    min="1"
                    className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                  <p className="text-xs text-[#6b7a90] mt-1">How many days the signal is valid after purchase</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#1e2733]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-[#6b7a90] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading ? 'Saving...' : editingSignal ? 'Update Signal' : 'Create Signal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && signalToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Delete Signal</h3>
                  <p className="text-[#6b7a90] text-sm">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-[#6b7a90] mb-6">
                Are you sure you want to delete{' '}
                <span className="text-white font-medium">{signalToDelete.title}</span>?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2.5 text-[#6b7a90] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Deleting...' : 'Delete Signal'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
