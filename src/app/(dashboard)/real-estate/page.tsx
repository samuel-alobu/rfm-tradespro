'use client';

import React, { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, EyeOff, ChevronDown, Wallet, Loader2, TrendingUp, Calendar, Building2,
  X, AlertCircle, CheckCircle2, Info, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import { PropertyCard, PropertyDetailPanel, InvestModal, Property } from '@/components/real-estate';
import { cn, formatCurrency } from '@/utils';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Real Estate Page - Connected to Database
// ============================================

// Investment interface
interface Investment {
  _id: string;
  propertyId: string;
  propertyName: string;
  propertyImage: string;
  propertyLocation: string;
  amount: number;
  projectedReturn: number;
  roi: number;
  durationDays: number;
  status: 'active' | 'matured' | 'cashed_out' | 'withdrawn' | 'cancelled';
  investedAt: string;
  expiresAt: string;
  releasedAt?: string;
  releasedAmount?: number;
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

// Map database property to component Property interface
function mapDbProperty(dbProp: any): Property {
  const strategyMap: Record<string, 'Fixed income' | 'Growth & Income' | 'Opportunistic'> = {
    'fixed_income': 'Fixed income',
    'growth': 'Growth & Income',
    'hybrid': 'Growth & Income',
    'opportunistic': 'Opportunistic',
  };

  const status: 'open' | 'closed' | 'coming_soon' = dbProp.isActive ? 'open' : 'closed';

  return {
    id: dbProp._id,
    _id: dbProp._id,
    name: dbProp.name,
    slug: dbProp.slug,
    location: dbProp.breakdown?.location || 'Location TBD',
    description: dbProp.description,
    image: dbProp.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    images: dbProp.images,
    minInvestment: dbProp.minimum,
    minimum: dbProp.minimum,
    roi: dbProp.roi,
    strategy: strategyMap[dbProp.strategy] || 'Fixed income',
    status,
    type: dbProp.breakdown?.type || 'Real Estate',
    totalRaised: dbProp.raisedAmount,
    targetAmount: dbProp.targetAmount,
    raisedAmount: dbProp.raisedAmount,
    percentFunded: dbProp.percentFunded,
    investors: dbProp.investors,
    projectOverview: dbProp.projectOverview,
    breakdown: dbProp.breakdown,
    whyThisProject: dbProp.whyThisProject || [],
    whyThisSponsor: dbProp.whyThisSponsor || [],
    documents: dbProp.documents?.map((doc: any) => ({
      title: doc.title,
      name: doc.title,
      slug: doc.slug,
      url: dbProp.slug && doc.slug ? `/project/${dbProp.slug}/${doc.slug}.pdf` : doc.url,
    })),
    isActive: dbProp.isActive,
  };
}

// FAQ Data
// FAQ data is now driven by translations - see faqItems below

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

type TabType = 'open' | 'closed' | 'investments' | 'how';

export default function RealEstatePage() {
  // Translation hook
  const { t } = useLanguage();
  
  const toastId = useId();
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [showBalance, setShowBalance] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(1);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvesting, setIsInvesting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Real estate balance states
  const [realEstateBalance, setRealEstateBalance] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);

  // Modal states
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Holding | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [depositInputMode, setDepositInputMode] = useState<'token' | 'usd'>('usd');
  const [withdrawInputMode, setWithdrawInputMode] = useState<'token' | 'usd'>('usd');

  const addToast = (type: Toast['type'], message: string) => {
    const id = `${toastId}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch properties
      const propsRes = await fetch('/api/real-estate?status=all');
      const propsData = await propsRes.json();
      if (propsRes.ok && propsData.properties) {
        setProperties(propsData.properties.map(mapDbProperty));
      }

      // Fetch real estate balance, holdings, and investments
      const reRes = await fetch('/api/user/real-estate');
      const reData = await reRes.json();
      if (reRes.ok) {
        setRealEstateBalance(reData.realEstateBalance || 0);
        setHoldings(reData.holdings || []);
        setInvestments(reData.investments || []);
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

  const openProperties = properties.filter(p => p.isActive === true || p.status === 'open');
  const closedProperties = properties.filter(p => p.isActive === false || p.status === 'closed');
  
  const activeInvestments = investments.filter(i => i.status === 'active');
  const portfolioValue = activeInvestments.reduce((acc, inv) => acc + inv.amount, 0);
  const totalReturns = activeInvestments.reduce((acc, inv) => acc + inv.projectedReturn, 0);

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'open', label: t.realEstateSection.tabOpen, count: openProperties.length },
    { id: 'closed', label: t.realEstateSection.tabClosed },
    { id: 'investments', label: t.realEstateSection.tabYourInvestments, count: investments.length },
    { id: 'how', label: t.realEstateSection.tabHowItWorks },
  ];

  const handleViewProject = (property: Property) => {
    setSelectedProperty(property);
    setShowDetailPanel(true);
  };

  const handleInvest = (property: Property) => {
    setSelectedProperty(property);
    setShowDetailPanel(false);
    setShowInvestModal(true);
  };

  const handleInvestConfirm = async (propertyId: string, amount: number) => {
    setIsInvesting(true);
    try {
      const res = await fetch('/api/user/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, amount }),
      });

      const data = await res.json();
      
      if (res.ok) {
        addToast('success', `${t.realEstateSection.successInvested} ${formatCurrency(amount)}!`);
        setShowInvestModal(false);
        if (data.realEstateBalance !== undefined) {
          setRealEstateBalance(data.realEstateBalance);
        }
        await fetchData();
        setActiveTab('investments');
      } else {
        addToast('error', data.error || t.realEstateSection.investmentFailed);
      }
    } catch (error) {
      console.error('Investment error:', error);
      addToast('error', t.realEstateSection.failedToProcess);
    } finally {
      setIsInvesting(false);
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!selectedToken || !transferAmount) return;

    const inputAmount = parseFloat(transferAmount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      addToast('error', t.realEstateSection.enterValidAmount);
      return;
    }

    const tokenAmount = depositInputMode === 'usd'
      ? inputAmount / selectedToken.price
      : inputAmount;

    if (tokenAmount > selectedToken.amount) {
      addToast('error', t.realEstateSection.insufficientTokenBalance);
      return;
    }

    setIsProcessingTransfer(true);

    try {
      const res = await fetch('/api/user/real-estate', {
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
        addToast('success', `${t.realEstateSection.depositedSuccess} ${formatCurrency(usdValue)} ${selectedToken.symbol}`);
        setDepositModalOpen(false);
        setSelectedToken(null);
        setTransferAmount('');
        setDepositInputMode('usd');
        if (data.realEstateBalance !== undefined) {
          setRealEstateBalance(data.realEstateBalance);
        }
        setHoldings((prev) => 
          prev.map((h) => 
            h.symbol === selectedToken.symbol 
              ? { ...h, amount: h.amount - tokenAmount, amountUsd: (h.amount - tokenAmount) * h.price }
              : h
          ).filter((h) => h.amount > 0)
        );
      } else {
        addToast('error', data.error || t.realEstateSection.failedToDeposit);
      }
    } catch {
      addToast('error', t.realEstateSection.failedToProcessDeposit);
    } finally {
      setIsProcessingTransfer(false);
    }
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!selectedToken || !transferAmount) return;

    const inputAmount = parseFloat(transferAmount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      addToast('error', t.realEstateSection.enterValidAmount);
      return;
    }

    const tokenAmount = withdrawInputMode === 'usd'
      ? inputAmount / selectedToken.price
      : inputAmount;
    
    const amountUsd = withdrawInputMode === 'usd'
      ? inputAmount
      : inputAmount * selectedToken.price;

    if (amountUsd > realEstateBalance) {
      addToast('error', t.realEstateSection.insufficientReBalance);
      return;
    }

    setIsProcessingTransfer(true);

    try {
      const res = await fetch('/api/user/real-estate', {
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
        addToast('success', `${t.realEstateSection.withdrewSuccess} ${formatCurrency(amountUsd)} ${selectedToken.symbol}`);
        setWithdrawModalOpen(false);
        setSelectedToken(null);
        setTransferAmount('');
        setWithdrawInputMode('usd');
        if (data.realEstateBalance !== undefined) {
          setRealEstateBalance(data.realEstateBalance);
        }
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
        addToast('error', data.error || t.realEstateSection.failedToWithdraw);
      }
    } catch {
      addToast('error', t.realEstateSection.failedToProcessWithdrawal);
    } finally {
      setIsProcessingTransfer(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#22c55e]/20 text-[#22c55e]">{t.realEstateSection.statusActive}</span>;
      case 'cashed_out':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">{t.realEstateSection.statusCashedOut}</span>;
      case 'matured':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">{t.realEstateSection.statusMatured}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-400">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Two-Card Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Left Card: Real Estate Balance */}
        <div className="bg-[#0f1419] rounded-xl p-4 sm:p-6 border border-[#1e2733]">
          <div className="flex flex-col gap-4">
            {/* Balance Row */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#6b7a90] text-sm">{t.realEstateSection.balance}</span>
                  <button onClick={() => setShowBalance(!showBalance)} className="text-[#6b7a90] hover:text-white">
                    {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {showBalance ? formatCurrency(realEstateBalance) : '••••••'}
                </p>
              </div>
              {/* Desktop buttons */}
              <div className="hidden sm:flex items-center gap-2">
                {realEstateBalance > 0 && (
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
                    {t.realEstateSection.withdraw}
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
                  {t.realEstateSection.deposit}
                </button>
              </div>
            </div>
            {/* Mobile buttons */}
            <div className="flex sm:hidden items-center gap-2">
              {realEstateBalance > 0 && (
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
                  {t.realEstateSection.withdraw}
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
                {t.realEstateSection.deposit}
              </button>
            </div>
          </div>
        </div>

        {/* Right Card: Portfolio Value */}
        <div className="bg-[#0f1419] rounded-xl p-4 sm:p-6 border border-[#1e2733]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#6b7a90] text-sm">{t.realEstateSection.totalPortfolioValue}</span>
            <TrendingUp className="h-5 w-5 text-[#22c55e]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {showBalance ? formatCurrency(portfolioValue) : '••••••'}
          </p>
          <p className="text-sm text-[#6b7a90]">
            {t.realEstateSection.projectedReturns} <span className="text-[#22c55e] font-medium">+{formatCurrency(totalReturns)}</span>
          </p>
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
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs',
                    activeTab === tab.id ? 'bg-[#22c55e] text-white' : 'bg-[#1e2733] text-[#6b7a90]'
                  )}>
                    {tab.count}
                  </span>
                )}
              </span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'open' && (
        <div>
          <h2 className="font-heading font-semibold text-white text-lg mb-6">{t.realEstateSection.openProjects}</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : openProperties.length === 0 ? (
            <div className="text-center py-16 text-gray-400">{t.realEstateSection.noOpenProjects}</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {openProperties.map((property) => (
                <PropertyCard key={property.id} property={property} onViewProject={handleViewProject} onInvest={handleInvest} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'closed' && (
        <div>
          <h2 className="font-heading font-semibold text-white text-lg mb-6">{t.realEstateSection.closedProjects}</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : closedProperties.length === 0 ? (
            <div className="text-center py-16 text-gray-400">{t.realEstateSection.noClosedProjects}</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {closedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} onViewProject={handleViewProject} onInvest={handleInvest} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'investments' && (
        <div>
          <h2 className="font-heading font-semibold text-white text-lg mb-6">{t.realEstateSection.yourInvestments}</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : investments.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-[#1a2332] flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-[#6b7a90]" />
              </div>
              <h3 className="font-heading font-semibold text-white text-lg mb-2">{t.realEstateSection.noInvestmentsYet}</h3>
              <p className="text-[#6b7a90] text-sm mb-6">{t.realEstateSection.noInvestmentsDesc}</p>
              <button 
                onClick={() => setActiveTab('open')}
                className="px-6 py-3 rounded-lg bg-[#22c55e] text-white text-sm font-medium hover:bg-[#1ea550] transition-colors"
              >
                {t.realEstateSection.viewOpenProjects}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Portfolio Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className="p-3 sm:p-4 bg-[#0f1419] border border-[#1e2733] rounded-xl">
                  <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.totalInvested}</p>
                  <p className="text-lg sm:text-xl font-bold text-white">{formatCurrency(portfolioValue)}</p>
                </div>
                <div className="p-3 sm:p-4 bg-[#0f1419] border border-[#1e2733] rounded-xl">
                  <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.projectedReturns}</p>
                  <p className="text-lg sm:text-xl font-bold text-[#22c55e]">+{formatCurrency(totalReturns)}</p>
                </div>
                <div className="p-3 sm:p-4 bg-[#0f1419] border border-[#1e2733] rounded-xl">
                  <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.activeSlashTotal}</p>
                  <p className="text-lg sm:text-xl font-bold text-white">{activeInvestments.length} / {investments.length}</p>
                </div>
              </div>

              {/* Investment Cards */}
              {investments.map((investment) => (
                <div 
                  key={investment._id}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-[#0f1419] border border-[#1e2733] rounded-xl hover:border-[#2a3441] transition-colors"
                >
                  <div className="w-full sm:w-20 h-32 sm:h-20 rounded-lg bg-[#1a2332] overflow-hidden shrink-0">
                    {investment.propertyImage && (
                      <img src={investment.propertyImage} alt={investment.propertyName} className="object-cover w-full h-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-3 sm:mb-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-white truncate">{investment.propertyName}</h3>
                        <p className="text-xs text-[#6b7a90]">{investment.propertyLocation}</p>
                      </div>
                      {getStatusBadge(investment.status)}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                      <div>
                        <p className="text-[#6b7a90] text-xs">{t.realEstateSection.invested}</p>
                        <p className="text-white font-medium text-sm">{formatCurrency(investment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-[#6b7a90] text-xs">{t.realEstateSection.roi}</p>
                        <p className="text-[#22c55e] font-medium text-sm">{investment.roi}%</p>
                      </div>
                      <div>
                        <p className="text-[#6b7a90] text-xs">{t.realEstateSection.estReturn}</p>
                        <p className="text-[#22c55e] font-medium text-sm">+{formatCurrency(investment.projectedReturn)}</p>
                      </div>
                      <div>
                        <p className="text-[#6b7a90] text-xs">
                          {investment.status === 'cashed_out' ? t.realEstateSection.released : t.realEstateSection.expires}
                        </p>
                        <p className="text-white font-medium flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {investment.status === 'cashed_out' && investment.releasedAt
                            ? new Date(investment.releasedAt).toLocaleDateString()
                            : new Date(investment.expiresAt).toLocaleDateString()
                          }
                        </p>
                      </div>
                    </div>
                    {investment.status === 'cashed_out' && investment.releasedAmount && (
                      <div className="mt-2 pt-2 border-t border-[#1e2733]">
                        <p className="text-sm text-[#6b7a90]">
                          {t.realEstateSection.totalReleased} <span className="text-[#22c55e] font-medium">{formatCurrency(investment.releasedAmount)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'how' && (
        <div>
          <h2 className="font-heading font-semibold text-white text-lg mb-6">{t.realEstateSection.tabHowItWorks}</h2>
          <div className="space-y-3 max-w-3xl">
            {[
              { id: 1, question: t.realEstateSection.faq1Question, answer: t.realEstateSection.faq1Answer },
              { id: 2, question: t.realEstateSection.faq2Question, answer: t.realEstateSection.faq2Answer },
              { id: 3, question: t.realEstateSection.faq3Question, answer: t.realEstateSection.faq3Answer },
              { id: 4, question: t.realEstateSection.faq4Question, answer: t.realEstateSection.faq4Answer },
              { id: 5, question: t.realEstateSection.faq5Question, answer: t.realEstateSection.faq5Answer },
            ].map((item) => (
              <div key={item.id} className="border border-[#1e2733] rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#0c1320] transition-colors"
                >
                  <span className={cn(
                    'flex items-center justify-center h-6 w-6 rounded text-xs font-semibold',
                    expandedFaq === item.id ? 'bg-[#22c55e] text-white' : 'bg-[#1a2332] text-[#6b7a90]'
                  )}>
                    {item.id}
                  </span>
                  <span className="flex-1 text-white text-sm font-medium">{item.question}</span>
                  <ChevronDown className={cn('h-5 w-5 text-[#6b7a90] transition-transform', expandedFaq === item.id && 'rotate-180')} />
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
                        <p className="text-[#8b9ab4] text-sm leading-relaxed">{item.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Property Detail Panel */}
      {showDetailPanel && selectedProperty && (
        <PropertyDetailPanel
          property={selectedProperty}
          isOpen={showDetailPanel}
          onClose={() => setShowDetailPanel(false)}
          onInvest={() => {
            setShowDetailPanel(false);
            setShowInvestModal(true);
          }}
        />
      )}

      {/* Invest Modal */}
      {showInvestModal && selectedProperty && (
        <InvestModal
          property={selectedProperty}
          userBalance={realEstateBalance}
          isProcessing={isInvesting}
          onClose={() => setShowInvestModal(false)}
          onConfirm={handleInvestConfirm}
        />
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
                      <h3 className="text-lg font-semibold text-white">{t.realEstateSection.depositToRealEstate}</h3>
                      <p className="text-sm text-[#6b7a90]">{t.realEstateSection.transferFromHoldings}</p>
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
                    <p className="text-sm text-[#6b7a90]">{t.realEstateSection.selectTokenDeposit}</p>
                    {holdings.length === 0 ? (
                      <div className="text-center py-8">
                        <Wallet className="h-10 w-10 text-[#6b7a90] mx-auto mb-3" />
                        <p className="text-[#6b7a90]">{t.realEstateSection.noTokensFound}</p>
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
                    <button onClick={() => { setSelectedToken(null); setTransferAmount(''); }} className="flex items-center gap-2 text-[#6b7a90] hover:text-white text-sm">
                      <ChevronDown className="h-4 w-4 rotate-90" />
                      {t.realEstateSection.changeToken}
                    </button>

                    <div className="flex items-center gap-3 p-4 bg-[#0a0e14] rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-[#1a2332] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{selectedToken.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedToken.symbol}</p>
                        <p className="text-xs text-[#6b7a90]">{t.realEstateSection.balanceLabel} {selectedToken.amount.toFixed(6)} ({formatCurrency(selectedToken.amountUsd)})</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-[#6b7a90]">{t.realEstateSection.amount} ({depositInputMode === 'usd' ? 'USD' : selectedToken.symbol})</label>
                        <div className="flex items-center bg-[#0a0e14] rounded-lg p-0.5">
                          <button
                            onClick={() => { setDepositInputMode('usd'); setTransferAmount(''); }}
                            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors', depositInputMode === 'usd' ? 'bg-[#22c55e] text-white' : 'text-[#6b7a90] hover:text-white')}
                          >
                            USD
                          </button>
                          <button
                            onClick={() => { setDepositInputMode('token'); setTransferAmount(''); }}
                            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors', depositInputMode === 'token' ? 'bg-[#22c55e] text-white' : 'text-[#6b7a90] hover:text-white')}
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
                      {isProcessingTransfer ? <><Loader2 className="h-4 w-4 animate-spin" />{t.realEstateSection.processing}</> : t.realEstateSection.deposit}
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
                      <h3 className="text-lg font-semibold text-white">{t.realEstateSection.withdrawFromRealEstate}</h3>
                      <p className="text-sm text-[#6b7a90]">{t.realEstateSection.transferToHoldings}</p>
                    </div>
                  </div>
                  <button onClick={() => setWithdrawModalOpen(false)} className="text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="p-4 bg-[#0a0e14] rounded-lg">
                  <p className="text-sm text-[#6b7a90]">{t.realEstateSection.availableToWithdraw}</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(realEstateBalance)}</p>
                </div>

                {!selectedToken ? (
                  <>
                    <p className="text-sm text-[#6b7a90]">{t.realEstateSection.selectTokenReceive}</p>
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
                    <button onClick={() => { setSelectedToken(null); setTransferAmount(''); }} className="flex items-center gap-2 text-[#6b7a90] hover:text-white text-sm">
                      <ChevronDown className="h-4 w-4 rotate-90" />
                      {t.realEstateSection.changeToken}
                    </button>

                    <div className="flex items-center gap-3 p-4 bg-[#0a0e14] rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-[#1a2332] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{selectedToken.symbol.slice(0, 2)}</span>
                      </div>
                      <p className="text-white font-medium">{selectedToken.symbol}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-[#6b7a90]">{t.realEstateSection.amount} ({withdrawInputMode === 'usd' ? 'USD' : selectedToken.symbol})</label>
                        <div className="flex items-center bg-[#0a0e14] rounded-lg p-0.5">
                          <button
                            onClick={() => { setWithdrawInputMode('usd'); setTransferAmount(''); }}
                            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors', withdrawInputMode === 'usd' ? 'bg-[#22c55e] text-white' : 'text-[#6b7a90] hover:text-white')}
                          >
                            USD
                          </button>
                          <button
                            onClick={() => { setWithdrawInputMode('token'); setTransferAmount(''); }}
                            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors', withdrawInputMode === 'token' ? 'bg-[#22c55e] text-white' : 'text-[#6b7a90] hover:text-white')}
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
                              setTransferAmount(realEstateBalance.toFixed(2));
                            } else {
                              setTransferAmount((realEstateBalance / selectedToken.price).toFixed(6));
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
                      {isProcessingTransfer ? <><Loader2 className="h-4 w-4 animate-spin" />{t.realEstateSection.processing}</> : t.realEstateSection.withdraw}
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
