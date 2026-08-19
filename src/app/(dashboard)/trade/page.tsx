'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Circle,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Sparkles,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
} from 'lucide-react';
import { cn, formatCurrency, formatCryptoAmount } from '@/utils';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Trade Page - Full Trading Platform with API
// ============================================

// Trade Position Interface
export interface TradePosition {
  id: string;
  type: 'buy' | 'sell';
  assetType: 'Crypto' | 'Stocks';
  symbol: string;
  name: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  leverage: number;
  stopLoss: number | null;
  takeProfit: number | null;
  duration: string;
  marginUsed: number;
  status: 'open' | 'closed' | 'cancelled';
  pnl: number;
  pnlPercent: number;
  openedAt: Date;
  closedAt?: Date;
  closeReason?: 'manual' | 'stop_loss' | 'take_profit' | 'expired' | 'liquidated';
  expiresAt?: Date;
}

// Trading Account Interface
interface TradingAccount {
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: string;
}

// User Holding Interface
interface UserHolding {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  amount: number;
  amountUsd: number;
  type: string;
}

// Asset for trading
interface TradingAsset {
  id: string;
  name: string;
  symbol: string;
  type: 'Crypto' | 'Stocks';
  price: number;
  logo?: string;
  change24h: number;
}

// Trading assets with real prices
const tradingAssets: TradingAsset[] = [
  // Crypto
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', type: 'Crypto', price: 68400.306, logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', change24h: 2.34 },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', type: 'Crypto', price: 3520.45, logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', change24h: 1.56 },
  { id: 'sol', name: 'Solana', symbol: 'SOL', type: 'Crypto', price: 148.92, logo: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', change24h: 3.21 },
  { id: 'bnb', name: 'BNB', symbol: 'BNB', type: 'Crypto', price: 598.75, logo: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', change24h: 0.89 },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', type: 'Crypto', price: 0.5234, logo: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', change24h: -1.23 },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', type: 'Crypto', price: 0.4521, logo: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', change24h: 2.15 },
  { id: 'avax', name: 'Avalanche', symbol: 'AVAX', type: 'Crypto', price: 35.67, logo: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', change24h: 4.56 },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', type: 'Crypto', price: 0.1234, logo: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', change24h: -2.34 },
  // Stocks
  { id: 'aapl', name: 'Apple Inc', symbol: 'AAPL', type: 'Stocks', price: 251.62, change24h: 1.23 },
  { id: 'tsla', name: 'Tesla', symbol: 'TSLA', type: 'Stocks', price: 245.67, change24h: -0.89 },
  { id: 'nvda', name: 'NVIDIA', symbol: 'NVDA', type: 'Stocks', price: 875.28, change24h: 3.45 },
  { id: 'msft', name: 'Microsoft', symbol: 'MSFT', type: 'Stocks', price: 378.91, change24h: 0.67 },
  { id: 'amzn', name: 'Amazon', symbol: 'AMZN', type: 'Stocks', price: 178.25, change24h: 1.12 },
  { id: 'googl', name: 'Alphabet', symbol: 'GOOGL', type: 'Stocks', price: 156.78, change24h: 0.45 },
  { id: 'meta', name: 'Meta', symbol: 'META', type: 'Stocks', price: 485.23, change24h: 2.34 },
];

// Withdraw tokens for trading account
const withdrawTokens = [
  { symbol: 'BTC', name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { symbol: 'USDT', name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  { symbol: 'USDC', name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
  { symbol: 'BNB', name: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { symbol: 'SOL', name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
];

// Duration options
const durationOptions = [
  { value: '1m', label: '1 minute' },
  { value: '2m', label: '2 minutes' },
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '4h', label: '4 hours' },
  { value: '1d', label: '1 day' },
  { value: '1w', label: '1 week' },
];

// Chart timeframes
const timeframes = ['1m', '30m', '1h', 'D'];

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

// Asset Logo Component
function AssetLogo({ asset, size = 24 }: { asset: TradingAsset; size?: number }) {
  const [error, setError] = useState(false);
  
  const colors: Record<string, string> = {
    BTC: '#F7931A', ETH: '#627EEA', SOL: '#14F195', BNB: '#F3BA2F',
    XRP: '#23292F', ADA: '#0033AD', AVAX: '#E84142', DOGE: '#C2A633',
    AAPL: '#007AFF', TSLA: '#CC0000', NVDA: '#76B900', MSFT: '#00A4EF',
    AMZN: '#FF9900', GOOGL: '#4285F4', META: '#0668E1',
  };

  if (error || !asset.logo) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, backgroundColor: colors[asset.symbol] || '#6b7a90', fontSize: size * 0.4 }}
      >
        {asset.symbol.charAt(0)}
      </div>
    );
  }

  return (
    <div className="rounded-full overflow-hidden bg-white" style={{ width: size, height: size }}>
      <Image src={asset.logo} alt={asset.symbol} width={size} height={size} onError={() => setError(true)} unoptimized />
    </div>
  );
}

// TradingView Chart Component
function TradingViewChart({ symbol, type }: { symbol: string; type: 'Crypto' | 'Stocks' }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    containerRef.current.innerHTML = '';
    
    let tvSymbol = symbol;
    if (type === 'Crypto') {
      tvSymbol = `BINANCE:${symbol}USDT`;
    } else {
      tvSymbol = `NASDAQ:${symbol}`;
    }
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(15, 20, 25, 1)',
      gridColor: 'rgba(30, 39, 51, 1)',
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      details: false,
      hotlist: false,
      calendar: false,
      show_popup_button: false,
      popup_width: '1000',
      popup_height: '650',
      support_host: 'https://www.tradingview.com',
    });
    
    containerRef.current.appendChild(script);
    
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, type]);

  return (
    <div className="tradingview-widget-container h-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full" />
    </div>
  );
}

// Leverage Slider Component
function LeverageSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const marks = [0, 25, 50, 75, 100];
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#6b7a90]">Leverage:</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="range"
            min="1"
            max="100"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-[#1e2733] rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #22c55e 0%, #22c55e ${value}%, #1e2733 ${value}%, #1e2733 100%)`,
            }}
          />
          <div className="flex justify-between mt-1">
            {marks.map((mark) => (
              <span key={mark} className="text-xs text-[#6b7a90]">{mark}x</span>
            ))}
          </div>
        </div>
        <div className="w-16 px-3 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-center">
          <span className="text-white font-medium">{value}x</span>
        </div>
      </div>
    </div>
  );
}

type OrderTab = 'buy' | 'sell' | 'convert';
type TradeFilter = 'all' | 'swaps' | 'auto';
type ModalView = 'select-token' | 'amount' | 'processing' | 'success';

export default function TradePage() {
  // Translation hook
  const { t } = useLanguage();
  
  // Trading UI State
  const [orderTab, setOrderTab] = useState<OrderTab>('buy');
  const [tradeType, setTradeType] = useState<'Crypto' | 'Stocks'>('Crypto');
  const [selectedAsset, setSelectedAsset] = useState<TradingAsset>(tradingAssets[0]);
  const [amount, setAmount] = useState('100');
  const [leverage, setLeverage] = useState(10);
  const [useTpSl, setUseTpSl] = useState(true);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [duration, setDuration] = useState('2m');
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>('all');
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [openTradesExpanded, setOpenTradesExpanded] = useState(true);
  const [closedTradesExpanded, setClosedTradesExpanded] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('D');

  // Trading Account State
  const [tradingAccount, setTradingAccount] = useState<TradingAccount | null>(null);
  const [userHoldings, setUserHoldings] = useState<UserHolding[]>([]);
  const [positions, setPositions] = useState<TradePosition[]>([]);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);

  // Fund/Withdraw Modal State
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [modalView, setModalView] = useState<ModalView>('select-token');
  const [selectedToken, setSelectedToken] = useState<UserHolding | typeof withdrawTokens[0] | null>(null);
  const [fundWithdrawAmount, setFundWithdrawAmount] = useState('');
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');
  const [isModalProcessing, setIsModalProcessing] = useState(false);

  // Price simulation intervals ref
  const priceIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Filter assets by type
  const filteredAssets = tradingAssets.filter(a => a.type === tradeType);
  
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
        setUserHoldings(data.holdings || []);
      }
    } catch (error) {
      console.log('Trading account fetch error:', error);
    } finally {
      setIsLoadingAccount(false);
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
          openedAt: new Date(p.openedAt),
          closedAt: p.closedAt ? new Date(p.closedAt) : undefined,
          expiresAt: p.expiresAt ? new Date(p.expiresAt) : undefined,
        })));
      }
    } catch (error) {
      console.log('Positions fetch error:', error);
    } finally {
      setIsLoadingPositions(false);
    }
  }, []);

  useEffect(() => {
    fetchTradingAccount();
    fetchPositions();
  }, [fetchTradingAccount, fetchPositions]);

  // Start price simulation for open positions
  useEffect(() => {
    // Clear existing intervals
    priceIntervalsRef.current.forEach(interval => clearInterval(interval));
    priceIntervalsRef.current.clear();

    // Start new intervals for open positions
    openPositions.forEach(position => {
      const interval = setInterval(() => {
        setPositions(prev => prev.map(p => {
          if (p.id !== position.id || p.status !== 'open') return p;
          
          // Simulate price change (-2% to +2%)
          const change = (Math.random() - 0.5) * 0.04;
          const newPrice = p.currentPrice * (1 + change);
          
          // Calculate PnL
          const priceDiff = p.type === 'buy' 
            ? newPrice - p.entryPrice 
            : p.entryPrice - newPrice;
          const pnl = priceDiff * p.amount * p.leverage;
          const pnlPercent = (priceDiff / p.entryPrice) * 100 * p.leverage;

          // Check stop loss / take profit
          let shouldClose = false;
          let closeReason: TradePosition['closeReason'] = 'manual';

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

          // Check expiration
          if (p.expiresAt && new Date() >= p.expiresAt) {
            shouldClose = true;
            closeReason = 'expired';
          }

          if (shouldClose) {
            // Close position via API
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

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
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
      setStopLoss((price * (1 - slPercent)).toFixed(3));
      setTakeProfit((price * (1 + tpPercent)).toFixed(3));
    } else {
      setStopLoss((price * (1 + slPercent)).toFixed(3));
      setTakeProfit((price * (1 - tpPercent)).toFixed(3));
    }
    
    setIsAILoading(false);
    addToast('success', t.trade.aiSetTpSl);
  };

  // Execute trade via API
  const handleExecuteTrade = async () => {
    const tradeAmount = parseFloat(amount);
    
    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      addToast('error', t.trade.enterValidAmount);
      return;
    }

    if (!tradingAccount || tradingAccount.balance <= 0) {
      addToast('error', t.trade.fundAccount);
      setShowFundModal(true);
      return;
    }

    const positionValue = tradeAmount * selectedAsset.price;
    const marginRequired = positionValue / leverage;

    if (marginRequired > tradingAccount.balance) {
      addToast('error', t.trade.insufficientTradingBalance);
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
        // Add new position
        setPositions(prev => [{
          ...data.position,
          openedAt: new Date(data.position.openedAt),
          expiresAt: data.position.expiresAt ? new Date(data.position.expiresAt) : undefined,
        }, ...prev]);
        
        // Update account balance
        if (data.account) {
          setTradingAccount(prev => prev ? { ...prev, balance: data.account.balance } : prev);
        }

        addToast('success', `${t.trade.tradeExecuted}: ${tradeAmount} ${selectedAsset.symbol} @ ${formatCurrency(selectedAsset.price)}`);
      } else {
        addToast('error', data.error || t.trade.failedToFund);
      }
    } catch (error) {
      console.error('Trade error:', error);
      addToast('error', t.trade.failedToFund);
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
        body: JSON.stringify({
          positionId,
          action: 'close',
          currentPrice,
          closeReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update position in state
        setPositions(prev => prev.map(p => {
          if (p.id !== positionId) return p;
          return {
            ...p,
            ...data.position,
            status: 'closed' as const,
            closedAt: new Date(),
          };
        }));

        // Update account
        if (data.account) {
          setTradingAccount(prev => prev ? { 
            ...prev, 
            balance: data.account.balance,
            totalPnl: data.account.totalPnl,
          } : prev);
        }

        // Clear interval
        const interval = priceIntervalsRef.current.get(positionId);
        if (interval) {
          clearInterval(interval);
          priceIntervalsRef.current.delete(positionId);
        }

        addToast(data.position.pnl >= 0 ? 'success' : 'error', 
          `Position closed: ${data.position.pnl >= 0 ? '+' : ''}${formatCurrency(data.position.pnl)}`
        );
      }
    } catch (error) {
      console.error('Close position error:', error);
    }
  };

  // Manual close position
  const handleClosePosition = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (position) {
      handleClosePositionAPI(positionId, position.currentPrice, 'manual');
    }
  };

  // Fund trading account
  const handleFundAccount = async () => {
    if (!selectedToken || !fundWithdrawAmount) return;

    const amountUsd = parseFloat(fundWithdrawAmount);
    if (isNaN(amountUsd) || amountUsd < 10) {
      addToast('error', `${t.trade.minAmount}: $10`);
      return;
    }

    setIsModalProcessing(true);
    setModalView('processing');

    try {
      const res = await fetch('/api/trading/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fund',
          amount: amountUsd,
          token: selectedToken.symbol,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setModalView('success');
        await fetchTradingAccount();
        addToast('success', `${t.trade.fundSuccess}: ${formatCurrency(amountUsd)}`);
      } else {
        addToast('error', data.error || t.trade.failedToFund);
        setModalView('amount');
      }
    } catch (error) {
      addToast('error', t.trade.failedToFund);
      setModalView('amount');
    } finally {
      setIsModalProcessing(false);
    }
  };

  // Withdraw from trading account
  const handleWithdrawAccount = async () => {
    if (!selectedToken || !fundWithdrawAmount) return;

    const amountUsd = parseFloat(fundWithdrawAmount);
    if (isNaN(amountUsd) || amountUsd < 10) {
      addToast('error', `${t.trade.minAmount}: $10`);
      return;
    }

    if (!tradingAccount || amountUsd > tradingAccount.balance) {
      addToast('error', t.trade.insufficientTradingBalance);
      return;
    }

    setIsModalProcessing(true);
    setModalView('processing');

    try {
      const res = await fetch('/api/trading/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'withdraw',
          amount: amountUsd,
          token: selectedToken.symbol,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setModalView('success');
        await fetchTradingAccount();
        addToast('success', `${t.trade.withdrawSuccess}: ${formatCurrency(amountUsd)} ${selectedToken.symbol}`);
      } else {
        addToast('error', data.error || t.trade.failedToWithdraw);
        setModalView('amount');
      }
    } catch (error) {
      addToast('error', t.trade.failedToWithdraw);
      setModalView('amount');
    } finally {
      setIsModalProcessing(false);
    }
  };

  // Reset modal state
  const resetModal = () => {
    setModalView('select-token');
    setSelectedToken(null);
    setFundWithdrawAmount('');
    setTokenSearchQuery('');
  };

  // Close modals
  const handleCloseFundModal = () => {
    setShowFundModal(false);
    resetModal();
  };

  const handleCloseWithdrawModal = () => {
    setShowWithdrawModal(false);
    resetModal();
  };

  // Filter holdings for search
  const filteredHoldings = userHoldings.filter(h => {
    const query = tokenSearchQuery.toLowerCase();
    return h.symbol.toLowerCase().includes(query) || h.name.toLowerCase().includes(query);
  });

  // Filter withdraw tokens for search
  const filteredWithdrawTokens = withdrawTokens.filter(t => {
    const query = tokenSearchQuery.toLowerCase();
    return t.symbol.toLowerCase().includes(query) || t.name.toLowerCase().includes(query);
  });

  // Update selected asset when type changes
  useEffect(() => {
    const firstAsset = tradingAssets.find(a => a.type === tradeType);
    if (firstAsset) setSelectedAsset(firstAsset);
  }, [tradeType]);

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      {/* Trading Account Bar */}
      <div className="mb-4 lg:mb-6 p-4 lg:p-5 bg-[#0f1419] rounded-xl border border-[#1e2733]">
        {/* Mobile: Balance + Fund button on top */}
        <div className="flex items-center justify-between md:hidden mb-3">
          <div>
            <p className="text-xs text-[#6b7a90]">{t.trade.tradingBalance}</p>
            {isLoadingAccount ? (
              <div className="h-7 w-24 bg-[#1e2733] rounded animate-pulse mt-1" />
            ) : (
              <p className="text-xl font-bold text-white">
                {formatCurrency(tradingAccount?.balance || 0)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowFundModal(true); resetModal(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#22c55e] hover:bg-[#1ea550] text-white font-semibold rounded-lg transition-colors text-sm"
            >
              <ArrowDownToLine className="h-4 w-4" />
              {t.trade.fund}
            </button>
            {(tradingAccount?.balance || 0) > 0 && (
              <button
                onClick={() => { setShowWithdrawModal(true); resetModal(); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1e2733] hover:bg-[#2a3441] text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <ArrowUpFromLine className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile: Stats row (scrollable) */}
        <div className="flex gap-4 overflow-x-auto pb-1 md:hidden scrollbar-hide">
          <div className="flex-shrink-0">
            <p className="text-xs text-[#6b7a90]">{t.trade.pnl}</p>
            <p className={cn(
              'text-sm font-semibold',
              (tradingAccount?.totalPnl || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
            )}>
              {(tradingAccount?.totalPnl || 0) >= 0 ? '+' : ''}{formatCurrency(tradingAccount?.totalPnl || 0)}
            </p>
          </div>
          <div className="h-8 w-px bg-[#1e2733] flex-shrink-0" />
          <div className="flex-shrink-0">
            <p className="text-xs text-[#6b7a90]">{t.trade.winRate}</p>
            <p className="text-sm font-semibold text-white">{tradingAccount?.winRate || '0.0'}%</p>
          </div>
          <div className="h-8 w-px bg-[#1e2733] flex-shrink-0" />
          <div className="flex-shrink-0">
            <p className="text-xs text-[#6b7a90]">{t.trade.trades}</p>
            <p className="text-sm font-semibold text-white">{tradingAccount?.totalTrades || 0}</p>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-6 lg:gap-10">
            <div>
              <p className="text-xs lg:text-sm text-[#6b7a90]">{t.trade.tradingBalance}</p>
              {isLoadingAccount ? (
                <div className="h-7 w-24 bg-[#1e2733] rounded animate-pulse mt-1" />
              ) : (
                <p className="text-xl lg:text-2xl font-bold text-white">
                  {formatCurrency(tradingAccount?.balance || 0)}
                </p>
              )}
            </div>
            <div className="h-10 lg:h-12 w-px bg-[#1e2733]" />
            <div>
              <p className="text-xs lg:text-sm text-[#6b7a90]">{t.trade.totalPnl}</p>
              <p className={cn(
                'text-lg lg:text-xl font-semibold',
                (tradingAccount?.totalPnl || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
              )}>
                {(tradingAccount?.totalPnl || 0) >= 0 ? '+' : ''}{formatCurrency(tradingAccount?.totalPnl || 0)}
              </p>
            </div>
            <div className="h-10 lg:h-12 w-px bg-[#1e2733]" />
            <div>
              <p className="text-xs lg:text-sm text-[#6b7a90]">{t.trade.winRate}</p>
              <p className="text-lg lg:text-xl font-semibold text-white">{tradingAccount?.winRate || '0.0'}%</p>
            </div>
            <div className="h-10 lg:h-12 w-px bg-[#1e2733]" />
            <div>
              <p className="text-xs lg:text-sm text-[#6b7a90]">{t.trade.totalTrades}</p>
              <p className="text-lg lg:text-xl font-semibold text-white">{tradingAccount?.totalTrades || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowFundModal(true); resetModal(); }}
              className="flex items-center gap-2 px-4 lg:px-5 py-2 lg:py-2.5 bg-[#22c55e] hover:bg-[#1ea550] text-white font-semibold rounded-lg transition-colors"
            >
              <ArrowDownToLine className="h-4 w-4" />
              {t.trade.fund}
            </button>
            {(tradingAccount?.balance || 0) > 0 && (
              <button
                onClick={() => { setShowWithdrawModal(true); resetModal(); }}
                className="flex items-center gap-2 px-4 lg:px-5 py-2 lg:py-2.5 bg-[#1e2733] hover:bg-[#2a3441] text-white font-semibold rounded-lg transition-colors"
              >
                <ArrowUpFromLine className="h-4 w-4" />
                {t.trade.withdraw}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Trading Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0">
        {/* Order Panel - Shows first on mobile */}
        <div className="order-1 lg:order-2 lg:w-[380px] xl:w-[420px] 2xl:w-[460px] flex flex-col bg-[#0f1419] rounded-xl border border-[#1e2733] max-h-[500px] lg:max-h-none overflow-hidden">
          {/* Order Tabs */}
          <div className="flex border-b border-[#1e2733]">
            {(['buy', 'sell', 'convert'] as OrderTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setOrderTab(tab)}
                className={cn(
                  'flex-1 py-3 lg:py-4 text-sm lg:text-base font-semibold transition-colors',
                  orderTab === tab
                    ? tab === 'buy'
                      ? 'text-[#22c55e] border-b-2 border-[#22c55e]'
                      : tab === 'sell'
                      ? 'text-[#ef4444] border-b-2 border-[#ef4444]'
                      : 'text-white border-b-2 border-white'
                    : 'text-[#6b7a90] hover:text-white'
                )}
              >
                {tab === 'buy' ? t.trade.buy : tab === 'sell' ? t.trade.sell : t.trade.convert}
              </button>
            ))}
          </div>

          {/* Order Form */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4 lg:space-y-5">
            {/* Asset Type Selector */}
            <div className="relative">
              <button
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 lg:py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white hover:border-[#3b82f6] transition-colors"
              >
                <span className="flex items-center gap-2">
                  {tradeType === 'Crypto' ? <TrendingUp className="h-4 w-4 text-[#f59e0b]" /> : <TrendingDown className="h-4 w-4 text-[#3b82f6]" />}
                  {tradeType === 'Crypto' ? t.trade.crypto : t.trade.stocks}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-[#6b7a90] transition-transform', isTypeDropdownOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {isTypeDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-[#0a0e14] border border-[#1e2733] rounded-lg overflow-hidden z-20"
                  >
                    {(['Crypto', 'Stocks'] as const).map((assetType) => (
                      <button
                        key={assetType}
                        onClick={() => { setTradeType(assetType); setIsTypeDropdownOpen(false); }}
                        className={cn(
                          'w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#1e2733] transition-colors',
                          tradeType === assetType ? 'text-[#22c55e]' : 'text-white'
                        )}
                      >
                        {assetType === 'Crypto' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {assetType === 'Crypto' ? t.trade.crypto : t.trade.stocks}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Asset Selector */}
            <div className="relative">
              <button
                onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white hover:border-[#3b82f6] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <AssetLogo asset={selectedAsset} size={20} />
                  <span>{selectedAsset.symbol}</span>
                  <span className="text-[#6b7a90]">{selectedAsset.name}</span>
                </span>
                <ChevronDown className={cn('h-4 w-4 text-[#6b7a90] transition-transform', isAssetDropdownOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {isAssetDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-[#0a0e14] border border-[#1e2733] rounded-lg overflow-hidden z-20 max-h-60 overflow-y-auto"
                  >
                    {filteredAssets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => { setSelectedAsset(asset); setIsAssetDropdownOpen(false); }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1e2733] transition-colors',
                          selectedAsset.id === asset.id ? 'bg-[#1e2733]' : ''
                        )}
                      >
                        <AssetLogo asset={asset} size={24} />
                        <div className="flex-1 text-left">
                          <p className="text-white text-sm">{asset.symbol}</p>
                          <p className="text-xs text-[#6b7a90]">{asset.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm">{formatCurrency(asset.price)}</p>
                          <p className={cn('text-xs', asset.change24h >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                          </p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Current Price */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0a0e14] rounded-lg">
              <span className="text-sm text-[#6b7a90]">{t.markets.price}</span>
              <span className="text-white font-medium">{formatCurrency(selectedAsset.price)}</span>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm text-[#6b7a90] mb-2">{t.trade.amount}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 px-4 py-2.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                />
                <div className="px-3 py-2.5 bg-[#1e2733] rounded-lg text-white text-sm">{selectedAsset.symbol}</div>
              </div>
              {amount && (
                <p className="text-xs text-[#6b7a90] mt-1">
                  ≈ {formatCurrency(parseFloat(amount) * selectedAsset.price || 0)} USD
                </p>
              )}
            </div>

            {/* Leverage Slider */}
            <LeverageSlider value={leverage} onChange={setLeverage} />

            {/* Duration Selector */}
            <div className="relative">
              <label className="block text-sm text-[#6b7a90] mb-2">{t.trade.duration}</label>
              <button
                onClick={() => setIsDurationDropdownOpen(!isDurationDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white hover:border-[#3b82f6] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#6b7a90]" />
                  {durationOptions.find(d => d.value === duration)?.label}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-[#6b7a90] transition-transform', isDurationDropdownOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {isDurationDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-[#0a0e14] border border-[#1e2733] rounded-lg overflow-hidden z-20 max-h-48 overflow-y-auto"
                  >
                    {durationOptions.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => { setDuration(d.value); setIsDurationDropdownOpen(false); }}
                        className={cn(
                          'w-full px-4 py-2.5 text-left hover:bg-[#1e2733] transition-colors',
                          duration === d.value ? 'text-[#22c55e]' : 'text-white'
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* TP/SL Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useTpSl}
                    onChange={(e) => setUseTpSl(e.target.checked)}
                    className="w-4 h-4 rounded border-[#1e2733] bg-[#0a0e14] text-[#22c55e] focus:ring-[#22c55e]"
                  />
                  <span className="text-sm text-white">{t.trade.tpsl}</span>
                </label>
                <button
                  onClick={handleSetWithAI}
                  disabled={isAILoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] rounded-lg text-white text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  {isAILoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {t.trade.setWithAI}
                </button>
              </div>
              
              <AnimatePresence>
                {useTpSl && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div>
                      <label className="block text-xs text-[#6b7a90] mb-1">{t.trade.takeProfit}</label>
                      <input
                        type="number"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                        placeholder="Enter price"
                        className="w-full px-4 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-sm focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#6b7a90] mb-1">{t.trade.stopLoss}</label>
                      <input
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        placeholder="Enter price"
                        className="w-full px-4 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-sm focus:outline-none focus:border-[#ef4444]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Execute Button */}
          <div className="p-4 lg:p-5 border-t border-[#1e2733]">
            <button
              onClick={handleExecuteTrade}
              disabled={isProcessing || orderTab === 'convert'}
              className={cn(
                'w-full py-3.5 lg:py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-base lg:text-lg',
                orderTab === 'buy'
                  ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                  : orderTab === 'sell'
                  ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white'
                  : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed',
                isProcessing && 'opacity-70 cursor-wait'
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t.trade.processing}
                </>
              ) : (
                orderTab === 'convert' ? t.trade.comingSoon : orderTab === 'buy' ? t.trade.buy : t.trade.sell
              )}
            </button>
          </div>
        </div>

        {/* Chart Section */}
        <div className="order-2 lg:order-1 lg:flex-1 flex flex-col min-w-0">
          {/* Chart Toolbar */}
          <div className="flex items-center gap-1 lg:gap-2 mb-3 lg:mb-4 p-2 lg:p-3 bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-x-auto">
            {/* Timeframes */}
            <div className="flex items-center gap-1 lg:gap-2">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={cn(
                    'px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors whitespace-nowrap',
                    selectedTimeframe === tf
                      ? 'bg-[#22c55e] text-white'
                      : 'text-[#6b7a90] hover:text-white hover:bg-[#1e2733]'
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <button className="p-1.5 lg:p-2 text-[#6b7a90] hover:text-white transition-colors flex-shrink-0">
              <RefreshCw className="h-4 w-4 lg:h-5 lg:w-5" />
            </button>
          </div>

          {/* TradingView Chart */}
          <div className="h-[350px] lg:flex-1 lg:h-auto rounded-xl overflow-hidden border border-[#1e2733] lg:min-h-[450px] xl:min-h-[500px]">
            <TradingViewChart symbol={selectedAsset.symbol} type={selectedAsset.type} />
          </div>
        </div>
      </div>

      {/* My Trades Section */}
      <div className="mt-4 lg:mt-6 bg-[#0f1419] rounded-xl border border-[#1e2733]">
        {/* Trades Header */}
        <div className="flex items-center justify-between p-3 lg:p-5 border-b border-[#1e2733]">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm lg:text-lg">{t.trade.myTrades}</span>
          </div>
          <div className="flex items-center gap-1 lg:gap-2">
            {(['all', 'swaps', 'auto'] as TradeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTradeFilter(filter)}
                className={cn(
                  'px-2.5 lg:px-5 py-1 lg:py-2 rounded-full text-xs lg:text-sm font-medium transition-colors',
                  tradeFilter === filter
                    ? 'bg-[#22c55e] text-white'
                    : 'text-[#6b7a90] hover:text-white'
                )}
              >
                {filter === 'all' ? t.trade.all : filter === 'swaps' ? t.trade.swaps : t.trade.auto}
              </button>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div className="border-b border-[#1e2733]">
          <button
            onClick={() => setOpenTradesExpanded(!openTradesExpanded)}
            className="w-full flex items-center justify-between px-3 lg:px-5 py-3 lg:py-4 hover:bg-[#151c24] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 lg:h-5 lg:w-5 text-[#22c55e]" />
              <span className="text-white text-sm lg:text-base font-medium">{t.trade.open}</span>
              <span className="text-[#6b7a90] text-sm lg:text-base">({openPositions.length})</span>
            </div>
            <ChevronDown className={cn('h-4 w-4 lg:h-5 lg:w-5 text-[#6b7a90] transition-transform', openTradesExpanded && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {openTradesExpanded && openPositions.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 lg:px-5 pb-4 lg:pb-5 space-y-2 lg:space-y-3">
                  {openPositions.map((pos) => (
                    <div key={pos.id} className="p-2.5 lg:p-4 bg-[#0a0e14] rounded-lg lg:rounded-xl">
                      {/* Mobile: Stack layout */}
                      <div className="flex items-center justify-between mb-2 lg:mb-0">
                        <div className="flex items-center gap-2 lg:gap-4">
                          <div className={cn(
                            'px-2 lg:px-3 py-0.5 lg:py-1 rounded text-xs lg:text-sm font-medium',
                            pos.type === 'buy' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]'
                          )}>
                            {pos.type.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm lg:text-base font-medium text-white">{pos.symbol}</p>
                            <p className="text-xs lg:text-sm text-[#6b7a90]">{pos.amount} @ {formatCurrency(pos.entryPrice)}</p>
                          </div>
                        </div>
                        {/* Desktop: show P&L inline */}
                        <div className="hidden lg:flex items-center gap-6">
                          <div className="text-right">
                            <p className={cn('text-base font-semibold', pos.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                              {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)}
                            </p>
                            <p className={cn('text-sm', pos.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                              {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                            </p>
                          </div>
                          <button
                            onClick={() => handleClosePosition(pos.id)}
                            className="px-4 py-2 bg-[#ef4444]/10 text-[#ef4444] rounded-lg text-sm font-medium hover:bg-[#ef4444]/20 transition-colors"
                          >
                            {t.trade.close}
                          </button>
                        </div>
                      </div>
                      {/* Mobile: P&L and close button row */}
                      <div className="flex items-center justify-between lg:hidden">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-medium', pos.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                            {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)}
                          </span>
                          <span className={cn('text-xs', pos.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                            ({pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)
                          </span>
                        </div>
                        <button
                          onClick={() => handleClosePosition(pos.id)}
                          className="px-3 py-1.5 bg-[#ef4444]/10 text-[#ef4444] rounded text-xs hover:bg-[#ef4444]/20 transition-colors"
                        >
                          {t.trade.close}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Closed Positions */}
        <div>
          <button
            onClick={() => setClosedTradesExpanded(!closedTradesExpanded)}
            className="w-full flex items-center justify-between px-3 lg:px-5 py-3 lg:py-4 hover:bg-[#151c24] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 lg:h-5 lg:w-5 text-[#6b7a90]" />
              <span className="text-white text-sm lg:text-base font-medium">{t.trade.closed}</span>
              <span className="text-[#6b7a90] text-sm lg:text-base">({closedPositions.length})</span>
            </div>
            <ChevronDown className={cn('h-4 w-4 lg:h-5 lg:w-5 text-[#6b7a90] transition-transform', closedTradesExpanded && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {closedTradesExpanded && closedPositions.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 lg:px-5 pb-4 lg:pb-5 space-y-2 lg:space-y-3">
                  {closedPositions.map((pos) => (
                    <div key={pos.id} className="p-2.5 lg:p-4 bg-[#0a0e14] rounded-lg lg:rounded-xl opacity-70">
                      {/* Mobile: Stack layout */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 lg:gap-4">
                          <div className={cn(
                            'px-2 lg:px-3 py-0.5 lg:py-1 rounded text-xs lg:text-sm font-medium',
                            pos.type === 'buy' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]'
                          )}>
                            {pos.type.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm lg:text-base font-medium text-white">{pos.symbol}</p>
                            <p className="text-xs lg:text-sm text-[#6b7a90] hidden lg:block">
                              {pos.amount} @ {formatCurrency(pos.entryPrice)} → {formatCurrency(pos.exitPrice || pos.currentPrice)}
                            </p>
                            <p className="text-xs text-[#6b7a90] lg:hidden">
                              {pos.amount} @ {formatCurrency(pos.entryPrice)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn('text-sm lg:text-base font-semibold', pos.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                            {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)}
                          </p>
                          <p className="text-xs lg:text-sm text-[#6b7a90] capitalize">
                            {pos.closeReason?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fund Modal */}
      <AnimatePresence>
        {showFundModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseFundModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden mx-4"
            >
              {/* Token Selection */}
              {modalView === 'select-token' && (
                <>
                  <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#1e2733]">
                    <h3 className="text-base md:text-lg font-semibold text-white">{t.trade.fundAccount}</h3>
                    <button onClick={handleCloseFundModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4 md:p-6">
                    <p className="text-sm text-[#6b7a90] mb-3">{t.trade.selectToken}</p>
                    
                    {userHoldings.length === 0 ? (
                      <div className="text-center py-8">
                        <Wallet className="h-12 w-12 text-[#6b7a90] mx-auto mb-3" />
                        <p className="text-white font-medium">No Holdings Available</p>
                        <p className="text-sm text-[#6b7a90]">Deposit tokens to fund your trading account</p>
                      </div>
                    ) : (
                      <>
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
                          <input
                            type="text"
                            value={tokenSearchQuery}
                            onChange={(e) => setTokenSearchQuery(e.target.value)}
                            placeholder="Search tokens..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
                          />
                        </div>
                        <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto space-y-2">
                          {filteredHoldings.map((holding) => (
                            <button
                              key={holding.id}
                              onClick={() => { setSelectedToken(holding); setModalView('amount'); }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#1e2733] hover:border-[#3b82f6] transition-colors"
                            >
                              <div className="h-10 w-10 rounded-full bg-[#1e2733] flex items-center justify-center overflow-hidden flex-shrink-0">
                                {holding.icon ? (
                                  <Image src={holding.icon} alt={holding.symbol} width={32} height={32} className="object-cover" />
                                ) : (
                                  <span className="text-sm font-bold text-white">{holding.symbol.slice(0, 2)}</span>
                                )}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-white font-medium">{holding.symbol}</p>
                                <p className="text-xs text-[#6b7a90] truncate">{holding.name}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-white font-medium">{formatCryptoAmount(holding.amount)}</p>
                                <p className="text-xs text-[#6b7a90]">{formatCurrency(holding.amountUsd)}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Amount Entry */}
              {modalView === 'amount' && selectedToken && (
                <>
                  <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#1e2733]">
                    <button
                      onClick={() => setModalView('select-token')}
                      className="flex items-center gap-2 text-[#6b7a90] hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="text-sm md:text-base">{t.trade.enterAmount}</span>
                    </button>
                    <button onClick={handleCloseFundModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4 md:p-6">
                    {/* Selected Token */}
                    <div className="flex items-center gap-3 p-3 bg-[#0a0e14] rounded-xl border border-[#1e2733] mb-4">
                      <div className="h-10 w-10 rounded-full bg-[#1e2733] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {'icon' in selectedToken && selectedToken.icon ? (
                          <Image src={selectedToken.icon} alt={selectedToken.symbol} width={32} height={32} className="object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-white">{selectedToken.symbol.slice(0, 2)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{selectedToken.symbol}</p>
                        {'amountUsd' in selectedToken && (
                          <p className="text-xs text-[#6b7a90]">{t.trade.availableBalance}: {formatCurrency(selectedToken.amountUsd)}</p>
                        )}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-4">
                      <label className="block text-sm text-[#6b7a90] mb-2">{t.trade.amount} (USD)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={fundWithdrawAmount}
                          onChange={(e) => setFundWithdrawAmount(e.target.value)}
                          placeholder="0"
                          className="flex-1 px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-lg focus:outline-none focus:border-[#22c55e]"
                        />
                        {'amountUsd' in selectedToken && (
                          <button
                            onClick={() => setFundWithdrawAmount(selectedToken.amountUsd.toString())}
                            className="px-4 py-3 bg-[#1e2733] rounded-lg text-[#22c55e] font-medium hover:bg-[#22c55e]/10 transition-colors"
                          >
                            MAX
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Validation */}
                    {'amountUsd' in selectedToken && fundWithdrawAmount && parseFloat(fundWithdrawAmount) > selectedToken.amountUsd && (
                      <div className="flex items-center gap-3 p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl mb-4">
                        <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0" />
                        <p className="text-sm text-[#ef4444]">{t.trade.insufficientBalance}</p>
                      </div>
                    )}

                    <button
                      onClick={handleFundAccount}
                      disabled={!fundWithdrawAmount || parseFloat(fundWithdrawAmount) < 10 || ('amountUsd' in selectedToken && parseFloat(fundWithdrawAmount) > selectedToken.amountUsd)}
                      className={cn(
                        'w-full py-4 rounded-xl font-semibold transition-colors',
                        fundWithdrawAmount && parseFloat(fundWithdrawAmount) >= 10 && ('amountUsd' in selectedToken ? parseFloat(fundWithdrawAmount) <= selectedToken.amountUsd : true)
                          ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                          : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                      )}
                    >
                      {t.trade.fundAccount}
                    </button>
                  </div>
                </>
              )}

              {/* Processing */}
              {modalView === 'processing' && (
                <div className="p-8 text-center">
                  <Loader2 className="h-16 w-16 text-[#22c55e] animate-spin mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-2">{t.trade.processing}</h3>
                  <p className="text-[#6b7a90]">{t.common.loading}</p>
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
                  <h3 className="text-xl font-semibold text-white mb-2">{t.trade.fundSuccess}!</h3>
                  <p className="text-[#6b7a90] mb-6">
                    {formatCurrency(parseFloat(fundWithdrawAmount))} {t.trade.fundedSuccess}.
                  </p>
                  <button
                    onClick={handleCloseFundModal}
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

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseWithdrawModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden mx-4"
            >
              {/* Token Selection */}
              {modalView === 'select-token' && (
                <>
                  <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#1e2733]">
                    <h3 className="text-base md:text-lg font-semibold text-white">{t.trade.withdrawFunds}</h3>
                    <button onClick={handleCloseWithdrawModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4 md:p-6">
                    <p className="text-sm text-[#6b7a90] mb-3">{t.trade.selectToken}</p>
                    
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
                      <input
                        type="text"
                        value={tokenSearchQuery}
                        onChange={(e) => setTokenSearchQuery(e.target.value)}
                        placeholder={t.common.search + '...'}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                    <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto space-y-2">
                      {filteredWithdrawTokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => { setSelectedToken(token); setModalView('amount'); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#1e2733] hover:border-[#3b82f6] transition-colors"
                        >
                          <div className="h-10 w-10 rounded-full bg-[#1e2733] flex items-center justify-center overflow-hidden flex-shrink-0">
                            <Image src={token.icon} alt={token.symbol} width={32} height={32} className="object-cover" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-white font-medium">{token.symbol}</p>
                            <p className="text-xs text-[#6b7a90] truncate">{token.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Amount Entry */}
              {modalView === 'amount' && selectedToken && (
                <>
                  <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#1e2733]">
                    <button
                      onClick={() => setModalView('select-token')}
                      className="flex items-center gap-2 text-[#6b7a90] hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="text-sm md:text-base">{t.trade.enterAmount}</span>
                    </button>
                    <button onClick={handleCloseWithdrawModal} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4 md:p-6">
                    {/* Selected Token */}
                    <div className="flex items-center gap-3 p-3 bg-[#0a0e14] rounded-xl border border-[#1e2733] mb-4">
                      <div className="h-10 w-10 rounded-full bg-[#1e2733] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {'icon' in selectedToken && selectedToken.icon ? (
                          <Image src={selectedToken.icon} alt={selectedToken.symbol} width={32} height={32} className="object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-white">{selectedToken.symbol.slice(0, 2)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">{selectedToken.symbol}</p>
                        <p className="text-xs text-[#6b7a90]">{t.trade.tradingBalance}: {formatCurrency(tradingAccount?.balance || 0)}</p>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-4">
                      <label className="block text-sm text-[#6b7a90] mb-2">{t.trade.amount} (USD)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={fundWithdrawAmount}
                          onChange={(e) => setFundWithdrawAmount(e.target.value)}
                          placeholder="0"
                          className="flex-1 px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white text-lg focus:outline-none focus:border-[#22c55e]"
                        />
                        <button
                          onClick={() => setFundWithdrawAmount((tradingAccount?.balance || 0).toString())}
                          className="px-4 py-3 bg-[#1e2733] rounded-lg text-[#22c55e] font-medium hover:bg-[#22c55e]/10 transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    {/* Validation */}
                    {fundWithdrawAmount && parseFloat(fundWithdrawAmount) > (tradingAccount?.balance || 0) && (
                      <div className="flex items-center gap-3 p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl mb-4">
                        <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0" />
                        <p className="text-sm text-[#ef4444]">{t.trade.insufficientTradingBalance}</p>
                      </div>
                    )}

                    <button
                      onClick={handleWithdrawAccount}
                      disabled={!fundWithdrawAmount || parseFloat(fundWithdrawAmount) < 10 || parseFloat(fundWithdrawAmount) > (tradingAccount?.balance || 0)}
                      className={cn(
                        'w-full py-4 rounded-xl font-semibold transition-colors',
                        fundWithdrawAmount && parseFloat(fundWithdrawAmount) >= 10 && parseFloat(fundWithdrawAmount) <= (tradingAccount?.balance || 0)
                          ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                          : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                      )}
                    >
                      {t.trade.withdrawFunds}
                    </button>
                  </div>
                </>
              )}

              {/* Processing */}
              {modalView === 'processing' && (
                <div className="p-8 text-center">
                  <Loader2 className="h-16 w-16 text-[#22c55e] animate-spin mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-2">{t.trade.processing}</h3>
                  <p className="text-[#6b7a90]">{t.common.loading}</p>
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
                  <h3 className="text-xl font-semibold text-white mb-2">{t.trade.withdrawSuccess}!</h3>
                  <p className="text-[#6b7a90] mb-6">
                    {formatCurrency(parseFloat(fundWithdrawAmount))} {t.trade.withdrawnSuccess}.
                  </p>
                  <button
                    onClick={handleCloseWithdrawModal}
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Custom Styles */}
      <style jsx global>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #22c55e;
          cursor: pointer;
          border: 2px solid #0a0e14;
        }
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #22c55e;
          cursor: pointer;
          border: 2px solid #0a0e14;
        }
      `}</style>
    </div>
  );
}
