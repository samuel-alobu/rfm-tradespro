'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Info,
  Loader2,
  TrendingUp,
  Building2,
  ArrowDownUp,
  AlertCircle,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Investing Page - With TradingView Charts
// ============================================

type TabType = 'stocks' | 'realestate' | 'crypto';
type PanelView = 'list' | 'detail' | 'select-token' | 'enter-amount' | 'confirm' | 'processing' | 'success';

interface Toast { id: string; type: 'success' | 'error' | 'info'; message: string; }

interface Holding {
  id: string;
  symbol: string;
  name: string;
  type: string;
  icon: string;
  amount: number;
  amountUsd: number;
  averagePrice: number;
  currentPrice: number;
}

interface StockPosition {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  currentValue: number;
  totalInvested: number;
  pnl: number;
  pnlPercent: number;
}

interface RealEstateInvestment {
  id: string;
  propertyId: string;
  title: string;
  location: string;
  image: string;
  amount: number;
  expectedReturn: number;
  status: string;
}

interface Stock {
  symbol: string;
  name: string;
  logoUrl: string;
  currentPrice: number;
  change24h: number;
  exchange: string;
}

interface CryptoToken {
  symbol: string;
  name: string;
  icon: string;
  price: number;
}

// Stock data
const stocks: Stock[] = [
  { symbol: 'MMM', name: '3M Company', logoUrl: 'https://assets.parqet.com/logos/symbol/MMM', currentPrice: 98.45, change24h: 1.26, exchange: 'NYSE' },
  { symbol: 'ABT', name: 'Abbott Labs', logoUrl: 'https://assets.parqet.com/logos/symbol/ABT', currentPrice: 106.00, change24h: -1.99, exchange: 'NYSE' },
  { symbol: 'ADBE', name: 'Adobe', logoUrl: 'https://assets.parqet.com/logos/symbol/ADBE', currentPrice: 485.50, change24h: 2.34, exchange: 'NASDAQ' },
  { symbol: 'AEMD', name: 'Aethlon Medical', logoUrl: 'https://assets.parqet.com/logos/symbol/AEMD', currentPrice: 1.23, change24h: -0.89, exchange: 'NASDAQ' },
  { symbol: 'BABA', name: 'Alibaba', logoUrl: 'https://assets.parqet.com/logos/symbol/BABA', currentPrice: 78.34, change24h: 0.56, exchange: 'NYSE' },
  { symbol: 'APT', name: 'Alpha Pro Tech', logoUrl: 'https://assets.parqet.com/logos/symbol/APT', currentPrice: 5.67, change24h: -2.34, exchange: 'NYSE' },
  { symbol: 'AMZN', name: 'Amazon', logoUrl: 'https://assets.parqet.com/logos/symbol/AMZN', currentPrice: 178.25, change24h: 1.89, exchange: 'NASDAQ' },
  { symbol: 'AMC', name: 'AMC Holdings', logoUrl: 'https://assets.parqet.com/logos/symbol/AMC', currentPrice: 4.56, change24h: -3.21, exchange: 'NYSE' },
  { symbol: 'AMD', name: 'AMD', logoUrl: 'https://assets.parqet.com/logos/symbol/AMD', currentPrice: 156.78, change24h: 2.45, exchange: 'NASDAQ' },
  { symbol: 'AXP', name: 'American Express', logoUrl: 'https://assets.parqet.com/logos/symbol/AXP', currentPrice: 234.56, change24h: 0.78, exchange: 'NYSE' },
  { symbol: 'AIG', name: 'American International Group', logoUrl: 'https://assets.parqet.com/logos/symbol/AIG', currentPrice: 76.89, change24h: -0.45, exchange: 'NYSE' },
  { symbol: 'AMT', name: 'American Tower', logoUrl: 'https://assets.parqet.com/logos/symbol/AMT', currentPrice: 198.34, change24h: 1.23, exchange: 'NYSE' },
  { symbol: 'ADI', name: 'Analog Devices', logoUrl: 'https://assets.parqet.com/logos/symbol/ADI', currentPrice: 212.45, change24h: 1.67, exchange: 'NASDAQ' },
  { symbol: 'AAPL', name: 'Apple', logoUrl: 'https://assets.parqet.com/logos/symbol/AAPL', currentPrice: 178.72, change24h: 0.89, exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet (Google)', logoUrl: 'https://assets.parqet.com/logos/symbol/GOOGL', currentPrice: 156.23, change24h: 1.45, exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft', logoUrl: 'https://assets.parqet.com/logos/symbol/MSFT', currentPrice: 425.67, change24h: 0.67, exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms', logoUrl: 'https://assets.parqet.com/logos/symbol/META', currentPrice: 512.34, change24h: 2.12, exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA', logoUrl: 'https://assets.parqet.com/logos/symbol/NVDA', currentPrice: 878.90, change24h: 3.45, exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla', logoUrl: 'https://assets.parqet.com/logos/symbol/TSLA', currentPrice: 245.67, change24h: -1.23, exchange: 'NASDAQ' },
  { symbol: 'JPM', name: 'JPMorgan Chase', logoUrl: 'https://assets.parqet.com/logos/symbol/JPM', currentPrice: 198.45, change24h: 0.56, exchange: 'NYSE' },
  { symbol: 'V', name: 'Visa', logoUrl: 'https://assets.parqet.com/logos/symbol/V', currentPrice: 287.34, change24h: 0.89, exchange: 'NYSE' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', logoUrl: 'https://assets.parqet.com/logos/symbol/JNJ', currentPrice: 156.78, change24h: 0.34, exchange: 'NYSE' },
  { symbol: 'WMT', name: 'Walmart', logoUrl: 'https://assets.parqet.com/logos/symbol/WMT', currentPrice: 165.23, change24h: 0.45, exchange: 'NYSE' },
  { symbol: 'PG', name: 'Procter & Gamble', logoUrl: 'https://assets.parqet.com/logos/symbol/PG', currentPrice: 167.89, change24h: 0.23, exchange: 'NYSE' },
  { symbol: 'MA', name: 'Mastercard', logoUrl: 'https://assets.parqet.com/logos/symbol/MA', currentPrice: 456.78, change24h: 1.12, exchange: 'NYSE' },
  { symbol: 'HD', name: 'Home Depot', logoUrl: 'https://assets.parqet.com/logos/symbol/HD', currentPrice: 378.45, change24h: 0.78, exchange: 'NYSE' },
  { symbol: 'DIS', name: 'Walt Disney', logoUrl: 'https://assets.parqet.com/logos/symbol/DIS', currentPrice: 112.34, change24h: -0.56, exchange: 'NYSE' },
  { symbol: 'NFLX', name: 'Netflix', logoUrl: 'https://assets.parqet.com/logos/symbol/NFLX', currentPrice: 634.56, change24h: 1.89, exchange: 'NASDAQ' },
  { symbol: 'CRM', name: 'Salesforce', logoUrl: 'https://assets.parqet.com/logos/symbol/CRM', currentPrice: 267.89, change24h: 1.34, exchange: 'NYSE' },
  { symbol: 'INTC', name: 'Intel', logoUrl: 'https://assets.parqet.com/logos/symbol/INTC', currentPrice: 34.56, change24h: -0.89, exchange: 'NASDAQ' },
];

// Crypto tokens
const cryptoTokens: CryptoToken[] = [
  { symbol: 'BTC', name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', price: 67234.50 },
  { symbol: 'ETH', name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', price: 3456.78 },
  { symbol: 'USDT', name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', price: 1.00 },
  { symbol: 'USDC', name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', price: 1.00 },
  { symbol: 'BNB', name: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', price: 605.23 },
  { symbol: 'SOL', name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', price: 178.45 },
  { symbol: 'XRP', name: 'Ripple', icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', price: 0.62 },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', price: 0.12 },
  { symbol: 'ADA', name: 'Cardano', icon: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', price: 0.45 },
  { symbol: 'AVAX', name: 'Avalanche', icon: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', price: 35.67 },
  { symbol: 'DOT', name: 'Polkadot', icon: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', price: 7.23 },
  { symbol: 'MATIC', name: 'Polygon', icon: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png', price: 0.58 },
  { symbol: 'LINK', name: 'Chainlink', icon: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', price: 14.56 },
  { symbol: 'LTC', name: 'Litecoin', icon: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', price: 84.56 },
  { symbol: 'ATOM', name: 'Cosmos', icon: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png', price: 8.45 },
  { symbol: 'UNI', name: 'Uniswap', icon: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png', price: 9.87 },
  { symbol: 'TRX', name: 'TRON', icon: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png', price: 0.12 },
  { symbol: 'NEAR', name: 'NEAR Protocol', icon: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg', price: 5.23 },
  { symbol: 'APT', name: 'Aptos', icon: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png', price: 9.45 },
  { symbol: 'ARB', name: 'Arbitrum', icon: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg', price: 1.12 },
  { symbol: 'OP', name: 'Optimism', icon: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png', price: 2.34 },
  { symbol: 'FTM', name: 'Fantom', icon: 'https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png', price: 0.78 },
  { symbol: 'AAVE', name: 'Aave', icon: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png', price: 156.78 },
  { symbol: 'CRO', name: 'Cronos', icon: 'https://assets.coingecko.com/coins/images/7310/small/cro_token_logo.png', price: 0.12 },
];

// TradingView Chart Component
function TradingViewChart({ symbol, exchange }: { symbol: string; exchange: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `${exchange}:${symbol}`,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      backgroundColor: 'rgba(15, 20, 25, 1)',
      gridColor: 'rgba(30, 39, 51, 0.5)',
      hide_top_toolbar: false,
      hide_legend: true,
      save_image: false,
      hide_volume: true,
      support_host: 'https://www.tradingview.com',
    });

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    containerRef.current.appendChild(widgetContainer);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, exchange]);

  return <div ref={containerRef} className="tradingview-widget-container h-[300px] w-full" />;
}

// Asset Logo Component
function AssetLogo({ symbol, logoUrl, size = 40 }: { symbol: string; logoUrl: string; size?: number }) {
  const [error, setError] = useState(false);

  if (error || !logoUrl) {
    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
    const colorIndex = symbol.charCodeAt(0) % colors.length;
    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, backgroundColor: colors[colorIndex], fontSize: size * 0.4 }}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <div className="rounded-full overflow-hidden bg-white flex items-center justify-center" style={{ width: size, height: size }}>
      <Image src={logoUrl} alt={symbol} width={size} height={size} className="object-contain" onError={() => setError(true)} unoptimized />
    </div>
  );
}

// Toast Container
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
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
            {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button onClick={() => onDismiss(toast.id)}><X className="h-4 w-4" /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function InvestingPage() {
  // Translation hook
  const { t } = useLanguage();
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('stocks');
  const [showBalance, setShowBalance] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Portfolio data from API
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [stockPositions, setStockPositions] = useState<StockPosition[]>([]);
  const [realEstateInvestments, setRealEstateInvestments] = useState<RealEstateInvestment[]>([]);

  // Panel states
  const [showPanel, setShowPanel] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>('list');
  const [panelMode, setPanelMode] = useState<'buy' | 'sell' | 'withdraw'>('buy');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected items
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoToken | null>(null);
  const [selectedPayToken, setSelectedPayToken] = useState<Holding | null>(null);
  const [selectedStockPosition, setSelectedStockPosition] = useState<StockPosition | null>(null);

  // Amount inputs
  const [buyAmount, setBuyAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch portfolio data
  const fetchPortfolio = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/investing');
      const data = await res.json();

      if (res.ok) {
        setPortfolioValue(data.portfolio?.totalValue || 0);
        setHoldings(data.holdings || []);
        setStockPositions(data.stocks || []);
        setRealEstateInvestments(data.realEstate || []);
      }
    } catch (error) {
      console.log('Portfolio fetch error:', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  // Panel handlers
  const handleOpenPanel = () => {
    setShowPanel(true);
    setPanelView('list');
    setPanelMode('buy');
    setSelectedStock(null);
    setSelectedCrypto(null);
    setSelectedPayToken(null);
    setSearchQuery('');
    setBuyAmount('');
  };

  const handleClosePanel = () => {
    setShowPanel(false);
    setPanelView('list');
    setSelectedStock(null);
    setSelectedCrypto(null);
    setSelectedPayToken(null);
    setSelectedStockPosition(null);
    setBuyAmount('');
  };

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
    setPanelView('detail');
  };

  const handleSelectCrypto = (crypto: CryptoToken) => {
    setSelectedCrypto(crypto);
    setPanelView('detail');
  };

  const handleBuyClick = () => {
    setPanelView('select-token');
  };

  const handleSellClick = () => {
    const symbol = selectedStock?.symbol || selectedCrypto?.symbol;
    addToast('info', `No ${symbol} to sell yet`);
  };

  const handleSelectPayToken = (token: Holding) => {
    setSelectedPayToken(token);
    setPanelView('enter-amount');
  };

  const handleContinueToConfirm = () => {
    const amount = parseFloat(buyAmount);
    if (!amount || amount <= 0) {
      addToast('error', t.staking.enterValidAmount);
      return;
    }
    if (selectedPayToken && amount > selectedPayToken.amountUsd) {
      addToast('error', t.coldStorage.insufficientBalance);
      return;
    }
    setPanelView('confirm');
  };

  const handleConfirmPurchase = async () => {
    setIsProcessing(true);
    setPanelView('processing');

    try {
      const amount = parseFloat(buyAmount);
      
      if (activeTab === 'stocks' && selectedStock && selectedPayToken) {
        // Buy stock
        const res = await fetch('/api/user/investing/stocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'buy',
            stockSymbol: selectedStock.symbol,
            stockName: selectedStock.name,
            stockIcon: selectedStock.logoUrl,
            stockPrice: selectedStock.currentPrice,
            quantity: amount / selectedStock.currentPrice,
            payWithToken: selectedPayToken.symbol,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setPanelView('success');
          addToast('success', t.investing.successfullyPurchasedStock);
          await fetchPortfolio();
        } else {
          addToast('error', data.error || t.investing.transactionFailed);
          setPanelView('enter-amount');
        }
      } else if (activeTab === 'crypto' && selectedCrypto && selectedPayToken) {
        // Swap crypto
        const res = await fetch('/api/user/investing/crypto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromToken: selectedPayToken.symbol,
            toToken: selectedCrypto.symbol,
            amountUsd: amount,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setPanelView('success');
          addToast('success', `${t.investing.successfullySwapped} ${selectedCrypto.symbol}!`);
          await fetchPortfolio();
        } else {
          addToast('error', data.error || t.investing.swapFailed);
          setPanelView('enter-amount');
        }
      }
    } catch (error) {
      addToast('error', t.investing.transactionFailed);
      setPanelView('enter-amount');
    } finally {
      setIsProcessing(false);
    }
  };

  // Stock position withdraw
  const handleOpenWithdraw = (position: StockPosition) => {
    setSelectedStockPosition(position);
    setPanelMode('withdraw');
    setShowPanel(true);
    setPanelView('select-token');
    setBuyAmount('');
  };

  const handleWithdrawFromStock = async () => {
    if (!selectedStockPosition || !selectedPayToken || !buyAmount) return;
    
    const amount = parseFloat(buyAmount);
    if (amount <= 0 || amount > selectedStockPosition.currentValue) {
      addToast('error', t.investing.invalidAmount);
      return;
    }

    setIsProcessing(true);
    setPanelView('processing');

    try {
      const res = await fetch('/api/user/investing/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'withdraw',
          stockId: selectedStockPosition.id,
          withdrawAmount: amount,
          withdrawToToken: selectedPayToken.symbol,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPanelView('success');
        addToast('success', `${t.investing.withdrewTo} ${selectedPayToken.symbol}!`);
        await fetchPortfolio();
      } else {
        addToast('error', data.error || t.investing.withdrawalFailed);
        setPanelView('enter-amount');
      }
    } catch (error) {
      addToast('error', t.investing.withdrawalFailed);
      setPanelView('enter-amount');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered lists
  const filteredStocks = stocks.filter(
    (stock) =>
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCryptos = cryptoTokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: TabType; label: string }[] = [
    { id: 'stocks', label: t.investing.stocksTab },
    { id: 'realestate', label: t.investing.realEstateTab },
    { id: 'crypto', label: t.investing.cryptoTab },
  ];

  const activeTabIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const progressWidth = ((activeTabIndex + 1) / tabs.length) * 100;

  const currentAsset = selectedStock || selectedCrypto;
  const currentSymbol = selectedStock?.symbol || selectedCrypto?.symbol || '';
  const currentPrice = selectedStock?.currentPrice || selectedCrypto?.price || 0;
  const currentExchange = selectedStock?.exchange || 'CRYPTO';

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-heading text-2xl font-semibold text-white mb-6">{t.investing.title}</h1>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-8 border-b border-[#1e2733]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative pb-4 text-sm font-medium transition-colors',
                activeTab === tab.id ? 'text-white' : 'text-[#6b7a90] hover:text-white'
              )}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />}
            </button>
          ))}
        </div>
        <div className="relative h-1 bg-[#1e2733] rounded-full mt-0.5 overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-[#22c55e] rounded-full"
            initial={false}
            animate={{ width: `${progressWidth}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Portfolio Value */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[#6b7a90] text-sm mb-1">
          <span>{t.investing.portfolioValue}</span>
          <button onClick={() => setShowBalance(!showBalance)} className="hover:text-white">
            {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
        <h2 className="font-heading text-3xl font-bold text-white">
          {isLoading ? (
            <span className="inline-block w-32 h-9 bg-[#1e2733] rounded animate-pulse" />
          ) : showBalance ? (
            formatCurrency(portfolioValue)
          ) : (
            '••••••'
          )}
        </h2>
      </div>

      {/* Stocks Tab */}
      {activeTab === 'stocks' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-white">{t.investing.positions}</h3>
            <button
              onClick={handleOpenPanel}
              className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-medium hover:bg-[#1ea550] transition-colors"
            >
              {t.investing.buyStocks}
            </button>
          </div>

          <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2733]">
                    <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">{t.investing.stock}</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">{t.investing.currentPrice}</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">{t.investing.change24h}</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">{t.investing.value}</th>
                    <th className="text-right py-4 px-5 text-sm font-medium text-[#6b7a90]">{t.investing.action}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="border-b border-[#1e2733]">
                        <td className="py-4 px-5"><div className="h-10 w-40 bg-[#1e2733] rounded animate-pulse" /></td>
                        <td className="py-4 px-5"><div className="h-5 w-20 bg-[#1e2733] rounded animate-pulse" /></td>
                        <td className="py-4 px-5"><div className="h-5 w-16 bg-[#1e2733] rounded animate-pulse" /></td>
                        <td className="py-4 px-5"><div className="h-5 w-24 bg-[#1e2733] rounded animate-pulse" /></td>
                        <td className="py-4 px-5"><div className="h-8 w-20 bg-[#1e2733] rounded animate-pulse ml-auto" /></td>
                      </tr>
                    ))
                  ) : stockPositions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 px-5 text-[#6b7a90] text-sm">
                        {t.investing.noStocksInPortfolio}
                      </td>
                    </tr>
                  ) : (
                    stockPositions.map((position) => (
                      <tr key={position.id} className="border-b border-[#1e2733] last:border-b-0 hover:bg-[#0c1320]">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <AssetLogo symbol={position.symbol} logoUrl={position.icon} size={36} />
                            <div>
                              <p className="font-medium text-white">{position.name}</p>
                              <p className="text-sm text-[#6b7a90]">{position.quantity.toFixed(4)} {t.investing.shares}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-white">{formatCurrency(position.currentPrice)}</td>
                        <td className="py-4 px-5">
                          <span className={cn('font-medium', position.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                            {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-white font-medium">{formatCurrency(position.currentValue)}</span>
                          <p className={cn('text-xs', position.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                            {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                          </p>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => handleOpenWithdraw(position)}
                            className="px-3 py-1.5 bg-[#1e2733] text-white text-sm rounded-lg hover:bg-[#2a3441] transition-colors"
                          >
                            {t.investing.withdraw}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[#1e2733]">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 bg-[#1e2733] rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-[#1e2733] rounded animate-pulse mb-1" />
                        <div className="h-3 w-16 bg-[#1e2733] rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-4 w-full bg-[#1e2733] rounded animate-pulse" />
                  </div>
                ))
              ) : stockPositions.length === 0 ? (
                <div className="py-8 px-5 text-[#6b7a90] text-sm text-center">
                  {t.investing.noStocksInPortfolio}
                </div>
              ) : (
                stockPositions.map((position) => (
                  <div key={position.id} className="p-4 hover:bg-[#0c1320] transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <AssetLogo symbol={position.symbol} logoUrl={position.icon} size={40} />
                      <div className="flex-1">
                        <p className="font-medium text-white">{position.name}</p>
                        <p className="text-sm text-[#6b7a90]">{position.quantity.toFixed(4)} {t.investing.shares}</p>
                      </div>
                      <span className={cn('font-medium text-sm', position.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                        {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#6b7a90]">{t.investing.currentPrice}</p>
                        <p className="text-white">{formatCurrency(position.currentPrice)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#6b7a90]">{t.investing.value}</p>
                        <p className="text-white font-medium">{formatCurrency(position.currentValue)}</p>
                      </div>
                      <button
                        onClick={() => handleOpenWithdraw(position)}
                        className="px-3 py-1.5 bg-[#1e2733] text-white text-sm rounded-lg hover:bg-[#2a3441] transition-colors"
                      >
                        {t.investing.withdraw}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real Estate Tab */}
      {activeTab === 'realestate' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-white">{t.investing.yourInvestments}</h3>
            <button
              onClick={() => router.push('/real-estate')}
              className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-medium hover:bg-[#1ea550] transition-colors"
            >
              {t.investing.investInRealEstate}
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-24 bg-[#1e2733] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : realEstateInvestments.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex items-center justify-center gap-1 text-[#6b7a90] mb-4">
                <X className="h-5 w-5" />
                <Building2 className="h-8 w-8" />
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-[#6b7a90] text-sm">
                {t.investing.noInvestmentsYet}{' '}
                <button onClick={() => router.push('/real-estate')} className="text-[#22c55e] hover:underline">
                  {t.investing.clickHere}
                </button>{' '}
                {t.investing.toStartInvesting}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {realEstateInvestments.map((investment) => (
                <div key={investment.id} className="bg-[#0f1419] rounded-xl p-5 border border-[#1e2733]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {investment.image && (
                        <Image src={investment.image} alt={investment.title} width={60} height={60} className="rounded-lg object-cover" unoptimized />
                      )}
                      <div>
                        <h4 className="font-medium text-white">{investment.title}</h4>
                        <p className="text-sm text-[#6b7a90]">{investment.location}</p>
                        <p className="text-sm text-[#6b7a90]">{t.investing.expectedReturn}: {investment.expectedReturn}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{formatCurrency(investment.amount)}</p>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        investment.status === 'active' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#6b7a90]/10 text-[#6b7a90]'
                      )}>
                        {investment.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Crypto Tab */}
      {activeTab === 'crypto' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-white">{t.investing.positions}</h3>
            <button
              onClick={handleOpenPanel}
              className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-medium hover:bg-[#1ea550] transition-colors"
            >
              {t.investing.buyCrypto}
            </button>
          </div>

          <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2733]">
                    <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">{t.investing.asset}</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">{t.investing.currentPrice}</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">{t.investing.holdings}</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">{t.investing.value}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="border-b border-[#1e2733]">
                        <td className="py-4 px-5"><div className="h-10 w-40 bg-[#1e2733] rounded animate-pulse" /></td>
                        <td className="py-4 px-5"><div className="h-5 w-20 bg-[#1e2733] rounded animate-pulse" /></td>
                        <td className="py-4 px-5"><div className="h-5 w-24 bg-[#1e2733] rounded animate-pulse" /></td>
                        <td className="py-4 px-5"><div className="h-5 w-20 bg-[#1e2733] rounded animate-pulse" /></td>
                      </tr>
                    ))
                  ) : holdings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 px-5 text-[#6b7a90] text-sm">
                        {t.investing.noCryptoInPortfolio}
                      </td>
                    </tr>
                  ) : (
                    holdings.map((holding) => (
                      <tr key={holding.id} className="border-b border-[#1e2733] last:border-b-0 hover:bg-[#0c1320]">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <AssetLogo symbol={holding.symbol} logoUrl={holding.icon} size={36} />
                            <div>
                              <p className="font-medium text-white">{holding.name}</p>
                              <p className="text-sm text-[#6b7a90]">{holding.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-white">{formatCurrency(holding.currentPrice)}</td>
                        <td className="py-4 px-5 text-white">{holding.amount.toFixed(6)} {holding.symbol}</td>
                        <td className="py-4 px-5 text-[#22c55e] font-medium">{formatCurrency(holding.amountUsd)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[#1e2733]">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 bg-[#1e2733] rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-20 bg-[#1e2733] rounded animate-pulse mb-1" />
                        <div className="h-3 w-12 bg-[#1e2733] rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-4 w-full bg-[#1e2733] rounded animate-pulse" />
                  </div>
                ))
              ) : holdings.length === 0 ? (
                <div className="py-8 px-5 text-[#6b7a90] text-sm text-center">
                  {t.investing.noCryptoInPortfolio}
                </div>
              ) : (
                holdings.map((holding) => (
                  <div key={holding.id} className="p-4 hover:bg-[#0c1320] transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <AssetLogo symbol={holding.symbol} logoUrl={holding.icon} size={40} />
                      <div className="flex-1">
                        <p className="font-medium text-white">{holding.name}</p>
                        <p className="text-sm text-[#6b7a90]">{holding.symbol}</p>
                      </div>
                      <p className="text-[#22c55e] font-semibold">{formatCurrency(holding.amountUsd)}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6b7a90]">{t.investing.price}: <span className="text-white">{formatCurrency(holding.currentPrice)}</span></span>
                      <span className="text-[#6b7a90]">{t.investing.inWallet}: <span className="text-white">{holding.amount.toFixed(4)} {holding.symbol}</span></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SLIDE PANEL ==================== */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={handleClosePanel}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0e14] border-l border-[#1e2733] z-50 overflow-hidden flex flex-col"
            >
              {/* ===== LIST VIEW ===== */}
              {panelView === 'list' && (
                <>
                  <div className="flex items-center justify-between p-4 border-b border-[#1e2733]">
                    <button onClick={handleClosePanel} className="flex items-center gap-2 text-sm text-[#6b7a90] hover:text-white">
                      <ChevronLeft className="h-4 w-4" />
                      {activeTab === 'crypto' ? t.investing.selectCrypto : t.investing.selectStock}
                    </button>
                    <button onClick={handleClosePanel} className="text-[#6b7a90] hover:text-white"><X className="h-5 w-5" /></button>
                  </div>

                  <div className="p-4 border-b border-[#1e2733]">
                    <p className="text-sm text-[#6b7a90] mb-3">{activeTab === 'crypto' ? t.investing.crypto : t.investing.stocks}</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
                      <input
                        type="text"
                        placeholder={activeTab === 'crypto' ? t.investing.searchCrypto : t.investing.searchStock}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white text-sm placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {activeTab === 'crypto' ? (
                      filteredCryptos.map((crypto) => (
                        <button
                          key={crypto.symbol}
                          onClick={() => handleSelectCrypto(crypto)}
                          className="w-full flex items-center justify-between p-4 hover:bg-[#0f1419] transition-colors border-b border-[#1e2733]"
                        >
                          <div className="flex items-center gap-3">
                            <AssetLogo symbol={crypto.symbol} logoUrl={crypto.icon} size={36} />
                            <div className="text-left">
                              <p className="font-medium text-white">{crypto.name}</p>
                              <p className="text-sm text-[#6b7a90]">0 {crypto.symbol}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-[#6b7a90]" />
                        </button>
                      ))
                    ) : (
                      filteredStocks.map((stock) => (
                        <button
                          key={stock.symbol}
                          onClick={() => handleSelectStock(stock)}
                          className="w-full flex items-center justify-between p-4 hover:bg-[#0f1419] transition-colors border-b border-[#1e2733]"
                        >
                          <div className="flex items-center gap-3">
                            <AssetLogo symbol={stock.symbol} logoUrl={stock.logoUrl} size={36} />
                            <div className="text-left">
                              <p className="font-medium text-white">{stock.name}</p>
                              <p className="text-sm text-[#6b7a90]">0 {stock.symbol}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-[#6b7a90]" />
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* ===== DETAIL VIEW (with Chart) ===== */}
              {panelView === 'detail' && currentAsset && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b border-[#1e2733]">
                    <button onClick={() => setPanelView('list')} className="flex items-center gap-2 text-sm text-[#6b7a90] hover:text-white">
                      <ChevronLeft className="h-4 w-4" />
                      {activeTab === 'crypto' ? t.investing.backToCrypto : t.investing.backToStocks}
                    </button>
                    <button onClick={handleClosePanel} className="text-[#6b7a90] hover:text-white"><X className="h-5 w-5" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="p-5">
                      <div className="flex items-center gap-4 mb-2">
                        <AssetLogo symbol={currentSymbol} logoUrl={selectedStock?.logoUrl || selectedCrypto?.icon || ''} size={48} />
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-white">
                        {selectedStock?.name || selectedCrypto?.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-white">{formatCurrency(currentPrice)}</span>
                        <span className="text-[#6b7a90]">/ {currentSymbol}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#0f1419] rounded-lg mb-5">
                        <span className="text-sm text-[#6b7a90]">{t.investing.yourBalance}</span>
                        <span className="text-sm text-white">
                          <span className="text-[#22c55e]">0</span> {currentSymbol} ~$0
                        </span>
                      </div>

                      {/* TradingView Chart */}
                      <div className="mb-5 rounded-xl overflow-hidden border border-[#1e2733]">
                        <TradingViewChart symbol={currentSymbol} exchange={currentExchange} />
                      </div>
                    </div>
                  </div>

                  {/* Buy/Sell Buttons */}
                  <div className="p-5 border-t border-[#1e2733] bg-[#0a0e14]">
                    <div className="flex gap-3">
                      <button
                        onClick={handleBuyClick}
                        className="flex-1 py-3.5 rounded-lg bg-[#22c55e] text-white font-semibold hover:bg-[#1ea550] transition-colors"
                      >
                        {t.investing.buy}
                      </button>
                      <button
                        onClick={handleSellClick}
                        className="flex-1 py-3.5 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white font-semibold hover:bg-[#232d3b] transition-colors"
                      >
                        {t.investing.sell}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== SELECT TOKEN ===== */}
              {panelView === 'select-token' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b border-[#1e2733]">
                    <button
                      onClick={() => {
                        if (panelMode === 'withdraw') {
                          handleClosePanel();
                        } else {
                          setPanelView('detail');
                        }
                      }}
                      className="flex items-center gap-2 text-sm text-[#6b7a90] hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {panelMode === 'withdraw' ? `${t.investing.withdrawFrom} ${selectedStockPosition?.symbol}` : `${t.investing.buy} ${currentSymbol}`}
                      <span className="text-[#6b7a90]">{t.investing.step} 1/2</span>
                    </button>
                    <button onClick={handleClosePanel} className="text-[#6b7a90] hover:text-white"><X className="h-5 w-5" /></button>
                  </div>

                  <div className="h-1 bg-[#1e2733]">
                    <div className="h-full w-1/2 bg-[#22c55e]" />
                  </div>

                  <div className="p-4">
                    <h3 className="font-heading text-lg font-semibold text-white mb-2">
                      {panelMode === 'withdraw' ? t.investing.withdrawToWhichToken : t.investing.payWithWhichToken}
                    </h3>
                    <p className="text-sm text-[#6b7a90] mb-4">
                      {t.investing.selectTokenFromWallet}
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {holdings.length === 0 ? (
                      <div className="text-center py-8 text-[#6b7a90]">
                        <p className="mb-2">{t.investing.noTokensWithBalance}</p>
                        <p className="text-sm">{t.investing.pleaseDepositFirst}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {holdings.map((holding) => (
                          <button
                            key={holding.id}
                            onClick={() => handleSelectPayToken(holding)}
                            className="w-full flex items-center justify-between p-4 bg-[#0f1419] rounded-xl border border-[#1e2733] hover:border-[#22c55e] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <AssetLogo symbol={holding.symbol} logoUrl={holding.icon} size={40} />
                              <div className="text-left">
                                <p className="font-medium text-white">{holding.name}</p>
                                <p className="text-sm text-[#6b7a90]">{holding.symbol}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-[#22c55e]">{formatCurrency(holding.amountUsd)}</p>
                              <p className="text-sm text-[#6b7a90]">{holding.amount.toFixed(4)} {holding.symbol}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== ENTER AMOUNT ===== */}
              {panelView === 'enter-amount' && selectedPayToken && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b border-[#1e2733]">
                    <button onClick={() => setPanelView('select-token')} className="flex items-center gap-2 text-sm text-[#6b7a90] hover:text-white">
                      <ChevronLeft className="h-4 w-4" />
                      {panelMode === 'withdraw' ? `${t.investing.withdrawFrom} ${selectedStockPosition?.symbol}` : `${t.investing.buy} ${currentSymbol}`}
                      <span className="text-[#6b7a90]">{t.investing.step} 2/2</span>
                    </button>
                    <button onClick={handleClosePanel} className="text-[#6b7a90] hover:text-white"><X className="h-5 w-5" /></button>
                  </div>

                  <div className="h-1 bg-[#1e2733]">
                    <div className="h-full w-full bg-[#22c55e]" />
                  </div>

                  <div className="flex-1 p-5">
                    <h3 className="font-heading text-xl font-semibold text-white mb-6">
                      {panelMode === 'withdraw' 
                        ? t.investing.howMuchWithdraw
                        : t.investing.howMuchBuy
                      }
                    </h3>

                    <div className="relative mb-3">
                      <input
                        type="number"
                        placeholder={t.investing.enterAmountUsd}
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="w-full px-4 py-4 pr-16 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white text-lg placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7a90] font-medium">USD</span>
                    </div>

                    <p className="text-sm text-[#6b7a90] mb-6">
                      {panelMode === 'withdraw' ? (
                        <>{t.investing.positionValue}: <span className="text-[#22c55e]">{formatCurrency(selectedStockPosition?.currentValue || 0)}</span></>
                      ) : (
                        <>{t.investing.payingWith} {selectedPayToken.symbol}: <span className="text-[#22c55e]">{formatCurrency(selectedPayToken.amountUsd)}</span> {t.investing.available}</>
                      )}
                    </p>

                    <div className="p-4 bg-[#0f1419] rounded-lg border border-[#1e2733]">
                      {panelMode === 'withdraw' ? (
                        <p className="text-sm text-[#6b7a90]">
                          {t.investing.youWillReceive} {selectedPayToken.symbol}
                        </p>
                      ) : (
                        <>
                          <div className="flex justify-between mb-2">
                            <span className="text-[#6b7a90]">{t.investing.pricePer} {currentSymbol}</span>
                            <span className="text-white">{formatCurrency(currentPrice)}</span>
                          </div>
                          {buyAmount && parseFloat(buyAmount) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-[#6b7a90]">{t.investing.estReceived} {currentSymbol}</span>
                              <span className="text-[#22c55e]">{(parseFloat(buyAmount) / currentPrice).toFixed(6)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-5 border-t border-[#1e2733]">
                    <button
                      onClick={handleContinueToConfirm}
                      disabled={!buyAmount || parseFloat(buyAmount) <= 0}
                      className={cn(
                        'w-full py-4 rounded-lg font-semibold transition-colors',
                        buyAmount && parseFloat(buyAmount) > 0
                          ? 'bg-[#22c55e] text-white hover:bg-[#1ea550]'
                          : 'bg-[#1a2332] text-[#6b7a90] cursor-not-allowed'
                      )}
                    >
                      {t.investing.continue}
                    </button>
                  </div>
                </div>
              )}

              {/* ===== CONFIRM ===== */}
              {panelView === 'confirm' && selectedPayToken && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b border-[#1e2733]">
                    <button onClick={() => setPanelView('enter-amount')} className="flex items-center gap-2 text-sm text-[#6b7a90] hover:text-white">
                      <ChevronLeft className="h-4 w-4" />
                      {panelMode === 'withdraw' ? t.investing.confirmWithdrawal : t.investing.confirmPurchase}
                    </button>
                    <button onClick={handleClosePanel} className="text-[#6b7a90] hover:text-white"><X className="h-5 w-5" /></button>
                  </div>

                  <div className="flex-1 p-5">
                    <h3 className="font-heading text-xl font-semibold text-white mb-6">
                      {panelMode === 'withdraw' ? t.investing.confirmYourWithdrawal : t.investing.confirmYourPurchase}
                    </h3>

                    <div className="bg-[#0f1419] rounded-xl p-5 border border-[#1e2733] mb-6">
                      <div className="flex items-center gap-4 mb-4">
                        <AssetLogo
                          symbol={panelMode === 'withdraw' ? selectedStockPosition?.symbol || '' : currentSymbol}
                          logoUrl={panelMode === 'withdraw' ? selectedStockPosition?.icon || '' : selectedStock?.logoUrl || selectedCrypto?.icon || ''}
                          size={48}
                        />
                        <div>
                          <p className="font-semibold text-white">
                            {panelMode === 'withdraw' ? selectedStockPosition?.name : selectedStock?.name || selectedCrypto?.name}
                          </p>
                          <p className="text-sm text-[#6b7a90]">
                            {panelMode === 'withdraw' ? selectedStockPosition?.symbol : currentSymbol}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-[#1e2733]">
                        <div className="flex justify-between">
                          <span className="text-[#6b7a90]">{t.investing.amount}</span>
                          <span className="text-white font-medium">{formatCurrency(parseFloat(buyAmount))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6b7a90]">{panelMode === 'withdraw' ? t.investing.withdrawTo : t.investing.payingWith}</span>
                          <span className="text-white font-medium">{selectedPayToken.symbol}</span>
                        </div>
                        {panelMode !== 'withdraw' && (
                          <div className="flex justify-between">
                            <span className="text-[#6b7a90]">{t.investing.estReceived} {currentSymbol}</span>
                            <span className="text-[#22c55e] font-medium">
                              {(parseFloat(buyAmount) / currentPrice).toFixed(6)} {currentSymbol}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-[#0f1419] rounded-lg border border-[#1e2733]">
                      <Info className="h-5 w-5 text-[#3b82f6] shrink-0 mt-0.5" />
                      <p className="text-sm text-[#6b7a90]">
                        {panelMode === 'withdraw'
                          ? t.investing.byConfirmingWithdrawal
                          : t.investing.byConfirmingPurchase
                        }
                      </p>
                    </div>
                  </div>

                  <div className="p-5 border-t border-[#1e2733]">
                    <button
                      onClick={panelMode === 'withdraw' ? handleWithdrawFromStock : handleConfirmPurchase}
                      className="w-full py-4 rounded-lg bg-[#22c55e] text-white font-semibold hover:bg-[#1ea550] transition-colors"
                    >
                      {panelMode === 'withdraw' ? t.investing.confirmWithdrawal : t.investing.confirmPurchase}
                    </button>
                  </div>
                </div>
              )}

              {/* ===== PROCESSING ===== */}
              {panelView === 'processing' && (
                <div className="flex flex-col items-center justify-center h-full p-5">
                  <div className="relative w-20 h-20 mb-6">
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-[#1e2733] border-t-[#22c55e]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="absolute inset-3 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-[#22c55e]" />
                    </div>
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-white mb-2">{t.investing.processingOrder}</h3>
                  <p className="text-[#6b7a90] text-center">{t.investing.pleaseWaitTransaction}</p>
                </div>
              )}

              {/* ===== SUCCESS ===== */}
              {panelView === 'success' && (
                <div className="flex flex-col items-center justify-center h-full p-5">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-[#22c55e]" />
                  </motion.div>
                  <h3 className="font-heading text-xl font-semibold text-white mb-2">
                    {panelMode === 'withdraw' ? t.investing.withdrawalSuccessful : t.investing.purchaseSuccessful}
                  </h3>
                  <p className="text-[#6b7a90] text-center mb-6">
                    {panelMode === 'withdraw'
                      ? `${t.investing.successfullyWithdrawn} ${formatCurrency(parseFloat(buyAmount))}`
                      : `${t.investing.successfullyPurchased} ${formatCurrency(parseFloat(buyAmount))} ${currentSymbol}`
                    }
                  </p>
                  <button
                    onClick={handleClosePanel}
                    className="px-8 py-3 rounded-lg bg-[#22c55e] text-white font-semibold hover:bg-[#1ea550] transition-colors"
                  >
                    {t.investing.done}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
