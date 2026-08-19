'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Lock, AlertCircle, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Card Deposit Modal
// ============================================

const cardDepositSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 10,
    'Minimum deposit is $10'
  ).refine(
    (val) => !isNaN(Number(val)) && Number(val) <= 10000,
    'Maximum deposit is $10,000'
  ),
  cardNumber: z.string()
    .min(16, 'Invalid card number')
    .max(19, 'Invalid card number')
    .refine((val) => /^[\d\s]+$/.test(val), 'Invalid card number'),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Invalid expiry date (MM/YY)'),
  cvv: z.string()
    .min(3, 'Invalid CVV')
    .max(4, 'Invalid CVV')
    .regex(/^\d+$/, 'Invalid CVV'),
  cardholderName: z.string().min(2, 'Cardholder name is required'),
});

type CardDepositFormData = z.infer<typeof cardDepositSchema>;

interface CardDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEE_PERCENTAGE = 2.5;

export const CardDepositModal: React.FC<CardDepositModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CardDepositFormData>({
    resolver: zodResolver(cardDepositSchema),
    defaultValues: {
      amount: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
    },
  });

  const amount = watch('amount');
  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * (FEE_PERCENTAGE / 100);
  const total = amountNum + fee;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const onSubmit = async (data: CardDepositFormData) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setSuccess(true);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setSuccess(false);
      reset();
      onClose();
    }, 3000);
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Deposit Successful" size="md">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-success-bg)] mb-4">
            <Check className="h-8 w-8 text-[var(--color-success)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Deposit Successful!
          </h3>
          <p className="text-[var(--color-text-muted)] mb-4">
            {formatCurrency(amountNum)} has been added to your account.
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Your funds are now available for trading.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deposit with Card" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount */}
        <div>
          <Input
            label="Amount (USD)"
            type="number"
            placeholder="Enter amount"
            leftIcon={<span className="text-[var(--color-text-muted)]">$</span>}
            error={errors.amount?.message}
            {...register('amount')}
          />
          <div className="flex gap-2 mt-2">
            {['100', '250', '500', '1000'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  const input = document.querySelector('input[name="amount"]') as HTMLInputElement;
                  if (input) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }}
                className="flex-1 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
              >
                ${value}
              </button>
            ))}
          </div>
        </div>

        {/* Card Number */}
        <Input
          label="Card Number"
          placeholder="1234 5678 9012 3456"
          leftIcon={<CreditCard className="h-4 w-4" />}
          error={errors.cardNumber?.message}
          {...register('cardNumber', {
            onChange: (e) => {
              e.target.value = formatCardNumber(e.target.value);
            },
          })}
          maxLength={19}
        />

        {/* Expiry and CVV */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Expiry Date"
            placeholder="MM/YY"
            error={errors.expiryDate?.message}
            {...register('expiryDate', {
              onChange: (e) => {
                e.target.value = formatExpiryDate(e.target.value);
              },
            })}
            maxLength={5}
          />
          <Input
            label="CVV"
            type="password"
            placeholder="•••"
            leftIcon={<Lock className="h-4 w-4" />}
            error={errors.cvv?.message}
            {...register('cvv')}
            maxLength={4}
          />
        </div>

        {/* Cardholder Name */}
        <Input
          label="Cardholder Name"
          placeholder="John Doe"
          error={errors.cardholderName?.message}
          {...register('cardholderName')}
        />

        {/* Fee Summary */}
        {amountNum > 0 && (
          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Amount</span>
              <span className="text-[var(--color-text-primary)]">{formatCurrency(amountNum)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Processing Fee ({FEE_PERCENTAGE}%)</span>
              <span className="text-[var(--color-text-primary)]">{formatCurrency(fee)}</span>
            </div>
            <div className="pt-2 border-t border-[var(--color-border)] flex justify-between">
              <span className="font-medium text-[var(--color-text-primary)]">Total</span>
              <span className="font-bold text-[var(--color-text-primary)]">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Lock className="h-4 w-4" />
          <span>Your payment is secured with 256-bit SSL encryption</span>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          disabled={amountNum < 10}
        >
          Deposit {amountNum > 0 ? formatCurrency(amountNum) : ''}
        </Button>
      </form>
    </Modal>
  );
};

export default CardDepositModal;
