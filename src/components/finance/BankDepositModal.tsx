'use client';

import React, { useState } from 'react';
import { Copy, Check, Building2, Clock, AlertCircle, Shield } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';

// ============================================
// Bank Deposit Modal
// ============================================

interface BankDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const bankDetails = {
  bankName: 'RFM TradePro Trust',
  accountName: 'RFM TradePro LLC',
  accountNumber: '8847562901',
  routingNumber: '021000021',
  swiftCode: 'EPCBUS33',
  bankAddress: '123 Financial District, New York, NY 10004',
  reference: 'EPC-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
};

export const BankDepositModal: React.FC<BankDepositModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (field: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ field, value }: { field: string; value: string }) => (
    <button
      onClick={() => handleCopy(field, value)}
      className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-md transition-colors"
    >
      {copiedField === field ? (
        <Check className="h-4 w-4 text-[var(--color-success)]" />
      ) : (
        <Copy className="h-4 w-4 text-[var(--color-text-muted)]" />
      )}
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bank Wire Transfer" size="lg">
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="p-4 bg-[var(--color-info-bg)] border border-[var(--color-info)]/20 rounded-lg">
          <div className="flex gap-3">
            <Building2 className="h-5 w-5 text-[var(--color-info)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--color-info)]">
                Wire Transfer Instructions
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Use the bank details below to initiate a wire transfer from your bank. 
                Make sure to include your unique reference number.
              </p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">
            Bank Information
          </h4>
          
          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-lg space-y-4">
            {/* Bank Name */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Bank Name</p>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {bankDetails.bankName}
                </p>
              </div>
              <CopyButton field="bankName" value={bankDetails.bankName} />
            </div>

            {/* Account Name */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Account Name</p>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {bankDetails.accountName}
                </p>
              </div>
              <CopyButton field="accountName" value={bankDetails.accountName} />
            </div>

            {/* Account Number */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Account Number</p>
                <p className="text-sm font-mono font-medium text-[var(--color-text-primary)]">
                  {bankDetails.accountNumber}
                </p>
              </div>
              <CopyButton field="accountNumber" value={bankDetails.accountNumber} />
            </div>

            {/* Routing Number */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Routing Number (ABA)</p>
                <p className="text-sm font-mono font-medium text-[var(--color-text-primary)]">
                  {bankDetails.routingNumber}
                </p>
              </div>
              <CopyButton field="routingNumber" value={bankDetails.routingNumber} />
            </div>

            {/* SWIFT Code */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">SWIFT/BIC Code</p>
                <p className="text-sm font-mono font-medium text-[var(--color-text-primary)]">
                  {bankDetails.swiftCode}
                </p>
              </div>
              <CopyButton field="swiftCode" value={bankDetails.swiftCode} />
            </div>

            {/* Bank Address */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Bank Address</p>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {bankDetails.bankAddress}
                </p>
              </div>
              <CopyButton field="bankAddress" value={bankDetails.bankAddress} />
            </div>
          </div>
        </div>

        {/* Reference Number */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Your Reference Number
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-[var(--color-primary-muted)] border border-[var(--color-primary)]/30 rounded-lg">
              <p className="text-lg font-mono font-bold text-[var(--color-primary)] text-center">
                {bankDetails.reference}
              </p>
            </div>
            <Button
              onClick={() => handleCopy('reference', bankDetails.reference)}
              leftIcon={copiedField === 'reference' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copiedField === 'reference' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Include this reference in your transfer memo/description for faster processing.
          </p>
        </div>

        {/* Important Notice */}
        <div className="p-4 bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/20 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-[var(--color-warning)] shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-warning)]">Important</p>
              <ul className="text-sm text-[var(--color-text-muted)] space-y-1 list-disc list-inside">
                <li>Include your reference number in the transfer memo</li>
                <li>Wire transfers must originate from a bank account in your name</li>
                <li>Minimum deposit amount: $100</li>
                <li>No maximum deposit limit for wire transfers</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Processing Time */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[var(--color-text-muted)]" />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                Processing Time
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Domestic: 1-2 business days • International: 3-5 business days
              </p>
            </div>
          </div>
          <Badge variant="info">No Fees</Badge>
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Shield className="h-4 w-4" />
          <span>Bank-level security with FDIC insurance</span>
        </div>

        {/* Action Button */}
        <Button fullWidth size="lg" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
};

export default BankDepositModal;
