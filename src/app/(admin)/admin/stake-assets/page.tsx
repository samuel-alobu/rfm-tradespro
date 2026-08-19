'use client';

import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Plus, Search, Trash2, X, CheckCircle, XCircle, AlertCircle, Users, Loader2 } from 'lucide-react';

interface StakeCycle { days: number; apy: number; isActive: boolean; }

interface StakeAsset {
  _id: string;
  name: string;
  symbol: string;
  image: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  cycles: StakeCycle[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  totalStaked: number;
  totalStakers: number;
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

export default function AdminStakeAssetsPage() {
  const toastId = useId();
  const [assets, setAssets] = useState<StakeAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<StakeAsset | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<StakeAsset | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, totalStakers: 0, featured: 0 });

  const [formData, setFormData] = useState({
    name: '', symbol: '', image: '', description: '', minAmount: 0.1, maxAmount: 1000,
    cycles: [{ days: 30, apy: 5, isActive: true }] as StakeCycle[],
    isActive: true, isFeatured: false, sortOrder: 1,
  });

  const addToast = (type: Toast['type'], message: string) => {
    const id = `${toastId}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/admin/stake-assets');
      const data = await res.json();
      if (res.ok) { setAssets(data.assets || []); setStats(data.stats || { total: 0, active: 0, totalStakers: 0, featured: 0 }); }
      else { addToast('error', data.error); }
    } catch { addToast('error', 'Failed to fetch assets'); }
    finally { setIsFetching(false); }
  };

  useEffect(() => { fetchAssets(); }, []);

  const resetForm = () => {
    setFormData({ name: '', symbol: '', image: '', description: '', minAmount: 0.1, maxAmount: 1000, cycles: [{ days: 30, apy: 5, isActive: true }], isActive: true, isFeatured: false, sortOrder: assets.length + 1 });
  };

  const openCreateModal = () => { resetForm(); setEditingAsset(null); setIsModalOpen(true); };

  const openEditModal = (asset: StakeAsset) => {
    setEditingAsset(asset);
    setFormData({ name: asset.name, symbol: asset.symbol, image: asset.image, description: asset.description || '', minAmount: asset.minAmount, maxAmount: asset.maxAmount, cycles: asset.cycles || [{ days: 30, apy: 5, isActive: true }], isActive: asset.isActive, isFeatured: asset.isFeatured, sortOrder: asset.sortOrder });
    setIsModalOpen(true);
  };

  const addCycle = () => {
    const last = formData.cycles[formData.cycles.length - 1];
    setFormData({ ...formData, cycles: [...formData.cycles, { days: last.days + 30, apy: last.apy + 2, isActive: true }] });
  };

  const removeCycle = (index: number) => {
    if (formData.cycles.length > 1) setFormData({ ...formData, cycles: formData.cycles.filter((_, i) => i !== index) });
  };

  const updateCycle = (index: number, field: keyof StakeCycle, value: number | boolean) => {
    const newCycles = [...formData.cycles];
    newCycles[index] = { ...newCycles[index], [field]: value };
    setFormData({ ...formData, cycles: newCycles });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!formData.name || !formData.symbol || !formData.image) { addToast('error', 'Fill required fields'); setIsLoading(false); return; }
    if (formData.cycles.length === 0) { addToast('error', 'Add at least one cycle'); setIsLoading(false); return; }

    try {
      const payload = editingAsset ? { assetId: editingAsset._id, ...formData } : formData;
      const res = await fetch('/api/admin/stake-assets', { method: editingAsset ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { addToast('success', data.message); setIsModalOpen(false); resetForm(); fetchAssets(); }
      else { addToast('error', data.error); }
    } catch { addToast('error', 'Operation failed'); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/stake-assets?id=${assetToDelete._id}`, { method: 'DELETE' });
      if (res.ok) { addToast('success', 'Asset deleted'); setIsDeleteModalOpen(false); setAssetToDelete(null); fetchAssets(); }
      else { const data = await res.json(); addToast('error', data.error); }
    } catch { addToast('error', 'Failed to delete'); }
    finally { setIsLoading(false); }
  };

  const toggleStatus = async (asset: StakeAsset, field: 'isActive' | 'isFeatured') => {
    try {
      const res = await fetch('/api/admin/stake-assets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assetId: asset._id, [field]: !asset[field] }) });
      if (res.ok) { addToast('success', 'Status updated'); fetchAssets(); }
    } catch { addToast('error', 'Failed'); }
  };

  const filteredAssets = assets.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.symbol.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isFetching) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Stake Assets</h1><p className="text-gray-400 mt-1">Manage staking assets and cycles</p></div>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"><Plus className="w-5 h-5" />Add Asset</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Assets', value: stats.total, icon: Coins, color: 'text-blue-500' }, { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-500' }, { label: 'Total Stakers', value: stats.totalStakers?.toLocaleString(), icon: Users, color: 'text-purple-500' }, { label: 'Featured', value: stats.featured, icon: Coins, color: 'text-yellow-500' }].map((stat) => (
          <div key={stat.label} className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-4">
            <div className="flex items-center gap-3"><div className={`p-2 rounded-lg bg-[#151c24] ${stat.color}`}><stat.icon className="w-5 h-5" /></div><div><p className="text-gray-400 text-sm">{stat.label}</p><p className="text-white text-xl font-bold">{stat.value}</p></div></div>
          </div>
        ))}
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Search assets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500" /></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <div key={asset._id} className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src={asset.image} alt={asset.name} className="w-12 h-12 rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48'; }} />
                <div><h3 className="text-white font-bold">{asset.name}</h3><p className="text-gray-400 text-sm">{asset.symbol}</p></div>
              </div>
              <button onClick={() => toggleStatus(asset, 'isActive')} className={`px-2 py-1 rounded text-xs ${asset.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>{asset.isActive ? 'Active' : 'Inactive'}</button>
            </div>
            {asset.description && <p className="text-gray-400 text-sm mb-4">{asset.description}</p>}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Min:</span><span className="text-white">{asset.minAmount} {asset.symbol}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Max:</span><span className="text-white">{asset.maxAmount?.toLocaleString()} {asset.symbol}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Stakers:</span><span className="text-white">{asset.totalStakers || 0}</span></div>
            </div>
            <div className="mb-4"><p className="text-gray-400 text-sm mb-2">Staking Cycles</p><div className="flex flex-wrap gap-2">{asset.cycles?.map((cycle, index) => (<div key={index} className={`px-2 py-1 rounded text-xs ${cycle.isActive ? 'bg-[#151c24] border border-[#1e2733]' : 'bg-gray-500/10 text-gray-500'}`}><span className="text-white">{cycle.days}d</span><span className="text-green-500 ml-1">{cycle.apy}%</span></div>))}</div></div>
            <div className="flex gap-2">
              <button onClick={() => openEditModal(asset)} className="flex-1 px-3 py-2 bg-[#151c24] hover:bg-[#1e2733] text-white rounded-lg text-sm">Edit</button>
              <button onClick={() => { setAssetToDelete(asset); setIsDeleteModalOpen(true); }} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {filteredAssets.length === 0 && <div className="text-center py-12 bg-[#0f1419] border border-[#1e2733] rounded-xl"><Coins className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">No assets found</p></div>}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f1419] border border-[#1e2733] rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-[#1e2733]"><h2 className="text-xl font-bold text-white">{editingAsset ? 'Edit Asset' : 'Add Asset'}</h2><button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-[#1e2733] rounded-lg"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-gray-400 text-sm mb-2">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="Ethereum" /></div>
                  <div><label className="block text-gray-400 text-sm mb-2">Symbol *</label><input type="text" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="ETH" /></div>
                </div>
                <div><label className="block text-gray-400 text-sm mb-2">Image URL *</label><input type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="https://..." /></div>
                <div><label className="block text-gray-400 text-sm mb-2">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500 resize-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-gray-400 text-sm mb-2">Minimum</label><input type="number" step="any" value={formData.minAmount} onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" /></div>
                  <div><label className="block text-gray-400 text-sm mb-2">Maximum</label><input type="number" step="any" value={formData.maxAmount} onChange={(e) => setFormData({ ...formData, maxAmount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" /></div>
                </div>
                <div><div className="flex items-center justify-between mb-2"><label className="text-gray-400 text-sm">Staking Cycles *</label><button type="button" onClick={addCycle} className="text-green-500 text-sm hover:underline">+ Add Cycle</button></div><div className="space-y-2">{formData.cycles.map((cycle, index) => (<div key={index} className="flex items-center gap-2"><div className="flex-1 grid grid-cols-2 gap-2"><div className="relative"><input type="number" value={cycle.days} onChange={(e) => updateCycle(index, 'days', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500 pr-12" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">days</span></div><div className="relative"><input type="number" step="0.1" value={cycle.apy} onChange={(e) => updateCycle(index, 'apy', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500 pr-10" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span></div></div><button type="button" onClick={() => updateCycle(index, 'isActive', !cycle.isActive)} className={`p-2 rounded-lg ${cycle.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}><CheckCircle className="w-4 h-4" /></button>{formData.cycles.length > 1 && (<button type="button" onClick={() => removeCycle(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"><X className="w-4 h-4" /></button>)}</div>))}</div></div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-[#1e2733] bg-[#151c24] text-green-500" /><span className="text-white">Active</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} className="w-4 h-4 rounded border-[#1e2733] bg-[#151c24] text-green-500" /><span className="text-white">Featured</span></label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#1e2733]"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button><button type="submit" disabled={isLoading} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">{isLoading && <Loader2 className="w-4 h-4 animate-spin" />}{isLoading ? 'Saving...' : editingAsset ? 'Update' : 'Create'}</button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && assetToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setIsDeleteModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Delete Asset</h3><p className="text-gray-400 mb-6">Delete <span className="text-white font-medium">{assetToDelete.name}</span>?{(assetToDelete.totalStakers || 0) > 0 && <span className="text-yellow-500 block mt-2">Warning: {assetToDelete.totalStakers} active stakers</span>}</p>
              <div className="flex justify-end gap-3"><button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button><button onClick={handleDelete} disabled={isLoading} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">{isLoading && <Loader2 className="w-4 h-4 animate-spin" />}{isLoading ? 'Deleting...' : 'Delete'}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
