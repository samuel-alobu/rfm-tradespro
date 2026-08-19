'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Search,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Cold Storage Page - Connected to Real APIs
// ============================================

type TabType = 'assets' | 'howItWorks';
type PanelView = 'list' | 'detail' | 'processing' | 'success';

// Available assets list (for assets without wallet balance)
const defaultAssets = [
  { symbol: 'BTC', name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', price: 67234.50, type: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', price: 3456.78, type: 'crypto' },
  { symbol: 'SOL', name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', price: 178.45, type: 'crypto' },
  { symbol: 'BNB', name: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', price: 605.23, type: 'crypto' },
  { symbol: 'XRP', name: 'Ripple', icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', price: 0.62, type: 'crypto' },
  { symbol: 'ADA', name: 'Cardano', icon: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', price: 0.45, type: 'crypto' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', price: 0.12, type: 'crypto' },
  { symbol: 'DOT', name: 'Polkadot', icon: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', price: 7.23, type: 'crypto' },
  { symbol: 'AVAX', name: 'Avalanche', icon: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', price: 35.67, type: 'crypto' },
  { symbol: 'MATIC', name: 'Polygon', icon: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png', price: 0.58, type: 'crypto' },
  { symbol: 'LINK', name: 'Chainlink', icon: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', price: 14.56, type: 'crypto' },
  { symbol: 'UNI', name: 'Uniswap', icon: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png', price: 9.87, type: 'crypto' },
  { symbol: 'ATOM', name: 'Cosmos', icon: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png', price: 8.45, type: 'crypto' },
  { symbol: 'LTC', name: 'Litecoin', icon: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', price: 84.56, type: 'crypto' },
  { symbol: 'USDT', name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', price: 1.00, type: 'crypto' },
  { symbol: 'USDC', name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', price: 1.00, type: 'crypto' },
];

interface ColdStorageAsset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  icon: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  currentValue: number;
  createdAt: string;
}

interface WalletHolding {
  symbol: string;
  name: string;
  icon: string;
  amount: number;
  amountUsd: number;
  price: number;
}

interface DisplayAsset {
  symbol: string;
  name: string;
  icon: string;
  price: number;
  type: string;
  walletAmount: number;
  walletValue: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Asset Logo with fallback
function AssetLogo({ symbol, logoUrl, size = 36 }: { symbol: string; logoUrl: string; size?: number }) {
  const [error, setError] = useState(false);

  if (error) {
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
    <Image
      src={logoUrl}
      alt={symbol}
      width={size}
      height={size}
      className="rounded-full bg-white"
      onError={() => setError(true)}
      unoptimized
    />
  );
}

export default function ColdStoragePage() {
  // Translation hook
  const { t } = useLanguage();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('assets');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(2);
  
  // Data states
  const [coldStorageAssets, setColdStorageAssets] = useState<ColdStorageAsset[]>([]);
  const [walletHoldings, setWalletHoldings] = useState<WalletHolding[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalColdStorageValue, setTotalColdStorageValue] = useState(0);
  
  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Panel states
  const [showPanel, setShowPanel] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<DisplayAsset | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Fetch cold storage data
  const fetchColdStorageData = async () => {
    try {
      const res = await fetch('/api/user/cold-storage');
      const data = await res.json();
      
      if (res.ok) {
        setColdStorageAssets(data.coldStorageAssets || []);
        setWalletHoldings(data.walletHoldings || []);
        setTotalColdStorageValue(data.totalColdStorageValue || 0);
        setAvailableBalance(data.availableBalance || 0);
      }
    } catch (error) {
      console.log('Cold storage fetch issue:', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchColdStorageData();
  }, []);

  // Build display assets list (combine wallet holdings with default assets)
  const displayAssets: DisplayAsset[] = (() => {
    const assetsMap = new Map<string, DisplayAsset>();
    
    // First add wallet holdings (user's actual tokens)
    walletHoldings.forEach(h => {
      assetsMap.set(h.symbol, {
        symbol: h.symbol,
        name: h.name,
        icon: h.icon,
        price: h.price,
        type: 'crypto',
        walletAmount: h.amount,
        walletValue: h.amountUsd,
      });
    });
    
    // Then add default assets (with 0 wallet balance if not already present)
    defaultAssets.forEach(a => {
      if (!assetsMap.has(a.symbol)) {
        assetsMap.set(a.symbol, {
          symbol: a.symbol,
          name: a.name,
          icon: a.icon,
          price: a.price,
          type: a.type,
          walletAmount: 0,
          walletValue: 0,
        });
      }
    });
    
    // Convert to array and sort (holdings first, then alphabetically)
    return Array.from(assetsMap.values()).sort((a, b) => {
      if (a.walletAmount > 0 && b.walletAmount === 0) return -1;
      if (a.walletAmount === 0 && b.walletAmount > 0) return 1;
      return a.symbol.localeCompare(b.symbol);
    });
  })();

  // Filter assets based on search
  const filteredAssets = displayAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const handleOpenPanel = () => {
    setShowPanel(true);
    setPanelView('list');
    setSearchQuery('');
    setSelectedAsset(null);
    setDepositAmount('');
  };

  const handleClosePanel = () => {
    setShowPanel(false);
    setPanelView('list');
    setSearchQuery('');
    setSelectedAsset(null);
    setDepositAmount('');
  };

  const handleSelectAsset = (asset: DisplayAsset) => {
    setSelectedAsset(asset);
    setPanelView('detail');
    setDepositAmount('');
  };

  const handleBackToList = () => {
    setPanelView('list');
    setSelectedAsset(null);
    setDepositAmount('');
  };

  const handleDeposit = async () => {
    const quantity = parseFloat(depositAmount);
    if (isNaN(quantity) || quantity <= 0) {
      addToast('error', 'Please enter a valid quantity');
      return;
    }
    if (!selectedAsset) return;

    const totalCost = quantity * selectedAsset.price;
    
    // Check balance
    if (totalCost > availableBalance) {
      addToast('error', `Insufficient balance. You need ${formatCurrency(totalCost)} but only have ${formatCurrency(availableBalance)}`);
      return;
    }

    setPanelView('processing');

    try {
      const res = await fetch('/api/user/cold-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedAsset.symbol,
          name: selectedAsset.name,
          type: selectedAsset.type,
          icon: selectedAsset.icon,
          quantity,
          price: selectedAsset.price,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPanelView('success');
        // Refresh data
        await fetchColdStorageData();
      } else {
        addToast('error', data.error || 'Failed to deposit to cold storage');
        setPanelView('detail');
      }
    } catch (error) {
      addToast('error', 'Failed to deposit to cold storage');
      setPanelView('detail');
    }
  };

  const handleWithdrawSingle = async (assetId: string) => {
    try {
      const res = await fetch('/api/user/cold-storage/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        addToast('success', data.message || t.coldStorage.successfullyWithdrawn);
        await fetchColdStorageData();
      } else {
        addToast('error', data.error || t.coldStorage.failedToWithdraw);
      }
    } catch (error) {
      addToast('error', t.coldStorage.failedToWithdraw);
    }
  };

  const handleWithdrawAll = async () => {
    if (coldStorageAssets.length === 0) return;

    try {
      const res = await fetch('/api/user/cold-storage/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawAll: true }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        addToast('success', data.message || t.coldStorage.successfullyWithdrawnAll);
        await fetchColdStorageData();
      } else {
        addToast('error', data.error || t.coldStorage.failedToWithdrawAll);
      }
    } catch (error) {
      addToast('error', t.coldStorage.failedToWithdrawAll);
    }
  };

  const handleSuccessClose = () => {
    addToast('success', `${t.coldStorage.successfullyAdded} ${depositAmount} ${selectedAsset?.symbol}`);
    handleClosePanel();
  };

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-white mb-6">{t.coldStorage.title}</h1>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-6 border-b border-[#1e2733]">
          <button
            onClick={() => setActiveTab('assets')}
            className={cn(
              'pb-3 text-sm font-medium transition-colors relative',
              activeTab === 'assets' ? 'text-white' : 'text-[#6b7a90] hover:text-white'
            )}
          >
            {t.coldStorage.assetsTab}
            {activeTab === 'assets' && (
              <motion.div layoutId="coldStorageTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('howItWorks')}
            className={cn(
              'pb-3 text-sm font-medium transition-colors relative',
              activeTab === 'howItWorks' ? 'text-white' : 'text-[#6b7a90] hover:text-white'
            )}
          >
            {t.coldStorage.howItWorksTab}
            {activeTab === 'howItWorks' && (
              <motion.div layoutId="coldStorageTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
            )}
          </button>
        </div>
        <div className="h-1 bg-[#1e2733] rounded-full mt-0.5">
          <div className="h-full bg-[#22c55e] rounded-full transition-all duration-300" style={{ width: activeTab === 'assets' ? '10%' : '100%' }} />
        </div>
      </div>

      {/* Assets Tab Content */}
      {activeTab === 'assets' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Cold Storage Value + Withdraw All */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-[#6b7a90]">{t.coldStorage.coldStorageValue}</span>
                <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-[#6b7a90] hover:text-white">
                  {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-3xl font-bold text-white">
                {isLoading ? (
                  <span className="inline-block w-32 h-8 bg-[#1e2733] rounded animate-pulse" />
                ) : balanceVisible ? (
                  formatCurrency(totalColdStorageValue)
                ) : (
                  '••••••'
                )}
              </p>
            </div>
            
            {/* Withdraw All Button - Only show when there are assets */}
            {coldStorageAssets.length > 0 && (
              <button
                onClick={handleWithdrawAll}
                className="flex items-center gap-2 px-4 py-2 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-sm font-medium rounded-lg hover:bg-[#ef4444]/20 transition-colors"
              >
                <ArrowUpRight className="h-4 w-4" />
                {t.coldStorage.withdrawAll}
              </button>
            )}
          </div>

          {/* Your Assets Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">{t.coldStorage.yourAssets}</h3>
              <button
                onClick={handleOpenPanel}
                className="px-4 py-2 bg-[#22c55e] text-white text-sm font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
              >
                {t.coldStorage.addAsset}
              </button>
            </div>

            {/* Assets Table */}
            <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2733]">
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">{t.coldStorage.asset}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">{t.coldStorage.currentPrice}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">{t.coldStorage.inWallet}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7a90]">{t.coldStorage.currentValue}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-[#6b7a90]">{t.coldStorage.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="border-b border-[#1e2733]">
                          <td className="px-4 py-3"><div className="h-10 w-40 bg-[#1e2733] rounded animate-pulse" /></td>
                          <td className="px-4 py-3"><div className="h-5 w-20 bg-[#1e2733] rounded animate-pulse" /></td>
                          <td className="px-4 py-3"><div className="h-5 w-24 bg-[#1e2733] rounded animate-pulse" /></td>
                          <td className="px-4 py-3"><div className="h-5 w-20 bg-[#1e2733] rounded animate-pulse" /></td>
                          <td className="px-4 py-3"><div className="h-8 w-20 bg-[#1e2733] rounded animate-pulse ml-auto" /></td>
                        </tr>
                      ))
                    ) : coldStorageAssets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[#6b7a90]">
                          {t.coldStorage.noAssetsFound}
                        </td>
                      </tr>
                    ) : (
                      coldStorageAssets.map((asset) => (
                        <tr key={asset.id} className="border-b border-[#1e2733] hover:bg-[#151c24]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <AssetLogo symbol={asset.symbol} logoUrl={asset.icon} size={32} />
                              <div>
                                <p className="text-white font-medium">{asset.name}</p>
                                <p className="text-sm text-[#6b7a90]">{asset.symbol}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white">{formatCurrency(asset.currentPrice)}</td>
                          <td className="px-4 py-3 text-white">{asset.quantity.toFixed(4)} {asset.symbol}</td>
                          <td className="px-4 py-3 text-[#22c55e] font-medium">{formatCurrency(asset.currentValue)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleWithdrawSingle(asset.id)}
                              className="px-3 py-1.5 bg-[#1e2733] text-white text-sm rounded-lg hover:bg-[#2a3441] transition-colors"
                            >
                              {t.coldStorage.withdraw}
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
                ) : coldStorageAssets.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[#6b7a90]">
                    {t.coldStorage.noAssetsFound}
                  </div>
                ) : (
                  coldStorageAssets.map((asset) => (
                    <div key={asset.id} className="p-4 hover:bg-[#151c24] transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <AssetLogo symbol={asset.symbol} logoUrl={asset.icon} size={40} />
                        <div className="flex-1">
                          <p className="text-white font-medium">{asset.name}</p>
                          <p className="text-sm text-[#6b7a90]">{asset.symbol}</p>
                        </div>
                        <p className="text-[#22c55e] font-semibold">{formatCurrency(asset.currentValue)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-[#6b7a90]">{t.coldStorage.price}: </span>
                          <span className="text-white">{formatCurrency(asset.currentPrice)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-[#6b7a90]">{t.coldStorage.inWallet}: </span>
                          <span className="text-white">{asset.quantity.toFixed(4)} {asset.symbol}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleWithdrawSingle(asset.id)}
                        className="w-full mt-3 px-3 py-2 bg-[#1e2733] text-white text-sm rounded-lg hover:bg-[#2a3441] transition-colors"
                      >
                        {t.coldStorage.withdraw}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Available Balance Info */}
          <div className="p-4 bg-[#0f1419] rounded-xl border border-[#1e2733]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6b7a90]">{t.coldStorage.availableBalance}</span>
              <span className="text-white font-semibold">
                {isLoading ? (
                  <span className="inline-block w-24 h-5 bg-[#1e2733] rounded animate-pulse" />
                ) : (
                  formatCurrency(availableBalance)
                )}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* How It Works Tab Content */}
      {activeTab === 'howItWorks' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h3 className="text-white font-semibold mb-4">{t.coldStorage.howItWorks}</h3>

          {/* FAQ Item 1 */}
          <div
            className={cn(
              'rounded-xl border transition-all overflow-hidden',
              expandedFaq === 1 ? 'border-[#22c55e] bg-[#22c55e]/5' : 'border-[#1e2733] bg-[#0f1419]'
            )}
          >
            <button onClick={() => toggleFaq(1)} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className={cn('h-6 w-6 rounded flex items-center justify-center text-sm font-semibold', expandedFaq === 1 ? 'bg-[#22c55e] text-white' : 'bg-[#1e2733] text-[#6b7a90]')}>
                  1
                </span>
                <span className="text-white font-medium">{t.coldStorage.faq1Title}</span>
              </div>
              {expandedFaq === 1 ? <ChevronUp className="h-5 w-5 text-[#22c55e]" /> : <ChevronDown className="h-5 w-5 text-[#6b7a90]" />}
            </button>
            <AnimatePresence>
              {expandedFaq === 1 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-4 pb-4 pl-[52px]">
                    <p className="text-sm text-[#6b7a90] leading-relaxed">{t.coldStorage.faq1Content}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FAQ Item 2 */}
          <div
            className={cn(
              'rounded-xl border transition-all overflow-hidden',
              expandedFaq === 2 ? 'border-[#22c55e] bg-[#22c55e]/5' : 'border-[#1e2733] bg-[#0f1419]'
            )}
          >
            <button onClick={() => toggleFaq(2)} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className={cn('h-6 w-6 rounded flex items-center justify-center text-sm font-semibold', expandedFaq === 2 ? 'bg-[#22c55e] text-white' : 'bg-[#1e2733] text-[#6b7a90]')}>
                  2
                </span>
                <span className="text-white font-medium">{t.coldStorage.faq2Title}</span>
              </div>
              {expandedFaq === 2 ? <ChevronUp className="h-5 w-5 text-[#22c55e]" /> : <ChevronDown className="h-5 w-5 text-[#6b7a90]" />}
            </button>
            <AnimatePresence>
              {expandedFaq === 2 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-4 pb-4 pl-[52px]">
                    <p className="text-sm text-[#6b7a90] leading-relaxed">{t.coldStorage.faq2Content}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FAQ Item 3 */}
          <div
            className={cn(
              'rounded-xl border transition-all overflow-hidden',
              expandedFaq === 3 ? 'border-[#22c55e] bg-[#22c55e]/5' : 'border-[#1e2733] bg-[#0f1419]'
            )}
          >
            <button onClick={() => toggleFaq(3)} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className={cn('h-6 w-6 rounded flex items-center justify-center text-sm font-semibold', expandedFaq === 3 ? 'bg-[#22c55e] text-white' : 'bg-[#1e2733] text-[#6b7a90]')}>
                  3
                </span>
                <span className="text-white font-medium">{t.coldStorage.faq3Title}</span>
              </div>
              {expandedFaq === 3 ? <ChevronUp className="h-5 w-5 text-[#22c55e]" /> : <ChevronDown className="h-5 w-5 text-[#6b7a90]" />}
            </button>
            <AnimatePresence>
              {expandedFaq === 3 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-4 pb-4 pl-[52px]">
                    <p className="text-sm text-[#6b7a90] leading-relaxed">{t.coldStorage.faq3Content}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FAQ Item 4 */}
          <div
            className={cn(
              'rounded-xl border transition-all overflow-hidden',
              expandedFaq === 4 ? 'border-[#22c55e] bg-[#22c55e]/5' : 'border-[#1e2733] bg-[#0f1419]'
            )}
          >
            <button onClick={() => toggleFaq(4)} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className={cn('h-6 w-6 rounded flex items-center justify-center text-sm font-semibold', expandedFaq === 4 ? 'bg-[#22c55e] text-white' : 'bg-[#1e2733] text-[#6b7a90]')}>
                  4
                </span>
                <span className="text-white font-medium">{t.coldStorage.faq4Title}</span>
              </div>
              {expandedFaq === 4 ? <ChevronUp className="h-5 w-5 text-[#22c55e]" /> : <ChevronDown className="h-5 w-5 text-[#6b7a90]" />}
            </button>
            <AnimatePresence>
              {expandedFaq === 4 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-4 pb-4 pl-[52px]">
                    <p className="text-sm text-[#6b7a90] leading-relaxed">{t.coldStorage.faq4Content}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Side Panel - Asset Selection */}
      <AnimatePresence>
        {showPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePanel}
              className="fixed inset-0 bg-black/60 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0f1419] border-l border-[#1e2733] z-50 flex flex-col"
            >
              {/* LIST VIEW - Asset Selection */}
              {panelView === 'list' && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-[#1e2733]">
                    <div className="flex items-center gap-3">
                      <ChevronLeft className="h-5 w-5 text-[#6b7a90]" />
                      <span className="text-white font-medium">{t.coldStorage.selectAsset}</span>
                    </div>
                    <button onClick={handleClosePanel} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="p-4">
                    <p className="text-sm text-[#6b7a90] mb-2">{t.coldStorage.assets}</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.coldStorage.searchAssets}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#1e2733] rounded-lg text-white placeholder:text-[#6b7a90] focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
                      />
                    </div>
                  </div>

                  {/* Asset List */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredAssets.map((asset) => (
                      <button
                        key={asset.symbol}
                        onClick={() => handleSelectAsset(asset)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#151c24] transition-colors border-b border-[#1e2733]/50"
                      >
                        <div className="flex items-center gap-3">
                          <AssetLogo symbol={asset.symbol} logoUrl={asset.icon} size={40} />
                          <div className="text-left">
                            <p className="text-white font-medium">{asset.name}</p>
                            <p className="text-sm text-[#6b7a90]">
                              {asset.walletAmount > 0 ? (
                                <span className="text-[#22c55e]">{asset.walletAmount.toFixed(4)} {asset.symbol}</span>
                              ) : (
                                `0 ${asset.symbol}`
                              )}
                            </p>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-[#6b7a90] rotate-[-90deg]" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* DETAIL VIEW - Deposit Form */}
              {panelView === 'detail' && selectedAsset && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-[#1e2733]">
                    <div className="flex items-center gap-3">
                      <button onClick={handleBackToList} className="text-[#6b7a90] hover:text-white">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <span className="text-white font-medium">{selectedAsset.name}</span>
                    </div>
                    <button onClick={handleClosePanel} className="text-[#6b7a90] hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-6">
                      {/* Asset Info */}
                      <div className="flex items-center gap-4 p-4 bg-[#151c24] rounded-xl">
                        <AssetLogo symbol={selectedAsset.symbol} logoUrl={selectedAsset.icon} size={48} />
                        <div>
                          <p className="text-white font-semibold text-lg">{selectedAsset.name}</p>
                          <p className="text-[#6b7a90]">{selectedAsset.symbol}</p>
                        </div>
                      </div>

                      {/* Wallet Holdings */}
                      {selectedAsset.walletAmount > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl">
                          <Wallet className="h-5 w-5 text-[#22c55e]" />
                          <div>
                            <p className="text-sm text-[#6b7a90]">{t.coldStorage.yourWalletBalance}</p>
                            <p className="text-[#22c55e] font-semibold">
                              {selectedAsset.walletAmount.toFixed(4)} {selectedAsset.symbol} ({formatCurrency(selectedAsset.walletValue)})
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Amount Input */}
                      <div>
                        <label className="text-sm text-[#6b7a90] mb-2 block">{t.coldStorage.amountToDeposit}</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="0.00"
                            step="any"
                            className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-xl text-white text-lg placeholder:text-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7a90]">{selectedAsset.symbol}</span>
                        </div>
                        {depositAmount && parseFloat(depositAmount) > 0 && (
                          <p className="text-sm text-[#6b7a90] mt-2">
                            ≈ {formatCurrency(parseFloat(depositAmount) * selectedAsset.price)}
                          </p>
                        )}
                      </div>

                      {/* Price + Balance Info */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#6b7a90]">{t.coldStorage.currentSymbolPrice} {selectedAsset.symbol}</span>
                          <span className="text-white">{formatCurrency(selectedAsset.price)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#6b7a90]">{t.coldStorage.availableBalance}</span>
                          <span className={cn('font-medium', depositAmount && parseFloat(depositAmount) * selectedAsset.price > availableBalance ? 'text-[#ef4444]' : 'text-[#22c55e]')}>
                            {formatCurrency(availableBalance)}
                          </span>
                        </div>
                      </div>

                      {/* Insufficient Balance Warning */}
                      {depositAmount && parseFloat(depositAmount) * selectedAsset.price > availableBalance && (
                        <div className="flex items-center gap-3 p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl">
                          <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0" />
                          <p className="text-sm text-[#ef4444]">
                            {t.coldStorage.insufficientBalance} {t.coldStorage.youNeedMore} {formatCurrency(parseFloat(depositAmount) * selectedAsset.price - availableBalance)}
                          </p>
                        </div>
                      )}

                      {/* Deposit Button */}
                      <button
                        onClick={handleDeposit}
                        disabled={!depositAmount || parseFloat(depositAmount) <= 0 || parseFloat(depositAmount) * selectedAsset.price > availableBalance}
                        className={cn(
                          'w-full py-3.5 rounded-xl font-semibold transition-colors',
                          depositAmount && parseFloat(depositAmount) > 0 && parseFloat(depositAmount) * selectedAsset.price <= availableBalance
                            ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                            : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                        )}
                      >
                        {t.coldStorage.depositToColdStorage}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* PROCESSING VIEW */}
              {panelView === 'processing' && (
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="mb-6">
                    <Loader2 className="h-16 w-16 text-[#22c55e]" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">{t.coldStorage.processingDeposit}</h3>
                  <p className="text-[#6b7a90] text-center">
                    {t.coldStorage.processingDepositMessage}
                  </p>
                </div>
              )}

              {/* SUCCESS VIEW */}
              {panelView === 'success' && selectedAsset && (
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }} className="h-20 w-20 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-[#22c55e]" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">{t.coldStorage.depositSuccessful}</h3>
                  <p className="text-[#6b7a90] text-center mb-2">
                    {depositAmount} {selectedAsset.symbol} {t.coldStorage.addedToColdStorage}
                  </p>
                  <p className="text-sm text-[#6b7a90] text-center mb-8">
                    {t.coldStorage.total}: {formatCurrency(parseFloat(depositAmount) * selectedAsset.price)}
                  </p>
                  <button onClick={handleSuccessClose} className="px-8 py-3 bg-[#22c55e] hover:bg-[#1ea550] text-white font-semibold rounded-xl transition-colors">
                    {t.common.done}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Messages */}
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
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5" />}
              {toast.type === 'info' && <Info className="h-5 w-5" />}
              <span className="text-sm font-medium flex-1">{toast.message}</span>
              <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}>
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
