'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Diamond, Star, Crown, CheckCircle2, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Account Upgrade Modal with Loading Animation
// ============================================

interface AccountLevel {
  id: string;
  name: string;
  icon: React.ReactNode;
  iconColor: string;
  percentage: string;
  maxBalance: number;
  features: string[];
  isCurrentLevel?: boolean;
}

const accountLevels: AccountLevel[] = [
  {
    id: 'starter',
    name: 'Starter',
    icon: <Diamond className="h-4 w-4" />,
    iconColor: 'text-[#6b7a90]',
    percentage: '1%',
    maxBalance: 150000,
    features: ['Basic trading features', 'Email support', 'Standard withdrawal limits'],
    isCurrentLevel: true,
  },
  {
    id: 'bronze',
    name: 'Bronze',
    icon: <Diamond className="h-4 w-4" />,
    iconColor: 'text-[#cd7f32]',
    percentage: '2%',
    maxBalance: 300000,
    features: ['All Starter features', 'Priority support', 'Higher withdrawal limits', 'Advanced charts'],
  },
  {
    id: 'silver',
    name: 'Silver',
    icon: <Star className="h-4 w-4" />,
    iconColor: 'text-[#c0c0c0]',
    percentage: '3%',
    maxBalance: 500000,
    features: ['All Bronze features', 'Dedicated account manager', 'Premium signals', 'Lower trading fees'],
  },
  {
    id: 'gold',
    name: 'Gold',
    icon: <Star className="h-4 w-4" />,
    iconColor: 'text-[#ffd700]',
    percentage: '4%',
    maxBalance: 1000000,
    features: ['All Silver features', 'VIP trading tools', 'Exclusive market insights', 'Zero withdrawal fees'],
  },
  {
    id: 'vip',
    name: 'VIP',
    icon: <Crown className="h-4 w-4" />,
    iconColor: 'text-[#e91e63]',
    percentage: '5%',
    maxBalance: 10000000,
    features: ['All Gold features', 'Personal trading advisor', 'Custom trading limits', 'Exclusive events access'],
  },
];

interface AccountUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: string;
  onRequestUpgrade: (levelId: string) => void;
}

export function AccountUpgradeModal({ 
  isOpen, 
  onClose, 
  currentLevel, 
  onRequestUpgrade 
}: AccountUpgradeModalProps) {
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const toggleLevel = (levelId: string) => {
    if (levelId === currentLevel) return;
    setExpandedLevel(expandedLevel === levelId ? null : levelId);
    setSelectedLevel(levelId);
  };

  const handleRequestUpgrade = async () => {
    if (!selectedLevel) return;
    
    setIsSubmitting(true);
    
    // Simulate API call with nice loading
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    // Call the callback
    onRequestUpgrade(selectedLevel);
    
    // Close after showing success
    setTimeout(() => {
      setIsSuccess(false);
      setSelectedLevel(null);
      setExpandedLevel(null);
      onClose();
    }, 2500);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedLevel(null);
    setExpandedLevel(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-[#0f1419] rounded-xl border border-[#1e2733] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Success State */}
              <AnimatePresence>
                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0f1419] z-10 flex flex-col items-center justify-center p-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1, damping: 15 }}
                      className="h-20 w-20 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-6"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.3, damping: 15 }}
                      >
                        <CheckCircle2 className="h-10 w-10 text-[#22c55e]" />
                      </motion.div>
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl font-semibold text-white mb-2"
                    >
                      Upgrade Requested!
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-[#6b7a90] text-center"
                    >
                      Your upgrade request has been submitted. Our team will review and process it shortly.
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                <h2 className="text-xl font-semibold text-white">Account upgrade</h2>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-1 text-[#6b7a90] hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-[#6b7a90] mb-6">
                  Upgrade your account now to enjoy premium perks, increased maximum balance, and additional features
                </p>

                <p className="text-sm text-[#6b7a90] mb-3">Levels</p>

                <div className="space-y-2">
                  {accountLevels.map((level) => {
                    const isCurrentLevel = level.id === currentLevel;
                    const isExpanded = expandedLevel === level.id;
                    const isSelected = selectedLevel === level.id;

                    return (
                      <div
                        key={level.id}
                        className={cn(
                          'rounded-lg border transition-all overflow-hidden',
                          isCurrentLevel
                            ? 'border-[#22c55e] bg-[#22c55e]/5'
                            : isSelected || isExpanded
                            ? 'border-[#22c55e] bg-[#0a0e14]'
                            : 'border-[#1e2733] bg-[#0a0e14]'
                        )}
                      >
                        <button
                          onClick={() => toggleLevel(level.id)}
                          disabled={isCurrentLevel || isSubmitting}
                          className={cn(
                            'w-full flex items-center justify-between p-4',
                            !isCurrentLevel && !isSubmitting && 'cursor-pointer hover:bg-[#151c24]'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={level.iconColor}>{level.icon}</span>
                            <span className="text-white font-medium">{level.name}</span>
                            {isCurrentLevel && (
                              <span className="px-2 py-0.5 text-xs bg-[#22c55e]/20 text-[#22c55e] rounded">
                                Your current level
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white">{level.percentage}</span>
                            {!isCurrentLevel && (
                              isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-[#6b7a90]" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-[#6b7a90]" />
                              )
                            )}
                          </div>
                        </button>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {(isExpanded || isCurrentLevel) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4">
                                <div className="flex items-center justify-between py-2 border-t border-[#1e2733]">
                                  <span className="text-sm text-[#6b7a90]">Maximum account balance</span>
                                  <span className="text-white font-medium">{formatCurrency(level.maxBalance)}</span>
                                </div>
                                {isExpanded && (
                                  <div className="mt-2">
                                    <p className="text-xs text-[#6b7a90] mb-2">Features:</p>
                                    <ul className="text-xs text-[#6b7a90] space-y-1">
                                      {level.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                          <span className="h-1 w-1 rounded-full bg-[#22c55e]" />
                                          {feature}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* Request Upgrade Button */}
                <button
                  onClick={handleRequestUpgrade}
                  disabled={!selectedLevel || selectedLevel === currentLevel || isSubmitting}
                  className={cn(
                    'w-full mt-6 py-3.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
                    selectedLevel && selectedLevel !== currentLevel && !isSubmitting
                      ? 'bg-[#22c55e] hover:bg-[#1ea550] text-white'
                      : 'bg-[#1e2733] text-[#6b7a90] cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="h-5 w-5" />
                      </motion.div>
                      <span>Processing request...</span>
                    </>
                  ) : (
                    'Request upgrade'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AccountUpgradeModal;
