'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  X,
  Copy,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { cn, formatCurrency, formatCryptoAmount } from '@/utils';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Deposit Page - Full Flow (Database Connected)
// ============================================

type FilterType = 'all' | 'pending' | 'declined' | 'approved' | 'regular' | 'subscribe' | 'signal';
type ModalView = 'method' | 'crypto-steps' | 'confirmation' | 'success';

// Deposit Token Interface (from DB)
interface DepositToken {
  _id: string;
  name: string;
  symbol: string;
  image: string;
  networks: { name: string; address: string; isActive: boolean }[];
  isActive: boolean;
  order: number;
}

// Mapped token for UI
interface UIToken {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  networks: string[];
  networkAddresses: Record<string, string>;
}

// Map database token to UI token
function mapDbToken(dbToken: DepositToken): UIToken {
  const networkAddresses: Record<string, string> = {};
  dbToken.networks.forEach(n => {
    networkAddresses[n.name] = n.address;
  });
  
  return {
    id: dbToken._id,
    symbol: dbToken.symbol,
    name: dbToken.name,
    icon: dbToken.image,
    networks: dbToken.networks.map(n => n.name),
    networkAddresses,
  };
}

// Get wallet address for a network
const getWalletAddress = (network: string, token: UIToken | null): string => {
  if (token && token.networkAddresses[network]) {
    return token.networkAddresses[network];
  }
  // Fallback addresses
  const fallbackAddresses: Record<string, string> = {
    'Bitcoin': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    'ERC20': '0x86eE640C10769C154c1a509042E4eE9215343AE2',
    'TRC20': 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
    'BEP20': '0x86eE640C10769C154c1a509042E4eE9215343AE2',
    'Solana': '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  };
  return fallbackAddresses[network] || '0x86eE640C10769C154c1a509042E4eE9215343AE2';
};

interface DepositRecord {
  id: string;
  date: Date;
  reference: string;
  method: string;
  token: string;
  type: 'regular' | 'subscribe' | 'signal';
  amount: number; // Token amount
  totalUsd: number; // USD amount
  status: 'pending' | 'approved' | 'declined';
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function DepositPage() {
  // Translation hook
  const { t } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [depositTokens, setDepositTokens] = useState<UIToken[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [isLoadingDeposits, setIsLoadingDeposits] = useState(true);

  // Settings state
  const [depositLimits, setDepositLimits] = useState({
    minimum: 10,
    maximum: 500000,
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalView, setModalView] = useState<ModalView>('method');
  const [selectedToken, setSelectedToken] = useState<UIToken | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofBase64, setPaymentProofBase64] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all data in parallel with timeout handling
  useEffect(() => {
    // Reset loading state on mount/navigation
    setIsLoadingDeposits(true);
    setIsLoadingTokens(true);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const fetchAllData = async () => {
      try {
        // Parallel fetch for better performance
        const [depositsRes, tokensRes, settingsRes] = await Promise.all([
          fetch('/api/deposits', { signal: controller.signal }),
          fetch('/api/deposit-tokens', { signal: controller.signal }),
          fetch('/api/settings', { signal: controller.signal }),
        ]);

        clearTimeout(timeoutId);

        const [depositsData, tokensData, settingsData] = await Promise.all([
          depositsRes.json(),
          tokensRes.json(),
          settingsRes.ok ? settingsRes.json() : null,
        ]);

        // Process deposits
        if (depositsRes.ok && depositsData.deposits) {
          setDeposits(depositsData.deposits.map((d: any) => ({
            id: d._id,
            date: new Date(d.createdAt),
            reference: d.reference,
            method: d.method || `${d.token} (${d.network})`,
            token: d.token || 'USDT',
            type: d.type || 'regular',
            amount: d.amount,
            totalUsd: d.amountUsd,
            status: d.status,
          })));
        }

        // Process tokens
        if (tokensRes.ok && tokensData.tokens) {
          setDepositTokens(tokensData.tokens.map(mapDbToken));
        }

        // Process settings
        if (settingsData) {
          setDepositLimits({
            minimum: settingsData.deposit?.minimum || 10,
            maximum: settingsData.deposit?.maximum || 500000,
          });
        }
      } catch (error: any) {
        // Timeout is expected behavior, not an error
        if (error.name !== 'AbortError') {
          console.log('Deposit fetch issue:', error.message);
        }
      } finally {
        clearTimeout(timeoutId);
        // Set both loading states together
        setIsLoadingDeposits(false);
        setIsLoadingTokens(false);
      }
    };

    fetchAllData();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  // Function to refresh deposits (called after new deposit)
  const refreshDeposits = async () => {
    try {
      const res = await fetch('/api/deposits');
      const data = await res.json();
      if (res.ok && data.deposits) {
        setDeposits(data.deposits.map((d: any) => ({
          id: d._id,
          date: new Date(d.createdAt),
          reference: d.reference,
          method: d.method || `${d.token} (${d.network})`,
          token: d.token || 'USDT',
          type: d.type || 'regular',
          amount: d.amount,
          totalUsd: d.amountUsd,
          status: d.status,
        })));
      }
    } catch (error) {
      console.error('Failed to refresh deposits:', error);
    }
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: t.common.all },
    { value: 'pending', label: t.transactions.pending },
    { value: 'approved', label: t.transactions.approved },
    { value: 'declined', label: t.transactions.declined },
    { value: 'regular', label: t.transactions.regular },
    { value: 'subscribe', label: t.transactions.subscribe },
    { value: 'signal', label: t.transactions.signal },
  ];

  // Filter deposits
  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = deposit.reference.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    if (['pending', 'approved', 'declined'].includes(filterType)) {
      return matchesSearch && deposit.status === filterType;
    }
    return matchesSearch && deposit.type === filterType;
  });

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setModalView('method');
    setSelectedToken(null);
    setSelectedNetwork('');
    setDepositAmount('');
    setPaymentProof(null);
    setPaymentProofBase64('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalView('method');
    setSelectedToken(null);
    setSelectedNetwork('');
    setDepositAmount('');
    setPaymentProof(null);
    setPaymentProofBase64('');
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    addToast('success', t.transactions.walletAddressCopied);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProof(file);
      // Convert to base64 for API
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitDeposit = async () => {
    if (!selectedToken || !selectedNetwork || !depositAmount) {
      addToast('error', t.transactions.fillAllFields);
      return;
    }

    if (!paymentProof || !paymentProofBase64) {
      addToast('error', t.transactions.paymentProofRequired);
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 10) {
      addToast('error', `${t.transactions.minimumDepositError} ${formatCurrency(depositLimits.minimum)}`);
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: `${selectedToken.symbol} (${selectedNetwork})`,
          token: selectedToken.symbol,
          network: selectedNetwork,
          walletAddress: getWalletAddress(selectedNetwork, selectedToken),
          amount,
          amountUsd: amount,
          type: 'regular',
          paymentProof: paymentProofBase64,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh deposits list
        await refreshDeposits();
        setModalView('success');
      } else {
        addToast('error', data.error || 'Failed to submit deposit');
      }
    } catch (error) {
      addToast('error', 'Failed to submit deposit');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Check if all crypto steps are complete
  const isStep1Complete = !!selectedToken;
  const isStep2Complete = !!selectedNetwork;
  const isStep3Complete = isStep1Complete && isStep2Complete;
  const allStepsComplete = isStep3Complete;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">{t.transactions.deposit}</h1>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
        >
          <CreditCard className="h-4 w-4" />
          {t.transactions.deposit}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
          <input
            type="text"
            placeholder={t.common.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white text-sm placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center justify-between gap-8 px-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white min-w-[140px]"
          >
            <span>{filterOptions.find(f => f.value === filterType)?.label}</span>
            <ChevronDown className={cn('h-4 w-4 text-[#6b7a90] transition-transform', showFilterDropdown && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {showFilterDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full right-0 mt-1 w-full bg-[#0f1419] border border-[#1e2733] rounded-lg shadow-xl z-20 overflow-hidden"
              >
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterType(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm transition-colors',
                      filterType === option.value
                        ? 'bg-[#22c55e]/10 text-[#22c55e]'
                        : 'text-white hover:bg-[#1e2733]'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2733]">
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">{t.transactions.date}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">{t.transactions.reference}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">{t.transactions.method}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">{t.transactions.type}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">{t.transactions.amount}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">{t.transactions.totalUsd}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">{t.transactions.status}</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingDeposits ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1e2733]">
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-[#1e2733] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-28 bg-[#1e2733] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-32 bg-[#1e2733] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-[#1e2733] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-[#1e2733] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-[#1e2733] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-[#1e2733] rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-[#6b7a90]">
                    {t.transactions.noDepositsYet}{' '}
                    <button onClick={handleOpenModal} className="text-[#22c55e] hover:underline">
                      {t.transactions.clickToDeposit}
                    </button>
                  </td>
                </tr>
              ) : (
                filteredDeposits.map(deposit => (
                  <tr key={deposit.id} className="border-b border-[#1e2733] hover:bg-[#151c24]">
                    <td className="px-4 py-3 text-white text-sm">{formatDate(deposit.date)}</td>
                    <td className="px-4 py-3 text-white text-sm font-mono">{deposit.reference}</td>
                    <td className="px-4 py-3 text-white text-sm">{deposit.method}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium capitalize',
                        deposit.type === 'regular' && 'bg-[#3b82f6]/10 text-[#3b82f6]',
                        deposit.type === 'subscribe' && 'bg-[#8b5cf6]/10 text-[#8b5cf6]',
                        deposit.type === 'signal' && 'bg-[#f59e0b]/10 text-[#f59e0b]'
                      )}>
                        {deposit.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white text-sm">{formatCryptoAmount(deposit.amount, deposit.token)}</td>
                    <td className="px-4 py-3 text-[#22c55e] text-sm font-semibold">+{formatCurrency(deposit.totalUsd)}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        deposit.status === 'pending' && 'bg-[#f59e0b]/10 text-[#f59e0b]',
                        deposit.status === 'approved' && 'bg-[#22c55e]/10 text-[#22c55e]',
                        deposit.status === 'declined' && 'bg-[#ef4444]/10 text-[#ef4444]'
                      )}>
                        {deposit.status === 'approved' ? t.transactions.approved : 
                         deposit.status === 'pending' ? t.transactions.pending : 
                         t.transactions.declined}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[#1e2733]">
          {isLoadingDeposits ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex justify-between mb-2">
                  <div className="h-4 w-24 bg-[#1e2733] rounded animate-pulse" />
                  <div className="h-4 w-16 bg-[#1e2733] rounded animate-pulse" />
                </div>
                <div className="h-4 w-32 bg-[#1e2733] rounded animate-pulse mb-2" />
                <div className="h-4 w-20 bg-[#1e2733] rounded animate-pulse" />
              </div>
            ))
          ) : filteredDeposits.length === 0 ? (
            <div className="p-8 text-center text-[#6b7a90]">
              {t.transactions.noDepositsYet}{' '}
              <button onClick={handleOpenModal} className="text-[#22c55e] hover:underline">
                {t.transactions.clickToDeposit}
              </button>
            </div>
          ) : (
            filteredDeposits.map(deposit => (
              <div key={deposit.id} className="p-4 hover:bg-[#151c24] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium">{deposit.method}</p>
                    <p className="text-xs text-[#6b7a90] font-mono">{deposit.reference}</p>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    deposit.status === 'pending' && 'bg-[#f59e0b]/10 text-[#f59e0b]',
                    deposit.status === 'approved' && 'bg-[#22c55e]/10 text-[#22c55e]',
                    deposit.status === 'declined' && 'bg-[#ef4444]/10 text-[#ef4444]'
                  )}>
                    {deposit.status === 'approved' ? t.transactions.approved : 
                     deposit.status === 'pending' ? t.transactions.pending : 
                     t.transactions.declined}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#6b7a90]">{formatDate(deposit.date)}</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium capitalize',
                    deposit.type === 'regular' && 'bg-[#3b82f6]/10 text-[#3b82f6]',
                    deposit.type === 'subscribe' && 'bg-[#8b5cf6]/10 text-[#8b5cf6]',
                    deposit.type === 'signal' && 'bg-[#f59e0b]/10 text-[#f59e0b]'
                  )}>
                    {deposit.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{formatCryptoAmount(deposit.amount, deposit.token)}</span>
                  <span className="text-[#22c55e] font-semibold">+{formatCurrency(deposit.totalUsd)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0f1419] rounded-2xl border border-[#1e2733] shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Method Selection */}
              {modalView === 'method' && (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                    <h2 className="text-xl font-semibold text-white">{t.transactions.makeDeposit}</h2>
                    <button onClick={handleCloseModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-[#6b7a90] mb-6">
                      {t.transactions.depositInstructions}
                    </p>
                    <p className="text-sm text-[#6b7a90] mb-3">{t.transactions.paymentOptions}</p>
                    <button
                      onClick={() => setModalView('crypto-steps')}
                      className="w-full px-4 py-4 bg-[#1e2733] border border-[#22c55e] rounded-xl text-white text-left hover:bg-[#22c55e]/10 transition-colors"
                    >
                      {t.transactions.crypto}
                    </button>
                    <button
                      onClick={() => setModalView('crypto-steps')}
                      className="w-full mt-4 py-4 bg-[#22c55e] text-white font-semibold rounded-xl hover:bg-[#1ea550] transition-colors"
                    >
                      {t.transactions.continue}
                    </button>
                  </div>
                </>
              )}

              {/* Crypto Steps */}
              {modalView === 'crypto-steps' && (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                    <button
                      onClick={() => setModalView('method')}
                      className="flex items-center gap-2 text-[#6b7a90] hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t.transactions.cryptoDeposit}
                    </button>
                    <button onClick={handleCloseModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-[#6b7a90] mb-6">
                      {t.transactions.cryptoInstructions}
                    </p>

                    {/* Step 1: Select Token */}
                    <div className="flex items-start gap-3 mb-6">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold',
                          isStep1Complete ? 'bg-[#22c55e] text-white' : 'bg-[#22c55e] text-white'
                        )}>
                          {isStep1Complete ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                        </div>
                        <div className={cn('w-0.5 h-16 mt-2', isStep1Complete ? 'bg-[#22c55e]' : 'bg-[#1e2733]')} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2">{t.transactions.selectTokenToDeposit}</p>
                        <div className="relative">
                          <button
                            onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white"
                          >
                            {selectedToken ? (
                              <div className="flex items-center gap-3">
                                <Image src={selectedToken.icon} alt={selectedToken.name} width={24} height={24} className="rounded-full" unoptimized />
                                <span>{selectedToken.name}</span>
                              </div>
                            ) : (
                              <span className="text-[#6b7a90]">{t.transactions.selectToken}</span>
                            )}
                            <ChevronDown className={cn('h-4 w-4 text-[#6b7a90]', showTokenDropdown && 'rotate-180')} />
                          </button>
                          <AnimatePresence>
                            {showTokenDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-1 bg-[#0f1419] border border-[#1e2733] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto"
                              >
                                {depositTokens.map(token => (
                                  <button
                                    key={token.id}
                                    onClick={() => {
                                      setSelectedToken(token);
                                      setSelectedNetwork('');
                                      setShowTokenDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#1e2733] transition-colors"
                                  >
                                    <Image src={token.icon} alt={token.name} width={24} height={24} className="rounded-full" unoptimized />
                                    <span>{token.name}</span>
                                    <span className="text-[#6b7a90]">({token.symbol})</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Select Network */}
                    <div className="flex items-start gap-3 mb-6">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold',
                          isStep2Complete ? 'bg-[#22c55e] text-white' : 'bg-[#1e2733] text-[#6b7a90]'
                        )}>
                          {isStep2Complete ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                        </div>
                        <div className={cn('w-0.5 h-16 mt-2', isStep2Complete ? 'bg-[#22c55e]' : 'bg-[#1e2733]')} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2">{t.transactions.selectNetwork}</p>
                        {selectedToken ? (
                          <div className="relative">
                            <button
                              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                              className="w-full flex items-center justify-between px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white"
                            >
                              <span className={selectedNetwork ? 'text-white' : 'text-[#6b7a90]'}>
                                {selectedNetwork || t.transactions.selectNetwork}
                              </span>
                              <ChevronDown className={cn('h-4 w-4 text-[#6b7a90]', showNetworkDropdown && 'rotate-180')} />
                            </button>
                            <AnimatePresence>
                              {showNetworkDropdown && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute top-full left-0 right-0 mt-1 bg-[#0f1419] border border-[#1e2733] rounded-lg shadow-xl z-20"
                                >
                                  {selectedToken.networks.map(network => (
                                    <button
                                      key={network}
                                      onClick={() => {
                                        setSelectedNetwork(network);
                                        setShowNetworkDropdown(false);
                                      }}
                                      className="w-full px-4 py-3 text-left text-white hover:bg-[#1e2733] transition-colors"
                                    >
                                      {network}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <div className="px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-[#6b7a90]">
                            {t.transactions.selectTokenToDeposit}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Deposit Details */}
                    <div className="flex items-start gap-3 mb-6">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold',
                          isStep3Complete ? 'bg-[#22c55e] text-white' : 'bg-[#1e2733] text-[#6b7a90]'
                        )}>
                          {isStep3Complete ? <CheckCircle2 className="h-4 w-4" /> : '3'}
                        </div>
                        <div className={cn('w-0.5 h-12 mt-2', isStep3Complete ? 'bg-[#22c55e]' : 'bg-[#1e2733]')} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2">{t.transactions.depositDetails}</p>
                        {isStep3Complete ? (
                          <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg">
                            <p className="flex-1 text-white text-sm font-mono break-all">
                              {getWalletAddress(selectedNetwork, selectedToken)}
                            </p>
                            <button
                              onClick={() => handleCopyAddress(getWalletAddress(selectedNetwork, selectedToken))}
                              className="p-2 bg-[#1e2733] rounded-lg hover:bg-[#2a3441] transition-colors"
                            >
                              <Copy className="h-4 w-4 text-[#6b7a90]" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-16 bg-[#0a0e14] border border-[#1e2733] rounded-lg" />
                        )}
                      </div>
                    </div>

                    {/* Step 4: Confirmation */}
                    <div className="flex items-start gap-3 mb-6">
                      <div className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold',
                        allStepsComplete ? 'bg-[#22c55e] text-white' : 'bg-[#1e2733] text-[#6b7a90]'
                      )}>
                        {allStepsComplete ? <CheckCircle2 className="h-4 w-4" /> : '4'}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-1">{t.transactions.depositConfirmation}</p>
                        <p className="text-sm text-[#6b7a90]">
                          {t.transactions.depositConfirmationHint}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => allStepsComplete && setModalView('confirmation')}
                      disabled={!allStepsComplete}
                      className={cn(
                        'w-full py-4 rounded-xl font-semibold transition-colors',
                        allStepsComplete
                          ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                          : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                      )}
                    >
                      {t.transactions.continue}
                    </button>
                  </div>
                </>
              )}

              {/* Confirmation */}
              {modalView === 'confirmation' && selectedToken && (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                    <button
                      onClick={() => setModalView('crypto-steps')}
                      className="flex items-center gap-2 text-[#6b7a90] hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t.transactions.depositConfirmation}
                    </button>
                    <button onClick={handleCloseModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-[#6b7a90] mb-2">{t.transactions.amount}:</p>
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0"
                        className="flex-1 px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-lg focus:outline-none focus:border-[#22c55e]"
                      />
                      <div className="flex items-center gap-2 px-4 py-3 bg-[#1e2733] rounded-lg">
                        <Image src={selectedToken.icon} alt={selectedToken.symbol} width={20} height={20} className="rounded-full" unoptimized />
                        <span className="text-white font-medium">{selectedToken.symbol}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6b7a90]">{t.transactions.currentBalance} {selectedToken.symbol}</span>
                        <span className="text-white">0 {selectedToken.symbol}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6b7a90]">{t.transactions.minimumDeposit}</span>
                        <span className="text-white">{formatCurrency(depositLimits.minimum)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6b7a90]">{t.transactions.maximumDeposit}</span>
                        <span className="text-white">{formatCurrency(depositLimits.maximum)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-[#6b7a90] mb-2">{t.transactions.paymentProof}</p>
                    <label className="block mb-6">
                      <div className="flex items-center gap-3 px-4 py-4 bg-[#22c55e]/10 border border-dashed border-[#22c55e] rounded-xl cursor-pointer hover:bg-[#22c55e]/20 transition-colors">
                        <Upload className="h-5 w-5 text-[#22c55e]" />
                        <span className="text-[#22c55e] font-medium">
                          {paymentProof ? paymentProof.name : t.transactions.uploadPaymentProof}
                        </span>
                      </div>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    <div className="flex justify-between text-sm mb-6">
                      <span className="text-[#6b7a90]">{t.transactions.totalDepositValue}</span>
                      <span className="text-white font-semibold">
                        {depositAmount ? formatCurrency(parseFloat(depositAmount)) : '$0.00'}
                      </span>
                    </div>

                    <button
                      onClick={handleSubmitDeposit}
                      disabled={isProcessing || !depositAmount || !paymentProof}
                      className={cn(
                        'w-full py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2',
                        depositAmount && paymentProof && !isProcessing
                          ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                          : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                      )}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {t.common.processing}...
                        </>
                      ) : (
                        t.transactions.iHaveMadeDeposit
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Success */}
              {modalView === 'success' && (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="h-20 w-20 mx-auto rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-6"
                  >
                    <CheckCircle2 className="h-10 w-10 text-[#22c55e]" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">{t.transactions.depositSubmitted}</h3>
                  <p className="text-[#6b7a90] mb-6">
                    {t.transactions.depositSubmittedMessage}
                  </p>
                  <button
                    onClick={handleCloseModal}
                    className="px-8 py-3 bg-[#22c55e] hover:bg-[#1ea550] text-white font-semibold rounded-xl transition-colors"
                  >
                    {t.common.done}
                  </button>
                </div>
              )}
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
                toast.type === 'error' && 'bg-[#ef4444] text-white',
                toast.type === 'info' && 'bg-[#3b82f6] text-white'
              )}
            >
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5" />}
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
