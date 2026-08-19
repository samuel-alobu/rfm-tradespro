'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  Check,
  X,
  Eye,
  Clock,
  AlertCircle,
  User,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/utils';

// ============================================
// Admin KYC Page - Real Data
// ============================================

interface KYCSubmission {
  _id: string;
  user: { name: string; email: string };
  status: 'pending' | 'verified' | 'rejected' | 'unverified';
  submittedAt: string;
  documents: {
    idType: string;
    images: Array<{
      type: string;
      url: string;
      status: string;
      uploadedAt: string;
    }>;
  };
  country: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function AdminKYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [imageModal, setImageModal] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/kyc?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok) {
        setSubmissions(data.submissions || []);
        setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch KYC submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleApprove = async (userId: string) => {
    try {
      setProcessingId(userId);
      const res = await fetch('/api/admin/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'approve' }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast('success', 'KYC approved successfully. User has been notified.');
        fetchSubmissions();
        setShowModal(false);
      } else {
        addToast('error', data.error || 'Failed to approve');
      }
    } catch (error) {
      addToast('error', 'An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    
    try {
      setProcessingId(selectedSubmission._id);
      const res = await fetch('/api/admin/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedSubmission._id,
          action: 'reject',
          rejectionReason: rejectionReason || 'Documents did not meet verification requirements',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast('success', 'KYC rejected. User has been notified.');
        fetchSubmissions();
        setShowModal(false);
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        addToast('error', data.error || 'Failed to reject');
      }
    } catch (error) {
      addToast('error', 'An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} days ago`;
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    verified: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    unverified: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">KYC Verification</h1>
          <p className="text-sm text-[#6b7a90]">Review and approve user identity verification</p>
        </div>
      </div>

      {/* Pending Alert */}
      {stats.pending > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium text-white">
                {stats.pending} verification request{stats.pending > 1 ? 's' : ''} pending review
              </p>
              <p className="text-sm text-[#6b7a90]">
                Review documents to approve or reject users
              </p>
            </div>
          </div>
          <button 
            onClick={() => setStatusFilter('pending')}
            className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-[#6b7a90]">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              <p className="text-sm text-[#6b7a90]">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-[#22c55e]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#22c55e]">{stats.approved}</p>
              <p className="text-sm text-[#6b7a90]">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
              <p className="text-sm text-[#6b7a90]">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'verified', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors',
                  statusFilter === status
                    ? 'bg-[#22c55e] text-white'
                    : 'bg-[#0a0e14] text-[#6b7a90] hover:text-white border border-[#1e2733]'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submissions Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#22c55e] animate-spin" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-12 text-center">
          <FileText className="h-12 w-12 text-[#6b7a90] mx-auto mb-3" />
          <p className="text-white font-medium">No KYC submissions found</p>
          <p className="text-sm text-[#6b7a90]">
            {statusFilter === 'all' ? 'No users have submitted KYC documents yet' : `No ${statusFilter} submissions`}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubmissions.map((sub, index) => (
            <motion.div
              key={sub._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <div
                onClick={() => { setSelectedSubmission(sub); setShowModal(true); }}
                className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-5 hover:border-[#22c55e] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                      <span className="font-semibold text-[#22c55e]">
                        {sub.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{sub.user.name}</p>
                      <p className="text-sm text-[#6b7a90]">{sub.user.email}</p>
                    </div>
                  </div>
                  <span className={cn('px-3 py-1 rounded-full text-xs font-medium border capitalize', statusColors[sub.status])}>
                    {sub.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6b7a90]">Document</span>
                    <span className="text-white">{sub.documents.idType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7a90]">Country</span>
                    <span className="text-white">{sub.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7a90]">Submitted</span>
                    <span className="text-white">{formatTime(sub.submittedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7a90]">Documents</span>
                    <span className="text-white">{sub.documents.images.length} file(s)</span>
                  </div>
                </div>

                {sub.status === 'pending' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-[#1e2733]">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApprove(sub._id); }}
                      disabled={processingId === sub._id}
                      className="flex-1 py-2 bg-[#22c55e] text-white rounded-lg font-medium hover:bg-[#1ea550] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processingId === sub._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedSubmission(sub); setShowRejectModal(true); }}
                      className="flex-1 py-2 bg-red-500/10 text-red-500 rounded-lg font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showModal && selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] rounded-xl border border-[#1e2733] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-[#1e2733]">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">KYC Review</h3>
                  <button onClick={() => setShowModal(false)} className="text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 bg-[#0a0e14] rounded-xl">
                  <div className="h-16 w-16 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                    <span className="text-xl font-semibold text-[#22c55e]">
                      {selectedSubmission.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{selectedSubmission.user.name}</h4>
                    <p className="text-[#6b7a90]">{selectedSubmission.user.email}</p>
                  </div>
                  <span className={cn('ml-auto px-3 py-1 rounded-full text-xs font-medium border capitalize', statusColors[selectedSubmission.status])}>
                    {selectedSubmission.status}
                  </span>
                </div>

                {/* Details */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0a0e14] rounded-xl">
                    <p className="text-sm text-[#6b7a90] mb-1">Document Type</p>
                    <p className="text-white font-medium">{selectedSubmission.documents.idType}</p>
                  </div>
                  <div className="p-4 bg-[#0a0e14] rounded-xl">
                    <p className="text-sm text-[#6b7a90] mb-1">Country</p>
                    <p className="text-white font-medium">{selectedSubmission.country}</p>
                  </div>
                  <div className="p-4 bg-[#0a0e14] rounded-xl">
                    <p className="text-sm text-[#6b7a90] mb-1">Submitted</p>
                    <p className="text-white font-medium">{new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-[#0a0e14] rounded-xl">
                    <p className="text-sm text-[#6b7a90] mb-1">Documents</p>
                    <p className="text-white font-medium">{selectedSubmission.documents.images.length} uploaded</p>
                  </div>
                </div>

                {/* Document Images */}
                <div>
                  <h4 className="text-white font-medium mb-3">Uploaded Documents</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {selectedSubmission.documents.images.map((img, idx) => {
                      const docTypeLabels: Record<string, string> = {
                        'id_card': 'ID Card',
                        'passport': 'Passport',
                        'drivers_license': "Driver's License",
                        'proof_of_address': 'Selfie',
                      };
                      return (
                        <div key={idx} className="relative group">
                          <div 
                            onClick={() => setImageModal(img.url)}
                            className="aspect-video bg-[#0a0e14] rounded-xl overflow-hidden cursor-pointer border border-[#1e2733] hover:border-[#22c55e] transition-colors relative"
                          >
                            <Image
                              src={img.url}
                              alt={`Document ${idx + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm text-[#6b7a90]">{docTypeLabels[img.type] || 'Document'} {idx + 1}</span>
                            <a 
                              href={img.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-[#22c55e] hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                {selectedSubmission.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-[#1e2733]">
                    <button
                      onClick={() => handleApprove(selectedSubmission._id)}
                      disabled={processingId === selectedSubmission._id}
                      className="flex-1 py-3 bg-[#22c55e] text-white rounded-lg font-medium hover:bg-[#1ea550] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processingId === selectedSubmission._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Approve Verification
                    </button>
                    <button
                      onClick={() => { setShowModal(false); setShowRejectModal(true); }}
                      className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-lg font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] rounded-xl border border-[#1e2733] w-full max-w-md"
            >
              <div className="p-6 border-b border-[#1e2733]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Reject Verification</h3>
                    <p className="text-sm text-[#6b7a90]">Provide a reason for rejection</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-[#0a0e14] rounded-xl">
                  <p className="text-sm text-[#6b7a90]">User</p>
                  <p className="text-white font-medium">{selectedSubmission.user.name}</p>
                  <p className="text-sm text-[#6b7a90]">{selectedSubmission.user.email}</p>
                </div>

                <div>
                  <label className="block text-sm text-[#6b7a90] mb-2">Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Document image unclear, please resubmit with better quality photos..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                    className="flex-1 py-3 bg-[#1e2733] text-white rounded-lg font-medium hover:bg-[#2a3744] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processingId === selectedSubmission._id}
                    className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingId === selectedSubmission._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Fullscreen Modal */}
      <AnimatePresence>
        {imageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
            onClick={() => setImageModal(null)}
          >
            <button 
              onClick={() => setImageModal(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative w-full max-w-4xl max-h-[90vh]">
              <Image
                src={imageModal}
                alt="Document"
                width={1200}
                height={800}
                className="object-contain w-full h-full rounded-lg"
                unoptimized
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl min-w-[250px]',
                toast.type === 'success' && 'bg-[#22c55e] text-white',
                toast.type === 'error' && 'bg-red-500 text-white'
              )}
            >
              {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
