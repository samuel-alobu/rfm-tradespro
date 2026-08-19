'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, AlertTriangle, Wallet, TrendingUp, X } from 'lucide-react';
import { cn, formatCurrency, formatPercentage } from '@/utils';
import { useLanguage } from '@/lib/i18n';
import { Property } from './PropertyCard';

// ============================================
// Invest Modal Component
// ============================================

interface InvestModalProps {
  property: Property | null;
  isOpen?: boolean;
  onClose: () => void;
  onConfirm?: (propertyId: string, amount: number) => void;
  availableBalance?: number;
  userBalance?: number;
  isProcessing?: boolean;
}

const investSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be greater than 0'
  ),
});

type InvestFormData = z.infer<typeof investSchema>;

export const InvestModal: React.FC<InvestModalProps> = ({
  property,
  isOpen = true,
  onClose,
  onConfirm,
  availableBalance,
  userBalance,
  isProcessing = false,
}) => {
  // Use userBalance if provided, otherwise fall back to availableBalance
  const { t } = useLanguage();
  const balance = userBalance ?? availableBalance ?? 0;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InvestFormData>({
    resolver: zodResolver(investSchema),
    defaultValues: {
      amount: (property?.minInvestment || property?.minimum || 0).toString(),
    },
  });

  const amount = parseFloat(watch('amount')) || 0;
  const minInvestment = property?.minInvestment || property?.minimum || 0;

  const handleClose = () => {
    setSuccess(false);
    setAgreedToTerms(false);
    reset();
    onClose();
  };

  const onSubmit = async (data: InvestFormData) => {
    if (!property || !agreedToTerms) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    onConfirm?.(property.id || property._id || '', parseFloat(data.amount));
    setIsSubmitting(false);
    setSuccess(true);

    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  if (!property || !isOpen) return null;

  const projectedReturn = amount * (property.roi / 100);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-lg bg-[#0a0e14] border border-[#1e2733] rounded-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#1e2733]">
            <h2 className="font-heading font-semibold text-white text-lg">
              {success ? t.realEstateSection.success : t.realEstateSection.investInProperty}
            </h2>
            <button
              onClick={handleClose}
              className="text-[#6b7a90] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {success ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#22c55e]/10 mb-4">
                  <Check className="h-8 w-8 text-[#22c55e]" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white mb-2">
                  {t.realEstateSection.investmentSuccessful}
                </h3>
                <p className="text-[#8b9ab4]">
                  {t.realEstateSection.youHaveInvested} {formatCurrency(amount)} - {property.name}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Property Info */}
                <div className="flex items-start gap-4 p-4 bg-[#0c1320] rounded-xl">
                  <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 relative">
                    <Image
                      src={property.images?.[0] || property.image || '/images/placeholder-property.jpg'}
                      alt={property.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {property.name}
                    </h3>
                    <p className="text-sm text-[#8b9ab4] truncate">
                      {property.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium rounded">
                        {formatPercentage(property.roi)} ROI
                      </span>
                      <span className="text-sm text-white">
                        {property.strategy}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Available Balance */}
                <div className="flex items-center justify-between p-3 bg-[#0c1320] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[#6b7a90]" />
                    <span className="text-sm text-[#6b7a90]">{t.realEstateSection.realEstateBalance}</span>
                  </div>
                  <span className="font-semibold text-white">
                    {formatCurrency(balance)}
                  </span>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm text-[#6b7a90] mb-2">
                    {t.realEstateSection.investmentAmountUsd}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7a90]">$</span>
                    <input
                      type="number"
                      {...register('amount')}
                      className="w-full pl-8 pr-4 py-3 bg-[#0c1320] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
                      placeholder={t.realEstateSection.enterAmount}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-[#ef4444] text-sm mt-1">{errors.amount.message}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {[minInvestment, minInvestment * 2, minInvestment * 5].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setValue('amount', amt.toString())}
                        className="flex-1 py-2 text-xs font-medium text-[#6b7a90] hover:text-white bg-[#0c1320] hover:bg-[#1a2332] border border-[#1e2733] rounded-lg transition-colors"
                      >
                        {formatCurrency(amt)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[#6b7a90] mt-2">
                    {t.realEstateSection.minimumInvestment} {formatCurrency(minInvestment)}
                  </p>
                </div>

                {/* Projected Returns */}
                {amount >= minInvestment && (
                  <div className="p-4 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-[#22c55e]" />
                      <h4 className="font-medium text-white">{t.realEstateSection.projectedReturns}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#6b7a90]">{t.realEstateSection.investment}</p>
                        <p className="font-semibold text-white">{formatCurrency(amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#6b7a90]">Est. Return ({property.roi}%)</p>
                        <p className="font-semibold text-[#22c55e]">+{formatCurrency(projectedReturn)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms Agreement */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#1e2733] text-[#22c55e] focus:ring-[#22c55e] bg-[#0c1320]"
                  />
                  <span className="text-sm text-[#8b9ab4]">
                    {t.realEstateSection.termsAgreement}
                  </span>
                </label>

                {/* Risk Warning */}
                <div className="p-4 bg-[#eab308]/10 border border-[#eab308]/20 rounded-xl">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-[#eab308] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#eab308]">
                        {t.realEstateSection.riskWarningTitle}
                      </p>
                      <p className="text-sm text-[#8b9ab4] mt-1">
                        {t.realEstateSection.riskWarningText}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 px-4 rounded-lg border border-[#2a3441] text-white text-sm font-medium hover:bg-[#1a2332] transition-colors"
                  >
                    {t.realEstateSection.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={amount < minInvestment || amount > balance || !agreedToTerms || isSubmitting || isProcessing}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-lg text-white text-sm font-medium transition-colors',
                      amount >= minInvestment && amount <= balance && agreedToTerms && !isSubmitting && !isProcessing
                        ? 'bg-[#22c55e] hover:bg-[#1ea550]'
                        : 'bg-[#1a2332] text-[#6b7a90] cursor-not-allowed'
                    )}
                  >
                    {isSubmitting || isProcessing ? t.realEstateSection.processing : t.realEstateSection.confirmInvestment}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default InvestModal;
