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
  TrendingUp,
  Clock,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { useLanguage, TranslationKeys } from '@/lib/i18n';

// ============================================
// Subscribe Page - Investment Plans with Deposit/Withdraw
// ============================================

// Interfaces
interface SubscriptionPlan {
  _id: string;
  name: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  durationDays: number;
  roiPercent: number;
  features?: string[];
  isActive: boolean;
}

interface UserSubscription {
  _id: string;
  planId: string;
  planName: string;
  amount: number;
  roiPercent: number;
  expectedReturn: number;
  currentReturn: number;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  completedAt?: string;
}

interface Holding {
  _id: string;
  symbol: string;
  name: string;
  icon: string;
  amount: number;
  amountUsd: number;
  price: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

type TabType = 'plans' | 'history' | 'how';

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

export default function SubscribePage() {
  // Translation hook
  const { t } = useLanguage();
  
  const toastIdPrefix = useId();
  const [activeTab, setActiveTab] = useState<TabType>('plans');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(1);
  const [showBalance, setShowBalance] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Data states
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [subscribeBalance, setSubscribeBalance] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Plan amounts state
  const [planAmounts, setPlanAmounts] = useState<Record<string, string>>({});
  
  // Processing states
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  
  // Modal states
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Holding | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [depositInputMode, setDepositInputMode] = useState<'token' | 'usd'>('usd');

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch plans
      const plansRes = await fetch('/api/subscribe-plans');
      const plansData = await plansRes.json();
      if (plansRes.ok && plansData.plans) {
        setPlans(plansData.plans);
        const amounts: Record<string, string> = {};
        plansData.plans.forEach((p: SubscriptionPlan) => {
          amounts[p._id] = p.minAmount.toString();
        });
        setPlanAmounts(amounts);
      }

      // Fetch user subscriptions
      const subsRes = await fetch('/api/user/subscriptions');
      const subsData = await subsRes.json();
      if (subsRes.ok) {
        setSubscriptions(subsData.subscriptions || []);
      }

      // Fetch subscribe balance and holdings
      const balanceRes = await fetch('/api/user/subscribe');
      const balanceData = await balanceRes.json();
      if (balanceRes.ok) {
        setSubscribeBalance(balanceData.subscribeBalance || 0);
        setHoldings(balanceData.holdings || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToast = (type: Toast['type'], message: string) => {
    const id = `${toastIdPrefix}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAmountChange = (planId: string, value: string) => {
    setPlanAmounts((prev) => ({ ...prev, [planId]: value }));
  };

  // Handle deposit from holdings to subscribe balance
  const handleDeposit = async () => {
    if (!selectedToken || !transferAmount) return;

    const inputAmount = parseFloat(transferAmount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      addToast('error', t.subscribe.enterValidAmount);
      return;
    }

    // Calculate token amount based on input mode
    const tokenAmount = depositInputMode === 'usd' 
      ? inputAmount / selectedToken.price 
      : inputAmount;

    if (tokenAmount > selectedToken.amount) {
      addToast('error', t.subscribe.insufficientTokenBalance);
      return;
    }

    setIsProcessingTransfer(true);

    try {
      const res = await fetch('/api/user/subscribe', {
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
        addToast('success', t.subscribe.depositedSuccess.replace('{amount}', formatCurrency(usdValue)).replace('{token}', selectedToken.symbol));
        setDepositModalOpen(false);
        setSelectedToken(null);
        setTransferAmount('');
        setDepositInputMode('usd');
        await fetchData();
      } else {
        addToast('error', data.error || t.subscribe.failedToDeposit);
      }
    } catch {
      addToast('error', t.subscribe.failedToDeposit);
    } finally {
      setIsProcessingTransfer(false);
    }
  };

  // Handle withdraw from subscribe balance to holdings
  const handleWithdraw = async () => {
    if (!selectedToken || !transferAmount) return;

    const amount = parseFloat(transferAmount);
    const amountUsd = amount * selectedToken.price;

    if (isNaN(amount) || amount <= 0) {
      addToast('error', t.subscribe.enterValidAmount);
      return;
    }

    if (amountUsd > subscribeBalance) {
      addToast('error', t.subscribe.insufficientSubscribeBalance);
      return;
    }

    setIsProcessingTransfer(true);

    try {
      const res = await fetch('/api/user/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'withdraw',
          symbol: selectedToken.symbol,
          amount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast('success', t.subscribe.withdrawnSuccess.replace('{amount}', amount.toString()).replace('{token}', selectedToken.symbol));
        setWithdrawModalOpen(false);
        setSelectedToken(null);
        setTransferAmount('');
        await fetchData();
      } else {
        addToast('error', data.error || t.subscribe.failedToWithdraw);
      }
    } catch {
      addToast('error', t.subscribe.failedToWithdraw);
    } finally {
      setIsProcessingTransfer(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    const amount = parseFloat(planAmounts[plan._id] || '0');
    
    if (amount < plan.minAmount) {
      addToast('error', t.subscribe.minAmountPlan.replace('{plan}', plan.name).replace('{amount}', formatCurrency(plan.minAmount)));
      return;
    }
    if (amount > plan.maxAmount) {
      addToast('error', t.subscribe.maxAmountPlan.replace('{plan}', plan.name).replace('{amount}', formatCurrency(plan.maxAmount)));
      return;
    }
    
    if (amount > subscribeBalance) {
      addToast('error', t.subscribe.depositFundsFirst);
      return;
    }

    setProcessingPlan(plan._id);

    try {
      const res = await fetch('/api/subscribe-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan._id,
          amount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast('success', t.subscribe.subscribedSuccess.replace('{plan}', plan.name));
        await fetchData();
        setActiveTab('history');
      } else {
        addToast('error', data.error || t.subscribe.failedToSubscribe);
      }
    } catch {
      addToast('error', t.subscribe.failedToSubscribe);
    } finally {
      setProcessingPlan(null);
    }
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'plans', label: t.subscribe.plans, count: plans.length },
    { id: 'history', label: t.subscribe.yourHistory, count: subscriptions.length },
    { id: 'how', label: t.subscribe.howItWorks },
  ];

  // Token list for withdraw (using common tokens)
  const withdrawTokens: Holding[] = [
    { _id: 'btc', symbol: 'BTC', name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', amount: 0, amountUsd: 0, price: 67234.50 },
    { _id: 'eth', symbol: 'ETH', name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', amount: 0, amountUsd: 0, price: 3456.78 },
    { _id: 'usdt', symbol: 'USDT', name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', amount: 0, amountUsd: 0, price: 1.00 },
    { _id: 'usdc', symbol: 'USDC', name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', amount: 0, amountUsd: 0, price: 1.00 },
    { _id: 'bnb', symbol: 'BNB', name: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', amount: 0, amountUsd: 0, price: 605.23 },
    { _id: 'sol', symbol: 'SOL', name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', amount: 0, amountUsd: 0, price: 178.45 },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        {/* Balance and Buttons */}
        <div className="flex flex-col gap-4">
          {/* Balance */}
          <div>
            <div className="flex items-center gap-2 text-[#6b7a90] text-sm mb-1">
              <span>{t.subscribe.subscribeBalance}</span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="hover:text-white transition-colors"
              >
                {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-2xl sm:text-3xl font-heading font-bold text-white">
              {showBalance ? formatCurrency(subscribeBalance) : '••••••'}
            </p>
          </div>
          
          {/* Action Buttons - Row on mobile, aligned right on desktop */}
          <div className="flex items-center gap-2 sm:gap-3 sm:self-end">
            {subscribeBalance > 0 && (
              <button
                onClick={() => {
                  setSelectedToken(null);
                  setTransferAmount('');
                  setWithdrawModalOpen(true);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg border border-[#2a3441] text-white text-sm font-medium hover:bg-[#1a2332] transition-colors"
              >
                <ArrowUpRight className="h-4 w-4" />
                {t.subscribe.withdraw}
              </button>
            )}
            <button
              onClick={() => {
                setSelectedToken(null);
                setTransferAmount('');
                setDepositInputMode('usd');
                setDepositModalOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg border border-[#2a3441] text-white text-sm font-medium hover:bg-[#1a2332] transition-colors"
            >
              <ArrowDownLeft className="h-4 w-4" />
              {t.subscribe.deposit}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#1e2733] mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
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
                {tab.count !== undefined && (
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

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div>
          <h2 className="font-heading font-semibold text-white text-lg mb-6">
            {t.subscribe.availablePlans}
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              {t.subscribe.noPlansAvailable}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  amount={planAmounts[plan._id] || plan.minAmount.toString()}
                  onAmountChange={(value) => handleAmountChange(plan._id, value)}
                  onSubscribe={() => handleSubscribe(plan)}
                  isProcessing={processingPlan === plan._id}
                  currentBalance={subscribeBalance}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-[#1a2332] flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-[#6b7a90]" />
              </div>
              <h3 className="font-heading font-semibold text-white text-lg mb-2">
                {t.subscribe.noSubscriptionsYet}
              </h3>
              <p className="text-[#6b7a90] text-sm mb-6">
                {t.subscribe.subscribeToEarn}
              </p>
              <button
                onClick={() => setActiveTab('plans')}
                className="px-6 py-3 rounded-lg bg-[#22c55e] text-white text-sm font-medium hover:bg-[#1ea550] transition-colors"
              >
                {t.subscribe.viewPlans}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <SubscriptionCard key={sub._id} subscription={sub} t={t} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* How it works Tab */}
      {activeTab === 'how' && (
        <div className="max-w-3xl">
          <h2 className="font-heading font-semibold text-white text-lg mb-6">
            {t.subscribe.faq}
          </h2>
          <div className="space-y-3">
            {[
              { id: 1, question: t.subscribe.faq1Question, answer: t.subscribe.faq1Answer },
              { id: 2, question: t.subscribe.faq2Question, answer: t.subscribe.faq2Answer },
              { id: 3, question: t.subscribe.faq3Question, answer: t.subscribe.faq3Answer },
              { id: 4, question: t.subscribe.faq4Question, answer: t.subscribe.faq4Answer },
              { id: 5, question: t.subscribe.faq5Question, answer: t.subscribe.faq5Answer },
              { id: 6, question: t.subscribe.faq6Question, answer: t.subscribe.faq6Answer },
            ].map((faq) => (
              <div
                key={faq.id}
                className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-white">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-[#6b7a90] transition-transform',
                      expandedFaq === faq.id && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {expandedFaq === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-[#6b7a90] text-sm leading-relaxed">
                        {faq.answer}
                      </p>
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
              className="bg-[#0f1419] rounded-xl border border-[#1e2733] w-full max-w-md max-h-[90vh] overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-[#1e2733]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center flex-shrink-0">
                      <ArrowDownLeft className="h-5 w-5 text-[#22c55e]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-white">{t.subscribe.depositToSubscribe}</h3>
                      <p className="text-xs sm:text-sm text-[#6b7a90]">{t.subscribe.transferFromHoldings}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDepositModalOpen(false)}
                    className="text-[#6b7a90] hover:text-white flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-100px)]">
                {!selectedToken ? (
                  <>
                    <p className="text-sm text-[#6b7a90]">{t.subscribe.selectTokenDeposit}</p>
                    {holdings.length === 0 ? (
                      <div className="text-center py-8">
                        <Wallet className="h-10 w-10 text-[#6b7a90] mx-auto mb-3" />
                        <p className="text-[#6b7a90]">{t.subscribe.noTokensFound}</p>
                        <p className="text-xs text-[#6b7a90] mt-1">{t.subscribe.depositCryptoFirst}</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                        {holdings.map((holding) => (
                          <button
                            key={holding._id}
                            onClick={() => setSelectedToken(holding)}
                            className="w-full flex items-center justify-between p-3 sm:p-4 bg-[#0a0e14] rounded-lg hover:bg-[#151c24] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-[#1a2332] flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-white">{holding.symbol.slice(0, 2)}</span>
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-white font-medium">{holding.symbol}</p>
                                <p className="text-xs text-[#6b7a90] truncate">{holding.name}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
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
                      {t.subscribe.changeToken}
                    </button>

                    <div className="flex items-center gap-3 p-4 bg-[#0a0e14] rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-[#1a2332] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{selectedToken.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedToken.symbol}</p>
                        <p className="text-xs text-[#6b7a90]">{t.subscribe.balance}: {selectedToken.amount.toFixed(6)} ({formatCurrency(selectedToken.amountUsd)})</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-[#6b7a90]">
                          {t.subscribe.amount} ({depositInputMode === 'usd' ? 'USD' : selectedToken.symbol})
                        </label>
                        {/* Toggle between Token and USD */}
                        <div className="flex items-center bg-[#0a0e14] rounded-lg p-0.5">
                          <button
                            onClick={() => {
                              setDepositInputMode('usd');
                              setTransferAmount('');
                            }}
                            className={cn(
                              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                              depositInputMode === 'usd'
                                ? 'bg-[#22c55e] text-white'
                                : 'text-[#6b7a90] hover:text-white'
                            )}
                          >
                            USD
                          </button>
                          <button
                            onClick={() => {
                              setDepositInputMode('token');
                              setTransferAmount('');
                            }}
                            className={cn(
                              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                              depositInputMode === 'token'
                                ? 'bg-[#22c55e] text-white'
                                : 'text-[#6b7a90] hover:text-white'
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
                      {/* Conversion display */}
                      {transferAmount && parseFloat(transferAmount) > 0 && (
                        <p className="text-xs text-[#6b7a90] mt-2">
                          {depositInputMode === 'usd' ? (
                            <>≈ {(parseFloat(transferAmount) / selectedToken.price).toFixed(6)} {selectedToken.symbol}</>
                          ) : (
                            <>≈ {formatCurrency(parseFloat(transferAmount) * selectedToken.price)}</>
                          )}
                        </p>
                      )}
                      {/* Balance warning */}
                      {transferAmount && parseFloat(transferAmount) > 0 && (
                        depositInputMode === 'usd' 
                          ? parseFloat(transferAmount) > selectedToken.amountUsd && (
                              <p className="text-xs text-red-400 mt-1">{t.subscribe.exceedsBalance}</p>
                            )
                          : parseFloat(transferAmount) > selectedToken.amount && (
                              <p className="text-xs text-red-400 mt-1">{t.subscribe.exceedsBalance}</p>
                            )
                      )}
                    </div>

                    <button
                      onClick={handleDeposit}
                      disabled={
                        isProcessingTransfer || 
                        !transferAmount || 
                        parseFloat(transferAmount) <= 0 ||
                        (depositInputMode === 'usd' 
                          ? parseFloat(transferAmount) > selectedToken.amountUsd
                          : parseFloat(transferAmount) > selectedToken.amount)
                      }
                      className="w-full py-3 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#1ea550] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessingTransfer ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t.common.processing}
                        </>
                      ) : (
                        t.subscribe.deposit
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
              className="bg-[#0f1419] rounded-xl border border-[#1e2733] w-full max-w-md max-h-[90vh] overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-[#1e2733]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <ArrowUpRight className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-white">{t.subscribe.withdrawFromSubscribe}</h3>
                      <p className="text-xs sm:text-sm text-[#6b7a90]">{t.subscribe.transferToHoldings}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setWithdrawModalOpen(false)}
                    className="text-[#6b7a90] hover:text-white flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-100px)]">
                <div className="p-3 sm:p-4 bg-[#0a0e14] rounded-lg">
                  <p className="text-sm text-[#6b7a90]">{t.subscribe.availableToWithdraw}</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(subscribeBalance)}</p>
                </div>

                {!selectedToken ? (
                  <>
                    <p className="text-sm text-[#6b7a90]">{t.subscribe.selectTokenReceive}</p>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {withdrawTokens.map((token) => (
                        <button
                          key={token._id}
                          onClick={() => setSelectedToken(token)}
                          className="w-full flex items-center justify-between p-4 bg-[#0a0e14] rounded-lg hover:bg-[#151c24] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#1a2332] flex items-center justify-center">
                              <span className="text-sm font-bold text-white">{token.symbol.slice(0, 2)}</span>
                            </div>
                            <div className="text-left">
                              <p className="text-white font-medium">{token.symbol}</p>
                              <p className="text-xs text-[#6b7a90]">{token.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[#6b7a90] text-sm">{formatCurrency(token.price)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedToken(null)}
                      className="flex items-center gap-2 text-[#6b7a90] hover:text-white text-sm"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
                      {t.subscribe.changeToken}
                    </button>

                    <div className="flex items-center gap-3 p-4 bg-[#0a0e14] rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-[#1a2332] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{selectedToken.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedToken.symbol}</p>
                        <p className="text-xs text-[#6b7a90]">{t.subscribe.price}: {formatCurrency(selectedToken.price)}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[#6b7a90] mb-2">{t.subscribe.amount} ({selectedToken.symbol})</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          placeholder="0.00"
                          step="0.000001"
                          className="w-full px-4 py-3 pr-20 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                        />
                        <button
                          onClick={() => setTransferAmount((subscribeBalance / selectedToken.price).toFixed(6))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-[#1a2332] text-[#22c55e] rounded hover:bg-[#22c55e] hover:text-white transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                      {transferAmount && (
                        <p className="text-xs text-[#6b7a90] mt-2">
                          ≈ {formatCurrency(parseFloat(transferAmount || '0') * selectedToken.price)}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleWithdraw}
                      disabled={isProcessingTransfer || !transferAmount || parseFloat(transferAmount) <= 0 || parseFloat(transferAmount) * selectedToken.price > subscribeBalance}
                      className="w-full py-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessingTransfer ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t.common.processing}
                        </>
                      ) : (
                        t.subscribe.withdraw
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ============================================
// Plan Card Component
// ============================================

interface PlanCardProps {
  plan: SubscriptionPlan;
  amount: string;
  onAmountChange: (value: string) => void;
  onSubscribe: () => void;
  isProcessing: boolean;
  currentBalance: number;
  t: TranslationKeys;
}

function PlanCard({
  plan,
  amount,
  onAmountChange,
  onSubscribe,
  isProcessing,
  currentBalance,
  t,
}: PlanCardProps) {
  const numAmount = parseFloat(amount) || 0;
  const isValidAmount = numAmount >= plan.minAmount && numAmount <= plan.maxAmount;
  const hasBalance = currentBalance >= numAmount;

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
                <TrendingUp className="h-5 w-5 text-[#22c55e]" />
              </div>
            </div>
            <p className="text-white font-medium mb-1">{t.subscribe.processingSubscription}</p>
            <p className="text-[#6b7a90] text-sm">{t.subscribe.pleaseWait}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Name */}
      <h3 className="text-[#22c55e] font-semibold text-lg mb-5">{plan.name}</h3>

      {/* Plan Details */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between">
          <span className="text-[#6b7a90] text-sm">{t.subscribe.minimum}</span>
          <span className="text-white font-medium">{formatCurrency(plan.minAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6b7a90] text-sm">{t.subscribe.maximum}</span>
          <span className="text-white font-medium">{formatCurrency(plan.maxAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6b7a90] text-sm">{t.subscribe.planDuration}</span>
          <span className="text-white font-medium">{plan.durationDays} {t.subscribe.days}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6b7a90] text-sm">{t.subscribe.roi}</span>
          <span className="text-[#22c55e] font-semibold">{plan.roiPercent}%</span>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-[#6b7a90] text-sm mb-2">{t.subscribe.amount}</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            min={plan.minAmount}
            max={plan.maxAmount}
            className="w-full px-4 py-3 pr-16 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
            placeholder={plan.minAmount.toString()}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7a90] text-sm font-medium bg-[#1a2332] px-2 py-1 rounded">
            USD
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#6b7a90]">{t.subscribe.yourBalance}</span>
          <span className={cn('text-xs', hasBalance ? 'text-[#6b7a90]' : 'text-red-400')}>
            {formatCurrency(currentBalance)}
          </span>
        </div>
        {isValidAmount && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-[#6b7a90]">{t.subscribe.expectedReturn}</span>
            <span className="text-xs text-[#22c55e]">
              +{formatCurrency(numAmount * (plan.roiPercent / 100))}
            </span>
          </div>
        )}
      </div>

      {/* Subscribe Button */}
      <button
        onClick={onSubscribe}
        disabled={isProcessing || !isValidAmount || !hasBalance}
        className={cn(
          'w-full py-3.5 rounded-lg font-medium transition-colors',
          isValidAmount && hasBalance
            ? 'bg-[#22c55e] text-white hover:bg-[#1ea550]'
            : 'bg-[#1a2332] text-[#6b7a90] cursor-not-allowed'
        )}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.common.processing}
          </span>
        ) : !hasBalance && isValidAmount ? (
          t.subscribe.insufficientBalance
        ) : (
          t.subscribe.subscribeBtn
        )}
      </button>
    </div>
  );
}

// ============================================
// Subscription Card Component (History)
// ============================================

interface SubscriptionCardProps {
  subscription: UserSubscription;
  t: TranslationKeys;
}

function SubscriptionCard({ subscription, t }: SubscriptionCardProps) {
  const startDate = new Date(subscription.startDate);
  const endDate = new Date(subscription.endDate);
  const now = new Date();
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const daysElapsed = totalDays - daysRemaining;
  const progress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return t.subscribe.active;
      case 'completed': return t.subscribe.completed;
      case 'cancelled': return t.subscribe.cancelled;
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="bg-[#0f1419] rounded-xl p-4 sm:p-5 border border-[#1e2733]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[#22c55e] font-semibold">{subscription.planName}</h3>
          <p className="text-sm text-[#6b7a90]">
            {t.subscribe.started} {startDate.toLocaleDateString()}
          </p>
        </div>
        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium',
            subscription.status === 'active'
              ? 'bg-yellow-500/10 text-yellow-500'
              : subscription.status === 'completed'
              ? 'bg-[#22c55e]/10 text-[#22c55e]'
              : 'bg-[#ef4444]/10 text-[#ef4444]'
          )}
        >
          {getStatusLabel(subscription.status)}
        </span>
      </div>

      {/* Progress Bar - Only show for active */}
      {subscription.status === 'active' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#6b7a90]">{t.subscribe.progress}</span>
            <span className="text-xs text-[#6b7a90]">{daysRemaining} {t.subscribe.daysRemaining}</span>
          </div>
          <div className="h-2 bg-[#1e2733] rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                progress >= 100 ? 'bg-[#22c55e]' : 'bg-yellow-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {progress >= 100 && (
            <p className="text-xs text-[#22c55e] mt-2">{t.subscribe.durationComplete}</p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 p-3 sm:p-4 bg-[#0a0e14] rounded-xl">
        <div>
          <p className="text-xs text-[#6b7a90] mb-0.5">{t.subscribe.invested}</p>
          <p className="text-white font-semibold text-sm">{formatCurrency(subscription.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7a90] mb-0.5">{t.subscribe.roi}</p>
          <p className="text-[#22c55e] font-semibold text-sm">{subscription.roiPercent}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7a90] mb-0.5">{t.subscribe.expectedReturn}</p>
          <p className="text-[#22c55e] font-semibold text-sm">+{formatCurrency(subscription.expectedReturn)}</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7a90] mb-0.5">{t.subscribe.duration}</p>
          <p className="text-white font-semibold text-sm">{totalDays} {t.subscribe.days}</p>
        </div>
      </div>

      {/* Completion info */}
      {subscription.status === 'completed' && subscription.completedAt && (
        <div className="mt-3 flex items-center gap-2 text-sm text-[#6b7a90]">
          <Calendar className="h-4 w-4" />
          {t.subscribe.completedOn} {new Date(subscription.completedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
