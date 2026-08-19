'use client';

import React, { useState, useId, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Loader2,
  Info,
  Lock,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { useLanguage, TranslationKeys } from '@/lib/i18n';

// ============================================
// Stake Page - Crypto Staking Pools
// ============================================

interface StakingPool {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  minimum: number;
  maximum: number;
  cycles: { days: number; apy: number; isActive: boolean }[];
  status: 'active' | 'inactive';
}

interface UserStake {
  _id: string;
  asset: { name: string; symbol: string; image: string };
  amount: number;
  amountUsd: number;
  cycleDays: number;
  apy: number;
  expectedReward: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'withdrawn' | 'cancelled';
  earnedReward: number;
  releasedAmount?: number;
  releasedAt?: string;
}

interface Stats {
  totalStaked: number;
  activeStakedUsd: number;
  completedStakedUsd: number;
  totalRewards: number;
  activeCount: number;
  completedCount: number;
  totalCount: number;
}

// Helper to get cycle label
function getCycleLabel(days: number, t?: TranslationKeys['stake']): string {
  if (t) {
    if (days === 1) return t.daily;
    if (days === 7) return t.weekly;
    if (days === 30) return t.monthly;
    return `${days} ${t.days}`;
  }
  // Fallback without translations
  if (days === 1) return 'Daily';
  if (days <= 7) return `${days} Days`;
  if (days <= 30) return days === 7 ? 'Weekly' : `${days} Days`;
  if (days <= 90) return days === 30 ? 'Monthly' : `${days} Days`;
  return `${days} Days`;
}

type TabType = 'pools' | 'history' | 'how-it-works';
type ViewState = 'list' | 'stake-form' | 'staking' | 'success';

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

// Crypto Logo Component with fallback
function CryptoLogo({ src, symbol, size = 40 }: { src: string; symbol: string; size?: number }) {
  const [error, setError] = useState(false);

  const colors: Record<string, string> = {
    AVAX: '#E84142',
    ETH: '#627EEA',
    MATIC: '#8247E5',
    SOL: '#14F195',
    USDT: '#26A17B',
    BTC: '#F7931A',
    BNB: '#F3BA2F',
    ADA: '#0033AD',
    DOT: '#E6007A',
    ATOM: '#2E3148',
  };

  if (error || !src) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, backgroundColor: colors[symbol] || '#6b7a90', fontSize: size * 0.35 }}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <div className="rounded-full overflow-hidden bg-white flex items-center justify-center" style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={symbol}
        width={size}
        height={size}
        className="object-contain"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );
}

export default function StakePage() {
  // Translation hook
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<TabType>('pools');
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<{ days: number; apy: number } | null>(null);
  const [userStakes, setUserStakes] = useState<UserStake[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(1);
  const [stakingPools, setStakingPools] = useState<StakingPool[]>([]);
  const [userHoldings, setUserHoldings] = useState<Record<string, number>>({});
  const [isLoadingPools, setIsLoadingPools] = useState(true);
  const [isLoadingStakes, setIsLoadingStakes] = useState(true);
  
  // Staking form state
  const [stakeAmount, setStakeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Generate unique IDs for accessibility
  const tabsId = useId();

  // Fetch staking pools from API
  useEffect(() => {
    const fetchPools = async () => {
      try {
        const res = await fetch('/api/stake-assets');
        const data = await res.json();
        if (res.ok && data.assets) {
          setStakingPools(data.assets.map((a: any) => ({
            id: a._id,
            name: a.name,
            symbol: a.symbol,
            logo: a.image,
            minimum: a.minAmount,
            maximum: a.maxAmount,
            cycles: a.cycles || [{ days: 7, apy: 5, isActive: true }],
            status: a.isActive ? 'active' : 'inactive',
          })));
        }
      } catch (error) {
        console.error('Failed to fetch stake assets:', error);
      } finally {
        setIsLoadingPools(false);
      }
    };
    fetchPools();
  }, []);

  // Fetch user stakes and holdings function (reusable)
  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch('/api/user/stakes');
      const data = await res.json();
      if (res.ok) {
        setUserStakes(data.stakes || []);
        setUserHoldings(data.holdings || {});
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch user stakes:', error);
    } finally {
      setIsLoadingStakes(false);
    }
  }, []);

  // Fetch user stakes and holdings on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

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

  const handleStakeClick = (pool: StakingPool) => {
    const activeCycles = pool.cycles.filter((c) => c.isActive);
    setSelectedPool(pool);
    setSelectedCycle(activeCycles[0] || null);
    setStakeAmount('');
    setViewState('stake-form');
  };

  const handleStake = async () => {
    if (!selectedPool || !selectedCycle) return;
    
    const amount = parseFloat(stakeAmount);
    
    if (isNaN(amount) || amount <= 0) {
      addToast('error', t.stake.enterValidAmount);
      return;
    }
    
    if (amount < selectedPool.minimum) {
      addToast('error', t.stake.minStakeAmount.replace('{min}', selectedPool.minimum.toString()).replace('{symbol}', selectedPool.symbol));
      return;
    }
    
    if (amount > selectedPool.maximum) {
      addToast('error', t.stake.maxStakeAmount.replace('{max}', selectedPool.maximum.toString()).replace('{symbol}', selectedPool.symbol));
      return;
    }

    const userBalance = userHoldings[selectedPool.symbol] || 0;
    if (amount > userBalance) {
      addToast('error', t.stake.insufficientBalance.replace('{symbol}', selectedPool.symbol));
      return;
    }

    setIsProcessing(true);
    setViewState('staking');

    try {
      const res = await fetch('/api/user/stakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stakeAssetId: selectedPool.id,
          amount,
          cycleDays: selectedCycle.days,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Update local state
        setUserStakes((prev) => [data.stake, ...prev]);
        setUserHoldings((prev) => ({
          ...prev,
          [selectedPool.symbol]: (prev[selectedPool.symbol] || 0) - amount,
        }));
        setViewState('success');
      } else {
        addToast('error', data.error || t.stake.failedToStake);
        setViewState('stake-form');
      }
    } catch (error) {
      addToast('error', t.stake.errorOccurred);
      setViewState('stake-form');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    setViewState('list');
    setSelectedPool(null);
    setSelectedCycle(null);
    setStakeAmount('');
  };

  const handleDone = () => {
    setViewState('list');
    setSelectedPool(null);
    setSelectedCycle(null);
    setStakeAmount('');
    setActiveTab('history');
    addToast('success', t.stake.stakeAddedSuccess);
    // Refetch user data to update stats immediately
    fetchUserData();
  };

  // Calculate stats from user stakes
  const totalStakings = stats?.totalStaked || 0;
  const activeStakings = stats?.activeStakedUsd || 0;
  const closedStakings = stats?.completedStakedUsd || 0;
  const activeCount = stats?.activeCount || 0;
  const closedCount = stats?.completedCount || 0;

  // Tab progress calculation
  const tabs: TabType[] = ['pools', 'history', 'how-it-works'];
  const currentTabIndex = tabs.indexOf(activeTab);
  const progressWidth = ((currentTabIndex + 1) / tabs.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* ===== MAIN LIST VIEW ===== */}
      {viewState === 'list' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div className="bg-[#0f1419] rounded-xl p-4 sm:p-5 border border-[#1e2733]">
              <p className="font-heading text-xl sm:text-2xl font-bold text-white mb-1">
                {formatCurrency(totalStakings)}
              </p>
              <p className="text-sm text-[#6b7a90]">{t.stake.totalStakings}</p>
              <p className="text-xs text-[#6b7a90]">{stats?.totalCount || 0} {t.stake.stakingsCount}</p>
            </div>
            <div className="bg-[#0f1419] rounded-xl p-4 sm:p-5 border border-[#1e2733]">
              <p className="font-heading text-xl sm:text-2xl font-bold text-white mb-1">
                {formatCurrency(activeStakings)}
              </p>
              <p className="text-sm text-[#6b7a90]">{t.stake.activeStakings}</p>
              <p className="text-xs text-[#6b7a90]">{activeCount} {t.stake.stakingsCount}</p>
            </div>
            <div className="bg-[#0f1419] rounded-xl p-4 sm:p-5 border border-[#1e2733]">
              <p className="font-heading text-xl sm:text-2xl font-bold text-white mb-1">
                {formatCurrency(closedStakings)}
              </p>
              <p className="text-sm text-[#6b7a90]">{t.stake.closedStakings}</p>
              <p className="text-xs text-[#6b7a90]">{closedCount} {t.stake.stakingsCount}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-4 sm:gap-6 mb-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setActiveTab('pools')}
                className={cn(
                  'text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
                  activeTab === 'pools' ? 'text-white' : 'text-[#6b7a90] hover:text-white'
                )}
              >
                {t.stake.poolsTab}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  'text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0',
                  activeTab === 'history' ? 'text-white' : 'text-[#6b7a90] hover:text-white'
                )}
              >
                {t.stake.yourHistory}
                {activeCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#22c55e]/10 text-[#22c55e] text-xs rounded">
                    {activeCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('how-it-works')}
                className={cn(
                  'text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
                  activeTab === 'how-it-works' ? 'text-white' : 'text-[#6b7a90] hover:text-white'
                )}
              >
                {t.stake.howItWorks}
              </button>
            </div>
            {/* Progress Bar */}
            <div className="h-0.5 bg-[#1e2733] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#22c55e]"
                initial={{ width: 0 }}
                animate={{ width: `${progressWidth}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Pools Tab */}
          {activeTab === 'pools' && (
            <div>
              <h2 className="font-heading font-semibold text-white mb-4">{t.stake.poolsHeading}</h2>
              {isLoadingPools ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                </div>
              ) : stakingPools.filter(p => p.status === 'active').length === 0 ? (
                <div className="bg-[#0f1419] rounded-xl p-8 border border-[#1e2733] text-center">
                  <Layers className="h-12 w-12 text-[#6b7a90] mx-auto mb-3" />
                  <p className="text-[#6b7a90]">{t.stake.noPoolsAvailable}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stakingPools.filter(p => p.status === 'active').map((pool) => {
                    const userBalance = userHoldings[pool.symbol] || 0;
                    const hasToken = userBalance > 0;
                    const activeCycles = pool.cycles.filter((c) => c.isActive);
                    const firstCycle = activeCycles[0];
                    
                    return (
                      <div
                        key={pool.id}
                        className={cn(
                          "bg-[#0f1419] rounded-xl p-5 border",
                          hasToken ? "border-[#1e2733]" : "border-[#1e2733] opacity-70"
                        )}
                      >
                        {/* Pool Header */}
                        <div className="flex items-center gap-3 mb-5">
                          <CryptoLogo src={pool.logo} symbol={pool.symbol} size={40} />
                          <div>
                            <p className="font-medium text-white">{pool.name}</p>
                            <p className="text-sm text-[#6b7a90]">{pool.symbol}</p>
                          </div>
                        </div>

                        {/* Pool Stats */}
                        <div className="space-y-3 mb-5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#6b7a90]">{t.stake.minimum}</span>
                            <span className="text-sm font-medium text-white">
                              {pool.minimum} {pool.symbol}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#6b7a90]">{t.stake.maximum}</span>
                            <span className="text-sm font-medium text-white">
                              {pool.maximum} {pool.symbol}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#6b7a90]">{t.stake.cycle}</span>
                            <span className="text-sm font-medium text-white">
                              {firstCycle ? getCycleLabel(firstCycle.days, t.stake) : 'N/A'}
                            </span>
                          </div>
                          {hasToken && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[#6b7a90]">{t.stake.yourBalance}</span>
                              <span className="text-sm font-medium text-[#22c55e]">
                                {userBalance.toFixed(6)} {pool.symbol}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Stake Button */}
                        <button
                          onClick={() => hasToken && handleStakeClick(pool)}
                          disabled={!hasToken}
                          className={cn(
                            "w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2",
                            hasToken 
                              ? "bg-[#22c55e] text-white hover:bg-[#1ea550]" 
                              : "bg-[#1e2733] text-[#6b7a90] cursor-not-allowed"
                          )}
                        >
                          {!hasToken && <Lock className="h-4 w-4" />}
                          {hasToken ? t.stake.stakeBtn : t.stake.needToken.replace('{symbol}', pool.symbol)}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h2 className="font-heading font-semibold text-white mb-4">{t.stake.stakingHistory}</h2>
              {isLoadingStakes ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                </div>
              ) : userStakes.length === 0 ? (
                <div className="bg-[#0f1419] rounded-xl p-8 border border-[#1e2733] text-center">
                  <Layers className="h-12 w-12 text-[#6b7a90] mx-auto mb-3" />
                  <p className="text-[#6b7a90] mb-4">{t.stake.noStakesYet}</p>
                  <button
                    onClick={() => setActiveTab('pools')}
                    className="text-[#22c55e] font-medium hover:underline"
                  >
                    {t.stake.browsePoolsLink}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userStakes.map((stake) => (
                    <div
                      key={stake._id}
                      className="bg-[#0f1419] rounded-xl p-4 border border-[#1e2733]"
                    >
                      <div className="flex items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <CryptoLogo src={stake.asset.image} symbol={stake.asset.symbol} size={40} />
                          <div className="min-w-0">
                            <p className="font-medium text-white">{stake.asset.name}</p>
                            <p className="text-sm text-[#6b7a90] break-words">
                              {stake.amount} {stake.asset.symbol} | {stake.apy}% APY | {getCycleLabel(stake.cycleDays, t.stake)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            stake.status === 'active' && 'bg-[#22c55e]/10 text-[#22c55e]',
                            stake.status === 'completed' && 'bg-[#3b82f6]/10 text-[#3b82f6]',
                            stake.status === 'cancelled' && 'bg-[#ef4444]/10 text-[#ef4444]'
                          )}>
                            {stake.status === 'active' && t.stake.active}
                            {stake.status === 'completed' && t.stake.completed}
                            {stake.status === 'cancelled' && t.stake.cancelled}
                          </span>
                          <p className="text-xs text-[#6b7a90] mt-1">
                            {stake.status === 'active' 
                              ? t.stake.endsOn.replace('{date}', new Date(stake.endDate).toLocaleDateString())
                              : stake.releasedAt 
                                ? t.stake.releasedOn.replace('{date}', new Date(stake.releasedAt).toLocaleDateString())
                                : t.stake.startedOn.replace('{date}', new Date(stake.startDate).toLocaleDateString())
                            }
                          </p>
                          {stake.status === 'completed' && stake.releasedAmount && (
                            <p className="text-xs text-[#22c55e] mt-1">
                              +{(stake.releasedAmount - stake.amount).toFixed(6)} {stake.asset.symbol} {t.stake.reward}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* How it works Tab */}
          {activeTab === 'how-it-works' && (
            <div>
              <h2 className="font-heading font-semibold text-white mb-4">{t.stake.howItWorks}</h2>
              <div className="space-y-3">
                {[
                  { id: 1, question: t.stake.faq1Question, answer: t.stake.faq1Answer },
                  { id: 2, question: t.stake.faq2Question, answer: t.stake.faq2Answer },
                  { id: 3, question: t.stake.faq3Question, answer: t.stake.faq3Answer },
                  { id: 4, question: t.stake.faq4Question, answer: t.stake.faq4Answer },
                  { id: 5, question: t.stake.faq5Question, answer: t.stake.faq5Answer },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'h-6 w-6 rounded flex items-center justify-center text-sm font-medium transition-colors',
                          expandedFaq === item.id 
                            ? 'bg-[#22c55e] text-white' 
                            : 'bg-[#1e2733] text-[#6b7a90]'
                        )}>
                          {item.id}
                        </span>
                        <span className="font-medium text-white">{item.question}</span>
                      </div>
                      {expandedFaq === item.id ? (
                        <ChevronUp className="h-5 w-5 text-[#6b7a90]" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[#6b7a90]" />
                      )}
                    </button>
                    <AnimatePresence>
                      {expandedFaq === item.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-4 pb-4 pt-0">
                            <p className="text-sm text-[#6b7a90] pl-9">{item.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ===== STAKE FORM VIEW ===== */}
      {viewState === 'stake-form' && selectedPool && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {/* Header */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[#6b7a90] hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.stake.goBack}
          </button>

          <div className="bg-[#0f1419] rounded-xl p-6 border border-[#1e2733]">
            {/* Pool Info */}
            <div className="flex items-center gap-4 mb-6">
              <CryptoLogo src={selectedPool.logo} symbol={selectedPool.symbol} size={56} />
              <div>
                <h2 className="font-heading text-xl font-bold text-white">{selectedPool.name}</h2>
                <p className="text-[#6b7a90]">{selectedPool.symbol}</p>
              </div>
            </div>

            {/* Cycle Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                {t.stake.selectDuration}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedPool.cycles.filter((c) => c.isActive).map((cycle) => (
                  <button
                    key={cycle.days}
                    onClick={() => setSelectedCycle(cycle)}
                    className={cn(
                      'p-3 rounded-lg border transition-colors text-center',
                      selectedCycle?.days === cycle.days
                        ? 'border-[#22c55e] bg-[#22c55e]/10'
                        : 'border-[#1e2733] hover:border-[#6b7a90]'
                    )}
                  >
                    <p className="font-medium text-white">{getCycleLabel(cycle.days, t.stake)}</p>
                    <p className="text-sm text-[#22c55e]">{cycle.apy}% APY</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white">{t.stake.amountToStake}</label>
                <span className="text-sm text-[#6b7a90]">
                  {t.stake.balance}: {(userHoldings[selectedPool.symbol] || 0).toFixed(6)} {selectedPool.symbol}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder={`Min: ${selectedPool.minimum} ${selectedPool.symbol}`}
                  className="w-full px-4 py-4 bg-[#0a0e14] border border-[#1e2733] rounded-xl text-white text-lg placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
                />
                <button
                  onClick={() => setStakeAmount((userHoldings[selectedPool.symbol] || 0).toString())}
                  className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-[#1a2332] text-[#22c55e] rounded hover:bg-[#22c55e] hover:text-white transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Pool Details */}
            <div className="space-y-3 mb-6 p-4 bg-[#0a0e14] rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7a90]">{t.stake.minimum}</span>
                <span className="text-sm font-medium text-white">
                  {selectedPool.minimum} {selectedPool.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7a90]">{t.stake.maximum}</span>
                <span className="text-sm font-medium text-white">
                  {selectedPool.maximum} {selectedPool.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7a90]">{t.stake.duration}</span>
                <span className="text-sm font-medium text-white">
                  {selectedCycle ? getCycleLabel(selectedCycle.days, t.stake) : t.stake.selectAbove}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7a90]">{t.stake.apy}</span>
                <span className="text-sm font-medium text-[#22c55e]">
                  {selectedCycle?.apy || 0}%
                </span>
              </div>
              {stakeAmount && selectedCycle && parseFloat(stakeAmount) > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-[#1e2733]">
                  <span className="text-sm text-[#6b7a90]">{t.stake.estReward}</span>
                  <span className="text-sm font-medium text-[#22c55e]">
                    +{((parseFloat(stakeAmount) * selectedCycle.apy / 100) * (selectedCycle.days / 365)).toFixed(6)} {selectedPool.symbol}
                  </span>
                </div>
              )}
            </div>

            {/* Info Notice */}
            <div className="flex items-start gap-3 p-4 bg-[#3b82f6]/10 rounded-lg border border-[#3b82f6]/20 mb-6">
              <Info className="h-5 w-5 text-[#3b82f6] shrink-0 mt-0.5" />
              <p className="text-sm text-[#3b82f6]">
                {t.stake.stakeInfoNotice}
              </p>
            </div>

            {/* Stake Button */}
            <button
              onClick={handleStake}
              disabled={!stakeAmount || !selectedCycle || parseFloat(stakeAmount) < selectedPool.minimum || isProcessing}
              className="w-full py-4 rounded-xl bg-[#22c55e] text-white font-semibold hover:bg-[#1ea550] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.stake.stakeBtn} {selectedPool.symbol}
            </button>
          </div>
        </motion.div>
      )}

      {/* ===== STAKING/PROCESSING VIEW ===== */}
      {viewState === 'staking' && selectedPool && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center min-h-[400px]"
        >
          <div className="text-center">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-full border-4 border-[#1e2733] border-t-[#22c55e] animate-spin mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CryptoLogo src={selectedPool.logo} symbol={selectedPool.symbol} size={40} />
              </div>
            </div>
            <h2 className="font-heading text-xl font-bold text-white mb-2">{t.stake.processingStake}</h2>
            <p className="text-[#6b7a90]">
              {t.stake.stakingAmount.replace('{amount}', stakeAmount).replace('{symbol}', selectedPool.symbol)}
            </p>
          </div>
        </motion.div>
      )}

      {/* ===== SUCCESS VIEW ===== */}
      {viewState === 'success' && selectedPool && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center min-h-[400px]"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="h-20 w-20 rounded-full bg-[#22c55e] flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="font-heading text-xl font-bold text-white mb-2">{t.stake.stakeSuccessful}</h2>
            <p className="text-[#6b7a90] mb-6">
              {t.stake.successfullyStaked.replace('{amount}', stakeAmount).replace('{symbol}', selectedPool.symbol)}
            </p>
            <button
              onClick={handleDone}
              className="px-8 py-3 rounded-xl bg-[#22c55e] text-white font-semibold hover:bg-[#1ea550] transition-colors"
            >
              {t.stake.done}
            </button>
          </div>
        </motion.div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
