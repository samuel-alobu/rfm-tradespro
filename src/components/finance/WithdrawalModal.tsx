'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Wallet, 
  Building2, 
  Bitcoin, 
  AlertCircle, 
  Check, 
  ChevronRight,
  Clock,
  Shield
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Withdrawal Modal
// ============================================

type WithdrawalMethod = 'bank' | 'crypto' | null;

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance?: number;
}

const bankWithdrawalSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  bankName: z.string().min(2, 'Bank name is required'),
  accountNumber: z.string().min(8, 'Invalid account number'),
  routingNumber: z.string().length(9, 'Routing number must be 9 digits'),
  accountHolderName: z.string().min(2, 'Account holder name is required'),
});

const cryptoWithdrawalSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  cryptoType: z.string().min(1, 'Select cryptocurrency'),
  walletAddress: z.string().min(26, 'Invalid wallet address'),
  network: z.string().min(1, 'Select network'),
});

type BankWithdrawalData = z.infer<typeof bankWithdrawalSchema>;
type CryptoWithdrawalData = z.infer<typeof cryptoWithdrawalSchema>;

const cryptoOptions = [
  { symbol: 'BTC', name: 'Bitcoin', networks: ['Bitcoin'], fee: 0.0001 },
  { symbol: 'ETH', name: 'Ethereum', networks: ['ERC-20'], fee: 0.005 },
  { symbol: 'USDT', name: 'Tether', networks: ['ERC-20', 'TRC-20'], fee: 1 },
  { symbol: 'USDC', name: 'USD Coin', networks: ['ERC-20'], fee: 1 },
  { symbol: 'SOL', name: 'Solana', networks: ['Solana'], fee: 0.01 },
];

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  availableBalance = 89234.56,
}) => {
  const [method, setMethod] = useState<WithdrawalMethod>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoOptions[0]);

  const bankForm = useForm<BankWithdrawalData>({
    resolver: zodResolver(bankWithdrawalSchema),
  });

  const cryptoForm = useForm<CryptoWithdrawalData>({
    resolver: zodResolver(cryptoWithdrawalSchema),
    defaultValues: {
      cryptoType: 'BTC',
      network: 'Bitcoin',
    },
  });

  const handleBack = () => {
    setMethod(null);
    bankForm.reset();
    cryptoForm.reset();
  };

  const handleClose = () => {
    setMethod(null);
    setSuccess(false);
    bankForm.reset();
    cryptoForm.reset();
    onClose();
  };

  const onBankSubmit = async (data: BankWithdrawalData) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setSuccess(true);
  };

  const onCryptoSubmit = async (data: CryptoWithdrawalData) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setSuccess(true);
  };

  // Success State
  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Withdrawal Submitted" size="md">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-success-bg)] mb-4">
            <Check className="h-8 w-8 text-[var(--color-success)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Withdrawal Request Submitted
          </h3>
          <p className="text-[var(--color-text-muted)] mb-4">
            Your withdrawal request has been submitted for processing.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Clock className="h-4 w-4" />
            <span>Processing time: {method === 'bank' ? '1-3 business days' : '10-60 minutes'}</span>
          </div>
        </div>
      </Modal>
    );
  }

  // Method Selection
  if (!method) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Withdraw Funds" size="md">
        <div className="space-y-4">
          {/* Available Balance */}
          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-lg text-center">
            <p className="text-sm text-[var(--color-text-muted)]">Available Balance</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {formatCurrency(availableBalance)}
            </p>
          </div>

          {/* Method Options */}
          <div className="space-y-3">
            <button
              onClick={() => setMethod('bank')}
              className="w-full flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[var(--color-info-bg)] flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-[var(--color-info)]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[var(--color-text-primary)]">Bank Transfer</p>
                  <p className="text-sm text-[var(--color-text-muted)]">1-3 business days • No fees</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
            </button>

            <button
              onClick={() => setMethod('crypto')}
              className="w-full flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[var(--color-warning-bg)] flex items-center justify-center">
                  <Bitcoin className="h-6 w-6 text-[var(--color-warning)]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[var(--color-text-primary)]">Cryptocurrency</p>
                  <p className="text-sm text-[var(--color-text-muted)]">10-60 minutes • Network fees apply</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
            </button>
          </div>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Shield className="h-4 w-4" />
            <span>Withdrawals are protected by 2FA verification</span>
          </div>
        </div>
      </Modal>
    );
  }

  // Bank Withdrawal Form
  if (method === 'bank') {
    const amount = parseFloat(bankForm.watch('amount')) || 0;

    return (
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose} 
        title="Bank Withdrawal"
        size="lg"
      >
        <form onSubmit={bankForm.handleSubmit(onBankSubmit)} className="space-y-6">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            ← Back to methods
          </button>

          {/* Amount */}
          <div>
            <Input
              label="Amount (USD)"
              type="number"
              placeholder="Enter amount"
              leftIcon={<span className="text-[var(--color-text-muted)]">$</span>}
              error={bankForm.formState.errors.amount?.message}
              {...bankForm.register('amount', {
                validate: (value) => {
                  const num = parseFloat(value);
                  if (num < 100) return 'Minimum withdrawal is $100';
                  if (num > availableBalance) return 'Insufficient balance';
                  return true;
                },
              })}
            />
            <div className="flex justify-between mt-1 text-xs text-[var(--color-text-muted)]">
              <span>Min: $100</span>
              <button
                type="button"
                onClick={() => bankForm.setValue('amount', availableBalance.toString())}
                className="text-[var(--color-primary)] hover:underline"
              >
                Withdraw Max
              </button>
            </div>
          </div>

          {/* Bank Name */}
          <Input
            label="Bank Name"
            placeholder="e.g., Chase, Bank of America"
            error={bankForm.formState.errors.bankName?.message}
            {...bankForm.register('bankName')}
          />

          {/* Account Details */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Account Number"
              placeholder="Enter account number"
              error={bankForm.formState.errors.accountNumber?.message}
              {...bankForm.register('accountNumber')}
            />
            <Input
              label="Routing Number"
              placeholder="9 digits"
              maxLength={9}
              error={bankForm.formState.errors.routingNumber?.message}
              {...bankForm.register('routingNumber')}
            />
          </div>

          {/* Account Holder */}
          <Input
            label="Account Holder Name"
            placeholder="Name on bank account"
            error={bankForm.formState.errors.accountHolderName?.message}
            {...bankForm.register('accountHolderName')}
          />

          {/* Summary */}
          {amount >= 100 && (
            <div className="p-4 bg-[var(--color-surface-elevated)] rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">Amount</span>
                <span className="text-[var(--color-text-primary)]">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">Fee</span>
                <span className="text-[var(--color-success)]">Free</span>
              </div>
              <div className="pt-2 border-t border-[var(--color-border)] flex justify-between">
                <span className="font-medium text-[var(--color-text-primary)]">You&apos;ll receive</span>
                <span className="font-bold text-[var(--color-text-primary)]">{formatCurrency(amount)}</span>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="p-3 bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/20 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-[var(--color-warning)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--color-text-muted)]">
                Bank account must be in your name. Processing takes 1-3 business days.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
            disabled={amount < 100 || amount > availableBalance}
          >
            Withdraw {amount >= 100 ? formatCurrency(amount) : ''}
          </Button>
        </form>
      </Modal>
    );
  }

  // Crypto Withdrawal Form
  if (method === 'crypto') {
    const amount = parseFloat(cryptoForm.watch('amount')) || 0;

    return (
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose} 
        title="Crypto Withdrawal"
        size="lg"
      >
        <form onSubmit={cryptoForm.handleSubmit(onCryptoSubmit)} className="space-y-6">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            ← Back to methods
          </button>

          {/* Crypto Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Select Cryptocurrency
            </label>
            <div className="grid grid-cols-5 gap-2">
              {cryptoOptions.map((crypto) => (
                <button
                  key={crypto.symbol}
                  type="button"
                  onClick={() => {
                    setSelectedCrypto(crypto);
                    cryptoForm.setValue('cryptoType', crypto.symbol);
                    cryptoForm.setValue('network', crypto.networks[0]);
                  }}
                  className={cn(
                    'p-3 rounded-lg border text-center transition-all',
                    selectedCrypto.symbol === crypto.symbol
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-light)]'
                  )}
                >
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {crypto.symbol}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Network Selection */}
          {selectedCrypto.networks.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Network
              </label>
              <div className="flex gap-2">
                {selectedCrypto.networks.map((network) => (
                  <button
                    key={network}
                    type="button"
                    onClick={() => cryptoForm.setValue('network', network)}
                    className={cn(
                      'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                      cryptoForm.watch('network') === network
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-light)]'
                    )}
                  >
                    {network}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <Input
              label="Amount (USD)"
              type="number"
              placeholder="Enter amount"
              leftIcon={<span className="text-[var(--color-text-muted)]">$</span>}
              error={cryptoForm.formState.errors.amount?.message}
              {...cryptoForm.register('amount', {
                validate: (value) => {
                  const num = parseFloat(value);
                  if (num < 10) return 'Minimum withdrawal is $10';
                  if (num > availableBalance) return 'Insufficient balance';
                  return true;
                },
              })}
            />
            <div className="flex justify-between mt-1 text-xs text-[var(--color-text-muted)]">
              <span>Min: $10</span>
              <button
                type="button"
                onClick={() => cryptoForm.setValue('amount', availableBalance.toString())}
                className="text-[var(--color-primary)] hover:underline"
              >
                Withdraw Max
              </button>
            </div>
          </div>

          {/* Wallet Address */}
          <Input
            label={`${selectedCrypto.name} Wallet Address`}
            placeholder={`Enter your ${selectedCrypto.symbol} address`}
            error={cryptoForm.formState.errors.walletAddress?.message}
            {...cryptoForm.register('walletAddress')}
          />

          {/* Summary */}
          {amount >= 10 && (
            <div className="p-4 bg-[var(--color-surface-elevated)] rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">Amount</span>
                <span className="text-[var(--color-text-primary)]">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">Network Fee</span>
                <span className="text-[var(--color-text-primary)]">
                  ~{selectedCrypto.fee} {selectedCrypto.symbol}
                </span>
              </div>
              <div className="pt-2 border-t border-[var(--color-border)] flex justify-between">
                <span className="font-medium text-[var(--color-text-primary)]">You&apos;ll receive</span>
                <span className="font-bold text-[var(--color-text-primary)]">~{formatCurrency(amount)} in {selectedCrypto.symbol}</span>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="p-3 bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/20 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-[var(--color-warning)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--color-text-muted)]">
                Double-check your wallet address. Withdrawals to incorrect addresses cannot be recovered.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
            disabled={amount < 10 || amount > availableBalance}
          >
            Withdraw {amount >= 10 ? formatCurrency(amount) : ''}
          </Button>
        </form>
      </Modal>
    );
  }

  return null;
};

export default WithdrawalModal;
