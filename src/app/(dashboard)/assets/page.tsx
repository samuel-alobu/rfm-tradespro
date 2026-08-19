'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Assets Page - User Portfolio Assets
// ============================================

// Asset Interface (Admin can manage user balances)
export interface UserAsset {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  type: 'Crypto' | 'Stocks';
  currentPrice: number;
  balance: number; // Amount user owns
  value: number; // balance * currentPrice
  // Admin fields
  userId?: string;
  updatedAt?: Date;
}

// Recent Activity Interface
export interface RecentActivity {
  id: string;
  message: string;
  date: string | null;
  type: 'welcome' | 'deposit' | 'withdraw' | 'trade' | 'stake' | 'info' | 'investment';
}

// Comprehensive asset list - Stocks and Crypto mixed
const allAssets: UserAsset[] = [
  // Stocks
  { id: 'aapl', name: 'Apple', symbol: 'AAPL', logo: '', type: 'Stocks', currentPrice: 248.98, balance: 0, value: 0 },
  { id: 'abt', name: 'Abbott Labs', symbol: 'ABT', logo: '', type: 'Stocks', currentPrice: 105.555, balance: 0, value: 0 },
  { id: 'adbe', name: 'Adobe', symbol: 'ADBE', logo: '', type: 'Stocks', currentPrice: 248.075, balance: 0, value: 0 },
  { id: 'adi', name: 'Analog Devices', symbol: 'ADI', logo: '', type: 'Stocks', currentPrice: 309.58, balance: 0, value: 0 },
  { id: 'aemd', name: 'Aethlon Medical', symbol: 'AEMD', logo: '', type: 'Stocks', currentPrice: 2.12, balance: 0, value: 0 },
  { id: 'aig', name: 'American International Group', symbol: 'AIG', logo: '', type: 'Stocks', currentPrice: 74.42, balance: 0, value: 0 },
  { id: 'amc', name: 'AMC Holdings', symbol: 'AMC', logo: '', type: 'Stocks', currentPrice: 0.994, balance: 0, value: 0 },
  { id: 'amd', name: 'AMD', symbol: 'AMD', logo: '', type: 'Stocks', currentPrice: 201.36, balance: 0, value: 0 },
  { id: 'amzn', name: 'Amazon', symbol: 'AMZN', logo: '', type: 'Stocks', currentPrice: 178.25, balance: 0, value: 0 },
  { id: 'ba', name: 'Boeing', symbol: 'BA', logo: '', type: 'Stocks', currentPrice: 176.89, balance: 0, value: 0 },
  { id: 'baba', name: 'Alibaba', symbol: 'BABA', logo: '', type: 'Stocks', currentPrice: 85.42, balance: 0, value: 0 },
  { id: 'cost', name: 'Costco', symbol: 'COST', logo: '', type: 'Stocks', currentPrice: 912.45, balance: 0, value: 0 },
  { id: 'crm', name: 'Salesforce', symbol: 'CRM', logo: '', type: 'Stocks', currentPrice: 267.89, balance: 0, value: 0 },
  { id: 'dis', name: 'Disney', symbol: 'DIS', logo: '', type: 'Stocks', currentPrice: 89.67, balance: 0, value: 0 },
  { id: 'googl', name: 'Alphabet', symbol: 'GOOGL', logo: '', type: 'Stocks', currentPrice: 156.78, balance: 0, value: 0 },
  { id: 'jpm', name: 'JPMorgan Chase', symbol: 'JPM', logo: '', type: 'Stocks', currentPrice: 198.45, balance: 0, value: 0 },
  { id: 'ko', name: 'Coca-Cola', symbol: 'KO', logo: '', type: 'Stocks', currentPrice: 62.34, balance: 0, value: 0 },
  { id: 'meta', name: 'Meta Platforms', symbol: 'META', logo: '', type: 'Stocks', currentPrice: 485.23, balance: 0, value: 0 },
  { id: 'msft', name: 'Microsoft', symbol: 'MSFT', logo: '', type: 'Stocks', currentPrice: 378.91, balance: 0, value: 0 },
  { id: 'nflx', name: 'Netflix', symbol: 'NFLX', logo: '', type: 'Stocks', currentPrice: 628.45, balance: 0, value: 0 },
  { id: 'nvda', name: 'NVIDIA', symbol: 'NVDA', logo: '', type: 'Stocks', currentPrice: 875.28, balance: 0, value: 0 },
  { id: 'pypl', name: 'PayPal', symbol: 'PYPL', logo: '', type: 'Stocks', currentPrice: 63.78, balance: 0, value: 0 },
  { id: 'shop', name: 'Shopify', symbol: 'SHOP', logo: '', type: 'Stocks', currentPrice: 78.92, balance: 0, value: 0 },
  { id: 'spot', name: 'Spotify', symbol: 'SPOT', logo: '', type: 'Stocks', currentPrice: 298.56, balance: 0, value: 0 },
  { id: 'sq', name: 'Block Inc', symbol: 'SQ', logo: '', type: 'Stocks', currentPrice: 67.34, balance: 0, value: 0 },
  { id: 'tsla', name: 'Tesla', symbol: 'TSLA', logo: '', type: 'Stocks', currentPrice: 245.67, balance: 0, value: 0 },
  { id: 'v', name: 'Visa', symbol: 'V', logo: '', type: 'Stocks', currentPrice: 275.89, balance: 0, value: 0 },
  { id: 'wmt', name: 'Walmart', symbol: 'WMT', logo: '', type: 'Stocks', currentPrice: 165.23, balance: 0, value: 0 },
  
  // Crypto
  { id: 'aave', name: 'AAVE', symbol: 'AAVE', logo: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png', type: 'Crypto', currentPrice: 105.758, balance: 0, value: 0 },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', logo: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', type: 'Crypto', currentPrice: 0.251, balance: 0, value: 0 },
  { id: 'algo', name: 'Algorand', symbol: 'ALGO', logo: 'https://assets.coingecko.com/coins/images/4380/small/download.png', type: 'Crypto', currentPrice: 0.085, balance: 0, value: 0 },
  { id: 'atom', name: 'Cosmos', symbol: 'ATOM', logo: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png', type: 'Crypto', currentPrice: 4.52, balance: 0, value: 0 },
  { id: 'avax', name: 'Avalanche', symbol: 'AVAX', logo: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', type: 'Crypto', currentPrice: 22.45, balance: 0, value: 0 },
  { id: 'bnb', name: 'BNB', symbol: 'BNB', logo: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', type: 'Crypto', currentPrice: 598.75, balance: 0, value: 0 },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', type: 'Crypto', currentPrice: 67250.00, balance: 0, value: 0 },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', logo: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', type: 'Crypto', currentPrice: 0.082, balance: 0, value: 0 },
  { id: 'dot', name: 'Polkadot', symbol: 'DOT', logo: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', type: 'Crypto', currentPrice: 4.25, balance: 0, value: 0 },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', type: 'Crypto', currentPrice: 3500.00, balance: 0, value: 0 },
  { id: 'ftm', name: 'Fantom', symbol: 'FTM', logo: 'https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png', type: 'Crypto', currentPrice: 0.42, balance: 0, value: 0 },
  { id: 'link', name: 'Chainlink', symbol: 'LINK', logo: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', type: 'Crypto', currentPrice: 13.85, balance: 0, value: 0 },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC', logo: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', type: 'Crypto', currentPrice: 72.45, balance: 0, value: 0 },
  { id: 'matic', name: 'Polygon', symbol: 'MATIC', logo: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png', type: 'Crypto', currentPrice: 0.38, balance: 0, value: 0 },
  { id: 'near', name: 'NEAR Protocol', symbol: 'NEAR', logo: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg', type: 'Crypto', currentPrice: 2.85, balance: 0, value: 0 },
  { id: 'shib', name: 'Shiba Inu', symbol: 'SHIB', logo: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png', type: 'Crypto', currentPrice: 0.0000089, balance: 0, value: 0 },
  { id: 'sol', name: 'Solana', symbol: 'SOL', logo: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', type: 'Crypto', currentPrice: 148.25, balance: 0, value: 0 },
  { id: 'uni', name: 'Uniswap', symbol: 'UNI', logo: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg', type: 'Crypto', currentPrice: 6.78, balance: 0, value: 0 },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', logo: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', type: 'Crypto', currentPrice: 1.00, balance: 0, value: 0 },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', type: 'Crypto', currentPrice: 1.00, balance: 0, value: 0 },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', logo: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', type: 'Crypto', currentPrice: 0.52, balance: 0, value: 0 },
];

// Sample recent activity - will be replaced by API data
const defaultActivities: RecentActivity[] = [];

// Stock logo colors (for fallback)
const stockColors: Record<string, string> = {
  AAPL: '#007AFF',
  ABT: '#0078D4',
  ADBE: '#FF0000',
  ADI: '#000000',
  AEMD: '#00A36C',
  AIG: '#004C97',
  AMC: '#FF0000',
  AMD: '#ED1C24',
  AMZN: '#FF9900',
  BA: '#0033A0',
  BABA: '#FF6A00',
  COST: '#E31837',
  CRM: '#00A1E0',
  DIS: '#006E99',
  GOOGL: '#4285F4',
  JPM: '#004C97',
  KO: '#F40009',
  META: '#0668E1',
  MSFT: '#00A4EF',
  NFLX: '#E50914',
  NVDA: '#76B900',
  PYPL: '#003087',
  SHOP: '#96BF48',
  SPOT: '#1DB954',
  SQ: '#000000',
  TSLA: '#CC0000',
  V: '#1A1F71',
  WMT: '#0071DC',
};

// Asset Logo Component
function AssetLogo({ asset, size = 32 }: { asset: UserAsset; size?: number }) {
  const [error, setError] = useState(false);

  // For stocks, always use colored initials
  if (asset.type === 'Stocks' || error || !asset.logo) {
    const color = stockColors[asset.symbol] || '#6b7a90';
    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-bold"
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: color,
          fontSize: size * 0.4
        }}
      >
        {asset.symbol.charAt(0)}
      </div>
    );
  }

  return (
    <div className="rounded-full overflow-hidden bg-white flex items-center justify-center" style={{ width: size, height: size }}>
      <Image
        src={asset.logo}
        alt={asset.symbol}
        width={size}
        height={size}
        className="object-contain"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );
}

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

type FilterType = 'all' | 'Crypto' | 'Stocks';
type ViewMode = 'list' | 'grid';
type MobileTab = 'categories' | 'recent';

export default function AssetsPage() {
  // Translation hook
  const { t } = useLanguage();
  
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileTab, setMobileTab] = useState<MobileTab>('categories');
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);

  // Fetch user assets from API
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/assets');
        const data = await response.json();
        
        if (data.assets) {
          // Merge API assets with the static allAssets list
          // API assets have real balances, static ones show all available assets
          const assetMap = new Map<string, UserAsset>();
          
          // First add all static assets with 0 balance
          allAssets.forEach(asset => {
            assetMap.set(asset.symbol.toUpperCase(), { ...asset, balance: 0, value: 0 });
          });
          
          // Then update with real balances from API
          data.assets.forEach((apiAsset: UserAsset) => {
            const existing = assetMap.get(apiAsset.symbol.toUpperCase());
            if (existing) {
              assetMap.set(apiAsset.symbol.toUpperCase(), {
                ...existing,
                balance: apiAsset.balance,
                value: apiAsset.value,
                currentPrice: apiAsset.currentPrice || existing.currentPrice,
              });
            } else {
              // New asset not in static list
              assetMap.set(apiAsset.symbol.toUpperCase(), apiAsset);
            }
          });
          
          setAssets(Array.from(assetMap.values()));
          setTotalBalance(data.totalBalance || 0);
        }
        
        if (data.recentActivities) {
          setActivities(data.recentActivities);
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        // Fallback to static assets
        setAssets(allAssets);
        setActivities([{
          id: 'welcome',
          message: 'Welcome to Rfm Tradepro!',
          date: null,
          type: 'welcome',
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, []);

  // Filter and search assets
  const filteredAssets = assets
    .filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || asset.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // Sort by balance value descending (assets with balance first), then alphabetically
      if (a.value > 0 && b.value === 0) return -1;
      if (a.value === 0 && b.value > 0) return 1;
      if (a.value > 0 && b.value > 0) return b.value - a.value;
      return a.name.localeCompare(b.name);
    });

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

  const handleDeposit = (asset: UserAsset) => {
    addToast('info', `Redirecting to deposit ${asset.symbol}...`);
    // In real app, would navigate to deposit page with asset pre-selected
  };

  const handleWithdraw = (asset: UserAsset) => {
    if (asset.balance <= 0) {
      addToast('error', `You don't have any ${asset.symbol} to withdraw`);
      return;
    }
    addToast('info', `Redirecting to withdraw ${asset.symbol}...`);
  };

  // Format date from ISO string - safe for hydration
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Translate activity messages
  const translateActivityMessage = (message: string): string => {
    const messageMap: Record<string, string> = {
      'Withdrawal Approved': t.assets.withdrawalApproved,
      'Withdrawal Submitted': t.assets.withdrawalSubmitted,
      'Deposit Approved': t.assets.depositApproved,
      'Deposit Submitted': t.assets.depositSubmitted,
      'Welcome to Rfm Tradepro!': t.assets.welcomeMessage,
    };
    return messageMap[message] || message;
  };

  return (
    <div className="space-y-6">
      {/* Mobile: Total Balance + Tabs */}
      <div className="md:hidden">
        {/* Total Balance Card */}
        <div className="bg-[#0f1419] rounded-xl p-6 border border-[#1e2733] mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-[#6b7a90]">{t.assets.totalBalance}</span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-[#6b7a90] hover:text-white transition-colors"
            >
              {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
          <p className="font-heading text-3xl font-bold text-white">
            {isLoading ? (
              <span className="inline-block w-32 h-9 bg-[#1e2733] rounded animate-pulse" />
            ) : showBalance ? (
              formatCurrency(totalBalance)
            ) : (
              '••••••'
            )}
          </p>

          {/* Mobile Tabs */}
          <div className="mt-6">
            <div className="flex gap-6 border-b border-[#1e2733]">
              <button
                onClick={() => setMobileTab('categories')}
                className={cn(
                  'pb-3 text-sm font-medium transition-colors relative',
                  mobileTab === 'categories' ? 'text-white' : 'text-[#6b7a90]'
                )}
              >
                {t.assets.allAssets}
                {mobileTab === 'categories' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
                )}
              </button>
              <button
                onClick={() => setMobileTab('recent')}
                className={cn(
                  'pb-3 text-sm font-medium transition-colors relative',
                  mobileTab === 'recent' ? 'text-white' : 'text-[#6b7a90]'
                )}
              >
                {t.assets.recentActivity}
                {mobileTab === 'recent' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
                )}
              </button>
            </div>

            {/* Mobile Tab Content */}
            <div className="mt-4">
              {mobileTab === 'recent' && (
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="h-5 w-48 bg-[#1e2733] rounded animate-pulse" />
                  ) : activities.length === 0 ? (
                    <p className="text-sm text-[#6b7a90]">{t.assets.noRecentActivity}</p>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between">
                        <p className="text-sm text-white">{translateActivityMessage(activity.message)}</p>
                        {activity.date && (
                          <span className="text-sm text-[#6b7a90]">{formatDate(activity.date)}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Top Cards Row */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Balance Card */}
        <div className="bg-[#0f1419] rounded-xl p-6 border border-[#1e2733]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-[#6b7a90]">{t.assets.totalBalance}</span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-[#6b7a90] hover:text-white transition-colors"
            >
              {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
          <p className="font-heading text-3xl font-bold text-white">
            {isLoading ? (
              <span className="inline-block w-32 h-9 bg-[#1e2733] rounded animate-pulse" />
            ) : showBalance ? (
              formatCurrency(totalBalance)
            ) : (
              '••••••'
            )}
          </p>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-[#0f1419] rounded-xl p-6 border border-[#1e2733]">
          <h3 className="text-sm font-medium text-[#6b7a90] mb-4">{t.assets.recentActivity}</h3>
          <div className="space-y-3">
            {isLoading ? (
              <div className="h-5 w-48 bg-[#1e2733] rounded animate-pulse" />
            ) : activities.length === 0 ? (
              <p className="text-sm text-[#6b7a90]">{t.assets.noRecentActivity}</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <p className="text-sm text-white">{translateActivityMessage(activity.message)}</p>
                  {activity.date && (
                    <span className="text-sm text-[#6b7a90]">{formatDate(activity.date)}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assets Section */}
      <div className={cn(
        "bg-[#0f1419] rounded-xl border border-[#1e2733]",
        mobileTab === 'recent' && "hidden md:block"
      )}>
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-[#1e2733]">
            <h2 className="font-heading text-lg font-semibold text-white mb-4 md:mb-0">{t.assets.allYourAssets}</h2>
            
            {/* Mobile: Search and Filter */}
            <div className="flex gap-2 md:hidden mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
                <input
                  type="text"
                  placeholder={t.assets.searchForAssets}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e] text-sm"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white hover:border-[#2a3441] transition-colors"
                >
                  <span className="text-sm whitespace-nowrap">
                    {filterType === 'all' ? t.assets.allAssets : filterType === 'Crypto' ? t.assets.crypto : t.assets.stocks}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 text-[#6b7a90] transition-transform', isFilterOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-40 bg-[#0f1419] border border-[#1e2733] rounded-lg shadow-xl z-10 overflow-hidden"
                    >
                      {(['all', 'Crypto', 'Stocks'] as FilterType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => { setFilterType(type); setIsFilterOpen(false); }}
                          className={cn(
                            'w-full px-4 py-2.5 text-left text-sm transition-colors',
                            filterType === type ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'text-white hover:bg-[#1e2733]'
                          )}
                        >
                          {type === 'all' ? t.assets.allAssets : type === 'Crypto' ? t.assets.crypto : t.assets.stocks}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Desktop: Search, Filter, View Toggle */}
            <div className="hidden md:flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
                  <input
                    type="text"
                    placeholder={t.assets.searchForAssets}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e] text-sm"
                  />
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white hover:border-[#2a3441] transition-colors"
                  >
                    <span className="text-sm">
                      {filterType === 'all' ? t.assets.allAssets : filterType === 'Crypto' ? t.assets.crypto : t.assets.stocks}
                    </span>
                    <ChevronDown className={cn(
                      'h-4 w-4 text-[#6b7a90] transition-transform',
                      isFilterOpen && 'rotate-180'
                    )} />
                  </button>
                  <AnimatePresence>
                    {isFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-40 bg-[#0f1419] border border-[#1e2733] rounded-lg shadow-xl z-10 overflow-hidden"
                      >
                        {(['all', 'Crypto', 'Stocks'] as FilterType[]).map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setFilterType(type);
                              setIsFilterOpen(false);
                            }}
                            className={cn(
                              'w-full px-4 py-2.5 text-left text-sm transition-colors',
                              filterType === type
                                ? 'bg-[#22c55e]/10 text-[#22c55e]'
                                : 'text-white hover:bg-[#1e2733]'
                            )}
                          >
                            {type === 'all' ? t.assets.allAssets : type === 'Crypto' ? t.assets.crypto : t.assets.stocks}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-[#1e2733] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'list'
                      ? 'bg-[#1e2733] text-white'
                      : 'text-[#6b7a90] hover:text-white'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-[#1e2733] text-white'
                      : 'text-[#6b7a90] hover:text-white'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden">
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2733] text-xs text-[#6b7a90]">
              <span>{t.assets.asset}</span>
              <span>{t.assets.inYourWallet}</span>
            </div>
            
            {/* Mobile Asset List */}
            <div className="divide-y divide-[#1e2733]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1e2733] animate-pulse" />
                      <div className="w-12 h-4 bg-[#1e2733] rounded animate-pulse" />
                    </div>
                    <div className="w-24 h-4 bg-[#1e2733] rounded animate-pulse" />
                  </div>
                ))
              ) : (
                filteredAssets.map((asset) => (
                  <div key={asset.id}>
                    <button
                      onClick={() => setExpandedAssetId(expandedAssetId === asset.id ? null : asset.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 transition-colors',
                        expandedAssetId === asset.id ? 'bg-[#151c24]' : 'hover:bg-[#0c1015]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <AssetLogo asset={asset} size={32} />
                        <span className="font-medium text-white">{asset.symbol}</span>
                      </div>
                      <span className="text-sm text-[#6b7a90]">
                        {asset.balance > 0 ? (
                          <>{asset.balance.toFixed(asset.balance < 1 ? 4 : 2)} {asset.symbol} <span className="text-[#22c55e]">{formatCurrency(asset.value)}</span></>
                        ) : (
                          <>0.00 {asset.symbol} $0.00</>
                        )}
                      </span>
                    </button>
                    
                    {/* Expanded Actions */}
                    <AnimatePresence>
                      {expandedAssetId === asset.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-[#151c24]"
                        >
                          <div className="flex items-center gap-2 px-4 py-3 pl-[60px]">
                            <Link
                              href="/deposit"
                              className="px-6 py-2 text-sm bg-[#1e2733] text-white rounded-lg hover:bg-[#2a3441] transition-colors"
                            >
                              {t.assets.deposit}
                            </Link>
                            <Link
                              href="/investing"
                              className="px-6 py-2 text-sm bg-[#1e2733] text-white rounded-lg hover:bg-[#2a3441] transition-colors"
                            >
                              {t.assets.withdraw}
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop: Assets Table/Grid */}
          <div className="hidden md:block">
            {viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2733]">
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#6b7a90] uppercase tracking-wider">
                        {t.assets.asset}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#6b7a90] uppercase tracking-wider">
                        {t.assets.type}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#6b7a90] uppercase tracking-wider">
                        {t.assets.currentPriceUsd}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#6b7a90] uppercase tracking-wider">
                        {t.assets.inYourWallet}
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-[#6b7a90] uppercase tracking-wider">
                        {t.assets.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-[#1e2733]">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1e2733] animate-pulse" />
                              <div className="w-24 h-4 bg-[#1e2733] rounded animate-pulse" />
                            </div>
                          </td>
                          <td className="px-6 py-4"><div className="w-16 h-4 bg-[#1e2733] rounded animate-pulse" /></td>
                          <td className="px-6 py-4"><div className="w-20 h-4 bg-[#1e2733] rounded animate-pulse" /></td>
                          <td className="px-6 py-4"><div className="w-28 h-4 bg-[#1e2733] rounded animate-pulse" /></td>
                          <td className="px-6 py-4"><div className="w-32 h-4 bg-[#1e2733] rounded animate-pulse ml-auto" /></td>
                        </tr>
                      ))
                    ) : (
                      filteredAssets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="border-b border-[#1e2733] hover:bg-[#151c24] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <AssetLogo asset={asset} size={32} />
                              <span className="font-medium text-white">{asset.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-[#6b7a90]">{asset.type === 'Crypto' ? t.assets.crypto : t.assets.stocks}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-white">
                              ${asset.currentPrice < 1 
                                ? asset.currentPrice.toFixed(asset.currentPrice < 0.01 ? 7 : 3)
                                : asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })
                              }/{asset.symbol}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {asset.balance > 0 ? (
                              <span className="text-sm">
                                <span className="text-white">{asset.balance.toFixed(asset.balance < 1 ? 4 : 2)} {asset.symbol}</span>
                                {' '}
                                <span className="text-[#22c55e]">{formatCurrency(asset.value)}</span>
                              </span>
                            ) : (
                              <span className="text-sm text-[#6b7a90]">0.00 {asset.symbol} $0.00</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href="/deposit"
                                className="px-4 py-1.5 text-sm text-white hover:text-[#22c55e] transition-colors"
                              >
                                {t.assets.deposit}
                              </Link>
                              <Link
                                href="/investing"
                                className="px-4 py-1.5 text-sm text-white hover:text-[#22c55e] transition-colors"
                              >
                                {t.assets.withdraw}
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              // Grid View
              <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <div key={i} className="bg-[#0a0e14] rounded-xl p-4 border border-[#1e2733]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#1e2733] animate-pulse" />
                        <div>
                          <div className="w-12 h-4 bg-[#1e2733] rounded animate-pulse mb-1" />
                          <div className="w-8 h-3 bg-[#1e2733] rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="w-10 h-3 bg-[#1e2733] rounded animate-pulse mb-1" />
                        <div className="w-16 h-5 bg-[#1e2733] rounded animate-pulse" />
                      </div>
                      <div className="mb-4">
                        <div className="w-12 h-3 bg-[#1e2733] rounded animate-pulse mb-1" />
                        <div className="w-20 h-4 bg-[#1e2733] rounded animate-pulse" />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-9 bg-[#1e2733] rounded-lg animate-pulse" />
                        <div className="flex-1 h-9 bg-[#1e2733] rounded-lg animate-pulse" />
                      </div>
                    </div>
                  ))
                ) : (
                  filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-[#0a0e14] rounded-xl p-4 border border-[#1e2733] hover:border-[#2a3441] transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <AssetLogo asset={asset} size={40} />
                        <div>
                          <p className="font-medium text-white">{asset.symbol}</p>
                          <p className="text-xs text-[#6b7a90]">{asset.type === 'Crypto' ? t.assets.crypto : t.assets.stocks}</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-[#6b7a90]">{t.assets.price}</p>
                        <p className="text-lg font-semibold text-white">
                          ${asset.currentPrice < 1 
                            ? asset.currentPrice.toFixed(3)
                            : asset.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })
                          }
                        </p>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-[#6b7a90]">{t.assets.balance}</p>
                        {asset.balance > 0 ? (
                          <p className="text-sm">
                            <span className="text-white">{asset.balance.toFixed(asset.balance < 1 ? 4 : 2)} {asset.symbol}</span>
                            {' '}
                            <span className="text-[#22c55e]">{formatCurrency(asset.value)}</span>
                          </p>
                        ) : (
                          <p className="text-sm text-[#6b7a90]">0.00 {asset.symbol}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href="/deposit"
                          className="flex-1 py-2 text-center text-sm bg-[#22c55e]/10 text-[#22c55e] rounded-lg hover:bg-[#22c55e]/20 transition-colors"
                        >
                          {t.assets.deposit}
                        </Link>
                        <Link
                          href="/investing"
                          className="flex-1 py-2 text-center text-sm bg-[#1e2733] text-white rounded-lg hover:bg-[#2a3441] transition-colors"
                        >
                          {t.assets.withdraw}
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Empty State */}
          {!isLoading && filteredAssets.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-[#6b7a90]">{t.assets.noAssetsFound}</p>
            </div>
          )}
        </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
