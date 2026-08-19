'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Circle,
  Check,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  ArrowDownToLine,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Dashboard Page - Responsive + Real Trading API
// ============================================

// Trading assets for the form
const tradingAssets = [
  { symbol: 'BTC', name: 'Bitcoin', price: 68400.31, type: 'Crypto', logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { symbol: 'ETH', name: 'Ethereum', price: 3520.45, type: 'Crypto', logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { symbol: 'SOL', name: 'Solana', price: 148.92, type: 'Crypto', logo: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { symbol: 'BNB', name: 'BNB', price: 598.75, type: 'Crypto', logo: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { symbol: 'AAPL', name: 'Apple', price: 251.62, type: 'Stocks' },
  { symbol: 'GOOGL', name: 'Google', price: 156.78, type: 'Stocks' },
  { symbol: 'MSFT', name: 'Microsoft', price: 378.91, type: 'Stocks' },
  { symbol: 'TSLA', name: 'Tesla', price: 245.67, type: 'Stocks' },
  { symbol: 'NVDA', name: 'NVIDIA', price: 875.28, type: 'Stocks' },
];

// Duration options created dynamically inside component to access translations
const durationValues = ['1m', '2m', '5m', '15m', '30m', '1h', '4h', '1d'] as const;

// Default assets when no holdings (6 tokens)
const defaultAssets = [
  { symbol: 'BTC', name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', amount: 0, amountUsd: 0 },
  { symbol: 'ETH', name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', amount: 0, amountUsd: 0 },
  { symbol: 'SOL', name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', amount: 0, amountUsd: 0 },
  { symbol: 'USDT', name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', amount: 0, amountUsd: 0 },
  { symbol: 'BNB', name: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', amount: 0, amountUsd: 0 },
  { symbol: 'XRP', name: 'XRP', icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', amount: 0, amountUsd: 0 },
];

// TradingView Widget Component
function TradingViewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current.querySelector('.tradingview-widget-container__widget');
    if (container) container.innerHTML = '';

    if (scriptRef.current && scriptRef.current.parentNode) {
      scriptRef.current.parentNode.removeChild(scriptRef.current);
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'CRYPTOCAP:BTC',
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      backgroundColor: 'rgba(15, 20, 25, 1)',
      gridColor: 'rgba(30, 39, 51, 0.5)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: true,
      support_host: 'https://www.tradingview.com',
    });

    containerRef.current?.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container h-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full" />
    </div>
  );
}

// Interfaces
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface Holding {
  symbol: string;
  name: string;
  icon: string;
  amount: number;
  amountUsd: number;
  color?: string;
}

interface Activity {
  id: string;
  type: 'deposit' | 'withdrawal';
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

interface TradingAccount {
  balance: number;
  totalPnl: number;
  totalTrades: number;
  winRate: string;
}

interface TradePosition {
  id: string;
  type: 'buy' | 'sell';
  assetType: 'Crypto' | 'Stocks';
  symbol: string;
  name: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  stopLoss: number | null;
  takeProfit: number | null;
  pnl: number;
  pnlPercent: number;
  status: 'open' | 'closed';
  closeReason?: string;
  expiresAt?: Date;
}

type OrderTab = 'buy' | 'sell' | 'convert';
type TradeFilter = 'all' | 'swaps' | 'auto';
type DashboardTab = 'assets' | 'overview';

export default function DashboardPage() {
  // Translation hook
  const { t } = useLanguage();
  
  // Duration options with translations
  const durationOptions = [
    { value: '1m', label: t.dashboard.min1 },
    { value: '2m', label: t.dashboard.min2 },
    { value: '5m', label: t.dashboard.min5 },
    { value: '15m', label: t.dashboard.min15 },
    { value: '30m', label: t.dashboard.min30 },
    { value: '1h', label: t.dashboard.hour1 },
    { value: '4h', label: t.dashboard.hours4 },
    { value: '1d', label: t.dashboard.day1 },
  ];
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  
  // Balance state
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  
  // Dashboard tab state (mobile)
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('assets');
  
  // Holdings and activities
  const [holdings, setHoldings] = useState<Holding[]>(defaultAssets);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [hasActivities, setHasActivities] = useState(false);

  // Trading Account & Positions (Real API)
  const [tradingAccount, setTradingAccount] = useState<TradingAccount | null>(null);
  const [positions, setPositions] = useState<TradePosition[]>([]);
  const [isLoadingTrading, setIsLoadingTrading] = useState(true);

  // Trade form state
  const [orderTab, setOrderTab] = useState<OrderTab>('buy');
  const [tradeType, setTradeType] = useState<'Crypto' | 'Stocks'>('Crypto');
  const [selectedAsset, setSelectedAsset] = useState(tradingAssets[0]);
  const [amount, setAmount] = useState('100');
  const [leverage, setLeverage] = useState(10);
  const [useTpSl, setUseTpSl] = useState(false);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [duration, setDuration] = useState('2m');
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Trades state
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>('all');
  const [openTradesExpanded, setOpenTradesExpanded] = useState(true);
  const [closedTradesExpanded, setClosedTradesExpanded] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Progress stats
  const [tradingProgress, setTradingProgress] = useState(0);
  const [signalStrength, setSignalStrength] = useState(0);

  // Price simulation intervals ref
  const priceIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Calculate positions
  const openPositions = positions.filter(p => p.status === 'open');
  const closedPositions = positions.filter(p => p.status === 'closed');

  // Fetch trading account data
  const fetchTradingAccount = useCallback(async () => {
    try {
      const res = await fetch('/api/trading/account');
      const data = await res.json();
      if (res.ok) {
        setTradingAccount(data.account);
      }
    } catch (error) {
      console.log('Trading account fetch error:', error);
    }
  }, []);

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/trading/positions');
      const data = await res.json();
      if (res.ok) {
        setPositions(data.positions.map((p: any) => ({
          ...p,
          expiresAt: p.expiresAt ? new Date(p.expiresAt) : undefined,
        })));
      }
    } catch (error) {
      console.log('Positions fetch error:', error);
    } finally {
      setIsLoadingTrading(false);
    }
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    setIsLoading(true);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/user/dashboard', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        
        if (res.ok) {
          // Use available balance to match navbar display
          setTotalBalance(data.balance?.available || 0);
          
          // Merge user holdings with default assets
          // User holdings with balance > 0 come first, sorted by amountUsd
          // Then fill remaining slots with default tokens they don't already hold
          const userHoldings = data.holdings || [];
          const holdingsWithBalance = userHoldings
            .filter((h: Holding) => h.amountUsd > 0)
            .sort((a: Holding, b: Holding) => b.amountUsd - a.amountUsd);
          
          const holdingSymbols = new Set(holdingsWithBalance.map((h: Holding) => h.symbol));
          const remainingDefaults = defaultAssets
            .filter(d => !holdingSymbols.has(d.symbol))
            .slice(0, 6 - holdingsWithBalance.length);
          
          const mergedHoldings = [...holdingsWithBalance, ...remainingDefaults].slice(0, 6);
          setHoldings(mergedHoldings.length > 0 ? mergedHoldings : defaultAssets);
          
          if (data.recentActivities && data.recentActivities.length > 0) {
            setRecentActivities(data.recentActivities);
            setHasActivities(true);
          }
          
          const totalDeposits = data.categories?.deposits?.total || 0;
          if (totalDeposits > 0) {
            setTradingProgress(Math.min(100, Math.round((totalDeposits / 10000) * 100)));
            setSignalStrength(Math.min(100, Math.round((totalDeposits / 5000) * 100)));
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.log('Dashboard fetch issue:', error.message);
        }
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    fetchTradingAccount();
    fetchPositions();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchTradingAccount, fetchPositions]);

  // Start price simulation for open positions
  useEffect(() => {
    priceIntervalsRef.current.forEach(interval => clearInterval(interval));
    priceIntervalsRef.current.clear();

    openPositions.forEach(position => {
      const interval = setInterval(() => {
        setPositions(prev => prev.map(p => {
          if (p.id !== position.id || p.status !== 'open') return p;
          
          const change = (Math.random() - 0.5) * 0.04;
          const newPrice = p.currentPrice * (1 + change);
          
          const priceDiff = p.type === 'buy' 
            ? newPrice - p.entryPrice 
            : p.entryPrice - newPrice;
          const pnl = priceDiff * p.amount * p.leverage;
          const pnlPercent = (priceDiff / p.entryPrice) * 100 * p.leverage;

          let shouldClose = false;
          let closeReason = 'manual';

          if (p.stopLoss) {
            if ((p.type === 'buy' && newPrice <= p.stopLoss) || (p.type === 'sell' && newPrice >= p.stopLoss)) {
              shouldClose = true;
              closeReason = 'stop_loss';
            }
          }
          if (p.takeProfit) {
            if ((p.type === 'buy' && newPrice >= p.takeProfit) || (p.type === 'sell' && newPrice <= p.takeProfit)) {
              shouldClose = true;
              closeReason = 'take_profit';
            }
          }

          if (p.expiresAt && new Date() >= p.expiresAt) {
            shouldClose = true;
            closeReason = 'expired';
          }

          if (shouldClose) {
            handleClosePositionAPI(p.id, newPrice, closeReason);
            return p;
          }

          return { ...p, currentPrice: newPrice, pnl, pnlPercent };
        }));
      }, 2000);

      priceIntervalsRef.current.set(position.id, interval);
    });

    return () => {
      priceIntervalsRef.current.forEach(interval => clearInterval(interval));
    };
  }, [openPositions.length]);

  // Filter assets by type
  const filteredAssets = tradingAssets.filter(a => a.type === tradeType);

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  // Set AI-suggested TP/SL
  const handleSetWithAI = async () => {
    setIsAILoading(true);
    setUseTpSl(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const price = selectedAsset.price;
    const slPercent = 0.015 + Math.random() * 0.015;
    const tpPercent = 0.03 + Math.random() * 0.04;
    
    if (orderTab === 'buy') {
      setStopLoss((price * (1 - slPercent)).toFixed(2));
      setTakeProfit((price * (1 + tpPercent)).toFixed(2));
    } else {
      setStopLoss((price * (1 + slPercent)).toFixed(2));
      setTakeProfit((price * (1 - tpPercent)).toFixed(2));
    }
    
    setIsAILoading(false);
    addToast('success', t.dashboard.aiSetTpSl);
  };

  // Execute trade via real API
  const handleExecuteTrade = async () => {
    const tradeAmount = parseFloat(amount);
    
    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      addToast('error', t.dashboard.enterValidAmount);
      return;
    }

    if (!tradingAccount || tradingAccount.balance <= 0) {
      addToast('error', t.dashboard.fundTradingFirst);
      return;
    }

    const positionValue = tradeAmount * selectedAsset.price;
    const marginRequired = positionValue / leverage;

    if (marginRequired > tradingAccount.balance) {
      addToast('error', `${t.dashboard.marginRequired} ${formatCurrency(marginRequired)}`);
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/trading/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: orderTab,
          assetType: tradeType,
          symbol: selectedAsset.symbol,
          name: selectedAsset.name,
          amount: tradeAmount,
          entryPrice: selectedAsset.price,
          leverage,
          stopLoss: useTpSl && stopLoss ? stopLoss : null,
          takeProfit: useTpSl && takeProfit ? takeProfit : null,
          duration,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPositions(prev => [{
          ...data.position,
          expiresAt: data.position.expiresAt ? new Date(data.position.expiresAt) : undefined,
        }, ...prev]);
        
        if (data.account) {
          setTradingAccount(prev => prev ? { ...prev, balance: data.account.balance } : prev);
        }

        addToast('success', `${orderTab.toUpperCase()} ${t.dashboard.tradeExecuted} ${tradeAmount} ${selectedAsset.symbol}`);
      } else {
        addToast('error', data.error || t.dashboard.tradeFailed);
      }
    } catch (error) {
      console.error('Trade error:', error);
      addToast('error', t.dashboard.tradeFailed);
    } finally {
      setIsProcessing(false);
    }
  };

  // Close position via API
  const handleClosePositionAPI = async (positionId: string, currentPrice?: number, closeReason: string = 'manual') => {
    try {
      const res = await fetch('/api/trading/positions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId, action: 'close', currentPrice, closeReason }),
      });

      const data = await res.json();

      if (res.ok) {
        setPositions(prev => prev.map(p => {
          if (p.id !== positionId) return p;
          return { ...p, ...data.position, status: 'closed' as const };
        }));

        if (data.account) {
          setTradingAccount(prev => prev ? { 
            ...prev, 
            balance: data.account.balance,
            totalPnl: data.account.totalPnl,
          } : prev);
        }

        const interval = priceIntervalsRef.current.get(positionId);
        if (interval) {
          clearInterval(interval);
          priceIntervalsRef.current.delete(positionId);
        }

        addToast(data.position.pnl >= 0 ? 'success' : 'error', 
          `${t.dashboard.positionClosed} ${data.position.pnl >= 0 ? '+' : ''}${formatCurrency(data.position.pnl)}`
        );
      }
    } catch (error) {
      console.error('Close position error:', error);
    }
  };

  const handleClosePosition = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (position) {
      handleClosePositionAPI(positionId, position.currentPrice, 'manual');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Section: Balance + Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Balance Card */}
        <div className="lg:col-span-2 bg-[#0f1419] rounded-xl border border-[#1e2733] p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <span className="text-[#6b7a90] text-sm">{t.dashboard.totalBalance}</span>
              <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-[#6b7a90] hover:text-white">
                {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            <Link href="/deposit" className="hidden sm:flex items-center justify-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#1ea550] text-white text-sm font-medium rounded-lg transition-colors">
              <Sparkles className="h-4 w-4" />
              {t.dashboard.moveMoney}
              <ChevronUp className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="h-10 md:h-12 w-40 md:w-48 bg-[#1e2733] rounded animate-pulse mb-4 md:mb-6" />
          ) : (
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">
              {balanceVisible ? formatCurrency(totalBalance) : '••••••'}
            </h2>
          )}

          {/* Mobile: 4-column action buttons grid */}
          <div className="grid grid-cols-4 gap-2 mb-6 md:hidden">
            <Link href="/deposit" className="flex flex-col items-center gap-2 p-3 bg-[#151c24] border border-[#1e2733] rounded-lg text-white hover:border-[#22c55e] transition-colors">
              <Plus className="h-5 w-5" />
              <span className="text-xs">{t.nav.deposit}</span>
            </Link>
            <Link href="/withdraw" className="flex flex-col items-center gap-2 p-3 bg-[#151c24] border border-[#1e2733] rounded-lg text-white hover:border-[#22c55e] transition-colors">
              <ArrowUpRight className="h-5 w-5" />
              <span className="text-xs">{t.nav.withdraw}</span>
            </Link>
            <Link href="/trade" className="flex flex-col items-center gap-2 p-3 bg-[#151c24] border border-[#1e2733] rounded-lg text-white hover:border-[#22c55e] transition-colors">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">{t.nav.trade}</span>
            </Link>
            <button className="flex flex-col items-center gap-2 p-3 bg-[#151c24] border border-[#1e2733] rounded-lg text-[#6b7a90] cursor-not-allowed">
              <ArrowDownToLine className="h-5 w-5 rotate-90" />
              <span className="text-xs">{t.dashboard.convert}</span>
            </button>
          </div>

          {/* Desktop: horizontal action buttons */}
          <div className="hidden md:flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
            <Link href="/deposit" className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-[#151c24] border border-[#1e2733] rounded-lg text-white hover:border-[#22c55e] transition-colors text-sm">
              <Plus className="h-4 w-4" />
              {t.nav.deposit}
            </Link>
            <Link href="/withdraw" className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-[#151c24] border border-[#1e2733] rounded-lg text-white hover:border-[#22c55e] transition-colors text-sm">
              <ArrowUpRight className="h-4 w-4" />
              {t.nav.withdraw}
            </Link>
            <Link href="/trade" className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-[#151c24] border border-[#1e2733] rounded-lg text-white hover:border-[#22c55e] transition-colors text-sm">
              <TrendingUp className="h-4 w-4" />
              {t.nav.trade}
            </Link>
          </div>

          {/* Mobile Tabs */}
          <div className="flex gap-6 mb-4 md:hidden border-b border-[#1e2733]">
            <button 
              onClick={() => setDashboardTab('assets')}
              className={cn(
                "pb-3 text-sm font-medium transition-colors relative",
                dashboardTab === 'assets' 
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#22c55e]" 
                  : "text-[#6b7a90] hover:text-white"
              )}
            >
              {t.nav.assets}
            </button>
            <button 
              onClick={() => setDashboardTab('overview')}
              className={cn(
                "pb-3 text-sm font-medium transition-colors relative",
                dashboardTab === 'overview' 
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#22c55e]" 
                  : "text-[#6b7a90] hover:text-white"
              )}
            >
              {t.dashboard.accountSummary}
            </button>
          </div>

          {/* Mobile Tab Content */}
          <div className="md:hidden">
            {dashboardTab === 'assets' ? (
              <>
                {/* Top Assets Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium text-sm">{t.nav.assets}</h3>
                  <Link href="/assets" className="text-[#3b82f6] text-xs hover:underline flex items-center gap-1">
                    {t.common.all} <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                
                {/* Assets List */}
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-[#151c24] rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-[#1e2733] rounded-full animate-pulse" />
                          <div>
                            <div className="h-3 w-16 bg-[#1e2733] rounded animate-pulse mb-1" />
                            <div className="h-2 w-10 bg-[#1e2733] rounded animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {holdings.slice(0, 6).map((asset) => (
                      <div key={asset.symbol} className="flex items-center justify-between p-2 bg-[#151c24] rounded-lg hover:bg-[#1a2129] transition-colors">
                        <div className="flex items-center gap-2">
                          {asset.icon ? (
                            <Image src={asset.icon} alt={asset.symbol} width={32} height={32} className="rounded-full w-8 h-8" unoptimized />
                          ) : (
                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs" style={{ backgroundColor: asset.color || '#555555' }}>
                              {asset.symbol.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium text-sm">{asset.name}</p>
                            <p className="text-[#6b7a90] text-xs">{asset.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium text-sm">{formatCurrency(asset.amountUsd)}</p>
                          <p className="text-[#6b7a90] text-xs">{asset.amount.toFixed(4)} {asset.symbol}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Overview - Recent Activity */}
                <h3 className="text-white font-medium text-sm mb-3">{t.dashboard.recentActivity}</h3>
                
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (<div key={i} className="h-14 bg-[#1e2733] rounded-lg animate-pulse" />))}
                  </div>
                ) : !hasActivities ? (
                  <div className="text-center py-8">
                    <p className="text-[#6b7a90] text-sm mb-2">{t.dashboard.recentActivity}</p>
                    <Link href="/deposit" className="text-[#22c55e] hover:underline text-sm">{t.nav.deposit}</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentActivities.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 bg-[#151c24] rounded-lg">
                        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', activity.type === 'deposit' ? 'bg-[#22c55e]/10' : 'bg-[#ef4444]/10')}>
                          {activity.type === 'deposit' ? <ArrowDown className="h-4 w-4 text-[#22c55e]" /> : <ArrowUp className="h-4 w-4 text-[#ef4444]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-[#6b7a90] text-xs truncate">{activity.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn('text-sm font-medium', activity.type === 'deposit' ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                            {activity.type === 'deposit' ? '+' : '-'}{formatCurrency(activity.amount)}
                          </p>
                          <p className="text-xs text-[#6b7a90] capitalize">{activity.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Desktop: Top Assets (always visible) */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-white font-medium text-sm md:text-base">{t.nav.assets}</h3>
              <Link href="/assets" className="text-[#3b82f6] text-xs md:text-sm hover:underline flex items-center gap-1">
                {t.common.all} <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
              </Link>
            </div>

          {isLoading ? (
            <div className="hidden md:block space-y-2 md:space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center justify-between p-2 md:p-3 bg-[#151c24] rounded-lg">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="h-8 w-8 md:h-10 md:w-10 bg-[#1e2733] rounded-full animate-pulse" />
                    <div>
                      <div className="h-3 md:h-4 w-16 md:w-20 bg-[#1e2733] rounded animate-pulse mb-1" />
                      <div className="h-2 md:h-3 w-10 md:w-12 bg-[#1e2733] rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="hidden md:block space-y-2 md:space-y-3">
              {holdings.slice(0, 6).map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between p-2 md:p-3 bg-[#151c24] rounded-lg hover:bg-[#1a2129] transition-colors">
                  <div className="flex items-center gap-2 md:gap-3">
                    {asset.icon ? (
                      <Image src={asset.icon} alt={asset.symbol} width={32} height={32} className="rounded-full w-8 h-8 md:w-10 md:h-10" unoptimized />
                    ) : (
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm" style={{ backgroundColor: asset.color || '#555555' }}>
                        {asset.symbol.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium text-sm md:text-base">{asset.name}</p>
                      <p className="text-[#6b7a90] text-xs md:text-sm">{asset.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium text-sm md:text-base">{formatCurrency(asset.amountUsd)}</p>
                    <p className="text-[#6b7a90] text-xs md:text-sm">{asset.amount.toFixed(4)} {asset.symbol}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4 md:p-6">
          {/* Trading Account Stats */}
          <div className="mb-4 md:mb-6 pb-4 md:pb-6 border-b border-[#1e2733]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium text-sm md:text-base">{t.dashboard.tradingAccount}</h3>
              <Link href="/trade" className="text-[#3b82f6] text-xs hover:underline">{t.common.open}</Link>
            </div>
            
            {isLoadingTrading ? (
              <div className="h-8 w-24 bg-[#1e2733] rounded animate-pulse" />
            ) : (
              <>
                <p className="text-xl md:text-2xl font-bold text-white mb-3">{formatCurrency(tradingAccount?.balance || 0)}</p>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="bg-[#151c24] rounded-lg p-2 md:p-3">
                    <p className="text-[#6b7a90] text-xs mb-0.5">{t.dashboard.totalPnl}</p>
                    <p className={cn('text-sm md:text-base font-semibold', (tradingAccount?.totalPnl || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                      {(tradingAccount?.totalPnl || 0) >= 0 ? '+' : ''}{formatCurrency(tradingAccount?.totalPnl || 0)}
                    </p>
                  </div>
                  <div className="bg-[#151c24] rounded-lg p-2 md:p-3">
                    <p className="text-[#6b7a90] text-xs mb-0.5">{t.dashboard.winRate}</p>
                    <p className="text-sm md:text-base font-semibold text-white">{tradingAccount?.winRate || '0.0'}%</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <h3 className="text-white font-medium mb-3 md:mb-4 text-sm md:text-base">{t.dashboard.recentActivity}</h3>
          
          {isLoading ? (
            <div className="space-y-2 md:space-y-3">
              {[1, 2, 3].map((i) => (<div key={i} className="h-14 md:h-16 bg-[#1e2733] rounded-lg animate-pulse" />))}
            </div>
          ) : !hasActivities ? (
            <div className="text-center py-6 md:py-8">
              <p className="text-[#6b7a90] text-sm mb-2">{t.dashboard.noActivityYet}</p>
              <Link href="/deposit" className="text-[#22c55e] hover:underline text-sm">{t.dashboard.depositNow}</Link>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {recentActivities.slice(0, 4).map((activity) => (
                <div key={activity.id} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-[#151c24] rounded-lg">
                  <div className={cn('h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center shrink-0', activity.type === 'deposit' ? 'bg-[#22c55e]/10' : 'bg-[#ef4444]/10')}>
                    {activity.type === 'deposit' ? <ArrowDown className="h-3 w-3 md:h-4 md:w-4 text-[#22c55e]" /> : <ArrowUp className="h-3 w-3 md:h-4 md:w-4 text-[#ef4444]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs md:text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-[#6b7a90] text-xs truncate">{activity.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-xs md:text-sm font-medium', activity.type === 'deposit' ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                      {activity.type === 'deposit' ? '+' : '-'}{formatCurrency(activity.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress Cards */}
          <div className="mt-4 md:mt-6 space-y-3 md:space-y-4">
            <div className="bg-[#151c24] rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6b7a90] text-xs md:text-sm">{t.dashboard.tradingProgress}</span>
                <span className="text-[#22c55e] font-medium text-xs md:text-sm">{tradingProgress}%</span>
              </div>
              <div className="h-1 md:h-1.5 bg-[#1e2733] rounded-full overflow-hidden">
                <div className="h-full bg-[#22c55e] rounded-full transition-all duration-500" style={{ width: `${tradingProgress}%` }} />
              </div>
            </div>
            <div className="bg-[#151c24] rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6b7a90] text-xs md:text-sm">{t.dashboard.signalStrength}</span>
                <span className="text-[#22c55e] font-medium text-xs md:text-sm">{signalStrength}%</span>
              </div>
              <div className="flex gap-0.5 md:gap-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className={cn('flex-1 h-2 md:h-3 rounded-sm', i < Math.round(signalStrength / 5) ? 'bg-[#22c55e]' : 'bg-[#1e2733]')} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Trading Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden h-[300px] md:h-[500px]">
          <TradingViewWidget />
        </div>

        {/* Trading Panel */}
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-3 md:p-4 overflow-hidden md:h-[500px] md:overflow-y-auto">
          {/* Trading Balance Mini */}
          <div className="flex items-center justify-between mb-3 md:mb-4 pb-3 border-b border-[#1e2733]">
            <div>
              <p className="text-[#6b7a90] text-xs">{t.dashboard.tradingBalance}</p>
              <p className="text-white font-semibold text-sm md:text-base">{formatCurrency(tradingAccount?.balance || 0)}</p>
            </div>
            <Link href="/trade" className="flex items-center gap-1 px-2 md:px-3 py-1.5 bg-[#22c55e] hover:bg-[#1ea550] text-white text-xs font-medium rounded-lg transition-colors">
              <ArrowDownToLine className="h-3 w-3" />
              {t.dashboard.fund}
            </Link>
          </div>

          {/* Order Tabs */}
          <div className="flex gap-1 md:gap-2 mb-3 md:mb-4">
            {(['buy', 'sell', 'convert'] as OrderTab[]).map((tab) => (
              <button key={tab} onClick={() => setOrderTab(tab)} className={cn('flex-1 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors capitalize', orderTab === tab ? (tab === 'buy' ? 'bg-[#22c55e] text-white' : tab === 'sell' ? 'bg-[#ef4444] text-white' : 'bg-[#6b7a90] text-white') : 'bg-[#151c24] text-[#6b7a90] hover:text-white')}>
                {tab === 'buy' ? t.trading.buy : tab === 'sell' ? t.trading.sell : t.dashboard.convert}
              </button>
            ))}
          </div>

          {/* Trade Type */}
          <div className="mb-3">
            <label className="text-xs text-[#6b7a90] mb-1 block">{t.dashboard.type}:</label>
            <div className="relative">
              <button onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} className="w-full flex items-center justify-between px-2 md:px-3 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-sm">
                <span>{tradeType}</span>
                <ChevronDown className={cn('h-3 w-3 md:h-4 md:w-4 text-[#6b7a90] transition-transform', isTypeDropdownOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {isTypeDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-1 bg-[#0f1419] border border-[#1e2733] rounded-lg shadow-xl z-20">
                    {['Crypto', 'Stocks'].map((type) => (
                      <button key={type} onClick={() => { setTradeType(type as 'Crypto' | 'Stocks'); const firstAsset = tradingAssets.find(a => a.type === type); if (firstAsset) setSelectedAsset(firstAsset); setIsTypeDropdownOpen(false); }} className={cn('w-full px-3 py-2 text-left text-sm transition-colors', tradeType === type ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'text-white hover:bg-[#1e2733]')}>
                        {type}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Amount + Asset */}
          <div className="mb-3">
            <label className="text-xs text-[#6b7a90] mb-1 block">{t.dashboard.amount}:</label>
            <div className="flex gap-2">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 min-w-0 px-2 md:px-3 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-sm focus:outline-none focus:border-[#22c55e]" placeholder="0" />
              <div className="relative shrink-0">
                <button onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)} className="flex items-center gap-1 px-2 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white whitespace-nowrap">
                  <span className="text-xs md:text-sm">{selectedAsset.symbol}</span>
                  <ChevronDown className={cn('h-3 w-3 text-[#6b7a90] transition-transform', isAssetDropdownOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {isAssetDropdownOpen && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full right-0 mt-1 w-32 md:w-40 bg-[#0f1419] border border-[#1e2733] rounded-lg shadow-xl z-20 max-h-40 md:max-h-48 overflow-y-auto">
                      {filteredAssets.map((asset) => (
                        <button key={asset.symbol} onClick={() => { setSelectedAsset(asset); setIsAssetDropdownOpen(false); }} className={cn('w-full px-3 py-2 text-left text-xs md:text-sm transition-colors', selectedAsset.symbol === asset.symbol ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'text-white hover:bg-[#1e2733]')}>
                          {asset.symbol}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Leverage */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#6b7a90]">{t.trading.leverage}:</label>
              <span className="text-sm text-white font-semibold">{leverage}x</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={leverage} 
              onChange={(e) => setLeverage(parseInt(e.target.value))} 
              className="leverage-slider w-full"
              style={{ 
                background: `linear-gradient(to right, #22c55e 0%, #22c55e ${leverage}%, #1e2733 ${leverage}%, #1e2733 100%)` 
              }} 
            />
          </div>

          {/* Balance Info */}
          <div className="space-y-1 mb-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6b7a90]">{t.trading.price}:</span>
              <span className="text-[#22c55e]">{formatCurrency(selectedAsset.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7a90]">{t.dashboard.margin}:</span>
              <span className="text-white">{formatCurrency((parseFloat(amount) * selectedAsset.price) / leverage || 0)}</span>
            </div>
          </div>

          {/* TP/SL Toggle */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setUseTpSl(!useTpSl)} 
                style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px' }}
                className={cn(
                  'rounded border-2 flex items-center justify-center transition-colors',
                  useTpSl ? 'bg-[#22c55e] border-[#22c55e]' : 'bg-transparent border-[#3a4553]'
                )}
              >
                {useTpSl && <Check style={{ width: '12px', height: '12px' }} className="text-white" />}
              </button>
              <span className="text-sm text-white">{t.dashboard.useTpSl}</span>
            </div>
            <button 
              onClick={handleSetWithAI} 
              disabled={isAILoading} 
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#3a4553] rounded-lg text-sm text-[#6b7a90] hover:text-white hover:border-[#6b7a90] transition-colors"
            >
              {isAILoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {t.dashboard.setWithAI}
            </button>
          </div>

          {/* TP/SL Inputs */}
          {useTpSl && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] text-[#6b7a90] mb-0.5 block">{t.trading.stopLoss}:</label>
                <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder={selectedAsset.price.toFixed(2)} className="w-full px-2 py-1.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-xs focus:outline-none focus:border-[#22c55e]" />
              </div>
              <div>
                <label className="text-[10px] text-[#6b7a90] mb-0.5 block">{t.trading.takeProfit}:</label>
                <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder={selectedAsset.price.toFixed(2)} className="w-full px-2 py-1.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-xs focus:outline-none focus:border-[#22c55e]" />
              </div>
            </div>
          )}

          {/* Duration */}
          <div className="mb-3">
            <label className="text-xs text-[#6b7a90] mb-1 block">{t.dashboard.duration}:</label>
            <div className="relative">
              <button onClick={() => setIsDurationDropdownOpen(!isDurationDropdownOpen)} className="w-full flex items-center justify-between px-2 md:px-3 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-sm">
                <span>{durationOptions.find(d => d.value === duration)?.label}</span>
                <ChevronDown className={cn('h-3 w-3 md:h-4 md:w-4 text-[#6b7a90] transition-transform', isDurationDropdownOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {isDurationDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute bottom-full left-0 right-0 mb-1 bg-[#0f1419] border border-[#1e2733] rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
                    {durationOptions.map((opt) => (
                      <button key={opt.value} onClick={() => { setDuration(opt.value); setIsDurationDropdownOpen(false); }} className={cn('w-full px-3 py-2 text-left text-sm transition-colors', duration === opt.value ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'text-white hover:bg-[#1e2733]')}>
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Execute Button */}
          <button onClick={handleExecuteTrade} disabled={isProcessing || orderTab === 'convert'} className={cn('w-full py-2.5 md:py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm', orderTab === 'buy' ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white' : orderTab === 'sell' ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white' : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed')}>
            {isProcessing ? (<><Loader2 className="h-4 w-4 animate-spin" />{t.common.processing}</>) : (orderTab === 'convert' ? t.common.comingSoon : orderTab === 'buy' ? t.trading.buy : t.trading.sell)}
          </button>
        </div>
      </div>

      {/* My Trades Section */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-white font-medium text-sm md:text-base">{t.dashboard.myTrades}</h3>
          <div className="flex gap-2">
            {(['all', 'swaps', 'auto'] as TradeFilter[]).map((filter) => (
              <button 
                key={filter} 
                onClick={() => setTradeFilter(filter)} 
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                  tradeFilter === filter 
                    ? 'bg-[#22c55e] text-white' 
                    : 'bg-[#1a2129] text-[#6b7a90] hover:text-white'
                )}
              >
                {filter === 'all' ? t.common.all : filter === 'swaps' ? t.dashboard.swaps : t.dashboard.auto}
              </button>
            ))}
          </div>
        </div>

        {/* Open Trades */}
        <div className="mb-3 md:mb-4">
          <button onClick={() => setOpenTradesExpanded(!openTradesExpanded)} className="flex items-center gap-2 text-[#6b7a90] hover:text-white mb-2 text-sm">
            <Circle className="h-3 w-3 md:h-4 md:w-4 text-[#22c55e]" />
            <span>{t.common.open} ({openPositions.length})</span>
            {openTradesExpanded ? <ChevronUp className="h-3 w-3 md:h-4 md:w-4" /> : <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />}
          </button>
          <AnimatePresence>
            {openTradesExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                {openPositions.length === 0 ? (
                  <div className="text-[#6b7a90] text-xs md:text-sm py-4 text-center bg-[#151c24] rounded-lg">{t.dashboard.noOpenTrades}</div>
                ) : (
                  <div className="space-y-2">
                    {openPositions.map((pos) => (
                      <div key={pos.id} className="flex items-center justify-between p-2 md:p-3 bg-[#151c24] rounded-lg">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={cn('px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs font-medium', pos.type === 'buy' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]')}>{pos.type.toUpperCase()}</div>
                          <div>
                            <p className="text-xs md:text-sm font-medium text-white">{pos.symbol}</p>
                            <p className="text-[10px] md:text-xs text-[#6b7a90]">{pos.amount} @ {formatCurrency(pos.entryPrice)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className="text-right">
                            <p className={cn('text-xs md:text-sm font-medium', pos.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)}</p>
                            <p className={cn('text-[10px] md:text-xs', pos.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%</p>
                          </div>
                          <button onClick={() => handleClosePosition(pos.id)} className="px-2 md:px-3 py-1 bg-[#ef4444]/10 text-[#ef4444] rounded text-[10px] md:text-xs hover:bg-[#ef4444]/20 transition-colors">{t.common.close}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Closed Trades */}
        <div>
          <button onClick={() => setClosedTradesExpanded(!closedTradesExpanded)} className="flex items-center gap-2 text-[#6b7a90] hover:text-white mb-2 text-sm">
            <Check className="h-3 w-3 md:h-4 md:w-4" />
            <span>{t.dashboard.closed} ({closedPositions.length})</span>
            {closedTradesExpanded ? <ChevronUp className="h-3 w-3 md:h-4 md:w-4" /> : <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />}
          </button>
          <AnimatePresence>
            {closedTradesExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                {closedPositions.length === 0 ? (
                  <div className="text-[#6b7a90] text-xs md:text-sm py-4 text-center bg-[#151c24] rounded-lg">{t.dashboard.noClosedTrades}</div>
                ) : (
                  <div className="space-y-2">
                    {closedPositions.slice(0, 5).map((pos) => (
                      <div key={pos.id} className="flex items-center justify-between p-2 md:p-3 bg-[#151c24] rounded-lg opacity-70">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={cn('px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs font-medium', pos.type === 'buy' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]')}>{pos.type.toUpperCase()}</div>
                          <div>
                            <p className="text-xs md:text-sm font-medium text-white">{pos.symbol}</p>
                            <p className="text-[10px] md:text-xs text-[#6b7a90]">{pos.amount} @ {formatCurrency(pos.entryPrice)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn('text-xs md:text-sm font-medium', pos.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)}</p>
                          <p className="text-[10px] md:text-xs text-[#6b7a90] capitalize">{pos.closeReason?.replace('_', ' ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toast Messages */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-2 md:gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div key={toast.id} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className={cn('flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl shadow-xl min-w-[200px] md:min-w-[280px]', toast.type === 'success' && 'bg-[#22c55e] text-white', toast.type === 'error' && 'bg-[#ef4444] text-white', toast.type === 'info' && 'bg-[#3b82f6] text-white')}>
              {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />}
              {toast.type === 'error' && <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />}
              {toast.type === 'info' && <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />}
              <span className="text-xs md:text-sm font-medium flex-1">{toast.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="hover:opacity-80"><X className="h-3 w-3 md:h-4 md:w-4" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
