'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Snowflake,
  Search,
  Edit2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Users,
  TrendingUp,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Cold Storage Management Page
// Connected to Real API
// ============================================

interface ColdStorageEntry {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  symbol: string;
  name: string;
  type: string;
  icon: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  currentValue: number;
  createdAt: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

// Asset Logo with fallback
function AssetLogo({ symbol, logoUrl, size = 32 }: { symbol: string; logoUrl: string; size?: number }) {
  const [error, setError] = useState(false);

  if (error || !logoUrl) {
    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
    const colorIndex = symbol.charCodeAt(0) % colors.length;
    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, backgroundColor: colors[colorIndex], fontSize: size * 0.4 }}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <Image
      src={logoUrl}
      alt={symbol}
      width={size}
      height={size}
      className="rounded-full bg-white"
      onError={() => setError(true)}
      unoptimized
    />
  );
}

export default function AdminColdStoragePage() {
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data states
  const [entries, setEntries] = useState<ColdStorageEntry[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  
  // Search/Filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Fetch cold storage data
  const fetchData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    
    try {
      const res = await fetch('/api/admin/cold-storage');
      const data = await res.json();
      
      if (res.ok) {
        setEntries(data.entries || []);
        setTotalValue(data.totalValue || 0);
        setTotalEntries(data.totalEntries || 0);
      }
    } catch (error) {
      console.log('Cold storage fetch error:', (error as Error).message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  // Filter entries based on search
  const filteredEntries = entries.filter(
    (entry) =>
      entry.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate unique users
  const uniqueUsers = new Set(entries.map(e => e.userId)).size;

  const handleStartEdit = (entry: ColdStorageEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.currentValue.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleSaveEdit = async (entryId: string) => {
    const newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue < 0) {
      addToast('error', 'Please enter a valid value');
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/cold-storage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryId, currentValue: newValue }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        addToast('success', 'Current value updated successfully');
        setEditingId(null);
        setEditValue('');
        await fetchData();
      } else {
        addToast('error', data.error || 'Failed to update');
      }
    } catch (error) {
      addToast('error', 'Failed to update value');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
            <Snowflake className="h-5 w-5 text-[#22c55e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Cold Storage</h1>
            <p className="text-sm text-[#6b7a90]">Manage user cold storage assets and simulate value changes</p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e2733] text-white rounded-lg hover:bg-[#2a3441] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#22c55e]" />
            </div>
            <p className="text-sm text-[#6b7a90]">Total Cold Storage Value</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {isLoading ? (
              <span className="inline-block w-28 h-7 bg-[#1e2733] rounded animate-pulse" />
            ) : (
              formatCurrency(totalValue)
            )}
          </p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
              <Snowflake className="h-4 w-4 text-[#3b82f6]" />
            </div>
            <p className="text-sm text-[#6b7a90]">Total Entries</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {isLoading ? (
              <span className="inline-block w-16 h-7 bg-[#1e2733] rounded animate-pulse" />
            ) : (
              totalEntries
            )}
          </p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-[#f59e0b]" />
            </div>
            <p className="text-sm text-[#6b7a90]">Unique Users</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {isLoading ? (
              <span className="inline-block w-16 h-7 bg-[#1e2733] rounded animate-pulse" />
            ) : (
              uniqueUsers
            )}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by user, email, or asset..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
        />
      </div>

      {/* Entries Table */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2733]">
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">Asset</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">Quantity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">Purchase Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">Current Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">Current Value</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[#6b7a90]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-[#1e2733]">
                    <td className="px-4 py-3"><div className="h-10 w-40 bg-[#1e2733] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-10 w-32 bg-[#1e2733] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-[#1e2733] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-[#1e2733] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-[#1e2733] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-24 bg-[#1e2733] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-8 w-16 bg-[#1e2733] rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#6b7a90]">
                    {searchQuery ? 'No matching entries found' : 'No cold storage entries found. Users will appear here once they deposit to cold storage.'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  // Calculate P&L
                  const pnl = entry.currentValue - (entry.quantity * entry.purchasePrice);
                  const pnlPercent = entry.purchasePrice > 0 ? (pnl / (entry.quantity * entry.purchasePrice)) * 100 : 0;
                  
                  return (
                    <tr key={entry.id} className="border-b border-[#1e2733] hover:bg-[#151c24]">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{entry.userName || 'Unknown User'}</p>
                          <p className="text-sm text-[#6b7a90]">{entry.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <AssetLogo symbol={entry.symbol} logoUrl={entry.icon} size={32} />
                          <div>
                            <p className="text-white font-medium">{entry.name}</p>
                            <p className="text-sm text-[#6b7a90]">{entry.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {entry.quantity.toFixed(4)} {entry.symbol}
                      </td>
                      <td className="px-4 py-3 text-white">
                        {formatCurrency(entry.purchasePrice)}
                      </td>
                      <td className="px-4 py-3 text-white">
                        {formatCurrency(entry.currentPrice)}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === entry.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[#6b7a90]">$</span>
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-28 px-2 py-1 bg-[#0a0e14] border border-[#22c55e] rounded text-white focus:outline-none"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="text-[#22c55e] font-medium">
                              {formatCurrency(entry.currentValue)}
                            </span>
                            <p className={cn(
                              'text-xs',
                              pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                            )}>
                              {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingId === entry.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(entry.id)}
                              disabled={isSaving}
                              className="p-1.5 bg-[#22c55e] text-white rounded hover:bg-[#1ea550] transition-colors disabled:opacity-50"
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 bg-[#1e2733] text-white rounded hover:bg-[#2a3441] transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(entry)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e2733] text-white text-sm rounded-lg hover:bg-[#2a3441] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit Value
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-[#0f1419] rounded-xl border border-[#1e2733]">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#f59e0b] shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium mb-1">Simulating Portfolio Growth</p>
            <p className="text-sm text-[#6b7a90]">
              Edit the &quot;Current Value&quot; to simulate price changes for users. This updates both the current value and 
              recalculates the current price automatically. Users will see the new value and P&L in their cold storage dashboard.
              This is useful for demonstrating realistic portfolio performance.
            </p>
          </div>
        </div>
      </div>

      {/* Toast Messages */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
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
              <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}>
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
