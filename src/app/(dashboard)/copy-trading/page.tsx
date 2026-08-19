'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Users, 
  ChevronLeft, 
  ChevronDown,
  X,
  TrendingUp,
  BarChart3,
  Target,
  DollarSign,
  Percent,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pause,
  Play,
  Trash2,
  Info
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { useLanguage } from '@/lib/i18n';
import { TranslationKeys } from '@/lib/i18n/translations';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

// ============================================
// Copy Trading Page - Complete Flow
// ============================================

// Expert/Trader Interface (Admin can manage all fields)
export interface Expert {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified: boolean; // Admin toggle
  subscribers: number;
  bio?: string;
  winRate: number;
  profitShare: number;
  wins: number;
  losses: number;
  trades: number;
  minStartup: number;
  // Admin fields
  createdAt?: Date;
  updatedAt?: Date;
  status?: 'active' | 'inactive' | 'suspended';
}

// Active Copy Interface
interface ActiveCopy {
  id: string;
  expert: Expert;
  amount: number;
  startDate: Date;
  profit: number;
  profitPercent: number;
  trades: number;
  status: 'active' | 'paused';
  paymentToken?: string;
}

// Token Holding for payment selection
interface TokenHolding {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  amount: number;
  amountUsd: number;
}

// Map database trader to Expert interface
function mapDbTrader(dbTrader: any): Expert {
  return {
    id: dbTrader._id,
    name: dbTrader.name,
    username: `@${dbTrader.username}`,
    avatar: dbTrader.avatar,
    verified: dbTrader.isVerified || false,
    subscribers: dbTrader.copiers || 0,
    bio: dbTrader.bio,
    winRate: dbTrader.winRate || 0,
    profitShare: dbTrader.profitShare || 10,
    wins: dbTrader.wins || 0,
    losses: dbTrader.losses || 0,
    trades: dbTrader.totalTrades || 0,
    minStartup: dbTrader.minInvestment || 100,
    status: dbTrader.isActive ? 'active' : 'inactive',
  };
}

// FAQ Data
const faqItems = [
  {
    id: 1,
    question: 'What is Copy Trading?',
    answer: 'Copy Trading is an automated feature that allows you to follow top traders and experts on our platform, copy their trades, and earn profits.',
  },
  {
    id: 2,
    question: 'How do I copy an expert?',
    answer: 'Simply browse the top experts, review their performance stats, and click the "Copy" button. Set your investment amount and confirm to start copying their trades automatically.',
  },
  {
    id: 3,
    question: 'How can I stop copying an expert?',
    answer: 'Go to the "Copying" tab to view all experts you are currently copying. Click on the expert and select "Stop Copying" to end the copy relationship.',
  },
  {
    id: 4,
    question: "Why don't I receive any trades from copied experts?",
    answer: 'This could happen if the expert has not made any trades recently, or if your account balance is below the minimum required amount to execute the copied trades.',
  },
  {
    id: 5,
    question: 'What is the minimum amount I can copy an expert with?',
    answer: 'Each expert sets their own minimum startup amount. You can see this in their profile under "Min. startup". This ensures you have enough capital to properly copy their trading strategy.',
  },
];

type TabType = 'experts' | 'copying' | 'how';

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

export default function CopyTradingPage() {
  // Translation hook
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<TabType>('experts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(1);
  const [panelTab, setPanelTab] = useState<'stats' | 'trades'>('stats');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [isLoadingExperts, setIsLoadingExperts] = useState(true);
  
  // Copy flow states
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyModalStep, setCopyModalStep] = useState<'select-token' | 'enter-amount'>('select-token');
  const [copyAmount, setCopyAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCopies, setActiveCopies] = useState<ActiveCopy[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenHolding | null>(null);
  
  // Stop copy modal states
  const [showStopModal, setShowStopModal] = useState(false);
  const [stoppingCopy, setStoppingCopy] = useState<ActiveCopy | null>(null);
  const [isStopProcessing, setIsStopProcessing] = useState(false);
  
  // Available tokens for withdrawal (all supported tokens)
  const availableWithdrawTokens = [
    { symbol: 'USDT', name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
    { symbol: 'USDC', name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
    { symbol: 'BTC', name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    { symbol: 'BNB', name: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
    { symbol: 'SOL', name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  ];
  
  // User balance from API
  const [userBalance, setUserBalance] = useState(0);

  // Fetch traders from API
  useEffect(() => {
    const fetchTraders = async () => {
      try {
        const res = await fetch('/api/traders');
        const data = await res.json();
        if (res.ok && data.traders) {
          setExperts(data.traders.map(mapDbTrader));
        }
      } catch (error) {
        console.error('Failed to fetch traders:', error);
      } finally {
        setIsLoadingExperts(false);
      }
    };
    fetchTraders();
  }, []);

  // Fetch user balance and active copy trades
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch balance
        const balanceRes = await fetch('/api/user/balance');
        const balanceData = await balanceRes.json();
        if (balanceRes.ok) {
          setUserBalance(balanceData.balance?.available || 0);
        }

        // Fetch token holdings
        const investingRes = await fetch('/api/user/investing');
        const investingData = await investingRes.json();
        if (investingRes.ok && investingData.holdings) {
          setTokenHoldings(investingData.holdings.map((h: any) => ({
            id: h._id || h.id,
            symbol: h.symbol,
            name: h.name,
            icon: h.icon,
            amountUsd: h.amountUsd,
            amount: h.amount,
          })));
        }

        // Fetch active copy trades
        const copiesRes = await fetch('/api/user/copy-trades');
        const copiesData = await copiesRes.json();
        if (copiesRes.ok && copiesData.active) {
          const mappedCopies = copiesData.active.map((c: any) => {
            // Check if traderId was successfully populated (has _id property)
            const isPopulated = c.traderId && typeof c.traderId === 'object' && c.traderId._id;
            
            // Use profitShare from the stored trader snapshot (from CopyTrade)
            const storedProfitShare = c.trader?.profitShare || 10;
            
            return {
              id: c._id,
              expert: isPopulated ? {
                ...mapDbTrader(c.traderId),
                profitShare: storedProfitShare, // Use stored profitShare from copy trade
              } : {
                id: c._id,
                name: c.trader?.name || 'Trader',
                username: `@${c.trader?.username || c.trader?.name?.toLowerCase().replace(/\s+/g, '') || 'trader'}`,
                avatar: c.trader?.avatar || '/api/placeholder/80/80',
                verified: false,
                subscribers: 0,
                winRate: c.trader?.winRate || 0,
                profitShare: storedProfitShare,
                wins: 0,
                losses: 0,
                trades: 0,
                minStartup: 100,
              },
              amount: c.amount,
              startDate: new Date(c.startedAt || c.createdAt),
              profit: c.profitLoss || 0,
              profitPercent: c.amount > 0 ? ((c.profitLoss || 0) / c.amount) * 100 : 0,
              trades: c.tradesCount || 0,
              status: c.status === 'paused' ? 'paused' : 'active',
              paymentToken: c.paymentToken,
            };
          });
          setActiveCopies(mappedCopies);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const filteredExperts = experts.filter((expert) =>
    expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expert.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleViewExpert = (expert: Expert) => {
    setSelectedExpert(expert);
    setShowPanel(true);
    setPanelTab('stats');
  };

  const handleCopyClick = (expert: Expert) => {
    // Check if already copying this expert
    const alreadyCopying = activeCopies.some((c) => c.expert.id === expert.id);
    if (alreadyCopying) {
      addToast('info', `${t.copyTrading.alreadyCopying} ${expert.name}`);
      return;
    }

    // Check if user has any token holdings
    if (tokenHoldings.length === 0) {
      addToast('error', t.copyTrading.noTokensToInvest);
      return;
    }

    // Check if any holding has enough balance
    const hasEnoughBalance = tokenHoldings.some((h) => h.amountUsd >= expert.minStartup);
    if (!hasEnoughBalance) {
      addToast('error', `${t.copyTrading.noEnoughBalance} ${formatCurrency(expert.minStartup)}`);
      return;
    }

    // Open copy modal at token selection step
    setSelectedExpert(expert);
    setSelectedToken(null);
    setCopyAmount('');
    setCopyModalStep('select-token');
    setShowCopyModal(true);
    setShowPanel(false);
  };

  const handleConfirmCopy = async () => {
    if (!selectedExpert || !selectedToken) return;
    
    const amount = parseFloat(copyAmount);
    if (isNaN(amount) || amount < selectedExpert.minStartup) {
      addToast('error', `${t.copyTrading.minAmountRequired} ${formatCurrency(selectedExpert.minStartup)}`);
      return;
    }

    if (amount > selectedToken.amountUsd) {
      addToast('error', t.copyTrading.exceedsBalance);
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/traders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traderId: selectedExpert.id,
          amount,
          paymentToken: selectedToken.symbol,
          paymentTokenIcon: selectedToken.icon,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Add to active copies locally
        const newCopy: ActiveCopy = {
          id: data.copyTrade?._id || Math.random().toString(36).substr(2, 9),
          expert: selectedExpert,
          amount,
          startDate: new Date(),
          profit: 0,
          profitPercent: 0,
          trades: 0,
          status: 'active',
          paymentToken: selectedToken.symbol,
        };

        setActiveCopies((prev) => [...prev, newCopy]);
        
        // Update token holdings locally
        setTokenHoldings((prev) =>
          prev
            .map((h) =>
              h.symbol === selectedToken.symbol
                ? { ...h, amountUsd: h.amountUsd - amount }
                : h
            )
            .filter((h) => h.amountUsd >= 0.01)
        );
        
        setUserBalance(data.newBalance || userBalance - amount);
        addToast('success', `${t.copyTrading.successStartedCopying} ${selectedExpert.name}!`);
        setActiveTab('copying');
      } else {
        addToast('error', data.error || t.copyTrading.failedToStartCopying);
      }
    } catch (error) {
      addToast('error', t.copyTrading.failedToStartCopying);
    } finally {
      setIsProcessing(false);
      setShowCopyModal(false);
      setCopyAmount('');
      setSelectedExpert(null);
      setSelectedToken(null);
    }
  };

  const handlePauseCopy = (copyId: string) => {
    setActiveCopies((prev) =>
      prev.map((c) =>
        c.id === copyId
          ? { ...c, status: c.status === 'active' ? 'paused' : 'active' }
          : c
      )
    );
  };

  // Opens the stop modal - user will select which token to receive funds in
  const handleStopCopy = (copyId: string) => {
    const copy = activeCopies.find((c) => c.id === copyId);
    if (!copy) return;
    
    setStoppingCopy(copy);
    setShowStopModal(true);
  };

  // Actually stops the copy trade with selected withdraw token
  const confirmStopCopy = async (withdrawToken: string) => {
    if (!stoppingCopy) return;

    setIsStopProcessing(true);

    try {
      const res = await fetch(`/api/user/copy-trades?id=${stoppingCopy.id}&withdrawToken=${withdrawToken}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setActiveCopies((prev) => prev.filter((c) => c.id !== stoppingCopy.id));
        setUserBalance(data.newBalance || userBalance);
        
        // Update token holdings
        if (data.withdrawToken && data.returnAmount) {
          setTokenHoldings((prev) => {
            const existingIdx = prev.findIndex((h) => h.symbol === data.withdrawToken);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = {
                ...updated[existingIdx],
                amountUsd: updated[existingIdx].amountUsd + data.returnAmount,
              };
              return updated;
            }
            // Add new holding if doesn't exist
            const tokenInfo = availableWithdrawTokens.find((t) => t.symbol === data.withdrawToken);
            return [...prev, {
              id: Date.now().toString(),
              symbol: data.withdrawToken,
              name: tokenInfo?.name || data.withdrawToken,
              icon: tokenInfo?.icon || '',
              amount: data.returnAmount / 1,
              amountUsd: data.returnAmount,
            }];
          });
          
          // Build toast message with profit share info
          let toastMessage = `Stopped copying ${stoppingCopy.expert.name}. `;
          
          if (data.grossProfitLoss > 0 && data.traderShare > 0) {
            toastMessage += `Net profit: +$${data.netProfitLoss?.toFixed(2)} (${data.profitSharePercent}% shared). `;
          } else if (data.grossProfitLoss < 0) {
            toastMessage += `Loss: -$${Math.abs(data.grossProfitLoss || 0).toFixed(2)}. `;
          } else {
            toastMessage += `No profit/loss. `;
          }
          
          toastMessage += `$${data.returnAmount?.toFixed(2)} deposited to ${data.withdrawToken}.`;
          addToast('success', toastMessage);
        } else {
          addToast('success', `${t.copyTrading.successStoppedCopying} ${stoppingCopy.expert.name}`);
        }
      } else {
        addToast('error', data.error || t.copyTrading.failedToStopCopying);
      }
    } catch (error) {
      addToast('error', t.copyTrading.failedToStopCopying);
    } finally {
      setIsStopProcessing(false);
      setShowStopModal(false);
      setStoppingCopy(null);
    }
  };

  const formatSubscribers = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'experts', label: t.copyTrading.topExperts },
    { id: 'copying', label: t.copyTrading.copying, count: activeCopies.length },
    { id: 'how', label: t.copyTrading.howItWorks },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <h1 className="font-heading text-2xl font-semibold text-white mb-6">
        {t.copyTrading.title}
      </h1>

      {/* Tabs Navigation */}
      <div className="border-b border-[#1e2733] mb-6">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative pb-4 text-sm font-medium transition-colors flex items-center gap-2',
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-[#6b7a90] hover:text-white'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#22c55e] text-white text-xs font-semibold">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Top Experts Tab */}
      {activeTab === 'experts' && (
        <div>
          {/* Section Header with Search */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-semibold text-white text-lg">{t.copyTrading.topExperts}</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
              <input
                type="text"
                placeholder={t.copyTrading.searchForExperts}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white text-sm placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
              />
            </div>
          </div>

          {/* Experts Grid */}
          {isLoadingExperts ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : filteredExperts.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-[#6b7a90] mx-auto mb-3" />
              <p className="text-white font-medium">No experts found</p>
              <p className="text-sm text-[#6b7a90] mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {filteredExperts.map((expert) => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  onView={() => handleViewExpert(expert)}
                  onCopy={() => handleCopyClick(expert)}
                  formatSubscribers={formatSubscribers}
                  isCopying={activeCopies.some((c) => c.expert.id === expert.id)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Copying Tab */}
      {activeTab === 'copying' && (
        <div>
          {activeCopies.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-[#1a2332] flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-[#6b7a90]" />
              </div>
              <h3 className="font-heading font-semibold text-white text-lg mb-2">
                {t.copyTrading.noCopiesYet}
              </h3>
              <p className="text-[#6b7a90] text-sm mb-6">
                {t.copyTrading.startCopyingExperts}
              </p>
              <button
                onClick={() => setActiveTab('experts')}
                className="px-6 py-3 rounded-lg bg-[#22c55e] text-white text-sm font-medium hover:bg-[#1ea550] transition-colors"
              >
                {t.copyTrading.browseExperts}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-heading font-semibold text-white text-lg">
                  {t.copyTrading.copying} ({activeCopies.length})
                </h2>
                <p className="text-sm text-[#6b7a90]">
                  {t.copyTrading.invested}: {formatCurrency(activeCopies.reduce((acc, c) => acc + c.amount, 0))}
                </p>
              </div>

              {activeCopies.map((copy) => (
                <ActiveCopyCard
                  key={copy.id}
                  copy={copy}
                  onPause={() => handlePauseCopy(copy.id)}
                  onStop={() => handleStopCopy(copy.id)}
                  formatSubscribers={formatSubscribers}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* How it Works Tab */}
      {activeTab === 'how' && (
        <div>
          <h2 className="font-heading font-semibold text-white text-lg mb-6">{t.copyTrading.howItWorks}</h2>
          <div className="space-y-3 max-w-3xl">
            {[
              { id: 1, question: t.copyTrading.faq1Question, answer: t.copyTrading.faq1Answer },
              { id: 2, question: t.copyTrading.faq2Question, answer: t.copyTrading.faq2Answer },
              { id: 3, question: t.copyTrading.faq3Question, answer: t.copyTrading.faq3Answer },
              { id: 4, question: t.copyTrading.faq4Question, answer: t.copyTrading.faq4Answer },
              { id: 5, question: t.copyTrading.faq5Question, answer: t.copyTrading.faq5Answer },
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
                {expandedFaq === item.id && (
                  <div className="px-4 pb-4 pl-14">
                    <p className="text-[#8b9ab4] text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expert Detail Panel */}
      <AnimatePresence>
        {showPanel && selectedExpert && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowPanel(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0e14] border-l border-[#1e2733] z-50 overflow-y-auto"
            >
              {/* Panel Header */}
              <div className="sticky top-0 bg-[#0a0e14] border-b border-[#1e2733] p-4 z-10">
                <button
                  onClick={() => setShowPanel(false)}
                  className="flex items-center gap-2 text-sm text-[#6b7a90] hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t.staking.goBack}
                </button>
              </div>

              {/* Expert Info */}
              <div className="p-5">
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative h-14 w-14 rounded-full overflow-hidden bg-[#1a2332]">
                    <Image
                      src={selectedExpert.avatar}
                      alt={selectedExpert.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-semibold text-white">
                        {selectedExpert.name}
                      </h3>
                      {selectedExpert.verified && <VerifiedBadge />}
                    </div>
                    <p className="text-sm text-[#6b7a90]">{selectedExpert.username}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3 text-[#6b7a90]" />
                      <span className="text-xs text-[#6b7a90]">
                        {formatSubscribers(selectedExpert.subscribers)} {t.copyTrading.subscribers}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => handleCopyClick(selectedExpert)}
                  className="w-full py-3 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#1ea550] transition-colors mb-4"
                >
                  {t.copyTrading.copy}
                </button>

                {/* Min Amount Info */}
                <div className="flex items-start gap-2 text-sm text-[#6b7a90] mb-6">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    {t.copyTrading.minAmountInfo}{' '}
                    <span className="text-white font-medium">
                      {formatCurrency(selectedExpert.minStartup)}
                    </span>
                  </span>
                </div>

                {/* Panel Tabs */}
                <div className="flex gap-6 border-b border-[#1e2733] mb-5">
                  <button
                    onClick={() => setPanelTab('stats')}
                    className={cn(
                      'pb-3 text-sm font-medium transition-colors relative',
                      panelTab === 'stats' ? 'text-white' : 'text-[#6b7a90] hover:text-white'
                    )}
                  >
                    Stats
                    {panelTab === 'stats' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
                    )}
                  </button>
                  <button
                    onClick={() => setPanelTab('trades')}
                    className={cn(
                      'pb-3 text-sm font-medium transition-colors relative',
                      panelTab === 'trades' ? 'text-white' : 'text-[#6b7a90] hover:text-white'
                    )}
                  >
                    Top trades
                    {panelTab === 'trades' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
                    )}
                  </button>
                </div>

                {/* Stats Grid */}
                {panelTab === 'stats' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-[#0c1320] rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-[#6b7a90]" />
                        <span className="text-xs text-[#6b7a90]">{t.copyTrading.winRate}</span>
                      </div>
                      <p className="text-lg font-bold text-[#22c55e]">{selectedExpert.winRate}%</p>
                    </div>
                    <div className="p-4 bg-[#0c1320] rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="h-4 w-4 text-[#6b7a90]" />
                        <span className="text-xs text-[#6b7a90]">{t.copyTrading.profitShare}</span>
                      </div>
                      <p className="text-lg font-bold text-[#22c55e]">{selectedExpert.profitShare}%</p>
                    </div>
                    <div className="p-4 bg-[#0c1320] rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-[#6b7a90]" />
                        <span className="text-xs text-[#6b7a90]">{t.copyTrading.wins}</span>
                      </div>
                      <p className="text-lg font-bold text-white">{selectedExpert.wins.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-[#0c1320] rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <X className="h-4 w-4 text-[#6b7a90]" />
                        <span className="text-xs text-[#6b7a90]">{t.copyTrading.losses}</span>
                      </div>
                      <p className="text-lg font-bold text-white">{selectedExpert.losses.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-[#0c1320] rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-[#6b7a90]" />
                        <span className="text-xs text-[#6b7a90]">{t.copyTrading.trades}</span>
                      </div>
                      <p className="text-lg font-bold text-white">{selectedExpert.trades.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-[#0c1320] rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-[#6b7a90]" />
                        <span className="text-xs text-[#6b7a90]">{t.copyTrading.minStartup}</span>
                      </div>
                      <p className="text-lg font-bold text-white">{formatCurrency(selectedExpert.minStartup)}</p>
                    </div>
                  </div>
                )}

                {/* Top Trades Tab */}
                {panelTab === 'trades' && (
                  <div className="text-center py-8">
                    <BarChart3 className="h-10 w-10 text-[#6b7a90] mx-auto mb-3" />
                    <p className="text-[#6b7a90] text-sm">Trade history coming soon</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Copy Modal */}
      <AnimatePresence>
        {showCopyModal && selectedExpert && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => !isProcessing && setShowCopyModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-[#0f1419] border border-[#1e2733] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto my-auto">
                {/* Processing State */}
                {isProcessing ? (
                  <div className="p-8 text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      {/* Outer spinning ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-[#1e2733] border-t-[#22c55e]"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      {/* Inner pulsing circle */}
                      <motion.div
                        className="absolute inset-3 rounded-full bg-[#22c55e]/20 flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <TrendingUp className="h-6 w-6 text-[#22c55e]" />
                      </motion.div>
                    </div>
                    <h3 className="font-heading font-semibold text-white text-lg mb-2">
                      {t.copyTrading.processing}
                    </h3>
                    <p className="text-[#6b7a90] text-sm mb-4">
                      {selectedExpert.name}...
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-[#22c55e]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Modal Header */}
                    <div className="sticky top-0 bg-[#0f1419] p-5 border-b border-[#1e2733] z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {copyModalStep === 'enter-amount' && (
                            <button
                              onClick={() => {
                                setCopyModalStep('select-token');
                                setSelectedToken(null);
                                setCopyAmount('');
                              }}
                              className="text-[#6b7a90] hover:text-white transition-colors"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                          )}
                          <h3 className="font-heading font-semibold text-white text-lg">
                            {copyModalStep === 'select-token' ? t.copyTrading.selectPaymentToken : `${t.copyTrading.copy} ${selectedExpert.name}`}
                          </h3>
                        </div>
                        <button
                          onClick={() => setShowCopyModal(false)}
                          className="text-[#6b7a90] hover:text-white transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      {/* Step indicator */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className={cn(
                          'h-1 flex-1 rounded-full',
                          'bg-[#22c55e]'
                        )} />
                        <div className={cn(
                          'h-1 flex-1 rounded-full',
                          copyModalStep === 'enter-amount' ? 'bg-[#22c55e]' : 'bg-[#1e2733]'
                        )} />
                      </div>
                    </div>

                    {/* Modal Body */}
                    <div className="p-5">
                      {/* Step 1: Select Token */}
                      {copyModalStep === 'select-token' && (
                        <>
                          <p className="text-sm text-[#6b7a90] mb-4">
                            {t.copyTrading.selectPaymentToken}. {t.copyTrading.minAmount} {formatCurrency(selectedExpert.minStartup)}
                          </p>
                          
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {tokenHoldings.filter((h) => h.amountUsd >= selectedExpert.minStartup).length === 0 ? (
                              <div className="text-center py-8">
                                <DollarSign className="h-10 w-10 text-[#6b7a90] mx-auto mb-3" />
                                <p className="text-[#6b7a90] text-sm">
                                  {t.copyTrading.noEnoughBalance} {formatCurrency(selectedExpert.minStartup)}
                                </p>
                              </div>
                            ) : (
                              tokenHoldings
                                .filter((h) => h.amountUsd >= selectedExpert.minStartup)
                                .map((token) => (
                                  <button
                                    key={token.id}
                                    onClick={() => {
                                      setSelectedToken(token);
                                      setCopyAmount(selectedExpert.minStartup.toString());
                                      setCopyModalStep('enter-amount');
                                    }}
                                    className="w-full flex items-center gap-3 p-4 bg-[#0a0e14] rounded-xl border border-[#1e2733] hover:border-[#22c55e] transition-colors"
                                  >
                                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-[#1e2733]">
                                      <Image
                                        src={token.icon || '/api/placeholder/40/40'}
                                        alt={token.symbol}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    </div>
                                    <div className="flex-1 text-left">
                                      <p className="font-medium text-white">{token.symbol}</p>
                                      <p className="text-xs text-[#6b7a90]">{token.name}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-white">{formatCurrency(token.amountUsd)}</p>
                                      <p className="text-xs text-[#6b7a90]">{token.amount.toFixed(6)} {token.symbol}</p>
                                    </div>
                                  </button>
                                ))
                            )}
                          </div>
                        </>
                      )}

                      {/* Step 2: Enter Amount */}
                      {copyModalStep === 'enter-amount' && selectedToken && (
                        <>
                          {/* Expert Preview */}
                          <div className="flex items-center gap-3 p-4 bg-[#0a0e14] rounded-xl mb-5">
                            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-[#1a2332]">
                              <Image
                                src={selectedExpert.avatar}
                                alt={selectedExpert.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{selectedExpert.name}</span>
                                {selectedExpert.verified && <VerifiedBadge size="sm" />}
                              </div>
                              <p className="text-sm text-[#6b7a90]">
                                {selectedExpert.winRate}% win rate • {selectedExpert.profitShare}% profit share
                              </p>
                            </div>
                          </div>

                          {/* Selected Token */}
                          <div className="flex items-center gap-3 p-3 bg-[#1a2332] rounded-lg mb-5">
                            <div className="relative h-8 w-8 rounded-full overflow-hidden bg-[#0a0e14]">
                              <Image
                                src={selectedToken.icon || '/api/placeholder/32/32'}
                                alt={selectedToken.symbol}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-white font-medium">{selectedToken.symbol}</p>
                              <p className="text-xs text-[#6b7a90]">{t.copyTrading.availableBalance}: {formatCurrency(selectedToken.amountUsd)}</p>
                            </div>
                          </div>

                          {/* Amount Input */}
                          <div className="mb-5">
                            <label className="block text-sm text-[#6b7a90] mb-2">
                              {t.copyTrading.enterAmount}
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7a90]">$</span>
                              <input
                                type="number"
                                value={copyAmount}
                                onChange={(e) => setCopyAmount(e.target.value)}
                                min={selectedExpert.minStartup}
                                max={selectedToken.amountUsd}
                                className="w-full pl-8 pr-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-[#22c55e]"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-[#6b7a90]">
                                {t.copyTrading.minAmount} {formatCurrency(selectedExpert.minStartup)}
                              </span>
                              <span className="text-xs text-[#6b7a90]">
                                {t.copyTrading.availableBalance}: {formatCurrency(selectedToken.amountUsd)}
                              </span>
                            </div>
                          </div>

                          {/* Quick Amounts */}
                          <div className="flex gap-2 mb-5">
                            {[
                              { label: 'Min', amount: selectedExpert.minStartup },
                              { label: '25%', amount: Math.round(selectedToken.amountUsd * 0.25) },
                              { label: '50%', amount: Math.round(selectedToken.amountUsd * 0.5) },
                              { label: 'Max', amount: Math.floor(selectedToken.amountUsd) },
                            ].map((opt) => (
                              <button
                                key={opt.label}
                                onClick={() => setCopyAmount(Math.max(opt.amount, selectedExpert.minStartup).toString())}
                                className={cn(
                                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                                  copyAmount === opt.amount.toString()
                                    ? 'bg-[#22c55e] text-white'
                                    : 'bg-[#1a2332] text-[#6b7a90] hover:text-white'
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          {/* Info Box */}
                          <div className="p-4 bg-[#0a0e14] rounded-xl mb-5 border border-[#1e2733]">
                            <div className="flex items-start gap-3">
                              <Info className="h-4 w-4 text-[#3b82f6] shrink-0 mt-0.5" />
                              <p className="text-sm text-[#8b9ab4]">
                                {t.copyTrading.profitShareInfo.replace('{percent}', selectedExpert.profitShare.toString())}
                              </p>
                            </div>
                          </div>

                          {/* Confirm Button */}
                          <button
                            onClick={handleConfirmCopy}
                            disabled={!copyAmount || parseFloat(copyAmount) < selectedExpert.minStartup || parseFloat(copyAmount) > selectedToken.amountUsd}
                            className="w-full py-3.5 rounded-lg bg-[#22c55e] text-white font-semibold hover:bg-[#1ea550] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t.copyTrading.confirmCopy}
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stop Copy Modal - Select token to receive funds */}
      <AnimatePresence>
        {showStopModal && stoppingCopy && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => !isStopProcessing && setShowStopModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#0f1419] border border-[#1e2733] rounded-2xl w-full max-w-md overflow-hidden">
                {/* Processing State */}
                {isStopProcessing ? (
                  <div className="p-8 text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-[#1e2733] border-t-[#ef4444]"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.div
                        className="absolute inset-3 rounded-full bg-[#ef4444]/20 flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Trash2 className="h-6 w-6 text-[#ef4444]" />
                      </motion.div>
                    </div>
                    <h3 className="font-heading font-semibold text-white text-lg mb-2">
                      {t.copyTrading.stopping}
                    </h3>
                    <p className="text-[#6b7a90] text-sm mb-4">
                      {stoppingCopy.expert.name}...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Modal Header */}
                    <div className="p-5 border-b border-[#1e2733]">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-semibold text-white text-lg">
                          {t.copyTrading.stopCopyingTitle} - {stoppingCopy.expert.name}
                        </h3>
                        <button
                          onClick={() => setShowStopModal(false)}
                          className="text-[#6b7a90] hover:text-white transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Modal Body */}
                    <div className="p-5">
                      {/* Summary */}
                      <div className="p-4 bg-[#0a0e14] rounded-xl mb-5 border border-[#1e2733]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-[#6b7a90]">{t.copyTrading.invested}</span>
                          <span className="font-semibold text-white">{formatCurrency(stoppingCopy.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-[#6b7a90]">{t.copyTrading.profit}</span>
                          <span className={cn(
                            'font-semibold',
                            stoppingCopy.profit >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                          )}>
                            {stoppingCopy.profit >= 0 ? '+' : ''}{formatCurrency(stoppingCopy.profit)}
                          </span>
                        </div>
                        {stoppingCopy.profit > 0 && (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-[#f59e0b]">
                                {t.copyTrading.profitShare} ({stoppingCopy.expert.profitShare}%)
                              </span>
                              <span className="font-semibold text-[#f59e0b]">
                                -{formatCurrency((stoppingCopy.profit * stoppingCopy.expert.profitShare) / 100)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-[#22c55e]">{t.copyTrading.profit}</span>
                              <span className="font-semibold text-[#22c55e]">
                                +{formatCurrency(stoppingCopy.profit - (stoppingCopy.profit * stoppingCopy.expert.profitShare) / 100)}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-[#1e2733]">
                          <span className="text-sm text-white font-medium">{t.copyTrading.invested}</span>
                          <span className="font-bold text-white text-lg">
                            {formatCurrency(
                              stoppingCopy.amount + 
                              (stoppingCopy.profit > 0 
                                ? stoppingCopy.profit - (stoppingCopy.profit * stoppingCopy.expert.profitShare) / 100
                                : stoppingCopy.profit)
                            )}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-[#6b7a90] mb-4">
                        {t.copyTrading.withdrawTo}:
                      </p>

                      {/* Token Selection */}
                      <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {availableWithdrawTokens.map((token) => (
                          <button
                            key={token.symbol}
                            onClick={() => confirmStopCopy(token.symbol)}
                            className="w-full flex items-center gap-3 p-4 bg-[#0a0e14] rounded-xl border border-[#1e2733] hover:border-[#ef4444] transition-colors"
                          >
                            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-[#1e2733]">
                              <Image
                                src={token.icon}
                                alt={token.symbol}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-white">{token.symbol}</p>
                              <p className="text-xs text-[#6b7a90]">{token.name}</p>
                            </div>
                            <ChevronLeft className="h-5 w-5 text-[#6b7a90] rotate-180" />
                          </button>
                        ))}
                      </div>

                      {/* Cancel Button */}
                      <button
                        onClick={() => setShowStopModal(false)}
                        className="w-full mt-4 py-3 rounded-lg bg-[#1a2332] text-white font-medium hover:bg-[#232d3b] transition-colors"
                      >
                        {t.copyTrading.cancel}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ============================================
// Expert Card Component
// ============================================

interface ExpertCardProps {
  expert: Expert;
  onView: () => void;
  onCopy: () => void;
  formatSubscribers: (num: number) => string;
  isCopying?: boolean;
  t: TranslationKeys;
}

function ExpertCard({ expert, onView, onCopy, formatSubscribers, isCopying, t }: ExpertCardProps) {
  return (
    <div className="bg-[#0f1419] rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className="relative h-12 w-12 rounded-full overflow-hidden bg-[#1a2332] shrink-0">
          <Image
            src={expert.avatar}
            alt={expert.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold text-white truncate">
              {expert.name}
            </h3>
            {expert.verified && <VerifiedBadge />}
          </div>
          <p className="text-sm text-[#6b7a90] truncate">{expert.username}</p>
          <div className="flex items-center gap-1 mt-1">
            <Users className="h-3 w-3 text-[#6b7a90]" />
            <span className="text-xs text-[#6b7a90]">
              {formatSubscribers(expert.subscribers)} {t.copyTrading.subscribers}
            </span>
          </div>
        </div>
      </div>

      {/* Bio if exists */}
      {expert.bio && (
        <p className="text-sm text-[#8b9ab4] mb-4 line-clamp-2">{expert.bio}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-xs text-[#6b7a90] mb-1">{t.copyTrading.winRate}</p>
          <p className="font-semibold text-[#22c55e] text-sm">{expert.winRate}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7a90] mb-1">{t.copyTrading.profitShare}</p>
          <p className="font-semibold text-[#22c55e] text-sm">{expert.profitShare}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#6b7a90] mb-1">{t.copyTrading.wins}</p>
          <p className="font-semibold text-white text-sm">{expert.wins.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-xs text-[#6b7a90] mb-1">{t.copyTrading.losses}</p>
          <p className="font-semibold text-white text-sm">{expert.losses}</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7a90] mb-1">{t.copyTrading.trades}</p>
          <p className="font-semibold text-white text-sm">{expert.trades.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#6b7a90] mb-1">{t.copyTrading.minStartup}</p>
          <p className="font-semibold text-white text-sm">{formatCurrency(expert.minStartup)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onView}
          className="flex-1 py-3 px-4 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm font-medium hover:bg-[#232d3b] transition-colors"
        >
          {t.copyTrading.view}
        </button>
        {isCopying ? (
          <button
            disabled
            className="flex-1 py-3 px-4 rounded-lg bg-[#1a2332] text-[#22c55e] text-sm font-medium cursor-default flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {t.copyTrading.copyingStatus}
          </button>
        ) : (
          <button
            onClick={onCopy}
            className="flex-1 py-3 px-4 rounded-lg bg-[#22c55e] text-white text-sm font-medium hover:bg-[#1ea550] transition-colors"
          >
            {t.copyTrading.copy}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Active Copy Card Component
// ============================================

interface ActiveCopyCardProps {
  copy: ActiveCopy;
  onPause: () => void;
  onStop: () => void;
  formatSubscribers: (num: number) => string;
  t: TranslationKeys;
}

function ActiveCopyCard({ copy, onPause, onStop, formatSubscribers, t }: ActiveCopyCardProps) {
  const daysSince = Math.floor((new Date().getTime() - copy.startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-[#0f1419] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-[#1a2332]">
            <Image
              src={copy.expert.avatar}
              alt={copy.expert.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-white">
                {copy.expert.name}
              </h3>
              {copy.expert.verified && <VerifiedBadge />}
            </div>
            <p className="text-sm text-[#6b7a90]">{copy.expert.username}</p>
          </div>
        </div>
        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium',
            copy.status === 'active'
              ? 'bg-[#22c55e]/10 text-[#22c55e]'
              : 'bg-[#f59e0b]/10 text-[#f59e0b]'
          )}
        >
          {copy.status === 'active' ? t.copyTrading.active : t.copyTrading.paused}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5 p-4 bg-[#0a0e14] rounded-xl">
        <div>
          <p className="text-xs text-[#6b7a90] mb-1">{t.copyTrading.invested}</p>
          <p className="font-semibold text-white text-sm">{formatCurrency(copy.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7a90] mb-1">{t.copyTrading.profit}</p>
          <p className={cn(
            'font-semibold text-sm',
            copy.profit >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
          )}>
            {copy.profit >= 0 ? '+' : ''}{formatCurrency(copy.profit)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#6b7a90] mb-1">{t.copyTrading.trades}</p>
          <p className="font-semibold text-white text-sm">{copy.trades}</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7a90] mb-1">{t.copyTrading.duration}</p>
          <p className="font-semibold text-white text-sm">{daysSince} {t.copyTrading.days}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onPause}
          className="flex-1 py-2.5 px-4 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm font-medium hover:bg-[#232d3b] transition-colors flex items-center justify-center gap-2"
        >
          {copy.status === 'active' ? (
            <>
              <Pause className="h-4 w-4" />
              {t.copyTrading.pause}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {t.copyTrading.resume}
            </>
          )}
        </button>
        <button
          onClick={onStop}
          className="flex-1 py-2.5 px-4 rounded-lg bg-[#ef4444]/10 text-[#ef4444] text-sm font-medium hover:bg-[#ef4444]/20 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {t.copyTrading.stopCopying}
        </button>
      </div>
    </div>
  );
}
