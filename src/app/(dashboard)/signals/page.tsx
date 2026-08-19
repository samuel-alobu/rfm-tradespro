'use client';

import React, { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Wifi,
  Radio,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Calendar,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { useLanguage, TranslationKeys } from '@/lib/i18n';

// ============================================
// Signals Page - Trading Signal Packages
// ============================================

interface Signal {
  _id: string;
  title: string;
  price: number;
  strength: number;
  amount: number;
  durationDays: number;
  isActive: boolean;
}

interface SignalPurchase {
  _id: string;
  signalId: string;
  signalName: string;
  signalPrice: number;
  signalStrength: number;
  amount: number;
  status: 'active' | 'completed' | 'expired';
  purchasedAt: string;
  expiresAt?: string;
}

interface Holding {
  _id: string;
  symbol: string;
  name: string;
  amount: number;
  amountUsd: number;
  price: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

type TabType = 'signals' | 'history' | 'how';

// Toast Container
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

// Signal Strength Bar Component - FIXED: unfilled bars are dark gray, not red
function SignalStrengthBar({ strength, size = 'default' }: { strength: number; size?: 'default' | 'large' }) {
  const totalBars = 20;
  const filledBars = Math.round((strength / 100) * totalBars);
  const isLow = strength < 50;
  const barWidth = size === 'large' ? 'w-2.5' : 'w-1.5';
  const barHeight = size === 'large' ? 'h-5' : 'h-4';

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: totalBars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            barWidth,
            barHeight,
            'rounded-sm',
            i < filledBars
              ? isLow ? 'bg-[#ef4444]' : 'bg-[#22c55e]'
              : 'bg-[#1e2733]'
          )}
        />
      ))}
    </div>
  );
}

export default function SignalsPage() {
  // Translation hook
  const { t } = useLanguage();
  
  const toastId = useId();
  const [activeTab, setActiveTab] = useState<TabType>('signals');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(1);
  const [showBalance, setShowBalance] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [signals, setSignals] = useState<Signal[]>([]);
  const [purchases, setPurchases] = useState<SignalPurchase[]>([]);
  const [signalBalance, setSignalBalance] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [currentSignalStrength, setCurrentSignalStrength] = useState(0);
  const [activeSignalName, setActiveSignalName] = useState<string | null>(null);

  // Signal amounts state
  const [signalAmounts, setSignalAmounts] = useState<Record<string, string>>({});

  // Processing states
  const [processingSignal, setProcessingSignal] = useState<string | null>(null);

  // Modal states
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Holding | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [depositInputMode, setDepositInputMode] = useState<'token' | 'usd'>('usd');
  const [withdrawInputMode, setWithdrawInputMode] = useState<'token' | 'usd'>('usd');

  const tabs = [
    { id: 'signals' as const, label: t.signals.signalsTab },
    { id: 'history' as const, label: t.signals.yourHistory, count: purchases.length },
    { id: 'how' as const, label: t.signals.howItWorks },
  ];

  const addToast = (type: Toast['type'], message: string) => {
    const id = `${toastId}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch data
  const fetchData = async () => {
    try {
      // Fetch signals
      const signalsRes = await fetch('/api/signals');
      const signalsData = await signalsRes.json();
      if (signalsRes.ok && signalsData.signals) {
        setSignals(signalsData.signals);
        const amounts: Record<string, string> = {};
        signalsData.signals.forEach((s: Signal) => {
          amounts[s._id] = s.amount.toString();
        });
        setSignalAmounts(amounts);
      }

      // Fetch signal balance and holdings
      const balanceRes = await fetch('/api/user/signals');
      const balanceData = await balanceRes.json();
      if (balanceRes.ok) {
        setSignalBalance(balanceData.signalBalance || 0);
        setHoldings(balanceData.holdings || []);
        setPurchases(balanceData.purchases || []);
        setCurrentSignalStrength(balanceData.currentSignalStrength || 0);
        setActiveSignalName(balanceData.activeSignalName || null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAmountChange = (signalId: string, value: string) => {
    setSignalAmounts((prev) => ({ ...prev, [signalId]: value }));
  };

  // Handle deposit from holdings to signal balance
  const handleDeposit = async () => {
    if (!selectedToken || !transferAmount) return;

    const inputAmount = parseFloat(transferAmount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      addToast('error', t.signals.enterValidAmount);
      return;
    }

    const tokenAmount = depositInputMode === 'usd'
      ? inputAmount / selectedToken.price
      : inputAmount;

    if (tokenAmount > selectedToken.amount) {
      addToast('error', t.signals.insufficientTokenBalance);
      return;
    }

    setIsProcessingTransfer(true);

    try {
      const res = await fetch('/api/user/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deposit',
          symbol: selectedToken.symbol,
          amount: tokenAmount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const usdValue = tokenAmount * selectedToken.price;
        addToast('success', t.signals.depositedSuccess.replace('{amount}', formatCurrency(usdValue)).replace('{token}', selectedToken.symbol));
        setDepositModalOpen(false);
        setSelectedToken(null);
        setTransferAmount('');
        setDepositInputMode('usd');
        // Use API response data for immediate update
        if (data.signalBalance !== undefined) {
          setSignalBalance(data.signalBalance);
        }
        // Update holdings by removing deposited amount
        setHoldings((prev) => 
          prev.map((h) => 
            h.symbol === selectedToken.symbol 
              ? { ...h, amount: h.amount - tokenAmount, amountUsd: (h.amount - tokenAmount) * h.price }
              : h
          ).filter((h) => h.amount > 0)
        );
      } else {
        addToast('error', data.error || t.signals.failedToDeposit);
      }
    } catch {
      addToast('error', t.signals.failedToDeposit);
    } finally {
      setIsProcessingTransfer(false);
    }
  };

  // Handle withdraw from signal balance to holdings
  const handleWithdraw = async () => {
    if (!selectedToken || !transferAmount) return;

    const inputAmount = parseFloat(transferAmount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      addToast('error', t.signals.enterValidAmount);
      return;
    }

    // Calculate token amount based on input mode
    const tokenAmount = withdrawInputMode === 'usd'
      ? inputAmount / selectedToken.price
      : inputAmount;
    
    const amountUsd = withdrawInputMode === 'usd'
      ? inputAmount
      : inputAmount * selectedToken.price;

    if (amountUsd > signalBalance) {
      addToast('error', t.signals.insufficientSignalBalance);
      return;
    }

    setIsProcessingTransfer(true);

    try {
      const res = await fetch('/api/user/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'withdraw',
          symbol: selectedToken.symbol,
          amount: tokenAmount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast('success', t.signals.withdrawnSuccess.replace('{amount}', formatCurrency(amountUsd)).replace('{token}', selectedToken.symbol));
        setWithdrawModalOpen(false);
        setSelectedToken(null);
        setTransferAmount('');
        setWithdrawInputMode('usd');
        // Use API response data for immediate update
        if (data.signalBalance !== undefined) {
          setSignalBalance(data.signalBalance);
        }
        // Update holdings by adding withdrawn amount
        setHoldings((prev) => {
          const existing = prev.find((h) => h.symbol === selectedToken.symbol);
          if (existing) {
            return prev.map((h) =>
              h.symbol === selectedToken.symbol
                ? { ...h, amount: h.amount + tokenAmount, amountUsd: (h.amount + tokenAmount) * h.price }
                : h
            );
          }
          return [...prev, {
            _id: selectedToken.symbol,
            symbol: selectedToken.symbol,
            name: selectedToken.symbol,
            amount: tokenAmount,
            amountUsd,
            price: selectedToken.price,
          }];
        });
      } else {
        addToast('error', data.error || t.signals.failedToWithdraw);
      }
    } catch {
      addToast('error', t.signals.failedToWithdraw);
    } finally {
      setIsProcessingTransfer(false);
    }
  };

  // Handle signal purchase
  const handlePurchase = async (signal: Signal) => {
    const amount = parseFloat(signalAmounts[signal._id] || '0');

    if (amount < signal.amount) {
      addToast('error', t.signals.minAmountSignal.replace('{amount}', formatCurrency(signal.amount)));
      return;
    }

    if (amount > signalBalance) {
      addToast('error', t.signals.depositFundsFirst);
      return;
    }

    setProcessingSignal(signal._id);

    try {
      const res = await fetch('/api/user/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          signalId: signal._id,
          amount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast('success', t.signals.purchasedSuccess.replace('{signal}', signal.title));
        // Use API response data for immediate update
        if (data.signalBalance !== undefined) {
          setSignalBalance(data.signalBalance);
        }
        if (data.currentSignalStrength !== undefined) {
          setCurrentSignalStrength(data.currentSignalStrength);
        }
        if (data.activeSignalName) {
          setActiveSignalName(data.activeSignalName);
        }
        // Add the new purchase to purchases list
        if (data.purchase) {
          setPurchases((prev) => [data.purchase, ...prev]);
        }
      } else {
        addToast('error', data.error || t.signals.failedToPurchase);
      }
    } catch {
      addToast('error', t.signals.failedToPurchase);
    } finally {
      setProcessingSignal(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#22c55e]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Two-Card Header - Matching Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card: Signal Balance */}
        <div className="bg-[#0f1419] rounded-xl p-4 sm:p-6 border border-[#1e2733]">
          <div className="flex flex-col gap-4">
            {/* Balance Row */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#6b7a90] text-sm">{t.signals.signalBalance}</span>
                  <button onClick={() => setShowBalance(!showBalance)} className="text-[#6b7a90] hover:text-white">
                    {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {showBalance ? formatCurrency(signalBalance) : '••••••'}
                </p>
              </div>
              {/* Desktop buttons */}
              <div className="hidden sm:flex items-center gap-2">
                {signalBalance > 0 && (
                  <button
                    onClick={() => {
                      setSelectedToken(null);
                      setTransferAmount('');
                      setWithdrawInputMode('usd');
                      setWithdrawModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#2a3441] text-white text-sm font-medium hover:bg-[#1a2332] transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    {t.signals.withdraw}
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedToken(null);
                    setTransferAmount('');
                    setDepositInputMode('usd');
                    setDepositModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#2a3441] text-white text-sm font-medium hover:bg-[#1a2332] transition-colors"
                >
                  <Wallet className="h-4 w-4" />
                  {t.signals.deposit}
                </button>
              </div>
            </div>
            {/* Mobile buttons */}
            <div className="flex sm:hidden items-center gap-2">
              {signalBalance > 0 && (
                <button
                  onClick={() => {
                    setSelectedToken(null);
                    setTransferAmount('');
                    setWithdrawInputMode('usd');
                    setWithdrawModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#2a3441] text-white text-sm font-medium hover:bg-[#1a2332] transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {t.signals.withdraw}
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedToken(null);
                  setTransferAmount('');
                  setDepositInputMode('usd');
                  setDepositModalOpen(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#2a3441] text-white text-sm font-medium hover:bg-[#1a2332] transition-colors"
              >
                <Wallet className="h-4 w-4" />
                {t.signals.deposit}
              </button>
            </div>
          </div>
        </div>

        {/* Right Card: Signal Strength & Active Signal */}
        <div className="bg-[#0f1419] rounded-xl p-4 sm:p-6 border border-[#1e2733]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#6b7a90] text-sm">{t.signals.signalStrength}</span>
            <span className={cn(
              'text-lg font-bold',
              currentSignalStrength < 50 ? 'text-[#ef4444]' : 'text-[#22c55e]'
            )}>
              {currentSignalStrength}%
            </span>
          </div>
          <SignalStrengthBar strength={currentSignalStrength} size="large" />
          {activeSignalName && (
            <p className="text-[#6b7a90] text-sm mt-4">
              {t.signals.yourActiveSignal} <span className="text-white font-medium">{activeSignalName}</span>
            </p>
          )}
          {!activeSignalName && (
            <p className="text-[#6b7a90] text-sm mt-4">{t.signals.noActiveSignal}</p>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#1e2733] -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative pb-4 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
                activeTab === tab.id ? 'text-white' : 'text-[#6b7a90] hover:text-white'
              )}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs',
                      activeTab === tab.id
                        ? 'bg-[#22c55e] text-white'
                        : 'bg-[#1e2733] text-[#6b7a90]'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Signals Tab */}
      {activeTab === 'signals' && (
        <div>
          <h2 className="font-heading font-semibold text-white text-lg mb-6">{t.signals.signalsHeading}</h2>

          {signals.length === 0 ? (
            <div className="text-center py-12 bg-[#0f1419] rounded-xl border border-[#1e2733]">
              <Radio className="h-12 w-12 text-[#1e2733] mx-auto mb-3" />
              <p className="text-[#6b7a90]">{t.signals.noSignalsAvailable}</p>
              <p className="text-xs text-[#6b7a90] mt-1">{t.signals.checkBackLater}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {signals.map((signal) => (
                <SignalCard
                  key={signal._id}
                  signal={signal}
                  amount={signalAmounts[signal._id] || signal.amount.toString()}
                  onAmountChange={(value) => handleAmountChange(signal._id, value)}
                  onPurchase={() => handlePurchase(signal)}
                  isProcessing={processingSignal === signal._id}
                  currentBalance={signalBalance}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h2 className="font-heading font-semibold text-white text-lg mb-6">{t.signals.purchaseHistory}</h2>

          {purchases.length === 0 ? (
            <div className="text-center py-12 bg-[#0f1419] rounded-xl border border-[#1e2733]">
              <Radio className="h-12 w-12 text-[#1e2733] mx-auto mb-3" />
              <p className="text-[#6b7a90]">{t.signals.noPurchasesYet}</p>
              <p className="text-xs text-[#6b7a90] mt-1">{t.signals.purchaseToStart}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {purchases.map((purchase) => (
                <PurchasedSignalCard key={purchase._id} purchase={purchase} t={t} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* How it Works Tab */}
      {activeTab === 'how' && (
        <div>
          <h2 className="font-heading font-semibold text-white text-lg mb-6">{t.signals.howItWorks}</h2>
          <div className="space-y-3 max-w-3xl">
            {[
              { id: 1, question: t.signals.faq1Question, answer: t.signals.faq1Answer },
              { id: 2, question: t.signals.faq2Question, answer: t.signals.faq2Answer },
              { id: 3, question: t.signals.faq3Question, answer: t.signals.faq3Answer },
              { id: 4, question: t.signals.faq4Question, answer: t.signals.faq4Answer },
              { id: 5, question: t.signals.faq5Question, answer: t.signals.faq5Answer },
              { id: 6, question: t.signals.faq6Question, answer: t.signals.faq6Answer },
            ].map((item) => (
              <div
                key={item.id}
                className="border border-[#1e2733] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#0c1320] transition-colors"
                >
                  <span
                    className={cn(
                      'flex items-center justify-center h-6 w-6 rounded text-xs font-semibold',
                      expandedFaq === item.id
                        ? 'bg-[#22c55e] text-white'
                        : 'bg-[#1a2332] text-[#6b7a90]'
                    )}
                  >
                    {item.id}
                  </span>
                  <span className="flex-1 text-white text-sm font-medium">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-[#6b7a90] transition-transform',
                      expandedFaq === item.id && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {expandedFaq === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pl-14">
                        <p className="text-[#8b9ab4] text-sm leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      <AnimatePresence>
        {depositModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setDepositModalOpen(false)}
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
                    <div className="h-10 w-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                      <ArrowDownLeft className="h-5 w-5 text-[#22c55e]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{t.signals.depositToSignals}</h3>
                      <p className="text-sm text-[#6b7a90]">{t.signals.transferFromHoldings}</p>
                    </div>
                  </div>
                  <button onClick={() => setDepositModalOpen(false)} className="text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {!selectedToken ? (
                  <>
                    <p className="text-sm text-[#6b7a90]">{t.signals.selectTokenDeposit}</p>
                    {holdings.length === 0 ? (
                      <div className="text-center py-8">
                        <Wallet className="h-10 w-10 text-[#6b7a90] mx-auto mb-3" />
                        <p className="text-[#6b7a90]">{t.signals.noTokensFound}</p>
                        <p className="text-xs text-[#6b7a90] mt-1">{t.signals.depositCryptoFirst}</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {holdings.map((holding) => (
                          <button
                            key={holding._id}
                            onClick={() => setSelectedToken(holding)}
                            className="w-full flex items-center justify-between p-4 bg-[#0a0e14] rounded-lg hover:bg-[#151c24] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-[#1a2332] flex items-center justify-center">
                                <span className="text-sm font-bold text-white">{holding.symbol.slice(0, 2)}</span>
                              </div>
                              <div className="text-left">
                                <p className="text-white font-medium">{holding.symbol}</p>
                                <p className="text-xs text-[#6b7a90]">{holding.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-medium">{holding.amount.toFixed(6)}</p>
                              <p className="text-xs text-[#6b7a90]">{formatCurrency(holding.amountUsd)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSelectedToken(null);
                        setTransferAmount('');
                      }}
                      className="flex items-center gap-2 text-[#6b7a90] hover:text-white text-sm"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
                      {t.signals.changeToken}
                    </button>

                    <div className="flex items-center gap-3 p-4 bg-[#0a0e14] rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-[#1a2332] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{selectedToken.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedToken.symbol}</p>
                        <p className="text-xs text-[#6b7a90]">{t.signals.balance}: {selectedToken.amount.toFixed(6)} ({formatCurrency(selectedToken.amountUsd)})</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-[#6b7a90]">
                          {t.signals.amount} ({depositInputMode === 'usd' ? 'USD' : selectedToken.symbol})
                        </label>
                        <div className="flex items-center bg-[#0a0e14] rounded-lg p-0.5">
                          <button
                            onClick={() => { setDepositInputMode('usd'); setTransferAmount(''); }}
                            className={cn(
                              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                              depositInputMode === 'usd' ? 'bg-[#22c55e] text-white' : 'text-[#6b7a90] hover:text-white'
                            )}
                          >
                            USD
                          </button>
                          <button
                            onClick={() => { setDepositInputMode('token'); setTransferAmount(''); }}
                            className={cn(
                              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                              depositInputMode === 'token' ? 'bg-[#22c55e] text-white' : 'text-[#6b7a90] hover:text-white'
                            )}
                          >
                            {selectedToken.symbol}
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          placeholder="0.00"
                          step={depositInputMode === 'usd' ? '0.01' : '0.000001'}
                          className="w-full px-4 py-3 pr-20 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                        />
                        <button
                          onClick={() => {
                            if (depositInputMode === 'usd') {
                              setTransferAmount(selectedToken.amountUsd.toFixed(2));
                            } else {
                              setTransferAmount(selectedToken.amount.toString());
                            }
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-[#1a2332] text-[#22c55e] rounded hover:bg-[#22c55e] hover:text-white transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                      {transferAmount && parseFloat(transferAmount) > 0 && (
                        <p className="text-xs text-[#6b7a90] mt-2">
                          {depositInputMode === 'usd' ? (
                            <>≈ {(parseFloat(transferAmount) / selectedToken.price).toFixed(6)} {selectedToken.symbol}</>
                          ) : (
                            <>≈ {formatCurrency(parseFloat(transferAmount) * selectedToken.price)}</>
                          )}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleDeposit}
                      disabled={isProcessingTransfer || !transferAmount || parseFloat(transferAmount) <= 0}
                      className="w-full py-3 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#1ea550] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessingTransfer ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t.common.processing}
                        </>
                      ) : (
                        t.signals.deposit
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {withdrawModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setWithdrawModalOpen(false)}
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
                    <div className="h-10 w-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                      <ArrowUpRight className="h-5 w-5 text-[#22c55e]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{t.signals.withdrawFromSignals}</h3>
                      <p className="text-sm text-[#6b7a90]">{t.signals.transferToHoldings}</p>
                    </div>
                  </div>
                  <button onClick={() => setWithdrawModalOpen(false)} className="text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="p-4 bg-[#0a0e14] rounded-lg">
                  <p className="text-sm text-[#6b7a90]">{t.signals.availableToWithdraw}</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(signalBalance)}</p>
                </div>

                {!selectedToken ? (
                  <>
                    <p className="text-sm text-[#6b7a90]">{t.signals.selectTokenReceive}</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {['BTC', 'ETH', 'USDT', 'USDC'].map((symbol) => (
                        <button
                          key={symbol}
                          onClick={() => setSelectedToken({
                            _id: symbol,
                            symbol,
                            name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : symbol,
                            amount: 0,
                            amountUsd: 0,
                            price: symbol === 'BTC' ? 67234.5 : symbol === 'ETH' ? 3456.78 : 1,
                          })}
                          className="w-full flex items-center gap-3 p-4 bg-[#0a0e14] rounded-lg hover:bg-[#151c24] transition-colors"
                        >
                          <div className="h-10 w-10 rounded-full bg-[#1a2332] flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{symbol.slice(0, 2)}</span>
                          </div>
                          <span className="text-white font-medium">{symbol}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setSelectedToken(null); setTransferAmount(''); }}
                      className="flex items-center gap-2 text-[#6b7a90] hover:text-white text-sm"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
                      {t.signals.changeToken}
                    </button>

                    <div className="flex items-center gap-3 p-4 bg-[#0a0e14] rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-[#1a2332] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{selectedToken.symbol.slice(0, 2)}</span>
                      </div>
                      <p className="text-white font-medium">{selectedToken.symbol}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-[#6b7a90]">
                          {t.signals.amount} ({withdrawInputMode === 'usd' ? 'USD' : selectedToken.symbol})
                        </label>
                        <div className="flex items-center bg-[#0a0e14] rounded-lg p-0.5">
                          <button
                            onClick={() => { setWithdrawInputMode('usd'); setTransferAmount(''); }}
                            className={cn(
                              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                              withdrawInputMode === 'usd' ? 'bg-[#22c55e] text-white' : 'text-[#6b7a90] hover:text-white'
                            )}
                          >
                            USD
                          </button>
                          <button
                            onClick={() => { setWithdrawInputMode('token'); setTransferAmount(''); }}
                            className={cn(
                              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                              withdrawInputMode === 'token' ? 'bg-[#22c55e] text-white' : 'text-[#6b7a90] hover:text-white'
                            )}
                          >
                            {selectedToken.symbol}
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          placeholder="0.00"
                          step={withdrawInputMode === 'usd' ? '0.01' : '0.000001'}
                          className="w-full px-4 py-3 pr-20 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                        />
                        <button
                          onClick={() => {
                            if (withdrawInputMode === 'usd') {
                              setTransferAmount(signalBalance.toFixed(2));
                            } else {
                              setTransferAmount((signalBalance / selectedToken.price).toFixed(6));
                            }
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-[#1a2332] text-[#22c55e] rounded hover:bg-[#22c55e] hover:text-white transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                      {transferAmount && parseFloat(transferAmount) > 0 && (
                        <p className="text-xs text-[#6b7a90] mt-2">
                          {withdrawInputMode === 'usd' ? (
                            <>≈ {(parseFloat(transferAmount) / selectedToken.price).toFixed(6)} {selectedToken.symbol}</>
                          ) : (
                            <>≈ {formatCurrency(parseFloat(transferAmount) * selectedToken.price)}</>
                          )}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleWithdraw}
                      disabled={isProcessingTransfer || !transferAmount || parseFloat(transferAmount) <= 0}
                      className="w-full py-3 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#1ea550] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessingTransfer ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t.common.processing}
                        </>
                      ) : (
                        t.signals.withdraw
                      )}
                    </button>
                  </>
                )}
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

// ============================================
// Signal Card Component
// ============================================

interface SignalCardProps {
  signal: Signal;
  amount: string;
  onAmountChange: (value: string) => void;
  onPurchase: () => void;
  isProcessing: boolean;
  currentBalance: number;
  t: TranslationKeys;
}

function SignalCard({
  signal,
  amount,
  onAmountChange,
  onPurchase,
  isProcessing,
  currentBalance,
  t,
}: SignalCardProps) {
  const numAmount = parseFloat(amount) || 0;
  const hasBalance = currentBalance >= numAmount;
  const meetsMinimum = numAmount >= signal.amount;

  return (
    <div className="relative bg-[#0f1419] rounded-xl p-5 border border-[#1e2733]">
      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0f1419]/95 rounded-xl flex flex-col items-center justify-center z-10"
          >
            <div className="relative w-16 h-16 mb-4">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-[#1e2733] border-t-[#22c55e]"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-2 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-[#22c55e]" />
              </div>
            </div>
            <p className="text-white font-medium mb-1">{t.signals.processingPurchase}</p>
            <p className="text-[#6b7a90] text-sm">{t.signals.activatingSignal}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signal Name */}
      <h3 className="text-[#22c55e] font-semibold text-lg mb-5">{signal.title}</h3>

      {/* Signal Details */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between">
          <span className="text-[#6b7a90] text-sm">{t.signals.signalPrice}</span>
          <span className="text-white font-medium">{formatCurrency(signal.price)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6b7a90] text-sm">{t.signals.signalStrength}</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-medium',
              signal.strength < 50 ? 'text-[#ef4444]' : 'text-[#22c55e]'
            )}>{signal.strength}%</span>
            <SignalStrengthBar strength={signal.strength} />
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-[#6b7a90] text-sm mb-2">{t.signals.amount}</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="w-full px-4 py-3 pr-16 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
            placeholder={signal.amount.toString()}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7a90] text-sm font-medium bg-[#1a2332] px-2 py-1 rounded">
            USD
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#6b7a90]">{t.signals.currentBalance}</span>
          <span className="text-xs text-[#6b7a90]">{formatCurrency(currentBalance)}</span>
        </div>
      </div>

      {/* Purchase Button */}
      <button
        onClick={onPurchase}
        disabled={isProcessing || !meetsMinimum || !hasBalance}
        className={cn(
          'w-full py-3.5 rounded-lg font-medium transition-colors',
          meetsMinimum && hasBalance
            ? 'bg-[#22c55e] text-white hover:bg-[#1ea550]'
            : 'bg-[#1a2332] text-[#6b7a90] cursor-not-allowed'
        )}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.common.processing}
          </span>
        ) : (
          t.signals.purchase
        )}
      </button>
    </div>
  );
}

// ============================================
// Purchased Signal Card Component
// ============================================

interface PurchasedSignalCardProps {
  purchase: SignalPurchase;
  t: TranslationKeys;
}

function PurchasedSignalCard({ purchase, t }: PurchasedSignalCardProps) {
  const isExpired = purchase.expiresAt && new Date(purchase.expiresAt) < new Date();
  const status = isExpired ? 'expired' : purchase.status;

  const getStatusLabel = () => {
    switch (status) {
      case 'active': return t.signals.active;
      case 'completed': return t.signals.completed;
      default: return t.signals.expired;
    }
  };

  return (
    <div className="bg-[#0f1419] rounded-xl p-4 sm:p-5 border border-[#1e2733]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[#22c55e] font-semibold">{purchase.signalName}</h3>
          <p className="text-sm text-[#6b7a90]">
            {t.signals.purchased} {new Date(purchase.purchasedAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium',
            status === 'active'
              ? 'bg-[#22c55e]/10 text-[#22c55e]'
              : status === 'completed'
              ? 'bg-blue-500/10 text-blue-500'
              : 'bg-[#6b7a90]/10 text-[#6b7a90]'
          )}
        >
          {getStatusLabel()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 sm:p-4 bg-[#0a0e14] rounded-xl mb-4">
        <div>
          <p className="text-xs text-[#6b7a90] mb-0.5">{t.signals.signalPrice}</p>
          <p className="text-white font-semibold text-sm">{formatCurrency(purchase.signalPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7a90] mb-0.5">{t.signals.amountPaid}</p>
          <p className="text-white font-semibold text-sm">{formatCurrency(purchase.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7a90] mb-0.5">{t.signals.strength}</p>
          <p className={cn(
            'font-semibold text-sm',
            purchase.signalStrength >= 50 ? 'text-[#22c55e]' : 'text-[#ef4444]'
          )}>{purchase.signalStrength}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7a90] mb-0.5">{t.signals.expires}</p>
          <p className="text-white font-semibold text-sm flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {purchase.expiresAt
              ? new Date(purchase.expiresAt).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Signal Strength Bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6b7a90]">{t.signals.signalStrength}</span>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium',
            purchase.signalStrength < 50 ? 'text-[#ef4444]' : 'text-[#22c55e]'
          )}>{purchase.signalStrength}%</span>
          <SignalStrengthBar strength={purchase.signalStrength} />
        </div>
      </div>
    </div>
  );
}
