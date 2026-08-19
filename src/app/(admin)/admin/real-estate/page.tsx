'use client';

import { useState, useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Users,
  DollarSign,
  MapPin,
  Upload,
  Loader2,
  ExternalLink,
} from 'lucide-react';

// Types
interface PropertyDocument {
  title: string;
  slug: string;
  url: string;
  publicId?: string;
  order: number;
}

interface Property {
  _id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  minimum: number;
  roi: number;
  strategy: 'fixed_income' | 'growth' | 'hybrid' | 'opportunistic';
  projectOverview: string;
  breakdown: {
    text: string;
    type: string;
    location: string;
    strategy: string;
    status: 'funding' | 'in_progress' | 'completed';
  };
  whyThisProject?: string[];
  whyThisSponsor?: string[];
  documents: PropertyDocument[];
  targetAmount: number;
  raisedAmount: number;
  percentFunded: number;
  investors: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Toast Component
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500/20 border border-green-500/30' :
              toast.type === 'error' ? 'bg-red-500/20 border border-red-500/30' :
              'bg-blue-500/20 border border-blue-500/30'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-500" />}
            <span className="text-white text-sm">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Generate slug from string
function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const strategyOptions = [
  { value: 'fixed_income', label: 'Fixed Income' },
  { value: 'growth', label: 'Growth' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'opportunistic', label: 'Opportunistic' },
];

const statusOptions = [
  { value: 'funding', label: 'Funding' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function AdminRealEstatePage() {
  const toastId = useId();
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStrategy, setFilterStrategy] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<number | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    images: [] as string[],
    minimum: 10000,
    roi: 50,
    strategy: 'fixed_income' as Property['strategy'],
    projectOverview: '',
    breakdown: {
      text: '',
      type: '',
      location: '',
      strategy: '',
      status: 'funding' as 'funding' | 'in_progress' | 'completed',
    },
    whyThisProject: [] as string[],
    whyThisSponsor: [] as string[],
    documents: [] as PropertyDocument[],
    targetAmount: 1000000,
    raisedAmount: 0,
    isActive: true,
    isFeatured: false,
    sortOrder: 1,
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalRaised: 0,
    totalInvestors: 0,
  });

  const addToast = (type: Toast['type'], message: string) => {
    const id = `${toastId}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch properties
  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/admin/real-estate');
      const data = await res.json();
      if (res.ok) {
        setProperties(data.properties || []);
        setStats(data.stats || { total: 0, active: 0, totalRaised: 0, totalInvestors: 0 });
      } else {
        addToast('error', data.error || 'Failed to fetch properties');
      }
    } catch {
      addToast('error', 'Failed to fetch properties');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      images: [],
      minimum: 10000,
      roi: 50,
      strategy: 'fixed_income',
      projectOverview: '',
      breakdown: {
        text: '',
        type: '',
        location: '',
        strategy: '',
        status: 'funding',
      },
      whyThisProject: [],
      whyThisSponsor: [],
      documents: [],
      targetAmount: 1000000,
      raisedAmount: 0,
      isActive: true,
      isFeatured: false,
      sortOrder: properties.length + 1,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingProperty(null);
    setIsModalOpen(true);
  };

  const openEditModal = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      description: property.description,
      images: property.images || [],
      minimum: property.minimum,
      roi: property.roi,
      strategy: property.strategy,
      projectOverview: property.projectOverview || '',
      breakdown: property.breakdown || {
        text: '',
        type: '',
        location: '',
        strategy: '',
        status: 'funding',
      },
      whyThisProject: property.whyThisProject || [],
      whyThisSponsor: property.whyThisSponsor || [],
      documents: property.documents || [],
      targetAmount: property.targetAmount,
      raisedAmount: property.raisedAmount,
      isActive: property.isActive,
      isFeatured: property.isFeatured,
      sortOrder: property.sortOrder,
    });
    setIsModalOpen(true);
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('error', 'Please select an image file');
      return;
    }

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'image');
      formDataUpload.append('folder', 'real-estate/images');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (res.ok) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, data.url],
        }));
        addToast('success', 'Image uploaded successfully');
      } else {
        addToast('error', data.error || 'Failed to upload image');
      }
    } catch {
      addToast('error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Document handlers
  const addDocument = () => {
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, { title: '', slug: '', url: '', order: prev.documents.length + 1 }],
    }));
  };

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const updateDocument = (index: number, field: keyof PropertyDocument, value: string | number) => {
    const newDocs = [...formData.documents];
    newDocs[index] = { ...newDocs[index], [field]: value };
    
    // Auto-generate slug when title changes
    if (field === 'title' && typeof value === 'string') {
      newDocs[index].slug = generateSlug(value);
    }
    
    setFormData({ ...formData, documents: newDocs });
  };

  // Document upload handler
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      addToast('error', 'Please select a PDF file');
      return;
    }

    setUploadingDoc(index);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'pdf');
      formDataUpload.append('folder', 'real-estate/documents');
      formDataUpload.append('name', formData.documents[index]?.title || file.name);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (res.ok) {
        const newDocs = [...formData.documents];
        newDocs[index] = {
          ...newDocs[index],
          url: data.url,
          publicId: data.publicId,
        };
        setFormData((prev) => ({ ...prev, documents: newDocs }));
        addToast('success', 'Document uploaded successfully');
      } else {
        addToast('error', data.error || 'Failed to upload document');
      }
    } catch {
      addToast('error', 'Failed to upload document');
    } finally {
      setUploadingDoc(null);
      if (docInputRefs.current[index]) docInputRefs.current[index]!.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name || !formData.description) {
      addToast('error', 'Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    // Filter out incomplete documents
    const validDocs = formData.documents.filter((doc) => doc.title && doc.url);

    try {
      const payload = {
        ...formData,
        documents: validDocs,
        slug: generateSlug(formData.name),
        ...(editingProperty ? { propertyId: editingProperty._id } : {}),
      };

      const res = await fetch('/api/admin/real-estate', {
        method: editingProperty ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        addToast('success', data.message || `Property ${editingProperty ? 'updated' : 'created'} successfully`);
        setIsModalOpen(false);
        resetForm();
        fetchProperties();
      } else {
        addToast('error', data.error || 'Operation failed');
      }
    } catch {
      addToast('error', 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/real-estate?id=${propertyToDelete._id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        addToast('success', 'Property deleted successfully');
        setIsDeleteModalOpen(false);
        setPropertyToDelete(null);
        fetchProperties();
      } else {
        addToast('error', data.error || 'Failed to delete property');
      }
    } catch {
      addToast('error', 'Failed to delete property');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (property: Property, field: 'isActive' | 'isFeatured') => {
    try {
      const res = await fetch('/api/admin/real-estate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property._id,
          [field]: !property[field],
        }),
      });

      if (res.ok) {
        addToast('success', `Property ${field.replace('is', '')} status updated`);
        fetchProperties();
      }
    } catch {
      addToast('error', 'Failed to update status');
    }
  };

  // Filter
  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStrategy = filterStrategy === 'all' || property.strategy === filterStrategy;
    return matchesSearch && matchesStrategy;
  });

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Real Estate Properties</h1>
          <p className="text-gray-400 mt-1">Manage investment properties</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Property
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Properties', value: stats.total, icon: Building2, color: 'text-blue-500' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Total Raised', value: `$${(stats.totalRaised / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-yellow-500' },
          { label: 'Total Investors', value: stats.totalInvestors.toLocaleString(), icon: Users, color: 'text-purple-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-[#151c24] ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-white text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
        </div>
        <select
          value={filterStrategy}
          onChange={(e) => setFilterStrategy(e.target.value)}
          className="px-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
        >
          <option value="all">All Strategies</option>
          {strategyOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProperties.map((property) => (
          <div key={property._id} className="bg-[#0f1419] border border-[#1e2733] rounded-xl overflow-hidden">
            {/* Image */}
            <div className="relative h-48">
              <img
                src={property.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'}
                alt={property.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  property.breakdown?.status === 'funding' ? 'bg-blue-500/90 text-white' :
                  property.breakdown?.status === 'in_progress' ? 'bg-yellow-500/90 text-black' :
                  'bg-green-500/90 text-white'
                }`}>
                  {property.breakdown?.status?.replace('_', ' ').toUpperCase() || 'FUNDING'}
                </span>
                {property.isFeatured && (
                  <span className="px-2 py-1 bg-purple-500/90 text-white rounded text-xs font-medium">Featured</span>
                )}
              </div>
              <div className="absolute top-3 right-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${property.isActive ? 'bg-green-500/90' : 'bg-gray-500/90'} text-white`}>
                  {property.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-white font-bold text-lg mb-1">{property.name}</h3>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                <MapPin className="w-4 h-4" />
                <span>{property.breakdown?.location || 'Location TBD'}</span>
                <span>•</span>
                <span>{property.breakdown?.type || 'Type TBD'}</span>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{property.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-xs">Min Investment</p>
                  <p className="text-white font-bold">${property.minimum?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Target ROI</p>
                  <p className="text-green-500 font-bold">{property.roi}%</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Investors</p>
                  <p className="text-white font-bold">{property.investors || 0}</p>
                </div>
              </div>

              {/* Funding Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Funding Progress</span>
                  <span className="text-white">{property.percentFunded || 0}%</span>
                </div>
                <div className="h-2 bg-[#1e2733] rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${property.percentFunded || 0}%` }} />
                </div>
              </div>

              {/* Info */}
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {property.images?.length || 0} images
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {property.documents?.length || 0} docs
                </span>
                {property.documents?.length > 0 && property.slug && (
                  <a
                    href={`/project/${property.slug}/${property.documents[0].slug}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-green-500 hover:text-green-400"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Doc
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleStatus(property, 'isFeatured')}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    property.isFeatured ? 'bg-purple-500/20 text-purple-500' : 'bg-[#151c24] text-gray-400 hover:text-white'
                  }`}
                >
                  Featured
                </button>
                <button
                  onClick={() => openEditModal(property)}
                  className="flex-1 px-3 py-2 bg-[#151c24] hover:bg-[#1e2733] text-white rounded-lg text-sm transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => { setPropertyToDelete(property); setIsDeleteModalOpen(true); }}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12 bg-[#0f1419] border border-[#1e2733] rounded-xl">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No properties found</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] border border-[#1e2733] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                <h2 className="text-xl font-bold text-white">{editingProperty ? 'Edit Property' : 'Add New Property'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-[#1e2733] rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Property Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    placeholder="Go Store It Nashville"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Brief Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500 resize-none"
                  />
                </div>

                {/* Images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-400 text-sm">Property Images</label>
                    <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex items-center gap-1 text-green-500 text-sm hover:underline disabled:opacity-50"
                    >
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Image
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={img} alt={`Property ${index + 1}`} className="w-24 h-24 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {formData.images.length === 0 && <p className="text-gray-500 text-sm">No images uploaded</p>}
                  </div>
                </div>

                {/* Investment Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Minimum ($)</label>
                    <input
                      type="number"
                      value={formData.minimum}
                      onChange={(e) => setFormData({ ...formData, minimum: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">ROI (%)</label>
                    <input
                      type="number"
                      value={formData.roi}
                      onChange={(e) => setFormData({ ...formData, roi: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Target ($)</label>
                    <input
                      type="number"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Raised ($)</label>
                    <input
                      type="number"
                      value={formData.raisedAmount}
                      onChange={(e) => setFormData({ ...formData, raisedAmount: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Strategy</label>
                    <select
                      value={formData.strategy}
                      onChange={(e) => setFormData({ ...formData, strategy: e.target.value as Property['strategy'] })}
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    >
                      {strategyOptions.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Status</label>
                    <select
                      value={formData.breakdown.status}
                      onChange={(e) => setFormData({ ...formData, breakdown: { ...formData.breakdown, status: e.target.value as 'funding' | 'in_progress' | 'completed' } })}
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Project Overview</label>
                  <textarea
                    value={formData.projectOverview}
                    onChange={(e) => setFormData({ ...formData, projectOverview: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500 resize-none"
                  />
                </div>

                {/* Breakdown */}
                <div className="p-4 bg-[#151c24] rounded-lg space-y-4">
                  <h4 className="text-white font-medium">Project Breakdown</h4>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Breakdown Text *</label>
                    <input
                      type="text"
                      value={formData.breakdown.text}
                      onChange={(e) => setFormData({ ...formData, breakdown: { ...formData.breakdown, text: e.target.value } })}
                      className="w-full px-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                      placeholder="85,000 SF climate-controlled self-storage with 650 units"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Type *</label>
                      <input
                        type="text"
                        value={formData.breakdown.type}
                        onChange={(e) => setFormData({ ...formData, breakdown: { ...formData.breakdown, type: e.target.value } })}
                        className="w-full px-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                        placeholder="Self-Storage"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Location *</label>
                      <input
                        type="text"
                        value={formData.breakdown.location}
                        onChange={(e) => setFormData({ ...formData, breakdown: { ...formData.breakdown, location: e.target.value } })}
                        className="w-full px-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                        placeholder="Franklin, TN"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Strategy Label *</label>
                      <input
                        type="text"
                        value={formData.breakdown.strategy}
                        onChange={(e) => setFormData({ ...formData, breakdown: { ...formData.breakdown, strategy: e.target.value } })}
                        className="w-full px-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                        placeholder="Fixed Income"
                      />
                    </div>
                  </div>
                </div>

                {/* Why This Project (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-400 text-sm">Why This Project? (Optional bullet points)</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, whyThisProject: [...formData.whyThisProject, ''] })}
                      className="text-green-500 text-sm hover:underline"
                    >
                      + Add Point
                    </button>
                  </div>
                  {formData.whyThisProject.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No points added. Click &quot;+ Add Point&quot; to add reasons why investors should consider this project.</p>
                  )}
                  <div className="space-y-2">
                    {formData.whyThisProject.map((point, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-green-500 mt-2">•</span>
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => {
                            const updated = [...formData.whyThisProject];
                            updated[index] = e.target.value;
                            setFormData({ ...formData, whyThisProject: updated });
                          }}
                          className="flex-1 px-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                          placeholder="Enter a reason..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.whyThisProject.filter((_, i) => i !== index);
                            setFormData({ ...formData, whyThisProject: updated });
                          }}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why This Sponsor (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-400 text-sm">Why This Sponsor? (Optional bullet points)</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, whyThisSponsor: [...formData.whyThisSponsor, ''] })}
                      className="text-green-500 text-sm hover:underline"
                    >
                      + Add Point
                    </button>
                  </div>
                  {formData.whyThisSponsor.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No points added. Click &quot;+ Add Point&quot; to add reasons about the sponsor.</p>
                  )}
                  <div className="space-y-2">
                    {formData.whyThisSponsor.map((point, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-green-500 mt-2">•</span>
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => {
                            const updated = [...formData.whyThisSponsor];
                            updated[index] = e.target.value;
                            setFormData({ ...formData, whyThisSponsor: updated });
                          }}
                          className="flex-1 px-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                          placeholder="Enter a reason..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.whyThisSponsor.filter((_, i) => i !== index);
                            setFormData({ ...formData, whyThisSponsor: updated });
                          }}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-400 text-sm">Documents (PDFs)</label>
                    <button type="button" onClick={addDocument} className="text-green-500 text-sm hover:underline">+ Add Document</button>
                  </div>
                  <div className="space-y-3">
                    {formData.documents.map((doc, index) => (
                      <div key={index} className="p-3 bg-[#151c24] rounded-lg space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={doc.title}
                            onChange={(e) => updateDocument(index, 'title', e.target.value)}
                            className="flex-1 px-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                            placeholder="Document title (e.g., Investment Deck)"
                          />
                          <button type="button" onClick={() => removeDocument(index)} className="p-2 text-gray-400 hover:text-red-500">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="file"
                            ref={(el) => { docInputRefs.current[index] = el; }}
                            onChange={(e) => handleDocumentUpload(e, index)}
                            accept="application/pdf"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => docInputRefs.current[index]?.click()}
                            disabled={uploadingDoc === index || !doc.title}
                            className="flex items-center gap-2 px-3 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
                          >
                            {uploadingDoc === index ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {doc.url ? 'Replace PDF' : 'Upload PDF'}
                          </button>
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-500 hover:text-green-400 text-sm">
                              <ExternalLink className="w-4 h-4" />
                              View Current
                            </a>
                          )}
                          {doc.slug && formData.name && (
                            <span className="text-gray-500 text-xs">
                              URL: /project/{generateSlug(formData.name)}/{doc.slug}.pdf
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {formData.documents.length === 0 && <p className="text-gray-500 text-sm">No documents added</p>}
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-[#1e2733] bg-[#151c24] text-green-500 focus:ring-green-500"
                    />
                    <span className="text-white">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded border-[#1e2733] bg-[#151c24] text-green-500 focus:ring-green-500"
                    />
                    <span className="text-white">Featured</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#1e2733]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading ? 'Saving...' : editingProperty ? 'Update Property' : 'Create Property'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && propertyToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-white mb-4">Delete Property</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <span className="text-white font-medium">{propertyToDelete.name}</span>?
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
