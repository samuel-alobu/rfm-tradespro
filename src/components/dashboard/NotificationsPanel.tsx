'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, Trash2, Bell } from 'lucide-react';
import { cn } from '@/utils';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Notifications Panel - Slide-out from Right
// ============================================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onDeleteAll: () => void;
  onMarkAsRead: (id: string) => void;
}

// Title mapping: English DB title -> translation key
const TITLE_KEY_MAP: Record<string, string> = {
  'Deposit Approved': 'depositApproved',
  'Deposit Declined': 'depositDeclined',
  'Deposit Submitted': 'depositSubmitted',
  'Withdrawal Approved': 'withdrawalApproved',
  'Withdrawal Declined': 'withdrawalDeclined',
  'Withdrawal Submitted': 'withdrawalSubmitted',
  'Wallet Approved': 'walletApproved',
  'Wallet Rejected': 'walletRejected',
  'Wallet Import Pending': 'walletImportPending',
  'Verification Approved': 'verificationApproved',
  'Verification Rejected': 'verificationRejected',
  'Verification Submitted': 'verificationSubmitted',
  'Referral Approved': 'referralApproved',
  'Referral Withdrawal': 'referralWithdrawal',
  'Subscription Completed': 'subscriptionCompleted',
  'Plan Subscription': 'planSubscription',
  'Trading Withdrawal Complete': 'tradingWithdrawalComplete',
  'Cold Storage Deposit': 'coldStorageDeposit',
  'Cold Storage Withdrawal': 'coldStorageWithdrawal',
  'Stock Purchase': 'stockPurchase',
  'Stock Withdrawal': 'stockWithdrawal',
  'Real Estate Deposit': 'realEstateDeposit',
  'Real Estate Withdrawal': 'realEstateWithdrawal',
  'Signal Deposit': 'signalDeposit',
  'Signal Withdrawal': 'signalWithdrawal',
  'Signal Purchase': 'signalPurchase',
  'Subscribe Deposit': 'subscribeDeposit',
  'Subscribe Withdrawal': 'subscribeWithdrawal',
  'Copy Trading Closed': 'copyTradingClosed',
  'Copy Trading Stopped': 'copyTradingStopped',
  'Investment Released': 'investmentReleased',
  'Investment Successful': 'investmentSuccessful',
  'Stake Released': 'stakeReleased',
  'Stake Cancelled': 'stakeCancelled',
  'Stake Created': 'stakeCreated',
  'Crypto Swap': 'cryptoSwap',
  'Signal Purchased': 'signalPurchased',
  'Password Changed': 'passwordChanged',
  'Trading Account Funded': 'tradingAccountFunded',
  'Position Opened': 'positionOpened',
  'Position Closed': 'positionClosed',
};

// Message pattern matchers
interface MessagePattern {
  regex: RegExp;
  templateKey: string;
  extractParams: (match: RegExpMatchArray) => Record<string, string>;
}

const MESSAGE_PATTERNS: MessagePattern[] = [
  { regex: /^Your deposit of (\$[\d,]+(?:\.\d+)?) has been approved/, templateKey: 'msgDepositApproved', extractParams: (m) => ({ amount: m[1] }) },
  { regex: /^Your deposit of (\$[\d,]+(?:\.\d+)?) was declined\.\s*(.*)/, templateKey: 'msgDepositDeclined', extractParams: (m) => ({ amount: m[1], reason: m[2] || '' }) },
  { regex: /^Your deposit of (\$[\d,]+(?:\.\d+)?) \(([^ ]+) ([A-Z]+)\) is pending/, templateKey: 'msgDepositSubmitted', extractParams: (m) => ({ amount: m[1], tokenAmount: m[2], symbol: m[3] }) },
  { regex: /^Your withdrawal of (\$[\d,]+(?:\.\d+)?) \(([^ ]+) ([A-Z]+)\) has been approved/, templateKey: 'msgWithdrawalApproved', extractParams: (m) => ({ amount: m[1], tokenAmount: m[2], symbol: m[3] }) },
  { regex: /^Your withdrawal of (\$[\d,]+(?:\.\d+)?) \(([A-Z]+)\) was declined\.\s*(.*)/, templateKey: 'msgWithdrawalDeclined', extractParams: (m) => ({ amount: m[1], symbol: m[2], reason: m[3] || '' }) },
  { regex: /^Your withdrawal of (\$[\d,]+(?:\.\d+)?) \(([A-Z]+)\) via (.+) is pending/, templateKey: 'msgWithdrawalSubmitted', extractParams: (m) => ({ amount: m[1], symbol: m[2], method: m[3] }) },
  { regex: /^Your (.+) wallet has been approved with (\$[\d,.]+) in assets/, templateKey: 'msgWalletApprovedWithBalance', extractParams: (m) => ({ wallet: m[1], balance: m[2] }) },
  { regex: /^Your (.+) wallet has been approved/, templateKey: 'msgWalletApproved', extractParams: (m) => ({ wallet: m[1] }) },
  { regex: /^Your (.+) wallet import was rejected\.\s*Reason:\s*(.+)/, templateKey: 'msgWalletRejectedReason', extractParams: (m) => ({ wallet: m[1], reason: m[2] }) },
  { regex: /^Your (.+) wallet import was rejected/, templateKey: 'msgWalletRejected', extractParams: (m) => ({ wallet: m[1] }) },
  { regex: /^Your (.+) wallet is being verified/, templateKey: 'msgWalletPending', extractParams: (m) => ({ wallet: m[1] }) },
  { regex: /^Congratulations! Your identity verification has been approved/, templateKey: 'msgVerificationApproved', extractParams: () => ({}) },
  { regex: /^Your identity verification was not approved/, templateKey: 'msgVerificationRejected', extractParams: () => ({}) },
  { regex: /^Your identity verification documents have been submitted/, templateKey: 'msgVerificationSubmitted', extractParams: () => ({}) },
  { regex: /^Your referral of (.+) has been approved! (\$[\d,.]+)/, templateKey: 'msgReferralApproved', extractParams: (m) => ({ name: m[1], amount: m[2] }) },
  { regex: /^Your (.+) plan has been completed\. (\$[\d,.]+)/, templateKey: 'msgSubscriptionCompleted', extractParams: (m) => ({ plan: m[1], amount: m[2] }) },
  { regex: /^You have successfully subscribed to (.+) plan with (\$[\d,.]+)\. Expected return: (\$[\d,.]+) after (\d+) days/, templateKey: 'msgPlanSubscribed', extractParams: (m) => ({ plan: m[1], amount: m[2], returnAmount: m[3], days: m[4] }) },
  { regex: /^Successfully funded (\$[\d,.]+) from ([A-Z]+) to your trading/, templateKey: 'msgTradingFunded', extractParams: (m) => ({ amount: m[1], symbol: m[2] }) },
  { regex: /^Successfully withdrew (\$[\d,.]+) as ([A-Z]+) from your trading/, templateKey: 'msgTradingWithdrew', extractParams: (m) => ({ amount: m[1], symbol: m[2] }) },
  { regex: /^Successfully withdrew all assets from cold storage\. (\$[\d,.]+)/, templateKey: 'msgGenericWithdrawalAll', extractParams: (m) => ({ amount: m[1] }) },
  { regex: /^Successfully purchased (.+) signal for (\$[\d,.]+)/, templateKey: 'msgSignalPurchased', extractParams: (m) => ({ signal: m[1], amount: m[2] }) },
  { regex: /^Bought ([\d.]+) shares of ([A-Z]+) for (\$[\d,.]+) using ([A-Z]+)/, templateKey: 'msgStockBought', extractParams: (m) => ({ quantity: m[1], symbol: m[2], amount: m[3], token: m[4] }) },
  { regex: /^Withdrew (\$[\d,.]+) from ([A-Z]+) to ([A-Z]+)/, templateKey: 'msgStockWithdrew', extractParams: (m) => ({ amount: m[1], symbol: m[2], token: m[3] }) },
  { regex: /^Your copy trade with (.+) has been closed\. (.+)\. (\$[\d,.]+) returned to ([A-Z]+)/, templateKey: 'msgCopyTradingClosed', extractParams: (m) => ({ traderName: m[1], profitText: m[2], returnAmount: m[3], token: m[4] }) },
  { regex: /^You stopped copying (.+)\. (.+)\. (\$[\d,.]+) deposited to ([A-Z]+)/, templateKey: 'msgCopyTradingStopped', extractParams: (m) => ({ traderName: m[1], profitText: m[2], returnAmount: m[3], token: m[4] }) },
  { regex: /^Your investment in (.+) has been released! Principal: (\$[\d,.]+), ROI: (\$[\d,.]+), Total: (\$[\d,.]+)/, templateKey: 'msgInvestmentReleased', extractParams: (m) => ({ propertyName: m[1], principal: m[2], roi: m[3], total: m[4] }) },
  { regex: /^You invested (\$[\d,.]+) in (.+)$/, templateKey: 'msgInvestmentSuccessful', extractParams: (m) => ({ amount: m[1], propertyName: m[2] }) },
  { regex: /^Your ([\d.]+) ([A-Z]+) stake has been completed! You received ([\d.]+) ([A-Z]+) as reward/, templateKey: 'msgStakeReleased', extractParams: (m) => ({ amount: m[1], symbol: m[2], reward: m[3], rewardSymbol: m[4] }) },
  { regex: /^Your ([\d.]+) ([A-Z]+) stake has been cancelled\. Principal returned/, templateKey: 'msgStakeCancelled', extractParams: (m) => ({ amount: m[1], symbol: m[2] }) },
  { regex: /^You have staked ([\d.]+) ([A-Z]+) for (\d+) days\. Expected reward: ([\d.]+) ([A-Z]+)/, templateKey: 'msgStakeCreated', extractParams: (m) => ({ amount: m[1], symbol: m[2], days: m[3], reward: m[4], rewardSymbol: m[5] }) },
  { regex: /^Swapped (\$[\d,.]+) worth of ([A-Z]+) for ([\d.]+) ([A-Z]+)/, templateKey: 'msgCryptoSwap', extractParams: (m) => ({ amount: m[1], fromToken: m[2], toAmount: m[3], toToken: m[4] }) },
  { regex: /^Your password has been successfully changed/, templateKey: 'msgPasswordChanged', extractParams: () => ({}) },
  { regex: /^(BUY|SELL|LONG|SHORT) ([\d.]+) ([A-Z]+) @ \$([\d,.]+) with ([\d.]+)x leverage/, templateKey: 'msgPositionOpened', extractParams: (m) => ({ type: m[1], positionAmount: m[2], symbol: m[3], price: m[4], leverage: m[5] }) },
  { regex: /^([A-Z]+) position closed\. PnL: (.+) \(([-\d.]+)%\)/, templateKey: 'msgPositionClosed', extractParams: (m) => ({ symbol: m[1], pnlText: m[2], pnlPercent: m[3] }) },
  { regex: /^(?:Successfully )?[Dd]eposited ([\d.]+) ([A-Z]+) \((\$[\d,.]+)\) (?:to|into) (?:your )?(.+?)(?:\s+balance)?$/, templateKey: 'msgGenericDeposit', extractParams: (m) => ({ tokenAmount: m[1], symbol: m[2], amount: m[3], section: m[4] }) },
  { regex: /^(?:Successfully )?[Ww]ithdrew ([\d.]+) ([A-Z]+) (?:worth )?\(?(\$[\d,.]+)\)? from (?:your )?(.+?)(?:\s+balance)?\.?$/, templateKey: 'msgGenericWithdrawal', extractParams: (m) => ({ tokenAmount: m[1], symbol: m[2], amount: m[3], section: m[4] }) },
];

// Replace {param} placeholders with actual values
function fillTemplate(template: string, params: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

export function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
  onDeleteAll,
  onMarkAsRead,
}: NotificationsPanelProps) {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onDeleteAll();
    setIsDeleting(false);
  };

  // Translated relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t.notificationsPanel.justNow;
    if (diffMins < 60) return `${diffMins} ${t.notificationsPanel.minAgo}`;
    if (diffHours < 24) return `${diffHours} ${t.notificationsPanel.hAgo}`;
    if (diffDays === 1) return `1 ${t.notificationsPanel.dAgo}`;
    return `${diffDays} ${t.notificationsPanel.dAgo}`;
  };

  // Translate notification title
  const translateTitle = (title: string): string => {
    const key = TITLE_KEY_MAP[title];
    if (key && t.notificationsPanel[key as keyof typeof t.notificationsPanel]) {
      return t.notificationsPanel[key as keyof typeof t.notificationsPanel];
    }
    return title;
  };

  // Translate notification message
  const translateMessage = (message: string): string => {
    for (const pattern of MESSAGE_PATTERNS) {
      const match = message.match(pattern.regex);
      if (match) {
        const params = pattern.extractParams(match);
        const template = t.notificationsPanel[pattern.templateKey as keyof typeof t.notificationsPanel];
        if (template) {
          return fillTemplate(template, params);
        }
      }
    }
    return message;
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
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[380px] bg-[#0f1419] border-l border-[#1e2733] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#1e2733]">
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="p-1 text-[#6b7a90] hover:text-white">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-white font-medium">{t.notificationsPanel.title}</span>
              </div>
              <button onClick={onClose} className="p-1 text-[#6b7a90] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <Bell className="h-16 w-16 text-[#1e2733] mb-4" />
                  <p className="text-[#6b7a90]">{t.notificationsPanel.noNotifications}</p>
                </div>
              ) : (
                <div className="py-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => onMarkAsRead(notification.id)}
                      className={cn(
                        'px-4 py-4 border-b border-[#1e2733] cursor-pointer hover:bg-[#151c24] transition-colors',
                        !notification.read && 'bg-[#22c55e]/5'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-medium">
                            {translateTitle(notification.title)}
                            <span className="ml-2 text-sm text-[#6b7a90] font-normal">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </p>
                          <p className="text-sm text-[#6b7a90] mt-1">{translateMessage(notification.message)}</p>
                        </div>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-[#22c55e] shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-[#1e2733]">
                <button
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="w-full py-3 bg-[#ef4444] hover:bg-[#dc2626] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      {t.notificationsPanel.deleteAll}
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NotificationsPanel;
