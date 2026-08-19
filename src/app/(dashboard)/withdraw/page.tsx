'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Wallet,
  MinusCircle,
  Info,
} from 'lucide-react';
import { cn, formatCurrency, formatCryptoAmount } from '@/utils';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Withdraw Page - Improved Token-Based Flow
// ============================================

type FilterType = 'all' | 'pending' | 'approved' | 'declined';
type ModalView = 
  | 'method' 
  | 'crypto-token-select' 
  | 'crypto-details' 
  | 'bank-details' 
  | 'bank-token-select'
  | 'confirmation' 
  | 'processing' 
  | 'success';
type WithdrawMethod = 'bank' | 'crypto' | null;

// User holding interface
interface UserHolding {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  type: 'crypto' | 'stock';
  amount: number;
  amountUsd: number;
  networks: string[];
}

interface WithdrawRecord {
  id: string;
  date: Date;
  reference: string;
  method: string;
  token?: string;
  fee: number;
  netAmount: number;
  amount: number;
  status: 'pending' | 'approved' | 'declined';
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function WithdrawPage() {
  // Translation hook
  const { t } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawRecord[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(true);

  // User balance and holdings
  const [userBalance, setUserBalance] = useState(0);
  const [userHoldings, setUserHoldings] = useState<UserHolding[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingHoldings, setIsLoadingHoldings] = useState(true);

  // Settings state
  const [settings, setSettings] = useState<{
    minimumWithdrawal: number;
    dailyLimit: number;
    monthlyLimit: number;
    dailyRemaining: number;
    monthlyRemaining: number;
    requireKycForWithdrawal: boolean;
    isVerified: boolean;
  }>({
    minimumWithdrawal: 10,
    dailyLimit: 1000,
    monthlyLimit: 5000,
    dailyRemaining: 1000,
    monthlyRemaining: 5000,
    requireKycForWithdrawal: false,
    isVerified: false,
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalView, setModalView] = useState<ModalView>('method');
  const [selectedMethod, setSelectedMethod] = useState<WithdrawMethod>(null);
  
  // Token selection
  const [selectedToken, setSelectedToken] = useState<UserHolding | null>(null);
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');
  
  // Crypto withdrawal states
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState('');
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  
  // Bank withdrawal states
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [bankCountry, setBankCountry] = useState('');

  // Common states
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch user balance
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/user/balance');
      const data = await res.json();
      if (res.ok) {
        setUserBalance(data.balance?.available || 0);
      }
    } catch (error: any) {
      console.log('Balance fetch issue:', error.message);
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  // Fetch user holdings
  const fetchHoldings = useCallback(async () => {
    try {
      const res = await fetch('/api/user/holdings');
      const data = await res.json();
      if (res.ok) {
        setUserHoldings(data.holdings || []);
      }
    } catch (error: any) {
      console.log('Holdings fetch issue:', error.message);
    } finally {
      setIsLoadingHoldings(false);
    }
  }, []);

  // Fetch withdrawals
  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch('/api/withdrawals');
      const data = await res.json();
      if (res.ok && data.withdrawals) {
        setWithdrawals(data.withdrawals.map((w: any) => ({
          id: w._id,
          date: new Date(w.createdAt),
          reference: w.reference,
          method: w.method,
          token: w.token,
          fee: w.fee || 0,
          netAmount: w.netAmount || w.amount,
          amount: w.amountUsd || w.amount,
          status: w.status,
        })));
      }
    } catch (error: any) {
      console.log('Withdrawals fetch issue:', error.message);
    } finally {
      setIsLoadingWithdrawals(false);
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (res.ok) {
        setSettings({
          minimumWithdrawal: data.withdrawal?.minimumWithdrawal || 10,
          dailyLimit: data.withdrawal?.dailyLimit || 1000,
          monthlyLimit: data.withdrawal?.monthlyLimit || 5000,
          dailyRemaining: data.withdrawal?.dailyRemaining || 1000,
          monthlyRemaining: data.withdrawal?.monthlyRemaining || 5000,
          requireKycForWithdrawal: data.requireKycForWithdrawal || false,
          isVerified: data.isVerified || false,
        });
      }
    } catch (error: any) {
      console.log('Settings fetch issue:', error.message);
    }
  }, []);

  useEffect(() => {
    setIsLoadingBalance(true);
    setIsLoadingWithdrawals(true);
    setIsLoadingHoldings(true);
    
    fetchBalance();
    fetchWithdrawals();
    fetchHoldings();
    fetchSettings();
  }, [fetchBalance, fetchWithdrawals, fetchHoldings, fetchSettings]);

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: t.common.all },
    { value: 'pending', label: t.transactions.pending },
    { value: 'approved', label: t.transactions.approved },
    { value: 'declined', label: t.transactions.declined },
  ];

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.reference.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && withdrawal.status === filterType;
  });

  // Filter tokens for search
  const filteredHoldings = userHoldings.filter(holding => {
    const query = tokenSearchQuery.toLowerCase();
    return holding.symbol.toLowerCase().includes(query) || 
           holding.name.toLowerCase().includes(query);
  });

  // Check if user has any holdings
  const hasHoldings = userHoldings.length > 0;

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const resetModal = () => {
    setSelectedMethod(null);
    setSelectedToken(null);
    setSelectedNetwork('');
    setWalletAddress('');
    setTokenSearchQuery('');
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setRoutingNumber('');
    setSwiftCode('');
    setBankCountry('');
    setWithdrawAmount('');
  };

  const handleOpenModal = () => {
    if (!hasHoldings) {
      addToast('error', t.transactions.noTokensToWithdraw);
      return;
    }
    setShowModal(true);
    setModalView('method');
    resetModal();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalView('method');
    resetModal();
  };

  const handleMethodSelect = (method: WithdrawMethod) => {
    setSelectedMethod(method);
  };

  const handleContinueFromMethod = () => {
    if (selectedMethod === 'crypto') {
      setModalView('crypto-token-select');
    } else if (selectedMethod === 'bank') {
      setModalView('bank-details');
    }
  };

  const handleTokenSelect = (token: UserHolding) => {
    setSelectedToken(token);
    setSelectedNetwork('');
    setWithdrawAmount('');
  };

  const handleContinueFromTokenSelect = () => {
    if (selectedMethod === 'crypto') {
      setModalView('crypto-details');
    } else if (selectedMethod === 'bank') {
      setModalView('confirmation');
    }
  };

  const handleContinueFromBankDetails = () => {
    setModalView('bank-token-select');
  };

  // Calculate fee (1% for crypto, 2% for bank, minimum $1)
  const calculateFee = (amount: number): number => {
    if (!selectedMethod || isNaN(amount)) return 0;
    const feePercent = selectedMethod === 'crypto' ? 0.01 : 0.02;
    return Math.max(amount * feePercent, 1);
  };

  // Get max withdrawable amount for selected token
  const getMaxAmount = (): number => {
    if (!selectedToken) return 0;
    return selectedToken.amountUsd;
  };

  const handleSubmitWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast('error', t.transactions.enterValidAmount);
      return;
    }

    const maxAmount = getMaxAmount();
    if (amount > maxAmount) {
      addToast('error', `${t.transactions.maxWithdrawalFor} ${selectedToken?.symbol} ${t.transactions.status.toLowerCase()}: ${formatCurrency(maxAmount)}`);
      return;
    }

    if (amount < settings.minimumWithdrawal) {
      addToast('error', `${t.transactions.minimumWithdrawalError} ${formatCurrency(settings.minimumWithdrawal)}`);
      return;
    }

    // Check daily limit
    if (amount > settings.dailyRemaining) {
      addToast('error', `${t.transactions.dailyLimitRemainingError} ${formatCurrency(settings.dailyRemaining)}`);
      return;
    }

    setModalView('processing');
    setIsProcessing(true);

    try {
      const payload: any = {
        method: selectedMethod,
        amount,
        token: selectedToken?.symbol,
        tokenName: selectedToken?.name,
        tokenAmount: selectedToken ? (amount / selectedToken.amountUsd) * selectedToken.amount : 0,
      };

      if (selectedMethod === 'crypto') {
        payload.network = selectedNetwork;
        payload.walletAddress = walletAddress;
      } else if (selectedMethod === 'bank') {
        payload.bankName = bankName;
        payload.accountName = accountName;
        payload.accountNumber = accountNumber;
        payload.routingNumber = routingNumber;
        payload.swiftCode = swiftCode;
        payload.bankCountry = bankCountry;
      }

      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        await Promise.all([fetchWithdrawals(), fetchBalance(), fetchHoldings()]);
        setModalView('success');
      } else {
        addToast('error', data.error || 'Failed to submit withdrawal');
        setModalView('confirmation');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      addToast('error', 'Failed to submit withdrawal');
      setModalView('confirmation');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Validation states
  const isBankDetailsComplete = bankName && accountName && accountNumber;
  const isCryptoDetailsComplete = selectedToken && selectedNetwork && walletAddress;
  const isAmountValid = withdrawAmount && parseFloat(withdrawAmount) >= settings.minimumWithdrawal && parseFloat(withdrawAmount) <= getMaxAmount();

  // Get the back view based on current view
  const getBackView = (): ModalView => {
    switch (modalView) {
      case 'crypto-token-select':
        return 'method';
      case 'crypto-details':
        return 'crypto-token-select';
      case 'bank-details':
        return 'method';
      case 'bank-token-select':
        return 'bank-details';
      case 'confirmation':
        return selectedMethod === 'crypto' ? 'crypto-details' : 'bank-token-select';
      default:
        return 'method';
    }
  };

  // Total holdings value
  const totalHoldingsValue = userHoldings.reduce((sum, h) => sum + h.amountUsd, 0);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">{t.transactions.withdraw}</h1>
        <button
          onClick={handleOpenModal}
          disabled={isLoadingHoldings}
          className={cn(
            'flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors',
            hasHoldings || isLoadingHoldings
              ? 'bg-[#22c55e] text-white hover:bg-[#1ea550]'
              : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
          )}
        >
          <MinusCircle className="h-4 w-4" />
          {t.transactions.withdraw}
        </button>
      </div>

      {/* Balance & Holdings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6b7a90]">{t.transactions.available} {t.transactions.balance}</p>
              {isLoadingBalance ? (
                <div className="h-8 w-32 bg-[#1e2733] rounded animate-pulse mt-1" />
              ) : (
                <p className="text-2xl font-bold text-white">{formatCurrency(userBalance)}</p>
              )}
            </div>
            <Wallet className="h-8 w-8 text-[#22c55e]" />
          </div>
        </div>

        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6b7a90]">{t.nav.assets}</p>
              {isLoadingHoldings ? (
                <div className="h-8 w-32 bg-[#1e2733] rounded animate-pulse mt-1" />
              ) : (
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(totalHoldingsValue)}
                  <span className="text-sm font-normal text-[#6b7a90] ml-2">
                    ({userHoldings.length} {t.transactions.tokens})
                  </span>
                </p>
              )}
            </div>
            <div className="flex -space-x-2">
              {userHoldings.slice(0, 4).map((h) => (
                <div key={h.id} className="h-8 w-8 rounded-full bg-[#1e2733] border-2 border-[#0f1419] flex items-center justify-center overflow-hidden">
                  {h.icon ? (
                    <Image src={h.icon} alt={h.symbol} width={24} height={24} className="object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">{h.symbol.slice(0, 2)}</span>
                  )}
                </div>
              ))}
              {userHoldings.length > 4 && (
                <div className="h-8 w-8 rounded-full bg-[#1e2733] border-2 border-[#0f1419] flex items-center justify-center">
                  <span className="text-xs font-bold text-white">+{userHoldings.length - 4}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      {!hasHoldings && !isLoadingHoldings && (
        <div className="flex items-center gap-3 p-4 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl mb-6">
          <Info className="h-5 w-5 text-[#3b82f6] shrink-0" />
          <p className="text-sm text-[#3b82f6]">
            {t.transactions.noHoldingsMessage}
          </p>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t.common.search}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white hover:border-[#22c55e] transition-colors"
          >
            {filterOptions.find(f => f.value === filterType)?.label}
            <ChevronDown className="h-4 w-4 text-[#6b7a90]" />
          </button>
          <AnimatePresence>
            {showFilterDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 mt-2 w-40 bg-[#0f1419] border border-[#1e2733] rounded-lg shadow-xl z-20 overflow-hidden"
              >
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterType(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left hover:bg-[#1e2733] transition-colors',
                      filterType === option.value ? 'text-[#22c55e]' : 'text-white'
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

      {/* Withdrawals Table */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-3 border-b border-[#1e2733] text-sm text-[#6b7a90]">
          <span>{t.transactions.date}</span>
          <span>{t.transactions.reference}</span>
          <span>{t.transactions.method}</span>
          <span className="text-right">{t.transactions.amount}</span>
          <span className="text-right">{t.transactions.status}</span>
        </div>

        {/* Table Body */}
        {isLoadingWithdrawals ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#22c55e] mb-3" />
            <p className="text-[#6b7a90]">{t.transactions.loadingWithdrawals}</p>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="p-8 text-center">
            <MinusCircle className="h-12 w-12 text-[#6b7a90] mx-auto mb-3" />
            <p className="text-white font-medium">{t.transactions.noWithdrawalsFound}</p>
            <p className="text-sm text-[#6b7a90]">
              {searchQuery ? t.transactions.tryDifferentSearch : t.transactions.withdrawalHistoryHere}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2733]">
            {filteredWithdrawals.map((withdrawal) => (
              <div key={withdrawal.id}>
                {/* Desktop Row */}
                <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-4 hover:bg-[#0a0e14]/50 transition-colors">
                  <span className="text-[#6b7a90] text-sm">{formatDate(withdrawal.date)}</span>
                  <span className="text-white font-mono text-sm">{withdrawal.reference}</span>
                  <span className="text-white text-sm">{withdrawal.method}</span>
                  <div className="text-right">
                    <p className="text-white font-medium">{formatCurrency(withdrawal.amount)}</p>
                    {withdrawal.fee > 0 && (
                      <p className="text-xs text-[#6b7a90]">{t.transactions.fee}: {formatCurrency(withdrawal.fee)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                        withdrawal.status === 'approved' && 'bg-[#22c55e]/10 text-[#22c55e]',
                        withdrawal.status === 'pending' && 'bg-[#f59e0b]/10 text-[#f59e0b]',
                        withdrawal.status === 'declined' && 'bg-[#ef4444]/10 text-[#ef4444]'
                      )}
                    >
                      {withdrawal.status === 'approved' ? t.transactions.approved : 
                       withdrawal.status === 'pending' ? t.transactions.pending : 
                       t.transactions.declined}
                    </span>
                  </div>
                </div>
                {/* Mobile Card */}
                <div className="md:hidden p-4 hover:bg-[#0a0e14]/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{withdrawal.method}</p>
                      <p className="text-xs text-[#6b7a90] font-mono">{withdrawal.reference}</p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                        withdrawal.status === 'approved' && 'bg-[#22c55e]/10 text-[#22c55e]',
                        withdrawal.status === 'pending' && 'bg-[#f59e0b]/10 text-[#f59e0b]',
                        withdrawal.status === 'declined' && 'bg-[#ef4444]/10 text-[#ef4444]'
                      )}
                    >
                      {withdrawal.status === 'approved' ? t.transactions.approved : 
                       withdrawal.status === 'pending' ? t.transactions.pending : 
                       t.transactions.declined}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6b7a90]">{formatDate(withdrawal.date)}</span>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatCurrency(withdrawal.amount)}</p>
                      {withdrawal.fee > 0 && (
                        <p className="text-xs text-[#6b7a90]">{t.transactions.fee}: {formatCurrency(withdrawal.fee)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
            >
              {/* Method Selection */}
              {modalView === 'method' && (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                    <h3 className="text-lg font-semibold text-white">{t.transactions.withdrawFunds}</h3>
                    <button onClick={handleCloseModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-[#6b7a90] mb-4">{t.transactions.selectWithdrawMethod}</p>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleMethodSelect('crypto')}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-xl border transition-colors',
                          selectedMethod === 'crypto'
                            ? 'border-[#22c55e] bg-[#22c55e]/5'
                            : 'border-[#1e2733] hover:border-[#3b82f6]'
                        )}
                      >
                        <div className="h-12 w-12 rounded-full bg-[#f59e0b]/10 flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-[#f59e0b]" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-white font-medium">{t.transactions.cryptocurrency}</p>
                          <p className="text-sm text-[#6b7a90]">{t.transactions.withdrawToWallet}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleMethodSelect('bank')}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-xl border transition-colors',
                          selectedMethod === 'bank'
                            ? 'border-[#22c55e] bg-[#22c55e]/5'
                            : 'border-[#1e2733] hover:border-[#3b82f6]'
                        )}
                      >
                        <div className="h-12 w-12 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-[#3b82f6]" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-white font-medium">{t.transactions.bankTransfer}</p>
                          <p className="text-sm text-[#6b7a90]">{t.transactions.convertToFiat}</p>
                        </div>
                      </button>
                    </div>
                    <button
                      onClick={handleContinueFromMethod}
                      disabled={!selectedMethod}
                      className={cn(
                        'w-full mt-6 py-4 rounded-xl font-semibold transition-colors',
                        selectedMethod
                          ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                          : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                      )}
                    >
                      {t.transactions.continue}
                    </button>
                  </div>
                </>
              )}

              {/* Crypto Token Select */}
              {modalView === 'crypto-token-select' && (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                    <button
                      onClick={() => setModalView('method')}
                      className="flex items-center gap-2 text-[#6b7a90] hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t.transactions.selectTokenTitle}
                    </button>
                    <button onClick={handleCloseModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-[#6b7a90] mb-3">{t.transactions.chooseTokenFromHoldings}</p>
                    
                    {/* Search */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
                      <input
                        type="text"
                        value={tokenSearchQuery}
                        onChange={(e) => setTokenSearchQuery(e.target.value)}
                        placeholder={t.transactions.searchTokens}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>

                    {/* Token List */}
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {filteredHoldings.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-[#6b7a90]">{t.transactions.noTokensFound}</p>
                        </div>
                      ) : (
                        filteredHoldings.map((holding) => (
                          <button
                            key={holding.id}
                            onClick={() => handleTokenSelect(holding)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-xl border transition-colors',
                              selectedToken?.id === holding.id
                                ? 'border-[#22c55e] bg-[#22c55e]/5'
                                : 'border-[#1e2733] hover:border-[#3b82f6]'
                            )}
                          >
                            <div className="h-10 w-10 rounded-full bg-[#1e2733] flex items-center justify-center overflow-hidden">
                              {holding.icon ? (
                                <Image src={holding.icon} alt={holding.symbol} width={32} height={32} className="object-cover" />
                              ) : (
                                <span className="text-sm font-bold text-white">{holding.symbol.slice(0, 2)}</span>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-white font-medium">{holding.symbol}</p>
                              <p className="text-xs text-[#6b7a90]">{holding.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-medium">{formatCryptoAmount(holding.amount)}</p>
                              <p className="text-xs text-[#6b7a90]">{formatCurrency(holding.amountUsd)}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <button
                      onClick={handleContinueFromTokenSelect}
                      disabled={!selectedToken}
                      className={cn(
                        'w-full mt-4 py-4 rounded-xl font-semibold transition-colors',
                        selectedToken
                          ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                          : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                      )}
                    >
                      {t.transactions.continue}
                    </button>
                  </div>
                </>
              )}

              {/* Crypto Details (Network & Address) */}
              {modalView === 'crypto-details' && (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                    <button
                      onClick={() => setModalView('crypto-token-select')}
                      className="flex items-center gap-2 text-[#6b7a90] hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t.transactions.walletDetails}
                    </button>
                    <button onClick={handleCloseModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Selected Token Display */}
                    {selectedToken && (
                      <div className="flex items-center gap-3 p-3 bg-[#0a0e14] rounded-xl border border-[#1e2733]">
                        <div className="h-10 w-10 rounded-full bg-[#1e2733] flex items-center justify-center overflow-hidden">
                          {selectedToken.icon ? (
                            <Image src={selectedToken.icon} alt={selectedToken.symbol} width={32} height={32} className="object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-white">{selectedToken.symbol.slice(0, 2)}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{selectedToken.symbol}</p>
                          <p className="text-xs text-[#6b7a90]">{t.transactions.available}: {formatCurrency(selectedToken.amountUsd)}</p>
                        </div>
                      </div>
                    )}

                    {/* Network Select */}
                    <div>
                      <label className="block text-sm text-[#6b7a90] mb-2">{t.transactions.network}</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                        >
                          <span className={selectedNetwork ? 'text-white' : 'text-[#6b7a90]'}>
                            {selectedNetwork || t.transactions.selectNetwork}
                          </span>
                          <ChevronDown className="h-4 w-4 text-[#6b7a90]" />
                        </button>
                        <AnimatePresence>
                          {showNetworkDropdown && selectedToken && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              className="absolute left-0 right-0 mt-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg shadow-xl z-30 overflow-hidden"
                            >
                              {selectedToken.networks.map((network) => (
                                <button
                                  key={network}
                                  onClick={() => {
                                    setSelectedNetwork(network);
                                    setShowNetworkDropdown(false);
                                  }}
                                  className={cn(
                                    'w-full px-4 py-3 text-left hover:bg-[#1e2733] transition-colors',
                                    selectedNetwork === network ? 'text-[#22c55e]' : 'text-white'
                                  )}
                                >
                                  {network}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Wallet Address */}
                    <div>
                      <label className="block text-sm text-[#6b7a90] mb-2">{t.transactions.walletAddress}</label>
                      <input
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder={t.transactions.enterWalletAddress}
                        className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white font-mono text-sm focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-3 p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl">
                      <AlertCircle className="h-5 w-5 text-[#f59e0b] shrink-0 mt-0.5" />
                      <p className="text-xs text-[#f59e0b]">
                        {t.transactions.walletWarning}
                      </p>
                    </div>

                    <button
                      onClick={() => isCryptoDetailsComplete && setModalView('confirmation')}
                      disabled={!isCryptoDetailsComplete}
                      className={cn(
                        'w-full py-4 rounded-xl font-semibold transition-colors',
                        isCryptoDetailsComplete
                          ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                          : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                      )}
                    >
                      {t.transactions.continue}
                    </button>
                  </div>
                </>
              )}

              {/* Bank Details */}
              {modalView === 'bank-details' && (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                    <button
                      onClick={() => setModalView('method')}
                      className="flex items-center gap-2 text-[#6b7a90] hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t.transactions.bankDetails}
                    </button>
                    <button onClick={handleCloseModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                    <div>
                      <label className="block text-sm text-[#6b7a90] mb-2">{t.transactions.bankName} *</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder={t.transactions.enterBankName}
                        className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#6b7a90] mb-2">{t.transactions.accountHolderName} *</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder={t.transactions.enterAccountHolderName}
                        className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#6b7a90] mb-2">{t.transactions.accountNumber} *</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder={t.transactions.enterAccountNumber}
                        className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#6b7a90] mb-2">{t.transactions.routingNumber}</label>
                        <input
                          type="text"
                          value={routingNumber}
                          onChange={(e) => setRoutingNumber(e.target.value)}
                          placeholder={t.transactions.optional}
                          className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6b7a90] mb-2">{t.transactions.swiftCode}</label>
                        <input
                          type="text"
                          value={swiftCode}
                          onChange={(e) => setSwiftCode(e.target.value)}
                          placeholder={t.transactions.optional}
                          className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[#6b7a90] mb-2">{t.transactions.bankCountry}</label>
                      <input
                        type="text"
                        value={bankCountry}
                        onChange={(e) => setBankCountry(e.target.value)}
                        placeholder={t.transactions.enterCountry}
                        className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                    <button
                      onClick={handleContinueFromBankDetails}
                      disabled={!isBankDetailsComplete}
                      className={cn(
                        'w-full py-4 rounded-xl font-semibold transition-colors',
                        isBankDetailsComplete
                          ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                          : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                      )}
                    >
                      {t.transactions.continueToTokenSelection}
                    </button>
                  </div>
                </>
              )}

              {/* Bank Token Select */}
              {modalView === 'bank-token-select' && (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                    <button
                      onClick={() => setModalView('bank-details')}
                      className="flex items-center gap-2 text-[#6b7a90] hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t.transactions.selectTokenToSell}
                    </button>
                    <button onClick={handleCloseModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-[#6b7a90] mb-3">{t.transactions.selectTokenToConvert}</p>
                    
                    {/* Search */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
                      <input
                        type="text"
                        value={tokenSearchQuery}
                        onChange={(e) => setTokenSearchQuery(e.target.value)}
                        placeholder={t.transactions.searchTokens}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>

                    {/* Token List */}
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {filteredHoldings.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-[#6b7a90]">{t.transactions.noTokensFound}</p>
                        </div>
                      ) : (
                        filteredHoldings.map((holding) => (
                          <button
                            key={holding.id}
                            onClick={() => handleTokenSelect(holding)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-xl border transition-colors',
                              selectedToken?.id === holding.id
                                ? 'border-[#22c55e] bg-[#22c55e]/5'
                                : 'border-[#1e2733] hover:border-[#3b82f6]'
                            )}
                          >
                            <div className="h-10 w-10 rounded-full bg-[#1e2733] flex items-center justify-center overflow-hidden">
                              {holding.icon ? (
                                <Image src={holding.icon} alt={holding.symbol} width={32} height={32} className="object-cover" />
                              ) : (
                                <span className="text-sm font-bold text-white">{holding.symbol.slice(0, 2)}</span>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-white font-medium">{holding.symbol}</p>
                              <p className="text-xs text-[#6b7a90]">{holding.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-medium">{formatCryptoAmount(holding.amount)}</p>
                              <p className="text-xs text-[#6b7a90]">{formatCurrency(holding.amountUsd)}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <button
                      onClick={handleContinueFromTokenSelect}
                      disabled={!selectedToken}
                      className={cn(
                        'w-full mt-4 py-4 rounded-xl font-semibold transition-colors',
                        selectedToken
                          ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                          : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                      )}
                    >
                      {t.transactions.continueToAmount}
                    </button>
                  </div>
                </>
              )}

              {/* Confirmation */}
              {modalView === 'confirmation' && (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                    <button
                      onClick={() => setModalView(getBackView())}
                      className="flex items-center gap-2 text-[#6b7a90] hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t.transactions.confirmWithdrawal}
                    </button>
                    <button onClick={handleCloseModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    {/* Selected Token Info */}
                    {selectedToken && (
                      <div className="flex items-center gap-3 p-3 bg-[#0a0e14] rounded-xl border border-[#1e2733] mb-4">
                        <div className="h-10 w-10 rounded-full bg-[#1e2733] flex items-center justify-center overflow-hidden">
                          {selectedToken.icon ? (
                            <Image src={selectedToken.icon} alt={selectedToken.symbol} width={32} height={32} className="object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-white">{selectedToken.symbol.slice(0, 2)}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{selectedToken.symbol}</p>
                          <p className="text-xs text-[#6b7a90]">{t.transactions.max}: {formatCurrency(selectedToken.amountUsd)}</p>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-[#6b7a90] mb-2">{t.transactions.amountUsd}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0"
                        className="flex-1 px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-lg focus:outline-none focus:border-[#22c55e]"
                      />
                      <button
                        onClick={() => selectedToken && setWithdrawAmount(selectedToken.amountUsd.toString())}
                        className="px-4 py-3 bg-[#1e2733] rounded-lg text-[#22c55e] font-medium hover:bg-[#22c55e]/10 transition-colors"
                      >
                        {t.transactions.max}
                      </button>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6b7a90]">{t.transactions.maximumAvailable}</span>
                        <span className="text-white">{formatCurrency(getMaxAmount())}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6b7a90]">{t.transactions.minimumWithdrawal}</span>
                        <span className="text-white">{formatCurrency(settings.minimumWithdrawal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6b7a90]">{t.transactions.dailyLimitRemaining}</span>
                        <span className="text-white">{formatCurrency(settings.dailyRemaining)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6b7a90]">{t.transactions.processingFee} ({selectedMethod === 'crypto' ? '1%' : '2%'})</span>
                        <span className="text-white">
                          {withdrawAmount ? formatCurrency(calculateFee(parseFloat(withdrawAmount))) : '$0.00'}
                        </span>
                      </div>
                    </div>

                    {/* KYC Verification Notice - Only show when KYC required and user is unverified */}
                    {settings.requireKycForWithdrawal && !settings.isVerified && (
                      <div className="flex items-center gap-3 p-4 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl mb-4">
                        <Info className="h-5 w-5 text-[#3b82f6] shrink-0" />
                        <div>
                          <p className="text-sm text-[#3b82f6] font-medium">{t.transactions.verifyToIncreaseLimits}</p>
                          <p className="text-xs text-[#6b7a90] mt-1">{t.transactions.verifyInstructions}</p>
                        </div>
                      </div>
                    )}

                    {/* Withdrawal Details Summary */}
                    <div className="p-4 bg-[#0a0e14] rounded-xl border border-[#1e2733] mb-6">
                      <p className="text-sm text-[#6b7a90] mb-2">{t.transactions.withdrawalTo}</p>
                      {selectedMethod === 'bank' ? (
                        <div className="text-white">
                          <p className="font-medium">{bankName}</p>
                          <p className="text-sm text-[#6b7a90]">{accountName} - ****{accountNumber.slice(-4)}</p>
                          {bankCountry && <p className="text-xs text-[#6b7a90]">{bankCountry}</p>}
                        </div>
                      ) : (
                        <div className="text-white">
                          <p className="font-medium">{selectedToken?.symbol} ({selectedNetwork})</p>
                          <p className="text-sm text-[#6b7a90] font-mono truncate">{walletAddress}</p>
                        </div>
                      )}
                    </div>

                    {/* Validation Warnings */}
                    {withdrawAmount && parseFloat(withdrawAmount) > getMaxAmount() && (
                      <div className="flex items-center gap-3 p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl mb-4">
                        <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0" />
                        <p className="text-sm text-[#ef4444]">{t.transactions.amountExceedsBalance} {selectedToken?.symbol}</p>
                      </div>
                    )}

                    {withdrawAmount && parseFloat(withdrawAmount) < settings.minimumWithdrawal && parseFloat(withdrawAmount) > 0 && (
                      <div className="flex items-center gap-3 p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl mb-4">
                        <AlertCircle className="h-5 w-5 text-[#f59e0b] shrink-0" />
                        <p className="text-sm text-[#f59e0b]">{t.transactions.minimumWithdrawalError} {formatCurrency(settings.minimumWithdrawal)}</p>
                      </div>
                    )}

                    <div className="flex justify-between text-sm mb-6">
                      <span className="text-[#6b7a90]">{t.transactions.youWillReceive}</span>
                      <span className="text-white font-semibold text-lg">
                        {withdrawAmount && parseFloat(withdrawAmount) >= settings.minimumWithdrawal
                          ? formatCurrency(parseFloat(withdrawAmount) - calculateFee(parseFloat(withdrawAmount))) 
                          : '$0.00'}
                      </span>
                    </div>

                    <button
                      onClick={handleSubmitWithdrawal}
                      disabled={!isAmountValid}
                      className={cn(
                        'w-full py-4 rounded-xl font-semibold transition-colors',
                        isAmountValid
                          ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                          : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                      )}
                    >
                      {t.transactions.confirmWithdrawal}
                    </button>
                  </div>
                </>
              )}

              {/* Processing */}
              {modalView === 'processing' && (
                <div className="p-8 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="mx-auto mb-6"
                  >
                    <Loader2 className="h-16 w-16 text-[#22c55e]" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">{t.transactions.processingWithdrawal}</h3>
                  <p className="text-[#6b7a90]">
                    {t.transactions.processingWithdrawalMessage}
                  </p>
                </div>
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
                  <h3 className="text-xl font-semibold text-white mb-2">{t.transactions.withdrawalSubmitted}</h3>
                  <p className="text-[#6b7a90] mb-6">
                    {t.transactions.withdrawalSubmittedMessage}
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
