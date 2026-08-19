'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Gift,
  Copy,
  Check,
  Share2,
  Award,
  Mail,
  Twitter,
  Linkedin,
  MessageCircle,
  Loader2,
  X,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Referrals Page - Full Implementation
// ============================================

interface Referral {
  _id: string;
  referredUser: {
    firstName: string;
    lastName: string;
    email: string;
    initials: string;
  };
  rewardAmount: number;
  tier: string;
  status: 'pending' | 'active' | 'completed';
  createdAt: string;
  approvedAt?: string;
}

interface Stats {
  totalReferrals: number;
  pendingReferrals: number;
  activeReferrals: number;
  completedReferrals: number;
  totalEarned: number;
  pendingEarnings: number;
  currentTier: string;
  currentReward: number;
}

interface Tier {
  minReferrals: number;
  reward: number;
  tier: string;
}

interface SelectedToken {
  symbol: string;
  name: string;
  price: number;
}

const TOKEN_PRICES: Record<string, number> = {
  BTC: 67234.50,
  ETH: 3456.78,
  USDT: 1.00,
  USDC: 1.00,
};

export default function ReferralsPage() {
  // Translation hook
  const { t } = useLanguage();
  
  // Data state
  const [referralCode, setReferralCode] = useState('');
  const [referralBalance, setReferralBalance] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  // Withdraw modal state
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SelectedToken | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawInputMode, setWithdrawInputMode] = useState<'usd' | 'token'>('usd');
  const [isProcessing, setIsProcessing] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const referralLink = `https://rfmtradepro.com/ref/${referralCode}`;

  // Tab labels mapped to translation keys
  const tabLabels: Record<string, string> = {
    all: t.referrals.all,
    pending: t.referrals.pending,
    active: t.referrals.active,
    completed: t.referrals.completed,
  };

  // Status labels mapped to translation keys
  const statusLabels: Record<string, string> = {
    pending: t.referrals.pending,
    active: t.referrals.active,
    completed: t.referrals.completed,
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchReferralData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/user/referrals');
      const data = await res.json();
      if (res.ok) {
        setReferralCode(data.referralCode || '');
        setReferralBalance(data.referralBalance || 0);
        setStats(data.stats);
        setReferrals(data.referrals || []);
        setTiers(data.tiers || []);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = () => {
    if (inviteEmail) {
      // Open email client with pre-filled message
      const subject = encodeURIComponent('Join RFM TradePro');
      const body = encodeURIComponent(`Hey! I've been using RFM TradePro for trading and I think you'd love it. Sign up with my referral link and we both get rewards!\n\n${referralLink}\n\nUse code: ${referralCode}`);
      window.open(`mailto:${inviteEmail}?subject=${subject}&body=${body}`);
      setInviteEmail('');
      setToast({ message: t.referrals.emailClientOpened, type: 'success' });
    }
  };

  const handleWithdraw = async () => {
    if (!selectedToken || !withdrawAmount || parseFloat(withdrawAmount) <= 0) return;

    const price = selectedToken.price;
    let tokenAmount: number;
    let usdAmount: number;

    if (withdrawInputMode === 'usd') {
      usdAmount = parseFloat(withdrawAmount);
      tokenAmount = usdAmount / price;
    } else {
      tokenAmount = parseFloat(withdrawAmount);
      usdAmount = tokenAmount * price;
    }

    if (usdAmount > referralBalance) {
      setToast({ message: t.referrals.insufficientBalance, type: 'error' });
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch('/api/user/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'withdraw',
          symbol: selectedToken.symbol,
          amount: tokenAmount,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReferralBalance(data.referralBalance);
        setToast({ message: `${t.referrals.successWithdrew} ${tokenAmount.toFixed(6)} ${selectedToken.symbol}!`, type: 'success' });
        setWithdrawModalOpen(false);
        setSelectedToken(null);
        setWithdrawAmount('');
      } else {
        setToast({ message: data.error || t.referrals.withdrawalFailed, type: 'error' });
      }
    } catch (error) {
      setToast({ message: t.referrals.errorOccurred, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter referrals by tab
  const filteredReferrals = referrals.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    active: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20',
    completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-[#22c55e] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">{t.referrals.title}</h1>
        <p className="text-sm text-[#6b7a90]">
          {t.referrals.subtitle}
        </p>
      </div>

      {/* Two Card Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Referral Balance Card */}
        <div className="bg-[#0f1419] rounded-xl border border-[#22c55e]/30 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[#6b7a90]">{t.referrals.referralBalance}</span>
              <button onClick={() => setShowBalance(!showBalance)} className="text-[#6b7a90] hover:text-white">
                {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            {referralBalance > 0 && (
              <button
                onClick={() => { setWithdrawModalOpen(true); setWithdrawInputMode('usd'); }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 rounded-lg hover:bg-[#22c55e]/20 transition-colors w-full sm:w-auto"
              >
                <ArrowUpRight className="h-4 w-4" />
                {t.referrals.withdraw}
              </button>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {showBalance ? formatCurrency(referralBalance) : '******'}
          </p>
          {stats && stats.pendingEarnings > 0 && (
            <p className="text-sm text-yellow-500 mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatCurrency(stats.pendingEarnings)} {t.referrals.pendingApproval}
            </p>
          )}
        </div>

        {/* Stats Card */}
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#6b7a90]">{t.referrals.yourPerformance}</span>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#22c55e]" />
              <span className="text-[#22c55e] font-semibold">{stats?.currentTier || 'Bronze'}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div>
              <p className="text-lg sm:text-2xl font-bold text-white">{stats?.totalReferrals || 0}</p>
              <p className="text-xs text-[#6b7a90]">{t.referrals.totalReferrals}</p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-[#22c55e]">{formatCurrency(stats?.totalEarned || 0)}</p>
              <p className="text-xs text-[#6b7a90]">{t.referrals.totalEarned}</p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-white">${stats?.currentReward || 50}/ref</p>
              <p className="text-xs text-[#6b7a90]">{t.referrals.currentRate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="h-5 w-5 text-[#22c55e]" />
          <h3 className="text-lg font-semibold text-white">{t.referrals.shareYourLink}</h3>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-xl text-white font-mono text-xs sm:text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={() => copyToClipboard(referralLink)}
              className="w-full sm:w-auto px-6 py-3 bg-[#22c55e] text-white font-medium rounded-xl hover:bg-[#1ea550] transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t.referrals.copied : t.referrals.copy}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6b7a90]">{t.referrals.yourCodeLabel}</span>
            <code className="px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] rounded-lg font-mono font-semibold text-sm">
              {referralCode}
            </code>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <button 
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=Join%20RFM%20TradePro%20using%20my%20referral%20link!%20${encodeURIComponent(referralLink)}`, '_blank')}
              className="px-3 sm:px-4 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white hover:bg-[#151c24] transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </button>
            <button 
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, '_blank')}
              className="px-3 sm:px-4 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white hover:bg-[#151c24] transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </button>
            <button 
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Join RFM TradePro using my referral link! ${referralLink}`)}`, '_blank')}
              className="px-3 sm:px-4 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white hover:bg-[#151c24] transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </button>
            <button 
              onClick={() => {
                const subject = encodeURIComponent('Join RFM TradePro');
                const body = encodeURIComponent(`Hey! Check out RFM TradePro. Sign up with my referral link: ${referralLink}\n\nUse code: ${referralCode}`);
                window.open(`mailto:?subject=${subject}&body=${body}`);
              }}
              className="px-3 sm:px-4 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white hover:bg-[#151c24] transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
          </div>
        </div>
      </div>

      {/* Invite by Email */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t.referrals.inviteByEmail}</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="email"
              placeholder="friend@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-xl text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
            />
          </div>
          <button
            onClick={handleInvite}
            disabled={!inviteEmail}
            className="w-full sm:w-auto px-6 py-3 bg-[#22c55e] text-white font-medium rounded-xl hover:bg-[#1ea550] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.referrals.sendInvite}
          </button>
        </div>
      </div>

      {/* Reward Tiers */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t.referrals.rewardTiers}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {tiers.map((tier) => {
            const isCurrentTier = stats?.currentTier === tier.tier;
            const isAchieved = (stats?.totalReferrals || 0) >= tier.minReferrals;
            return (
              <div
                key={tier.tier}
                className={cn(
                  'p-3 sm:p-4 rounded-xl text-center transition-all',
                  isCurrentTier
                    ? 'bg-[#22c55e]/10 border-2 border-[#22c55e]'
                    : isAchieved
                    ? 'bg-[#151c24] border border-[#22c55e]/30'
                    : 'bg-[#0a0e14] border border-[#1e2733]'
                )}
              >
                <div className={cn(
                  'h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center mx-auto mb-2',
                  isAchieved ? 'bg-[#22c55e] text-white' : 'bg-[#151c24] text-[#6b7a90]'
                )}>
                  <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <p className="font-semibold text-white text-sm sm:text-base">{tier.tier}</p>
                <p className="text-xs sm:text-sm text-[#6b7a90]">{tier.minReferrals}+ {t.referrals.referralsCount}</p>
                <p className="text-base sm:text-lg font-bold text-[#22c55e] mt-1">
                  ${tier.reward}/ref
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733]">
        <div className="p-4 sm:p-6 border-b border-[#1e2733]">
          <h3 className="text-lg font-semibold text-white">{t.referrals.referralHistory}</h3>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e2733] overflow-x-auto scrollbar-hide -mx-px">
          {(['all', 'pending', 'active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 sm:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
                activeTab === tab
                  ? 'text-[#22c55e] border-b-2 border-[#22c55e]'
                  : 'text-[#6b7a90] hover:text-white'
              )}
            >
              {tabLabels[tab]}
              {tab !== 'all' && (
                <span className="ml-2 px-1.5 sm:px-2 py-0.5 bg-[#151c24] rounded text-xs">
                  {referrals.filter(r => r.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {filteredReferrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-[#6b7a90] mx-auto mb-3" />
              <p className="text-[#6b7a90]">{t.referrals.noReferralsFound}</p>
              <p className="text-sm text-[#6b7a90]">
                {t.referrals.shareToEarn}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReferrals.map((referral) => (
                <div
                  key={referral._id}
                  className="p-3 sm:p-4 bg-[#0a0e14] rounded-xl"
                >
                  {/* Mobile: Stack layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* User info */}
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-[#22c55e] text-sm">
                          {referral.referredUser.initials}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {referral.referredUser.firstName} {referral.referredUser.lastName.charAt(0)}.
                        </p>
                        <p className="text-sm text-[#6b7a90] truncate">{referral.referredUser.email}</p>
                      </div>
                    </div>
                    {/* Reward and status */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-13 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <p className={cn(
                          'font-medium text-sm sm:text-base',
                          referral.status === 'pending' ? 'text-yellow-500' : 'text-[#22c55e]'
                        )}>
                          {referral.status === 'pending' ? `+${formatCurrency(referral.rewardAmount)} (${t.referrals.pending.toLowerCase()})` : `+${formatCurrency(referral.rewardAmount)}`}
                        </p>
                        <p className="text-xs text-[#6b7a90]">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={cn('px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0', statusColors[referral.status])}>
                        {statusLabels[referral.status]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-xl p-6 sm:p-8">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-6 text-center">{t.referrals.howItWorks}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Share2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-1">{t.referrals.stepShare}</h4>
            <p className="text-sm text-white/80">{t.referrals.stepShareDesc}</p>
          </div>
          <div className="text-center">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-1">{t.referrals.stepSignUp}</h4>
            <p className="text-sm text-white/80">{t.referrals.stepSignUpDesc}</p>
          </div>
          <div className="text-center">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-1">{t.referrals.stepEarnRewards}</h4>
            <p className="text-sm text-white/80">{t.referrals.stepEarnRewardsDesc}</p>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {withdrawModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setWithdrawModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] rounded-xl border border-[#1e2733] w-full max-w-md"
            >
              <div className="p-6 border-b border-[#1e2733]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                      <ArrowUpRight className="h-5 w-5 text-[#22c55e]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{t.referrals.withdrawFromReferrals}</h3>
                      <p className="text-sm text-[#6b7a90]">{t.referrals.transferToHoldings}</p>
                    </div>
                  </div>
                  <button onClick={() => setWithdrawModalOpen(false)} className="text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="p-4 bg-[#0a0e14] rounded-lg">
                  <p className="text-sm text-[#6b7a90]">{t.referrals.availableToWithdraw}</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(referralBalance)}</p>
                </div>

                {!selectedToken ? (
                  <>
                    <p className="text-sm text-[#6b7a90]">{t.referrals.selectToken}</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {Object.entries(TOKEN_PRICES).map(([symbol, price]) => (
                        <button
                          key={symbol}
                          onClick={() => setSelectedToken({
                            symbol,
                            name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : symbol,
                            price,
                          })}
                          className="w-full flex items-center gap-3 p-4 bg-[#0a0e14] rounded-lg hover:bg-[#151c24] transition-colors"
                        >
                          <div className="h-10 w-10 rounded-full bg-[#1a2332] flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{symbol.slice(0, 2)}</span>
                          </div>
                          <span className="text-white font-medium">{symbol}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setSelectedToken(null); setWithdrawAmount(''); }} className="flex items-center gap-2 text-[#6b7a90] hover:text-white text-sm">
                      <ChevronDown className="h-4 w-4 rotate-90" />
                      {t.referrals.changeToken}
                    </button>

                    <div className="flex items-center gap-3 p-4 bg-[#0a0e14] rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-[#1a2332] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{selectedToken.symbol.slice(0, 2)}</span>
                      </div>
                      <p className="text-white font-medium">{selectedToken.symbol}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-[#6b7a90]">{t.referrals.amount} ({withdrawInputMode === 'usd' ? 'USD' : selectedToken.symbol})</label>
                        <div className="flex items-center bg-[#0a0e14] rounded-lg p-0.5">
                          <button
                            onClick={() => { setWithdrawInputMode('usd'); setWithdrawAmount(''); }}
                            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors', withdrawInputMode === 'usd' ? 'bg-[#22c55e] text-white' : 'text-[#6b7a90] hover:text-white')}
                          >
                            USD
                          </button>
                          <button
                            onClick={() => { setWithdrawInputMode('token'); setWithdrawAmount(''); }}
                            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors', withdrawInputMode === 'token' ? 'bg-[#22c55e] text-white' : 'text-[#6b7a90] hover:text-white')}
                          >
                            {selectedToken.symbol}
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                          step={withdrawInputMode === 'usd' ? '0.01' : '0.000001'}
                          className="w-full px-4 py-3 pr-20 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                        />
                        <button
                          onClick={() => {
                            if (withdrawInputMode === 'usd') {
                              setWithdrawAmount(referralBalance.toFixed(2));
                            } else {
                              setWithdrawAmount((referralBalance / selectedToken.price).toFixed(6));
                            }
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-[#1a2332] text-[#22c55e] rounded hover:bg-[#22c55e] hover:text-white transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                      {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                        <p className="text-xs text-[#6b7a90] mt-2">
                          {withdrawInputMode === 'usd' ? (
                            <>≈ {(parseFloat(withdrawAmount) / selectedToken.price).toFixed(6)} {selectedToken.symbol}</>
                          ) : (
                            <>≈ {formatCurrency(parseFloat(withdrawAmount) * selectedToken.price)}</>
                          )}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleWithdraw}
                      disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                      className="w-full py-3 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#1ea550] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin" />{t.referrals.processing}</> : t.referrals.withdraw}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              'fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2',
              toast.type === 'success' ? 'bg-[#22c55e] text-white' : 'bg-red-500 text-white'
            )}
          >
            {toast.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
