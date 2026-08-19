'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, QrCode, AlertCircle, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';

// ============================================
// Crypto Deposit Modal
// ============================================

interface CryptoDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCrypto?: string;
}

const cryptoOptions = [
  { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin', confirmations: 3, minDeposit: 0.0001 },
  { symbol: 'ETH', name: 'Ethereum', network: 'ERC-20', confirmations: 12, minDeposit: 0.01 },
  { symbol: 'USDT', name: 'Tether', network: 'ERC-20', confirmations: 12, minDeposit: 10 },
  { symbol: 'USDC', name: 'USD Coin', network: 'ERC-20', confirmations: 12, minDeposit: 10 },
  { symbol: 'SOL', name: 'Solana', network: 'Solana', confirmations: 32, minDeposit: 0.1 },
];

// Mock wallet addresses
const walletAddresses: Record<string, string> = {
  BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bE21',
  USDT: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bE21',
  USDC: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bE21',
  SOL: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
};

export const CryptoDepositModal: React.FC<CryptoDepositModalProps> = ({
  isOpen,
  onClose,
  selectedCrypto = 'BTC',
}) => {
  const [selected, setSelected] = useState(selectedCrypto);
  const [copied, setCopied] = useState(false);

  const crypto = cryptoOptions.find((c) => c.symbol === selected) || cryptoOptions[0];
  const address = walletAddresses[selected];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deposit Cryptocurrency" size="lg">
      <div className="space-y-6">
        {/* Crypto Selection */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Select Cryptocurrency
          </label>
          <div className="grid grid-cols-5 gap-2">
            {cryptoOptions.map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => setSelected(crypto.symbol)}
                className={cn(
                  'p-3 rounded-lg border text-center transition-all',
                  selected === crypto.symbol
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-light)]'
                )}
              >
                <div className="h-8 w-8 mx-auto mb-1 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center">
                  <span className="text-xs font-bold text-[var(--color-primary)]">
                    {crypto.symbol.slice(0, 2)}
                  </span>
                </div>
                <p className="text-xs font-medium text-[var(--color-text-primary)]">
                  {crypto.symbol}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Network Info */}
        <div className="p-4 bg-[var(--color-surface-elevated)] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-muted)]">Network</span>
            <Badge variant="info">{crypto.network}</Badge>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-muted)]">Confirmations Required</span>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {crypto.confirmations}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-muted)]">Minimum Deposit</span>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {crypto.minDeposit} {crypto.symbol}
            </span>
          </div>
        </div>

        {/* QR Code and Address */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-40 w-40 bg-white rounded-xl mb-4">
            <QrCode className="h-32 w-32 text-gray-800" />
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-2">
            Scan QR code or copy address below
          </p>
        </div>

        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            {crypto.name} Deposit Address
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg">
              <p className="text-sm font-mono text-[var(--color-text-primary)] break-all">
                {address}
              </p>
            </div>
            <Button
              onClick={handleCopy}
              leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/20 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-[var(--color-warning)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--color-warning)]">Important</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Only send {crypto.symbol} to this address on the {crypto.network} network. 
                Sending any other cryptocurrency may result in permanent loss.
              </p>
            </div>
          </div>
        </div>

        {/* Processing Time */}
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Clock className="h-4 w-4" />
          <span>Deposits typically arrive within 10-60 minutes</span>
        </div>
      </div>
    </Modal>
  );
};

export default CryptoDepositModal;
