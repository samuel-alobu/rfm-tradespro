'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Camera,
  CreditCard,
  Car,
  Building2,
  Clock,
} from 'lucide-react';
import { cn } from '@/utils';

// ============================================
// KYC Verification Panel - Slide-out from Right
// ============================================

interface KYCPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: KYCData) => void;
}

interface KYCData {
  documentType: string;
  frontImage: File | null;
  backImage: File | null;
  selfieImage: File | null;
}

type DocumentType = 'drivers_license' | 'passport' | 'national_id' | 'state_id';

const documentTypes = [
  { id: 'drivers_license', label: "Driver's License", icon: Car },
  { id: 'passport', label: 'Passport', icon: FileText },
  { id: 'national_id', label: 'National ID Card', icon: CreditCard },
  { id: 'state_id', label: 'State ID', icon: Building2 },
];

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export function KYCVerificationPanel({ isOpen, onClose, onSubmit }: KYCPanelProps) {
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<string>('unverified');
  const [isLoading, setIsLoading] = useState(true);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // Fetch current KYC status
  useEffect(() => {
    if (isOpen) {
      fetchKycStatus();
    }
  }, [isOpen]);

  const fetchKycStatus = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/user/kyc');
      const data = await res.json();
      if (res.ok) {
        setVerificationStatus(data.verificationStatus);
        if (data.verificationStatus === 'pending') {
          setIsComplete(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch KYC status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('error', 'File size must be less than 5MB');
        return;
      }
      setter(file);
    }
  };

  const handleSubmit = async () => {
    if (!documentType || !frontImage) {
      addToast('error', 'Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('frontImage', frontImage);
      if (backImage) formData.append('backImage', backImage);
      if (selfieImage) formData.append('selfieImage', selfieImage);

      const res = await fetch('/api/user/kyc', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setVerificationStatus('pending');
        setIsComplete(true);
        
        if (onSubmit) {
          onSubmit({
            documentType,
            frontImage,
            backImage,
            selfieImage,
          });
        }
      } else {
        addToast('error', data.error || 'Failed to submit documents');
      }
    } catch (error) {
      addToast('error', 'An error occurred while submitting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setDocumentType(null);
    setFrontImage(null);
    setBackImage(null);
    setSelfieImage(null);
    setIsComplete(false);
    onClose();
  };

  const canProceedStep1 = documentType !== null;
  const canProceedStep2 = frontImage !== null;
  const canSubmit = documentType && frontImage;

  // Single return with all states handled inside
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="kyc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            key="kyc-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[420px] bg-[#0f1419] border-l border-[#1e2733] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#1e2733]">
              <div className="flex items-center gap-2">
                {step > 1 && !isComplete && verificationStatus !== 'verified' && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="p-1 text-[#6b7a90] hover:text-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <span className="text-white font-medium">Identity Verification</span>
              </div>
              <button onClick={handleClose} className="p-1 text-[#6b7a90] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-[#22c55e] animate-spin" />
              </div>
            )}

            {/* Already Verified State */}
            {!isLoading && verificationStatus === 'verified' && (
              <>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="h-20 w-20 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-[#22c55e]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Account Verified</h3>
                  <p className="text-[#6b7a90]">Your identity has been successfully verified. You have full access to all platform features.</p>
                </div>
                <div className="p-4 border-t border-[#1e2733]">
                  <button onClick={handleClose} className="w-full py-3.5 bg-[#22c55e] hover:bg-[#1ea550] text-white rounded-lg font-semibold transition-colors">
                    Done
                  </button>
                </div>
              </>
            )}

            {/* Progress Bar - Only show for unverified/rejected users going through flow */}
            {!isLoading && verificationStatus !== 'verified' && !isComplete && (
              <div className="px-4 py-3 border-b border-[#1e2733]">
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex-1 flex items-center gap-2">
                      <div
                        className={cn(
                          'h-2 flex-1 rounded-full transition-colors',
                          step >= s ? 'bg-[#22c55e]' : 'bg-[#1e2733]'
                        )}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#6b7a90] mt-2">Step {step} of 3</p>
              </div>
            )}

            {/* Content */}
            {!isLoading && verificationStatus !== 'verified' && (
              <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                  {/* Step 1: Select Document Type */}
                  {step === 1 && !isComplete && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Select ID Document Type
                        </h3>
                        <p className="text-sm text-[#6b7a90]">
                          Choose a valid government-issued identification document
                        </p>
                      </div>

                      <div className="space-y-3">
                        {documentTypes.map((doc) => {
                          const Icon = doc.icon;
                          return (
                            <button
                              key={doc.id}
                              onClick={() => setDocumentType(doc.id as DocumentType)}
                              className={cn(
                                'w-full flex items-center gap-4 p-4 rounded-xl border transition-all',
                                documentType === doc.id
                                  ? 'border-[#22c55e] bg-[#22c55e]/5'
                                  : 'border-[#1e2733] hover:border-[#2a3441]'
                              )}
                            >
                              <div
                                className={cn(
                                  'h-10 w-10 rounded-full flex items-center justify-center',
                                  documentType === doc.id
                                    ? 'bg-[#22c55e]/10 text-[#22c55e]'
                                    : 'bg-[#1e2733] text-[#6b7a90]'
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <span
                                className={cn(
                                  'font-medium',
                                  documentType === doc.id ? 'text-white' : 'text-[#6b7a90]'
                                )}
                              >
                                {doc.label}
                              </span>
                              {documentType === doc.id && (
                                <CheckCircle2 className="h-5 w-5 text-[#22c55e] ml-auto" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Upload Document */}
                  {step === 2 && !isComplete && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Upload Your Document
                        </h3>
                        <p className="text-sm text-[#6b7a90]">
                          Take clear photos of the front and back of your document
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Front Image */}
                        <div>
                          <label className="block text-sm text-white mb-2">
                            Front of Document <span className="text-[#ef4444]">*</span>
                          </label>
                          <input
                            ref={frontInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, setFrontImage)}
                          />
                          <button
                            onClick={() => frontInputRef.current?.click()}
                            className={cn(
                              'w-full p-8 rounded-xl border-2 border-dashed transition-colors',
                              frontImage
                                ? 'border-[#22c55e] bg-[#22c55e]/5'
                                : 'border-[#1e2733] hover:border-[#2a3441]'
                            )}
                          >
                            {frontImage ? (
                              <div className="flex items-center justify-center gap-3">
                                <CheckCircle2 className="h-6 w-6 text-[#22c55e]" />
                                <span className="text-[#22c55e] font-medium">
                                  {frontImage.name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-[#6b7a90]" />
                                <span className="text-[#6b7a90]">Click to upload</span>
                              </div>
                            )}
                          </button>
                        </div>

                        {/* Back Image */}
                        <div>
                          <label className="block text-sm text-white mb-2">
                            Back of Document (optional)
                          </label>
                          <input
                            ref={backInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, setBackImage)}
                          />
                          <button
                            onClick={() => backInputRef.current?.click()}
                            className={cn(
                              'w-full p-8 rounded-xl border-2 border-dashed transition-colors',
                              backImage
                                ? 'border-[#22c55e] bg-[#22c55e]/5'
                                : 'border-[#1e2733] hover:border-[#2a3441]'
                            )}
                          >
                            {backImage ? (
                              <div className="flex items-center justify-center gap-3">
                                <CheckCircle2 className="h-6 w-6 text-[#22c55e]" />
                                <span className="text-[#22c55e] font-medium">
                                  {backImage.name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-[#6b7a90]" />
                                <span className="text-[#6b7a90]">Click to upload</span>
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Selfie Verification */}
                  {step === 3 && !isComplete && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Take a Selfie
                        </h3>
                        <p className="text-sm text-[#6b7a90]">
                          Take a clear selfie holding your document next to your face
                        </p>
                      </div>

                      <input
                        ref={selfieInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setSelfieImage)}
                      />
                      <button
                        onClick={() => selfieInputRef.current?.click()}
                        className={cn(
                          'w-full p-12 rounded-xl border-2 border-dashed transition-colors',
                          selfieImage
                            ? 'border-[#22c55e] bg-[#22c55e]/5'
                            : 'border-[#1e2733] hover:border-[#2a3441]'
                        )}
                      >
                        {selfieImage ? (
                          <div className="flex flex-col items-center gap-3">
                            <CheckCircle2 className="h-12 w-12 text-[#22c55e]" />
                            <span className="text-[#22c55e] font-medium">
                              Selfie uploaded
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <Camera className="h-12 w-12 text-[#6b7a90]" />
                            <span className="text-[#6b7a90]">Click to take selfie</span>
                          </div>
                        )}
                      </button>

                      <div className="p-4 bg-[#0a0e14] rounded-xl">
                        <h4 className="text-sm font-medium text-white mb-2">Tips:</h4>
                        <ul className="text-xs text-[#6b7a90] space-y-1">
                          <li>• Ensure good lighting</li>
                          <li>• Hold your document clearly visible</li>
                          <li>• Make sure your face is not covered</li>
                          <li>• Look directly at the camera</li>
                        </ul>
                      </div>
                    </motion.div>
                  )}

                  {/* Pending State */}
                  {isComplete && verificationStatus === 'pending' && (
                    <motion.div
                      key="pending"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6"
                      >
                        <Clock className="h-10 w-10 text-yellow-500" />
                      </motion.div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Verification Pending
                      </h3>
                      <p className="text-[#6b7a90] mb-6">
                        Your documents have been submitted and are under review. We&apos;ll notify you once
                        verification is complete.
                      </p>
                      <p className="text-sm text-[#6b7a90]">
                        This usually takes 1-2 business days.
                      </p>
                    </motion.div>
                  )}

                  {/* Success State (just submitted) */}
                  {isComplete && verificationStatus !== 'pending' && (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="h-20 w-20 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-6"
                      >
                        <CheckCircle2 className="h-10 w-10 text-[#22c55e]" />
                      </motion.div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Verification Submitted!
                      </h3>
                      <p className="text-[#6b7a90] mb-6">
                        Your documents have been submitted for review. We&apos;ll notify you once
                        verification is complete.
                      </p>
                      <p className="text-sm text-[#6b7a90]">
                        This usually takes 1-2 business days.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Footer */}
            {!isLoading && verificationStatus !== 'verified' && !isComplete && (
              <div className="p-4 border-t border-[#1e2733]">
                {step === 1 && (
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className={cn(
                      'w-full py-3.5 rounded-lg font-semibold transition-colors',
                      canProceedStep1
                        ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                        : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                    )}
                  >
                    Continue
                  </button>
                )}
                {step === 2 && (
                  <button
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                    className={cn(
                      'w-full py-3.5 rounded-lg font-semibold transition-colors',
                      canProceedStep2
                        ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                        : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                    )}
                  >
                    Continue
                  </button>
                )}
                {step === 3 && (
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className={cn(
                      'w-full py-3.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2',
                      canSubmit && !isSubmitting
                        ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                        : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Uploading Documents...
                      </>
                    ) : (
                      'Submit Verification'
                    )}
                  </button>
                )}
              </div>
            )}

            {!isLoading && verificationStatus !== 'verified' && isComplete && (
              <div className="p-4 border-t border-[#1e2733]">
                <button
                  onClick={handleClose}
                  className="w-full py-3.5 bg-[#22c55e] hover:bg-[#1ea550] text-white rounded-lg font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            )}

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
                      toast.type === 'error' && 'bg-[#ef4444] text-white'
                    )}
                  >
                    {toast.type === 'success' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <span className="text-sm font-medium">{toast.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default KYCVerificationPanel;
