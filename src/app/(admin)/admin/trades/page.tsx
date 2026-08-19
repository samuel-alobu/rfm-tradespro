'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Eye,
  XCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Trades Management Page
// ============================================

interface Trade {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
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
  duration: string;
  status: 'open' | 'closed' | 'cancelled';
  pnl: number;
  pnlPercent: number;
  openedAt: Date;
  closedAt?: Date;
  closeReason?: 'manual' | 'stop_loss' | 'take_profit' | 'expired' | 'admin';
}

// Mock trades data
const mockTrades: Trade[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'John Smith',
    userEmail: 'john.smith@example.com',
    type: 'buy',
    assetType: 'Crypto',
    symbol: 'BTC',
    name: 'Bitcoin',
    amount: 0.5,
    entryPrice: 67500,
    currentPrice: 68200,
    leverage: 25,
    stopLoss: 66000,
    takeProfit: 72000,
    duration: '4h',
    status: 'open',
    pnl: 8750,
    pnlPercent: 25.93,
    openedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Sarah Johnson',
    userEmail: 'sarah.j@example.com',
    type: 'sell',
    assetType: 'Crypto',
    symbol: 'ETH',
    name: 'Ethereum',
    amount: 5,
    entryPrice: 3550,
    currentPrice: 3480,
    leverage: 10,
    stopLoss: 3650,
    takeProfit: 3300,
    duration: '1h',
    status: 'open',
    pnl: 3500,
    pnlPercent: 19.72,
    openedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '3',
    userId: 'user1',
    userName: 'John Smith',
    userEmail: 'john.smith@example.com',
    type: 'buy',
    assetType: 'Stocks',
    symbol: 'AAPL',
    name: 'Apple Inc',
    amount: 100,
    entryPrice: 248.50,
    currentPrice: 251.62,
    leverage: 5,
    stopLoss: 245,
    takeProfit: 260,
    duration: '1d',
    status: 'closed',
    pnl: 1560,
    pnlPercent: 6.28,
    openedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    closedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    closeReason: 'manual',
  },
  {
    id: '4',
    userId: 'user3',
    userName: 'Michael Chen',
    userEmail: 'mchen@example.com',
    type: 'buy',
    assetType: 'Crypto',
    symbol: 'SOL',
    name: 'Solana',
    amount: 50,
    entryPrice: 152.00,
    currentPrice: 148.25,
    leverage: 50,
    stopLoss: 145,
    takeProfit: 165,
    duration: '30m',
    status: 'closed',
    pnl: -9375,
    pnlPercent: -12.34,
    openedAt: new Date(Date.now() - 45 * 60 * 1000),
    closedAt: new Date(Date.now() - 15 * 60 * 1000),
    closeReason: 'stop_loss',
  },
  {
    id: '5',
    userId: 'user4',
    userName: 'Emily Davis',
    userEmail: 'emily.d@example.com',
    type: 'sell',
    assetType: 'Stocks',
    symbol: 'NVDA',
    name: 'NVIDIA',
    amount: 20,
    entryPrice: 890.00,
    currentPrice: 875.28,
    leverage: 15,
    stopLoss: 920,
    takeProfit: 850,
    duration: '2h',
    status: 'open',
    pnl: 4416,
    pnlPercent: 24.81,
    openedAt: new Date(Date.now() - 90 * 60 * 1000),
  },
];

// Asset colors
const assetColors: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', SOL: '#14F195', BNB: '#F3BA2F',
  AAPL: '#007AFF', TSLA: '#CC0000', NVDA: '#76B900', MSFT: '#00A4EF',
};

function AssetLogo({ symbol, size = 32 }: { symbol: string; size?: number }) {
  const color = assetColors[symbol] || '#6b7a90';
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
    >
      {symbol.charAt(0)}
    </div>
  );
}

export default function AdminTradesPage() {
  const [trades, setTrades] = useState<Trade[]>(mockTrades);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Crypto' | 'Stocks'>('all');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Calculate stats
  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const totalVolume = trades.reduce((sum, t) => sum + (t.amount * t.entryPrice), 0);

  // Filter trades
  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      trade.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;
    const matchesType = typeFilter === 'all' || trade.assetType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCloseTrade = (tradeId: string) => {
    setTrades(trades.map(t => 
      t.id === tradeId 
        ? { ...t, status: 'closed' as const, closedAt: new Date(), closeReason: 'admin' as const }
        : t
    ));
  };

  const handleCancelTrade = (tradeId: string) => {
    setTrades(trades.map(t => 
      t.id === tradeId 
        ? { ...t, status: 'cancelled' as const, closedAt: new Date(), closeReason: 'admin' as const, pnl: 0 }
        : t
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trades Management</h1>
          <p className="text-gray-400">Monitor and manage user trading activity</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-[#0f1419] border-[#1e2733]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{openTrades.length}</p>
                <p className="text-sm text-gray-400">Open Trades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1419] border-[#1e2733]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#6b7a90]/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-[#6b7a90]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{closedTrades.length}</p>
                <p className="text-sm text-gray-400">Closed Trades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1419] border-[#1e2733]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center',
                totalPnL >= 0 ? 'bg-[#22c55e]/10' : 'bg-[#ef4444]/10'
              )}>
                {totalPnL >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-[#22c55e]" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-[#ef4444]" />
                )}
              </div>
              <div>
                <p className={cn('text-2xl font-bold', totalPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                  {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                </p>
                <p className="text-sm text-gray-400">Total P&L</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1419] border-[#1e2733]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#f59e0b]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalVolume)}</p>
                <p className="text-sm text-gray-400">Total Volume</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user or asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="px-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
        >
          <option value="all">All Types</option>
          <option value="Crypto">Crypto</option>
          <option value="Stocks">Stocks</option>
        </select>
      </div>

      {/* Trades Table */}
      <Card className="bg-[#0f1419] border-[#1e2733]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2733]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Entry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Current</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Leverage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">P&L</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-[#1e2733] hover:bg-[#151c24]">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{trade.userName}</p>
                        <p className="text-xs text-gray-400">{trade.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={trade.type === 'buy' ? 'success' : 'error'}>
                        {trade.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <AssetLogo symbol={trade.symbol} size={28} />
                        <div>
                          <p className="text-sm font-medium text-white">{trade.symbol}</p>
                          <p className="text-xs text-gray-400">{trade.assetType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-white">{trade.amount}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-white">{formatCurrency(trade.entryPrice)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-white">{formatCurrency(trade.currentPrice)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-white">{trade.leverage}x</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className={cn('text-sm font-medium', trade.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                          {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                        </p>
                        <p className={cn('text-xs', trade.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                          {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant={
                          trade.status === 'open'
                            ? 'success'
                            : trade.status === 'closed'
                            ? 'info'
                            : 'error'
                        }
                      >
                        {trade.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedTrade(trade);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-[#1e2733] text-gray-400 hover:text-white"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {trade.status === 'open' && (
                          <>
                            <button
                              onClick={() => handleCloseTrade(trade.id)}
                              className="p-1.5 rounded-lg hover:bg-[#22c55e]/10 text-gray-400 hover:text-[#22c55e]"
                              title="Close Trade"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelTrade(trade.id)}
                              className="p-1.5 rounded-lg hover:bg-[#ef4444]/10 text-gray-400 hover:text-[#ef4444]"
                              title="Cancel Trade"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTrades.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No trades found matching your search
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Trade Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTrade(null);
        }}
        title="Trade Details"
      >
        {selectedTrade && (
          <div className="space-y-4">
            {/* Asset Info */}
            <div className="flex items-center gap-4 p-4 bg-[#0a0e14] rounded-lg">
              <AssetLogo symbol={selectedTrade.symbol} size={48} />
              <div className="flex-1">
                <p className="font-medium text-white">{selectedTrade.name}</p>
                <p className="text-sm text-gray-400">{selectedTrade.symbol} • {selectedTrade.assetType}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={selectedTrade.type === 'buy' ? 'success' : 'error'}>
                  {selectedTrade.type.toUpperCase()}
                </Badge>
                <Badge
                  variant={
                    selectedTrade.status === 'open' ? 'success' : selectedTrade.status === 'closed' ? 'info' : 'error'
                  }
                >
                  {selectedTrade.status}
                </Badge>
              </div>
            </div>

            {/* Trade Details */}
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">User</span>
                <span className="text-white">{selectedTrade.userName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Email</span>
                <span className="text-white">{selectedTrade.userEmail}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">{selectedTrade.amount} {selectedTrade.symbol}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Entry Price</span>
                <span className="text-white">{formatCurrency(selectedTrade.entryPrice)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Current Price</span>
                <span className="text-white">{formatCurrency(selectedTrade.currentPrice)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Leverage</span>
                <span className="text-white">{selectedTrade.leverage}x</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Stop Loss</span>
                <span className="text-white">
                  {selectedTrade.stopLoss ? formatCurrency(selectedTrade.stopLoss) : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Take Profit</span>
                <span className="text-white">
                  {selectedTrade.takeProfit ? formatCurrency(selectedTrade.takeProfit) : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Duration</span>
                <span className="text-white">{selectedTrade.duration}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">P&L</span>
                <span className={cn('font-medium', selectedTrade.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                  {selectedTrade.pnl >= 0 ? '+' : ''}{formatCurrency(selectedTrade.pnl)} ({selectedTrade.pnlPercent.toFixed(2)}%)
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Opened At</span>
                <span className="text-white">{selectedTrade.openedAt.toLocaleString()}</span>
              </div>
              {selectedTrade.closedAt && (
                <>
                  <div className="flex justify-between py-2 border-b border-[#1e2733]">
                    <span className="text-gray-400">Closed At</span>
                    <span className="text-white">{selectedTrade.closedAt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Close Reason</span>
                    <span className="text-white capitalize">{selectedTrade.closeReason?.replace('_', ' ')}</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            {selectedTrade.status === 'open' && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 text-[#22c55e] border-[#22c55e]/20 hover:bg-[#22c55e]/10"
                  onClick={() => {
                    handleCloseTrade(selectedTrade.id);
                    setIsViewModalOpen(false);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Close Trade
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-[#ef4444] border-[#ef4444]/20 hover:bg-[#ef4444]/10"
                  onClick={() => {
                    handleCancelTrade(selectedTrade.id);
                    setIsViewModalOpen(false);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Trade
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
