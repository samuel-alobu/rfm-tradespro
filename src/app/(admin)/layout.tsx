'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  Shield,
  Bell,
  LogOut,
  Menu,
  X,
  Building,
  Wallet,
  FileText,
  AlertTriangle,
  Snowflake,
  Coins,
  LineChart,
  PieChart,
  Building2,
  Radio,
  UserCheck,
  BadgeDollarSign,
  Briefcase,
  Copy,
  TrendingUp,
  Gift,
  Loader2,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';

// ============================================
// Admin Layout with Real-time Role Validation
// ============================================

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface AdminProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/admin/users', label: 'Users', icon: <Users className="h-5 w-5" /> },
  { href: '/admin/referrals', label: 'Referrals', icon: <Gift className="h-5 w-5" /> },
  { href: '/admin/portfolios', label: 'Portfolios', icon: <Briefcase className="h-5 w-5" /> },
  { href: '/admin/copy-trading', label: 'Copy Trading', icon: <Copy className="h-5 w-5" /> },
  { href: '/admin/transactions', label: 'Transactions', icon: <CreditCard className="h-5 w-5" /> },
  { href: '/admin/deposits', label: 'Deposits', icon: <Wallet className="h-5 w-5" /> },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: <Building className="h-5 w-5" /> },
  { href: '/admin/wallets', label: 'Wallets', icon: <Shield className="h-5 w-5" /> },
  { href: '/admin/deposit-tokens', label: 'Deposit Tokens', icon: <Coins className="h-5 w-5" /> },
  { href: '/admin/traders', label: 'Traders', icon: <UserCheck className="h-5 w-5" /> },
  { href: '/admin/plans', label: 'Subscribe Plans', icon: <BadgeDollarSign className="h-5 w-5" /> },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: <CreditCard className="h-5 w-5" /> },
  { href: '/admin/signals', label: 'Signals', icon: <Radio className="h-5 w-5" /> },
  { href: '/admin/stake-assets', label: 'Stake Assets', icon: <Coins className="h-5 w-5" /> },
  { href: '/admin/real-estate', label: 'Real Estate', icon: <Building2 className="h-5 w-5" /> },
  { href: '/admin/investments', label: 'Investments', icon: <TrendingUp className="h-5 w-5" /> },
  { href: '/admin/cold-storage', label: 'Cold Storage', icon: <Snowflake className="h-5 w-5" /> },
  { href: '/admin/assets', label: 'Assets', icon: <PieChart className="h-5 w-5" /> },
  { href: '/admin/trades', label: 'Trades', icon: <LineChart className="h-5 w-5" /> },
  { href: '/admin/stakes', label: 'Stakes', icon: <Coins className="h-5 w-5" /> },
  { href: '/admin/kyc', label: 'KYC Requests', icon: <FileText className="h-5 w-5" /> },
  { href: '/admin/reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" /> },
  { href: '/admin/alerts', label: 'Alerts', icon: <AlertTriangle className="h-5 w-5" /> },
  { href: '/admin/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
];

// Inner component that uses session
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Validate admin role on mount and periodically
  const validateAdminAccess = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();

      if (data.success && data.profile) {
        const validAdminRoles = ['admin', 'super_admin', 'superadmin'];
        
        if (!validAdminRoles.includes(data.profile.role)) {
          // User is no longer an admin - redirect immediately
          setAccessDenied(true);
          setTimeout(() => {
            router.replace('/dashboard');
          }, 2000);
          return;
        }

        setAdminProfile({
          firstName: data.profile.firstName,
          lastName: data.profile.lastName,
          email: data.profile.email,
          role: data.profile.role,
          avatar: data.profile.avatar,
        });
        setAccessDenied(false);
      }
    } catch (error) {
      console.error('Failed to validate admin access:', error);
    } finally {
      setIsValidating(false);
    }
  }, [session?.user?.id, router]);

  // Initial validation
  useEffect(() => {
    if (status === 'authenticated') {
      validateAdminAccess();
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, validateAdminAccess, router]);

  // Periodic validation every 30 seconds
  useEffect(() => {
    if (status !== 'authenticated') return;

    const interval = setInterval(() => {
      validateAdminAccess();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [status, validateAdminAccess]);

  // Also validate on window focus (when user comes back to the tab)
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        validateAdminAccess();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status, validateAdminAccess]);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleDisplay = (role: string) => {
    if (role === 'super_admin' || role === 'superadmin') return 'Super Admin';
    return 'Admin';
  };

  // Show loading state while validating
  if (status === 'loading' || isValidating) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--color-primary)]" />
          <p className="mt-4 text-[var(--color-text-muted)]">Validating admin access...</p>
        </div>
      </div>
    );
  }

  // Show access denied message
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto bg-[var(--color-error)]/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-[var(--color-error)]" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Access Revoked</h1>
          <p className="text-[var(--color-text-muted)] mb-4">
            Your admin privileges have been revoked. You will be redirected to the dashboard.
          </p>
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-[var(--color-primary)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-border)]">
          <Logo size="sm" href="/admin" />
          <Badge variant="error" size="sm">Admin</Badge>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem-4rem)]">
          {navItems.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
                  isActive(item.href)
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant={isActive(item.href) ? 'default' : 'primary'}
                    size="sm"
                    className={isActive(item.href) ? 'bg-white/20 text-white' : ''}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            </div>
          ))}
        </nav>

        {/* Admin Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 px-3 py-2">
            {adminProfile?.avatar ? (
              <Image
                src={adminProfile.avatar}
                alt={`${adminProfile.firstName} ${adminProfile.lastName}`}
                width={32}
                height={32}
                className="rounded-full"
                unoptimized
              />
            ) : (
              <Avatar 
                fallback={adminProfile ? getInitials(adminProfile.firstName, adminProfile.lastName) : 'AD'} 
                size="sm" 
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {adminProfile ? `${adminProfile.firstName} ${adminProfile.lastName}` : 'Admin User'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {adminProfile ? getRoleDisplay(adminProfile.role) : 'Admin'}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Admin Panel
              </h1>
              <p className="text-xs text-[var(--color-text-muted)]">
                Oasis MarketPro Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-[var(--color-error)] rounded-full" />
            </button>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-sm bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] rounded-lg hover:text-[var(--color-text-primary)] transition-colors"
            >
              Exit Admin
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile close button */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed top-4 right-4 z-50 p-2 bg-[var(--color-surface)] rounded-full shadow-lg lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

// Wrapper component with SessionProvider
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SessionProvider>
  );
}
