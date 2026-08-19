'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
  Save,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Assets Management Page
// ============================================

// User Asset Record Interface
interface UserAssetRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  assetId: string;
  assetName: string;
  assetSymbol: string;
  assetType: 'Crypto' | 'Stocks';
  balance: number;
  currentPrice: number;
  totalValue: number;
  updatedAt: Date;
}

// Asset Definition Interface
interface AssetDefinition {
  id: string;
  name: string;
  symbol: string;
  type: 'Crypto' | 'Stocks';
  currentPrice: number;
  isActive: boolean;
}

// Mock user asset records
const mockUserAssets: UserAssetRecord[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'John Smith',
    userEmail: 'john.smith@example.com',
    assetId: 'btc',
    assetName: 'Bitcoin',
    assetSymbol: 'BTC',
    assetType: 'Crypto',
    balance: 0.5,
    currentPrice: 67250,
    totalValue: 33625,
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    userName: 'John Smith',
    userEmail: 'john.smith@example.com',
    assetId: 'eth',
    assetName: 'Ethereum',
    assetSymbol: 'ETH',
    assetType: 'Crypto',
    balance: 5.2,
    currentPrice: 3500,
    totalValue: 18200,
    updatedAt: new Date(),
  },
  {
    id: '3',
    userId: 'user2',
    userName: 'Sarah Johnson',
    userEmail: 'sarah.j@example.com',
    assetId: 'aapl',
    assetName: 'Apple',
    assetSymbol: 'AAPL',
    assetType: 'Stocks',
    balance: 25,
    currentPrice: 248.98,
    totalValue: 6224.5,
    updatedAt: new Date(),
  },
  {
    id: '4',
    userId: 'user3',
    userName: 'Michael Chen',
    userEmail: 'mchen@example.com',
    assetId: 'sol',
    assetName: 'Solana',
    assetSymbol: 'SOL',
    assetType: 'Crypto',
    balance: 100,
    currentPrice: 148.25,
    totalValue: 14825,
    updatedAt: new Date(),
  },
  {
    id: '5',
    userId: 'user3',
    userName: 'Michael Chen',
    userEmail: 'mchen@example.com',
    assetId: 'nvda',
    assetName: 'NVIDIA',
    assetSymbol: 'NVDA',
    assetType: 'Stocks',
    balance: 10,
    currentPrice: 875.28,
    totalValue: 8752.8,
    updatedAt: new Date(),
  },
];

// Available assets list
const availableAssets: AssetDefinition[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', type: 'Crypto', currentPrice: 67250, isActive: true },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', type: 'Crypto', currentPrice: 3500, isActive: true },
  { id: 'sol', name: 'Solana', symbol: 'SOL', type: 'Crypto', currentPrice: 148.25, isActive: true },
  { id: 'bnb', name: 'BNB', symbol: 'BNB', type: 'Crypto', currentPrice: 598.75, isActive: true },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', type: 'Crypto', currentPrice: 0.52, isActive: true },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', type: 'Crypto', currentPrice: 0.251, isActive: true },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', type: 'Crypto', currentPrice: 1.00, isActive: true },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', type: 'Crypto', currentPrice: 1.00, isActive: true },
  { id: 'aapl', name: 'Apple', symbol: 'AAPL', type: 'Stocks', currentPrice: 248.98, isActive: true },
  { id: 'msft', name: 'Microsoft', symbol: 'MSFT', type: 'Stocks', currentPrice: 378.91, isActive: true },
  { id: 'nvda', name: 'NVIDIA', symbol: 'NVDA', type: 'Stocks', currentPrice: 875.28, isActive: true },
  { id: 'tsla', name: 'Tesla', symbol: 'TSLA', type: 'Stocks', currentPrice: 245.67, isActive: true },
  { id: 'googl', name: 'Alphabet', symbol: 'GOOGL', type: 'Stocks', currentPrice: 156.78, isActive: true },
  { id: 'amzn', name: 'Amazon', symbol: 'AMZN', type: 'Stocks', currentPrice: 178.25, isActive: true },
  { id: 'meta', name: 'Meta Platforms', symbol: 'META', type: 'Stocks', currentPrice: 485.23, isActive: true },
];

// Stock colors for logos
const assetColors: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#14F195',
  BNB: '#F3BA2F',
  XRP: '#23292F',
  ADA: '#0033AD',
  USDT: '#26A17B',
  USDC: '#2775CA',
  AAPL: '#007AFF',
  MSFT: '#00A4EF',
  NVDA: '#76B900',
  TSLA: '#CC0000',
  GOOGL: '#4285F4',
  AMZN: '#FF9900',
  META: '#0668E1',
};

// Asset Logo Component
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

type TabType = 'user-assets' | 'asset-list';

export default function AdminAssetsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('user-assets');
  const [userAssets, setUserAssets] = useState<UserAssetRecord[]>(mockUserAssets);
  const [assets, setAssets] = useState<AssetDefinition[]>(availableAssets);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Crypto' | 'Stocks'>('all');
  
  // Modal states
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isEditAssetModalOpen, setIsEditAssetModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UserAssetRecord | null>(null);

  // New asset form
  const [newAsset, setNewAsset] = useState({
    userId: '',
    userName: '',
    userEmail: '',
    assetId: '',
    balance: '',
  });

  // Edit form
  const [editBalance, setEditBalance] = useState('');

  // Calculate stats
  const totalValue = userAssets.reduce((sum, a) => sum + a.totalValue, 0);
  const uniqueUsers = new Set(userAssets.map(a => a.userId)).size;
  const cryptoAssets = userAssets.filter(a => a.assetType === 'Crypto');
  const stockAssets = userAssets.filter(a => a.assetType === 'Stocks');

  // Filter user assets
  const filteredUserAssets = userAssets.filter((record) => {
    const matchesSearch =
      record.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.assetSymbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || record.assetType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleAddAsset = () => {
    if (!newAsset.userId || !newAsset.assetId || !newAsset.balance) return;

    const asset = assets.find(a => a.id === newAsset.assetId);
    if (!asset) return;

    const balance = parseFloat(newAsset.balance);
    const record: UserAssetRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: newAsset.userId,
      userName: newAsset.userName,
      userEmail: newAsset.userEmail,
      assetId: asset.id,
      assetName: asset.name,
      assetSymbol: asset.symbol,
      assetType: asset.type,
      balance,
      currentPrice: asset.currentPrice,
      totalValue: balance * asset.currentPrice,
      updatedAt: new Date(),
    };

    setUserAssets([record, ...userAssets]);
    setIsAddAssetModalOpen(false);
    setNewAsset({ userId: '', userName: '', userEmail: '', assetId: '', balance: '' });
  };

  const handleUpdateBalance = () => {
    if (!selectedRecord || !editBalance) return;

    const balance = parseFloat(editBalance);
    setUserAssets(userAssets.map(a => 
      a.id === selectedRecord.id 
        ? { ...a, balance, totalValue: balance * a.currentPrice, updatedAt: new Date() }
        : a
    ));
    setIsEditAssetModalOpen(false);
    setSelectedRecord(null);
    setEditBalance('');
  };

  const handleDeleteRecord = (id: string) => {
    setUserAssets(userAssets.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Assets Management</h1>
          <p className="text-gray-400">Manage user assets and balances</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2 bg-[#22c55e] hover:bg-[#1ea550]" onClick={() => setIsAddAssetModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Asset to User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-[#0f1419] border-[#1e2733]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#22c55e]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
                <p className="text-sm text-gray-400">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1419] border-[#1e2733]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{uniqueUsers}</p>
                <p className="text-sm text-gray-400">Users with Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1419] border-[#1e2733]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#f59e0b]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{cryptoAssets.length}</p>
                <p className="text-sm text-gray-400">Crypto Holdings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1419] border-[#1e2733]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-[#8b5cf6]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stockAssets.length}</p>
                <p className="text-sm text-gray-400">Stock Holdings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-[#1e2733]">
        <button
          onClick={() => setActiveTab('user-assets')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'user-assets'
              ? 'text-[#22c55e] border-[#22c55e]'
              : 'text-gray-400 border-transparent hover:text-white'
          )}
        >
          User Assets
        </button>
        <button
          onClick={() => setActiveTab('asset-list')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'asset-list'
              ? 'text-[#22c55e] border-[#22c55e]'
              : 'text-gray-400 border-transparent hover:text-white'
          )}
        >
          Asset Definitions
        </button>
      </div>

      {/* User Assets Tab */}
      {activeTab === 'user-assets' && (
        <>
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="px-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
            >
              <option value="all">All Types</option>
              <option value="Crypto">Crypto</option>
              <option value="Stocks">Stocks</option>
            </select>
          </div>

          {/* Assets Table */}
          <Card className="bg-[#0f1419] border-[#1e2733]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2733]">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Asset</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Updated</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUserAssets.map((record) => (
                      <tr key={record.id} className="border-b border-[#1e2733] hover:bg-[#151c24]">
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-white">{record.userName}</p>
                            <p className="text-xs text-gray-400">{record.userEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <AssetLogo symbol={record.assetSymbol} size={28} />
                            <div>
                              <p className="text-sm font-medium text-white">{record.assetName}</p>
                              <p className="text-xs text-gray-400">{record.assetSymbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={record.assetType === 'Crypto' ? 'warning' : 'info'}>
                            {record.assetType}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-white">
                            {record.balance.toLocaleString()} {record.assetSymbol}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-white">
                            {formatCurrency(record.currentPrice)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-[#22c55e]">
                            {formatCurrency(record.totalValue)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-400">
                            {record.updatedAt.toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsViewModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[#1e2733] text-gray-400 hover:text-white"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setEditBalance(record.balance.toString());
                                setIsEditAssetModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[#3b82f6]/10 text-gray-400 hover:text-[#3b82f6]"
                              title="Edit Balance"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="p-1.5 rounded-lg hover:bg-[#ef4444]/10 text-gray-400 hover:text-[#ef4444]"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUserAssets.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  No assets found matching your search
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Asset Definitions Tab */}
      {activeTab === 'asset-list' && (
        <div className="grid grid-cols-3 gap-4">
          {assets.map((asset) => (
            <Card key={asset.id} className="bg-[#0f1419] border-[#1e2733]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AssetLogo symbol={asset.symbol} size={40} />
                  <div>
                    <p className="font-medium text-white">{asset.name}</p>
                    <p className="text-sm text-gray-400">{asset.symbol}</p>
                  </div>
                  <Badge variant={asset.type === 'Crypto' ? 'warning' : 'info'} className="ml-auto">
                    {asset.type}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Current Price</span>
                  <span className="text-sm font-medium text-white">{formatCurrency(asset.currentPrice)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Asset Modal */}
      <Modal isOpen={isAddAssetModalOpen} onClose={() => setIsAddAssetModalOpen(false)} title="Add Asset to User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">User ID</label>
            <Input
              value={newAsset.userId}
              onChange={(e) => setNewAsset({ ...newAsset, userId: e.target.value })}
              placeholder="Enter user ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">User Name</label>
            <Input
              value={newAsset.userName}
              onChange={(e) => setNewAsset({ ...newAsset, userName: e.target.value })}
              placeholder="Enter user name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">User Email</label>
            <Input
              type="email"
              value={newAsset.userEmail}
              onChange={(e) => setNewAsset({ ...newAsset, userEmail: e.target.value })}
              placeholder="Enter user email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Asset</label>
            <select
              value={newAsset.assetId}
              onChange={(e) => setNewAsset({ ...newAsset, assetId: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white"
            >
              <option value="">Select an asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.symbol}) - {formatCurrency(asset.currentPrice)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Balance</label>
            <Input
              type="number"
              step="any"
              value={newAsset.balance}
              onChange={(e) => setNewAsset({ ...newAsset, balance: e.target.value })}
              placeholder="Enter asset balance"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsAddAssetModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-[#22c55e] hover:bg-[#1ea550]" onClick={handleAddAsset}>
              Add Asset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Balance Modal */}
      <Modal
        isOpen={isEditAssetModalOpen}
        onClose={() => {
          setIsEditAssetModalOpen(false);
          setSelectedRecord(null);
          setEditBalance('');
        }}
        title="Edit Asset Balance"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-[#0a0e14] rounded-lg">
              <AssetLogo symbol={selectedRecord.assetSymbol} size={48} />
              <div>
                <p className="font-medium text-white">{selectedRecord.assetName}</p>
                <p className="text-sm text-gray-400">{selectedRecord.userName}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                New Balance ({selectedRecord.assetSymbol})
              </label>
              <Input
                type="number"
                step="any"
                value={editBalance}
                onChange={(e) => setEditBalance(e.target.value)}
                placeholder="Enter new balance"
              />
              {editBalance && (
                <p className="text-sm text-gray-400 mt-2">
                  New Value: {formatCurrency(parseFloat(editBalance) * selectedRecord.currentPrice)}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditAssetModalOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-[#22c55e] hover:bg-[#1ea550]" onClick={handleUpdateBalance}>
                <Save className="h-4 w-4 mr-2" />
                Update Balance
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedRecord(null);
        }}
        title="Asset Details"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-[#0a0e14] rounded-lg">
              <AssetLogo symbol={selectedRecord.assetSymbol} size={48} />
              <div>
                <p className="font-medium text-white">{selectedRecord.assetName}</p>
                <p className="text-sm text-gray-400">{selectedRecord.assetSymbol}</p>
              </div>
              <Badge variant={selectedRecord.assetType === 'Crypto' ? 'warning' : 'info'} className="ml-auto">
                {selectedRecord.assetType}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">User</span>
                <span className="text-white">{selectedRecord.userName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Email</span>
                <span className="text-white">{selectedRecord.userEmail}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Balance</span>
                <span className="text-white font-medium">
                  {selectedRecord.balance.toLocaleString()} {selectedRecord.assetSymbol}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Current Price</span>
                <span className="text-white">{formatCurrency(selectedRecord.currentPrice)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2733]">
                <span className="text-gray-400">Total Value</span>
                <span className="text-[#22c55e] font-medium">{formatCurrency(selectedRecord.totalValue)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Last Updated</span>
                <span className="text-white">{selectedRecord.updatedAt.toLocaleString()}</span>
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
