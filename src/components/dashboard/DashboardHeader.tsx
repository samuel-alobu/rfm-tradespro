'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Menu,
  ChevronRight,
  ChevronDown,
  PlusSquare,
  MinusSquare,
  Plus,
  ArrowUpRight,
  Settings,
  LogOut,
  Diamond,
  FileText,
  Wallet,
  TrendingUp,
  Activity,
  Home,
  CreditCard,
  Briefcase,
  BarChart3,
  Signal,
  Coins,
  Building2,
  Users,
  Link as LinkIcon,
  X,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { cn, formatCurrency } from '@/utils';
import { useUIStore } from '@/store';
import { useLanguage } from '@/lib/i18n';
import { SettingsPanel } from './SettingsPanel';
import { AccountUpgradeModal } from './AccountUpgradeModal';
import { NotificationsPanel, Notification } from './NotificationsPanel';
import { KYCVerificationPanel } from './KYCVerificationPanel';

// ============================================
// Dashboard Header Component
// ============================================

interface DashboardHeaderProps {
  className?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ className }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { t } = useLanguage();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isKYCPanelOpen, setIsKYCPanelOpen] = useState(false);

  // Notifications state - fetched from API
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Profile state - fetched from API
  const [profileData, setProfileData] = useState<{
    avatar: string;
    verificationStatus: string;
    firstName: string;
    lastName: string;
  }>({ avatar: '', verificationStatus: 'unverified', firstName: '', lastName: '' });

  // Portal mounting state
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (res.ok) {
        setProfileData({
          avatar: data.avatar || '',
          verificationStatus: data.verificationStatus || 'unverified',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, []);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/user/notifications');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications?.map((n: any) => ({
          id: n.id || n._id,
          title: n.title,
          message: n.message,
          type: n.type?.includes('approved') ? 'success' : 
                n.type?.includes('declined') ? 'error' : 'info',
          read: n.read,
          createdAt: new Date(n.createdAt),
        })) || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Every 60 seconds (reduced from 30s)
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // User balance state
  const [userStats, setUserStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalProfits: 0,
    totalTrades: 0,
    accountLevel: 'starter',
    accountPercentage: '1%',
    balance: 0,
  });

  // Fetch user balance and account summary
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/user/balance');
        const data = await res.json();
        if (res.ok) {
          setUserStats({
            balance: data.balance?.available || 0,
            totalDeposits: data.accountSummary?.totalDeposits || 0,
            totalWithdrawals: data.accountSummary?.totalWithdrawals || 0,
            totalProfits: data.accountSummary?.totalProfits || 0,
            totalTrades: data.accountSummary?.totalTrades || 0,
            accountLevel: data.accountSummary?.accountLevel || 'starter',
            accountPercentage: data.accountSummary?.accountPercentage || '1%',
          });
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };
    fetchBalance();
  }, [pathname]); // Refetch when page changes

  // Get translated page titles
  const getTranslatedPageTitles = useCallback((): Record<string, { icon: React.ReactNode; title: string }> => ({
    '/dashboard': { icon: <Home className="h-5 w-5" />, title: t.nav.dashboard },
    '/deposit': { icon: <PlusSquare className="h-5 w-5" />, title: t.nav.deposit },
    '/withdraw': { icon: <MinusSquare className="h-5 w-5" />, title: t.nav.withdraw },
    '/cold-storage': { icon: <Wallet className="h-5 w-5" />, title: t.nav.coldStorage },
    '/investing': { icon: <Briefcase className="h-5 w-5" />, title: t.nav.investing },
    '/assets': { icon: <Wallet className="h-5 w-5" />, title: t.nav.assets },
    '/copy-trading': { icon: <Users className="h-5 w-5" />, title: t.nav.copyTrading },
    '/markets': { icon: <BarChart3 className="h-5 w-5" />, title: t.nav.markets },
    '/trade': { icon: <Activity className="h-5 w-5" />, title: t.nav.trade },
    '/connect-wallet': { icon: <LinkIcon className="h-5 w-5" />, title: t.nav.connectWallet },
    '/subscribe': { icon: <CreditCard className="h-5 w-5" />, title: t.nav.subscribe },
    '/signals': { icon: <Signal className="h-5 w-5" />, title: t.nav.signals },
    '/stake': { icon: <Coins className="h-5 w-5" />, title: t.nav.stake },
    '/referrals': { icon: <Users className="h-5 w-5" />, title: t.nav.referrals },
    '/real-estate': { icon: <Building2 className="h-5 w-5" />, title: t.nav.realEstate },
    '/settings': { icon: <Settings className="h-5 w-5" />, title: t.nav.settings },
  }), [t]);

  // Get current page info
  const getPageInfo = () => {
    const translatedTitles = getTranslatedPageTitles();
    if (translatedTitles[pathname]) {
      return translatedTitles[pathname];
    }
    for (const [path, info] of Object.entries(translatedTitles)) {
      if (pathname.startsWith(path) && path !== '/') {
        return info;
      }
    }
    return { icon: <FileText className="h-5 w-5" />, title: t.nav.dashboard };
  };

  const currentPage = getPageInfo();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handleUpgradeRequest = (levelId: string) => {
    // Add notification about upgrade request (will be saved to DB via API)
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title: t.dashboard.upgradeRequestSubmitted,
      message: t.dashboard.upgradeRequestMessage.replace('{{level}}', levelId.charAt(0).toUpperCase() + levelId.slice(1)),
      type: 'success',
      read: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await fetch('/api/user/notifications', { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      try {
        await fetch('/api/user/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIndex: index }),
        });
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const handleKYCSubmit = () => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title: t.dashboard.verificationSubmitted,
      message: t.dashboard.verificationSubmittedMessage,
      type: 'success',
      read: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    // Refetch profile to update verification status
    fetchProfileData();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName?.charAt(0) || '';
    const l = lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || 'U';
  };

  // Use profile data if available, fallback to session
  const displayFirstName = profileData.firstName || session?.user?.firstName || 'User';
  const displayLastName = profileData.lastName || session?.user?.lastName || '';
  const userName = `${displayFirstName} ${displayLastName}`.trim();
  const userEmail = session?.user?.email || 'user@example.com';

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 z-20',
          'h-16 flex items-center justify-between gap-4 px-6',
          'bg-[var(--color-surface)]/95 backdrop-blur-xl',
          'border-b border-[var(--color-border)]',
          sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-[260px]',
          'left-0',
          'transition-[left] duration-200',
          className
        )}
      >
        {/* Left: Mobile menu + Page title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page Title */}
          <div className="flex items-center gap-2 text-white">
            <span className="text-[#6b7a90]">{currentPage.icon}</span>
            <span className="font-medium">{currentPage.title}</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector */}
          <LanguageSelector variant="icon" />

          {/* Balance Display */}
          <div className="hidden sm:flex items-center px-3 py-1.5 bg-[#0a0e14] border border-[#1e2733] rounded-lg">
            <span className="text-white font-medium">{formatCurrency(userStats.balance)}</span>
          </div>

          {/* Notifications */}
          <button
            onClick={() => setIsNotificationsPanelOpen(true)}
            className="p-2 text-[#6b7a90] hover:text-white transition-colors rounded-lg hover:bg-[#1e2733] relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-[#ef4444] text-white rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Avatar / Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center"
            >
              {profileData.avatar ? (
                <div className="h-10 w-10 rounded-full overflow-hidden relative">
                  <Image 
                    src={profileData.avatar} 
                    alt="Avatar" 
                    fill 
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#22c55e] flex items-center justify-center text-white font-bold">
                  {getInitials(displayFirstName, displayLastName)}
                </div>
              )}
            </button>

            {/* Profile Dropdown - Portal rendered separately */}
            {isMounted && createPortal(
              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      key="profile-backdrop"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[100] bg-black/50"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    />
                    
                    {/* Mobile: Full screen panel */}
                    <motion.div
                      key="profile-mobile"
                      initial={{ opacity: 0, x: '100%' }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: '100%' }}
                      transition={{ type: 'tween', duration: 0.25 }}
                      className="fixed inset-0 z-[101] bg-[#0f1419] flex flex-col md:hidden"
                    >
                      {/* Mobile Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2733]">
                        <button
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-2 text-white"
                        >
                          <ChevronRight className="h-5 w-5 rotate-180" />
                          <span className="font-medium">{t.dashboard.yourAccount}</span>
                        </button>
                        <button
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="p-1 text-[#6b7a90] hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Mobile Content */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {/* User Info */}
                        <div className="flex items-center gap-3 mb-4">
                          {profileData.avatar ? (
                            <div className="h-12 w-12 rounded-full overflow-hidden relative flex-shrink-0">
                              <Image src={profileData.avatar} alt="Avatar" fill className="object-cover" unoptimized />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-[#22c55e] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {getInitials(displayFirstName, displayLastName)}
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium">{userName}</p>
                            {profileData.verificationStatus === 'verified' ? (
                              <span className="text-sm text-[#22c55e]">{t.dashboard.verifiedAccount}</span>
                            ) : profileData.verificationStatus === 'pending' ? (
                              <span className="text-sm text-yellow-500">{t.dashboard.pendingVerification}</span>
                            ) : (
                              <button onClick={() => { setIsProfileDropdownOpen(false); setIsKYCPanelOpen(true); }} className="text-sm text-[#22c55e] hover:underline flex items-center gap-1">
                                {t.dashboard.verifyAccount} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Account Level */}
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-6 w-px bg-[#1e2733]" />
                          <Diamond className="h-4 w-4 text-[#6b7a90]" />
                          <span className="text-white font-medium capitalize">{userStats.accountLevel}</span>
                          <span className="text-white">{userStats.accountPercentage}</span>
                          <button onClick={() => { setIsProfileDropdownOpen(false); setIsUpgradeModalOpen(true); }} className="ml-auto px-6 py-2 bg-[#22c55e] text-white text-sm font-semibold rounded-lg hover:bg-[#1ea550] transition-colors">
                            {t.dashboard.upgrade}
                          </button>
                        </div>

                        {/* Quick Links */}
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-[#6b7a90] mb-3">{t.dashboard.quickLinks}</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <Link href="/deposit" onClick={() => setIsProfileDropdownOpen(false)} className="flex flex-col items-center gap-2 p-4 bg-[#151c24] border border-[#1e2733] rounded-xl hover:border-[#22c55e] transition-colors">
                              <PlusSquare className="h-5 w-5 text-[#6b7a90]" />
                              <span className="text-xs text-white">{t.nav.addFunds}</span>
                            </Link>
                            <Link href="/withdraw" onClick={() => setIsProfileDropdownOpen(false)} className="flex flex-col items-center gap-2 p-4 bg-[#151c24] border border-[#1e2733] rounded-xl hover:border-[#22c55e] transition-colors">
                              <MinusSquare className="h-5 w-5 text-[#6b7a90]" />
                              <span className="text-xs text-white">{t.nav.withdraw}</span>
                            </Link>
                            <button onClick={() => { setIsProfileDropdownOpen(false); setIsSettingsPanelOpen(true); }} className="flex flex-col items-center gap-2 p-4 bg-[#151c24] border border-[#1e2733] rounded-xl hover:border-[#22c55e] transition-colors">
                              <Settings className="h-5 w-5 text-[#6b7a90]" />
                              <span className="text-xs text-white">{t.nav.settings}</span>
                            </button>
                            <button onClick={() => { setIsProfileDropdownOpen(false); setIsNotificationsPanelOpen(true); }} className="flex flex-col items-center gap-2 p-4 bg-[#151c24] border border-[#1e2733] rounded-xl hover:border-[#22c55e] transition-colors">
                              <Bell className="h-5 w-5 text-[#6b7a90]" />
                              <span className="text-xs text-white">{t.nav.notifications}</span>
                            </button>
                            <button onClick={handleLogout} className="flex flex-col items-center gap-2 p-4 bg-[#151c24] border border-[#1e2733] rounded-xl hover:border-[#22c55e] transition-colors">
                              <LogOut className="h-5 w-5 text-[#6b7a90]" />
                              <span className="text-xs text-white">{t.nav.logout}</span>
                            </button>
                          </div>
                        </div>

                        {/* Account Summary */}
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-3">{t.dashboard.accountSummary}</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between"><span className="text-sm text-[#6b7a90]">{t.dashboard.totalDeposits}</span><span className="text-sm text-white">{formatCurrency(userStats.totalDeposits)}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-[#6b7a90]">{t.dashboard.totalWithdrawals}</span><span className="text-sm text-white">{formatCurrency(userStats.totalWithdrawals)}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-[#6b7a90]">{t.dashboard.totalProfits}</span><span className="text-sm text-white">{formatCurrency(userStats.totalProfits)}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-[#6b7a90]">{t.dashboard.totalTrades}</span><span className="text-sm text-white">{userStats.totalTrades}</span></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Desktop: Dropdown */}
                    <motion.div
                      key="profile-desktop"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{ top: '64px', right: '24px' }}
                      className="hidden md:block fixed w-[420px] lg:w-[480px] bg-[#0f1419] border border-[#1e2733] rounded-xl shadow-2xl z-[101] overflow-hidden"
                    >
                      <div className="flex">
                        {/* Left Side */}
                        <div className="flex-1 p-4 border-r border-[#1e2733]">
                          <div className="flex items-center gap-3 mb-4">
                            {profileData.avatar ? (
                              <div className="h-12 w-12 rounded-full overflow-hidden relative flex-shrink-0">
                                <Image src={profileData.avatar} alt="Avatar" fill className="object-cover" unoptimized />
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-[#22c55e] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                {getInitials(displayFirstName, displayLastName)}
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium">{userName}</p>
                              {profileData.verificationStatus === 'verified' ? (
                                <span className="text-sm text-[#22c55e]">{t.dashboard.verifiedAccount}</span>
                              ) : profileData.verificationStatus === 'pending' ? (
                                <span className="text-sm text-yellow-500">{t.dashboard.pendingVerification}</span>
                              ) : (
                                <button onClick={() => { setIsProfileDropdownOpen(false); setIsKYCPanelOpen(true); }} className="text-sm text-[#22c55e] hover:underline flex items-center gap-1">
                                  {t.dashboard.verifyAccount} <ChevronRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mb-4 pl-1">
                            <div className="h-6 w-px bg-[#1e2733]" />
                            <Diamond className="h-4 w-4 text-[#6b7a90]" />
                            <span className="text-white font-medium capitalize">{userStats.accountLevel}</span>
                            <span className="text-white">{userStats.accountPercentage}</span>
                            <button onClick={() => { setIsProfileDropdownOpen(false); setIsUpgradeModalOpen(true); }} className="px-4 py-1.5 bg-[#22c55e] text-white text-sm font-semibold rounded hover:bg-[#1ea550] transition-colors">{t.dashboard.upgrade}</button>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-3">{t.dashboard.accountSummary}</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between"><span className="text-sm text-[#6b7a90]">{t.dashboard.totalDeposits}</span><span className="text-sm text-white">{formatCurrency(userStats.totalDeposits)}</span></div>
                              <div className="flex justify-between"><span className="text-sm text-[#6b7a90]">{t.dashboard.totalWithdrawals}</span><span className="text-sm text-white">{formatCurrency(userStats.totalWithdrawals)}</span></div>
                              <div className="flex justify-between"><span className="text-sm text-[#6b7a90]">{t.dashboard.totalProfits}</span><span className="text-sm text-white">{formatCurrency(userStats.totalProfits)}</span></div>
                              <div className="flex justify-between"><span className="text-sm text-[#6b7a90]">{t.dashboard.totalTrades}</span><span className="text-sm text-white">{userStats.totalTrades}</span></div>
                            </div>
                          </div>
                        </div>
                        {/* Right Side */}
                        <div className="w-40 lg:w-44 py-3">
                          <Link href="/deposit" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#151c24] transition-colors"><PlusSquare className="h-4 w-4 text-[#6b7a90]" />{t.nav.addFunds}</Link>
                          <Link href="/withdraw" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#151c24] transition-colors"><MinusSquare className="h-4 w-4 text-[#6b7a90]" />{t.nav.withdraw}</Link>
                          <button onClick={() => { setIsProfileDropdownOpen(false); setIsSettingsPanelOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#151c24] transition-colors"><Settings className="h-4 w-4 text-[#6b7a90]" />{t.nav.settings}</button>
                          <button onClick={() => { setIsProfileDropdownOpen(false); setIsNotificationsPanelOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#151c24] transition-colors"><Bell className="h-4 w-4 text-[#6b7a90]" />{t.nav.notifications}</button>
                          <div className="my-2 border-t border-[#1e2733]" />
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#151c24] transition-colors"><LogOut className="h-4 w-4 text-[#6b7a90]" />{t.nav.logout}</button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>,
              document.body
            )}
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={() => setIsSettingsPanelOpen(false)}
        user={{ name: userName, email: userEmail }}
        onOpenKYC={() => {
          setIsSettingsPanelOpen(false);
          setIsKYCPanelOpen(true);
        }}
      />

      {/* Account Upgrade Modal */}
      <AccountUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentLevel={userStats.accountLevel}
        onRequestUpgrade={handleUpgradeRequest}
      />

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={isNotificationsPanelOpen}
        onClose={() => setIsNotificationsPanelOpen(false)}
        notifications={notifications}
        onDeleteAll={handleDeleteAllNotifications}
        onMarkAsRead={handleMarkAsRead}
      />

      {/* KYC Verification Panel */}
      <KYCVerificationPanel
        isOpen={isKYCPanelOpen}
        onClose={() => setIsKYCPanelOpen(false)}
        onSubmit={handleKYCSubmit}
      />
    </>
  );
};

export default DashboardHeader;
