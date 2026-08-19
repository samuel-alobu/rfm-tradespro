'use client';

import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeDollarSign, Plus, Search, Trash2, X, CheckCircle, XCircle, AlertCircle, Zap, TrendingUp, Crown, Star, Loader2 } from 'lucide-react';

interface Plan {
  _id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  durationDays: number;
  roiPercent: number;
  color: string;
  icon: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  totalSubscribers?: number;
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

const iconOptions = [
  { value: 'Zap', label: 'Zap', Icon: Zap },
  { value: 'TrendingUp', label: 'Trending', Icon: TrendingUp },
  { value: 'Crown', label: 'Crown', Icon: Crown },
  { value: 'Star', label: 'Star', Icon: Star },
];

const colorOptions = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const getIcon = (iconName: string) => {
  const found = iconOptions.find(i => i.value === iconName);
  return found ? found.Icon : Zap;
};

export default function AdminPlansPage() {
  const toastId = useId();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, totalSubscribers: 0 });

  const [formData, setFormData] = useState({
    name: '', description: '', minAmount: 100, maxAmount: 10000, durationDays: 30,
    roiPercent: 10, color: '#22c55e', icon: 'Zap',
    isActive: true, isFeatured: false, sortOrder: 1,
  });

  const addToast = (type: Toast['type'], message: string) => {
    const id = `${toastId}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      const data = await res.json();
      if (res.ok) {
        setPlans(data.plans || []);
        setStats(data.stats || { total: 0, active: 0, totalSubscribers: 0 });
      } else { addToast('error', data.error || 'Failed to fetch plans'); }
    } catch { addToast('error', 'Failed to fetch plans'); }
    finally { setIsFetching(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const resetForm = () => {
    setFormData({ name: '', description: '', minAmount: 100, maxAmount: 10000, durationDays: 30, roiPercent: 10, color: '#22c55e', icon: 'Zap', isActive: true, isFeatured: false, sortOrder: plans.length + 1 });
  };

  const openCreateModal = () => { resetForm(); setEditingPlan(null); setIsModalOpen(true); };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({ name: plan.name, description: plan.description || '', minAmount: plan.minAmount, maxAmount: plan.maxAmount, durationDays: plan.durationDays, roiPercent: plan.roiPercent, color: plan.color || '#22c55e', icon: plan.icon || 'Zap', isActive: plan.isActive, isFeatured: plan.isFeatured, sortOrder: plan.sortOrder });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!formData.name) { addToast('error', 'Name is required'); setIsLoading(false); return; }

    try {
      const payload = editingPlan ? { planId: editingPlan._id, ...formData } : formData;
      const res = await fetch('/api/admin/plans', { method: editingPlan ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { addToast('success', data.message); setIsModalOpen(false); resetForm(); fetchPlans(); }
      else { addToast('error', data.error); }
    } catch { addToast('error', 'Operation failed'); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/plans?id=${planToDelete._id}`, { method: 'DELETE' });
      if (res.ok) { addToast('success', 'Plan deleted'); setIsDeleteModalOpen(false); setPlanToDelete(null); fetchPlans(); }
      else { const data = await res.json(); addToast('error', data.error); }
    } catch { addToast('error', 'Failed to delete'); }
    finally { setIsLoading(false); }
  };

  const toggleStatus = async (plan: Plan, field: 'isActive' | 'isFeatured') => {
    try {
      const res = await fetch('/api/admin/plans', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: plan._id, [field]: !plan[field] }) });
      if (res.ok) { addToast('success', 'Status updated'); fetchPlans(); }
    } catch { addToast('error', 'Failed to update'); }
  };

  const filteredPlans = plans.filter((plan) => plan.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isFetching) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Subscribe Plans</h1><p className="text-gray-400 mt-1">Manage subscription plans</p></div>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"><Plus className="w-5 h-5" />Add Plan</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total Plans', value: stats.total, icon: BadgeDollarSign, color: 'text-blue-500' }, { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-500' }, { label: 'Total Subscribers', value: stats.totalSubscribers, icon: TrendingUp, color: 'text-purple-500' }].map((stat) => (
          <div key={stat.label} className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-4">
            <div className="flex items-center gap-3"><div className={`p-2 rounded-lg bg-[#151c24] ${stat.color}`}><stat.icon className="w-5 h-5" /></div><div><p className="text-gray-400 text-sm">{stat.label}</p><p className="text-white text-xl font-bold">{stat.value}</p></div></div>
          </div>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search plans..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => {
          const IconComponent = getIcon(plan.icon);
          return (
            <div key={plan._id} className="bg-[#0f1419] border border-[#1e2733] rounded-xl overflow-hidden">
              <div className="p-6" style={{ borderTop: `3px solid ${plan.color}` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: `${plan.color}20` }}><IconComponent className="w-6 h-6" style={{ color: plan.color }} /></div>
                    <div><h3 className="text-white font-bold text-lg">{plan.name}</h3><p className="text-gray-400 text-sm">{plan.durationDays} days</p></div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleStatus(plan, 'isActive')} className={`px-2 py-1 rounded text-xs ${plan.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>{plan.isActive ? 'Active' : 'Inactive'}</button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{plan.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Minimum:</span><span className="text-white">${plan.minAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Maximum:</span><span className="text-white">${plan.maxAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">ROI:</span><span className="text-green-500 font-bold">{plan.roiPercent}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Subscribers:</span><span className="text-white">{plan.totalSubscribers || 0}</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleStatus(plan, 'isFeatured')} className={`px-3 py-2 rounded-lg text-sm ${plan.isFeatured ? 'bg-yellow-500/20 text-yellow-500' : 'bg-[#151c24] text-gray-400'}`}>Featured</button>
                  <button onClick={() => openEditModal(plan)} className="flex-1 px-3 py-2 bg-[#151c24] hover:bg-[#1e2733] text-white rounded-lg text-sm">Edit</button>
                  <button onClick={() => { setPlanToDelete(plan); setIsDeleteModalOpen(true); }} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlans.length === 0 && <div className="text-center py-12 bg-[#0f1419] border border-[#1e2733] rounded-xl"><BadgeDollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">No plans found</p></div>}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f1419] border border-[#1e2733] rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-[#1e2733]"><h2 className="text-xl font-bold text-white">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h2><button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-[#1e2733] rounded-lg"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="block text-gray-400 text-sm mb-2">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="Premium Plan" /></div>
                <div><label className="block text-gray-400 text-sm mb-2">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500 resize-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-gray-400 text-sm mb-2">Min Amount ($)</label><input type="number" value={formData.minAmount} onChange={(e) => setFormData({ ...formData, minAmount: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" /></div>
                  <div><label className="block text-gray-400 text-sm mb-2">Max Amount ($)</label><input type="number" value={formData.maxAmount} onChange={(e) => setFormData({ ...formData, maxAmount: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-gray-400 text-sm mb-2">Duration (Days)</label><input type="number" value={formData.durationDays} onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" /></div>
                  <div><label className="block text-gray-400 text-sm mb-2">ROI (%)</label><input type="number" value={formData.roiPercent} onChange={(e) => setFormData({ ...formData, roiPercent: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-gray-400 text-sm mb-2">Icon</label><select value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500">{iconOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>
                  <div><label className="block text-gray-400 text-sm mb-2">Color</label><div className="flex gap-2">{colorOptions.map((c) => (<button key={c} type="button" onClick={() => setFormData({ ...formData, color: c })} className={`w-8 h-8 rounded-lg border-2 ${formData.color === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />))}</div></div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-[#1e2733] bg-[#151c24] text-green-500" /><span className="text-white">Active</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} className="w-4 h-4 rounded border-[#1e2733] bg-[#151c24] text-green-500" /><span className="text-white">Featured</span></label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#1e2733]"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button><button type="submit" disabled={isLoading} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">{isLoading && <Loader2 className="w-4 h-4 animate-spin" />}{isLoading ? 'Saving...' : editingPlan ? 'Update' : 'Create'}</button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && planToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setIsDeleteModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Delete Plan</h3><p className="text-gray-400 mb-6">Delete <span className="text-white font-medium">{planToDelete.name}</span>?</p>
              <div className="flex justify-end gap-3"><button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button><button onClick={handleDelete} disabled={isLoading} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">{isLoading && <Loader2 className="w-4 h-4 animate-spin" />}{isLoading ? 'Deleting...' : 'Delete'}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
