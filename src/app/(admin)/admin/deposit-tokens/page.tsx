'use client';

import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, Search, Edit2, Trash2, X, CheckCircle, XCircle, AlertCircle, Copy, Network, Loader2 } from 'lucide-react';

interface TokenNetwork { name: string; address: string; isActive: boolean; }

interface DepositToken {
  _id: string;
  name: string;
  symbol: string;
  image: string;
  networks: TokenNetwork[];
  isActive: boolean;
  order: number;
  createdAt: string;
}

interface Toast { id: string; type: 'success' | 'error' | 'info'; message: string; }

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div key={toast.id} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500/20 border border-green-500/30' : toast.type === 'error' ? 'bg-red-500/20 border border-red-500/30' : 'bg-blue-500/20 border border-blue-500/30'}`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-500" />}
            <span className="text-white text-sm">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const commonNetworks = ['Bitcoin', 'ERC20', 'BEP20', 'TRC20', 'Solana', 'Arbitrum', 'Polygon', 'Avalanche', 'Optimism', 'Base'];

export default function AdminDepositTokensPage() {
  const toastId = useId();
  const [tokens, setTokens] = useState<DepositToken[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<DepositToken | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<DepositToken | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, totalNetworks: 0 });

  const [formData, setFormData] = useState({
    name: '', symbol: '', image: '',
    networks: [{ name: '', address: '', isActive: true }] as TokenNetwork[],
    isActive: true, order: 1,
  });

  const addToast = (type: Toast['type'], message: string) => {
    const id = `${toastId}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/admin/deposit-tokens');
      const data = await res.json();
      if (res.ok) { setTokens(data.tokens || []); setStats(data.stats || { total: 0, active: 0, totalNetworks: 0 }); }
      else { addToast('error', data.error); }
    } catch { addToast('error', 'Failed to fetch tokens'); }
    finally { setIsFetching(false); }
  };

  useEffect(() => { fetchTokens(); }, []);

  const resetForm = () => {
    setFormData({ name: '', symbol: '', image: '', networks: [{ name: '', address: '', isActive: true }], isActive: true, order: tokens.length + 1 });
  };

  const openCreateModal = () => { resetForm(); setEditingToken(null); setIsModalOpen(true); };

  const openEditModal = (token: DepositToken) => {
    setEditingToken(token);
    setFormData({ name: token.name, symbol: token.symbol, image: token.image, networks: token.networks?.length > 0 ? token.networks : [{ name: '', address: '', isActive: true }], isActive: token.isActive, order: token.order });
    setIsModalOpen(true);
  };

  const addNetwork = () => {
    setFormData({ ...formData, networks: [...formData.networks, { name: '', address: '', isActive: true }] });
  };

  const removeNetwork = (index: number) => {
    if (formData.networks.length > 1) setFormData({ ...formData, networks: formData.networks.filter((_, i) => i !== index) });
  };

  const updateNetwork = (index: number, field: keyof TokenNetwork, value: string | boolean) => {
    const newNetworks = [...formData.networks];
    newNetworks[index] = { ...newNetworks[index], [field]: value };
    setFormData({ ...formData, networks: newNetworks });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!formData.name || !formData.symbol || !formData.image) { addToast('error', 'Fill required fields'); setIsLoading(false); return; }
    const validNetworks = formData.networks.filter((n) => n.name && n.address);
    if (validNetworks.length === 0) { addToast('error', 'Add at least one network'); setIsLoading(false); return; }

    try {
      const payload = editingToken ? { tokenId: editingToken._id, ...formData, networks: validNetworks } : { ...formData, networks: validNetworks };
      const res = await fetch('/api/admin/deposit-tokens', { method: editingToken ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { addToast('success', data.message); setIsModalOpen(false); resetForm(); fetchTokens(); }
      else { addToast('error', data.error); }
    } catch { addToast('error', 'Operation failed'); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async () => {
    if (!tokenToDelete) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/deposit-tokens?id=${tokenToDelete._id}`, { method: 'DELETE' });
      if (res.ok) { addToast('success', 'Token deleted'); setIsDeleteModalOpen(false); setTokenToDelete(null); fetchTokens(); }
      else { const data = await res.json(); addToast('error', data.error); }
    } catch { addToast('error', 'Failed to delete'); }
    finally { setIsLoading(false); }
  };

  const toggleActive = async (token: DepositToken) => {
    try {
      const res = await fetch('/api/admin/deposit-tokens', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tokenId: token._id, isActive: !token.isActive }) });
      if (res.ok) { addToast('success', 'Status updated'); fetchTokens(); }
    } catch { addToast('error', 'Failed'); }
  };

  const copyAddress = (address: string) => { navigator.clipboard.writeText(address); addToast('info', 'Copied'); };

  const filteredTokens = tokens.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.symbol.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isFetching) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Deposit Tokens</h1><p className="text-gray-400 mt-1">Manage tokens and wallet addresses</p></div>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"><Plus className="w-5 h-5" />Add Token</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total Tokens', value: stats.total, icon: Wallet, color: 'text-blue-500' }, { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-500' }, { label: 'Total Networks', value: stats.totalNetworks, icon: Network, color: 'text-purple-500' }].map((stat) => (
          <div key={stat.label} className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-4">
            <div className="flex items-center gap-3"><div className={`p-2 rounded-lg bg-[#151c24] ${stat.color}`}><stat.icon className="w-5 h-5" /></div><div><p className="text-gray-400 text-sm">{stat.label}</p><p className="text-white text-xl font-bold">{stat.value}</p></div></div>
          </div>
        ))}
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Search tokens..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500" /></div>

      <div className="space-y-4">
        {filteredTokens.map((token) => (
          <div key={token._id} className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <img src={token.image} alt={token.name} className="w-12 h-12 rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48'; }} />
                <div><div className="flex items-center gap-2"><h3 className="text-white font-bold text-lg">{token.name}</h3><span className="text-gray-400">({token.symbol})</span><span className="text-gray-500 text-sm">Order: {token.order}</span></div><p className="text-gray-400 text-sm">{token.networks?.length || 0} networks</p></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(token)} className={`px-3 py-1 rounded text-sm ${token.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>{token.isActive ? 'Active' : 'Inactive'}</button>
                <button onClick={() => openEditModal(token)} className="p-2 text-gray-400 hover:text-white hover:bg-[#1e2733] rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => { setTokenToDelete(token); setIsDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="space-y-2">
              {token.networks?.map((network, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${network.isActive ? 'bg-[#151c24]' : 'bg-[#151c24]/50'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${network.isActive ? 'bg-blue-500/20 text-blue-500' : 'bg-gray-500/20 text-gray-400'}`}>{network.name}</span>
                    <code className="text-gray-300 text-sm font-mono">{network.address.slice(0, 10)}...{network.address.slice(-8)}</code>
                  </div>
                  <button onClick={() => copyAddress(network.address)} className="p-2 text-gray-400 hover:text-white hover:bg-[#1e2733] rounded-lg"><Copy className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredTokens.length === 0 && <div className="text-center py-12 bg-[#0f1419] border border-[#1e2733] rounded-xl"><Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">No tokens found</p></div>}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f1419] border border-[#1e2733] rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-[#1e2733]"><h2 className="text-xl font-bold text-white">{editingToken ? 'Edit Token' : 'Add Token'}</h2><button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-[#1e2733] rounded-lg"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-gray-400 text-sm mb-2">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="Bitcoin" /></div>
                  <div><label className="block text-gray-400 text-sm mb-2">Symbol *</label><input type="text" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="BTC" /></div>
                </div>
                <div><label className="block text-gray-400 text-sm mb-2">Image URL *</label><input type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="https://..." /></div>
                <div><label className="block text-gray-400 text-sm mb-2">Display Order</label><input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" min="1" /></div>
                <div><div className="flex items-center justify-between mb-2"><label className="text-gray-400 text-sm">Networks *</label><button type="button" onClick={addNetwork} className="text-green-500 text-sm hover:underline">+ Add Network</button></div><div className="space-y-3">{formData.networks.map((network, index) => (<div key={index} className="p-3 bg-[#151c24] rounded-lg space-y-2"><div className="flex items-center gap-2"><select value={network.name} onChange={(e) => updateNetwork(index, 'name', e.target.value)} className="flex-1 px-3 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"><option value="">Select Network</option>{commonNetworks.map((n) => (<option key={n} value={n}>{n}</option>))}</select><button type="button" onClick={() => updateNetwork(index, 'isActive', !network.isActive)} className={`p-2 rounded-lg ${network.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}><CheckCircle className="w-4 h-4" /></button>{formData.networks.length > 1 && (<button type="button" onClick={() => removeNetwork(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"><X className="w-4 h-4" /></button>)}</div><input type="text" value={network.address} onChange={(e) => updateNetwork(index, 'address', e.target.value)} className="w-full px-3 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white font-mono text-sm focus:outline-none focus:border-green-500" placeholder="Wallet address" /></div>))}</div></div>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-[#1e2733] bg-[#151c24] text-green-500" /><span className="text-white">Active</span></label>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#1e2733]"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button><button type="submit" disabled={isLoading} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">{isLoading && <Loader2 className="w-4 h-4 animate-spin" />}{isLoading ? 'Saving...' : editingToken ? 'Update' : 'Create'}</button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && tokenToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setIsDeleteModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Delete Token</h3><p className="text-gray-400 mb-6">Delete <span className="text-white font-medium">{tokenToDelete.name}</span>?</p>
              <div className="flex justify-end gap-3"><button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button><button onClick={handleDelete} disabled={isLoading} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">{isLoading && <Loader2 className="w-4 h-4 animate-spin" />}{isLoading ? 'Deleting...' : 'Delete'}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
