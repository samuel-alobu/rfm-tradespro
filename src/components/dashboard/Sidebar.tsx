'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Snowflake,
  TrendingUp,
  Wallet,
  Users,
  BarChart3,
  LineChart,
  Link2,
  CreditCard,
  Radio,
  Coins,
  Gift,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Logo, LogoIcon } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';
import { useUIStore } from '@/store';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Navigation Items
// ============================================

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

// ============================================
// Sidebar Nav Item Component
// ============================================

interface SidebarNavItemProps {
  item: NavItem;
  isCollapsed: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ item, isCollapsed }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
        'hover:bg-[var(--color-surface-hover)]',
        isActive
          ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
        isCollapsed && 'justify-center px-2'
      )}
      title={isCollapsed ? item.label : undefined}
    >
      <span
        className={cn(
          'shrink-0 transition-colors',
          isActive && 'text-[var(--color-primary)]'
        )}
      >
        {item.icon}
      </span>
      {!isCollapsed && (
        <>
          <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
          {item.badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-[var(--color-primary)] text-[var(--color-background)] rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
};

// ============================================
// Sidebar Component
// ============================================

interface SidebarProps {
  className?: string;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onOpenSettings }) => {
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const { t } = useLanguage();

  // Create translated navigation groups
  const navGroups: NavGroup[] = useMemo(() => [
    {
      items: [
        {
          href: '/dashboard',
          label: t.nav.dashboard,
          icon: <LayoutDashboard className="h-5 w-5" />,
        },
      ],
    },
    {
      title: t.nav.finance,
      items: [
        {
          href: '/deposit',
          label: t.nav.deposit,
          icon: <ArrowDownToLine className="h-5 w-5" />,
        },
        {
          href: '/withdraw',
          label: t.nav.withdraw,
          icon: <ArrowUpFromLine className="h-5 w-5" />,
        },
        {
          href: '/cold-storage',
          label: t.nav.coldStorage,
          icon: <Snowflake className="h-5 w-5" />,
        },
      ],
    },
    {
      title: t.nav.investments,
      items: [
        {
          href: '/investing',
          label: t.nav.investing,
          icon: <TrendingUp className="h-5 w-5" />,
        },
        {
          href: '/assets',
          label: t.nav.assets,
          icon: <Wallet className="h-5 w-5" />,
        },
        {
          href: '/copy-trading',
          label: t.nav.copyTrading,
          icon: <Users className="h-5 w-5" />,
        },
      ],
    },
    {
      title: t.nav.trading,
      items: [
        {
          href: '/markets',
          label: t.nav.markets,
          icon: <BarChart3 className="h-5 w-5" />,
        },
        {
          href: '/trade',
          label: t.nav.trade,
          icon: <LineChart className="h-5 w-5" />,
        },
        {
          href: '/connect-wallet',
          label: t.nav.connectWallet,
          icon: <Link2 className="h-5 w-5" />,
        },
      ],
    },
    {
      title: t.nav.services,
      items: [
        {
          href: '/subscribe',
          label: t.nav.subscribe,
          icon: <CreditCard className="h-5 w-5" />,
        },
        {
          href: '/signals',
          label: t.nav.signals,
          icon: <Radio className="h-5 w-5" />,
          badge: t.common.new,
        },
        {
          href: '/stake',
          label: t.nav.stake,
          icon: <Coins className="h-5 w-5" />,
        },
        {
          href: '/referrals',
          label: t.nav.referrals,
          icon: <Gift className="h-5 w-5" />,
        },
        {
          href: '/real-estate',
          label: t.nav.realEstate,
          icon: <Building2 className="h-5 w-5" />,
        },
      ],
    },
  ], [t]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handleSettingsClick = () => {
    if (onOpenSettings) {
      onOpenSettings();
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 bottom-0 z-30',
        'flex flex-col',
        'bg-[var(--color-surface)] border-r border-[var(--color-border)]',
        className
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-[var(--color-border)]',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {sidebarCollapsed ? (
          <LogoIcon size="sm" />
        ) : (
          <Logo size="sm" href="/dashboard" />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebarCollapse}
          className={cn('shrink-0', sidebarCollapsed && 'absolute right-2')}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={cn(groupIndex > 0 && 'mt-6')}>
            {group.title && !sidebarCollapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                {group.title}
              </p>
            )}
            {group.title && sidebarCollapsed && (
              <div className="h-px bg-[var(--color-border)] mx-2 mb-2" />
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  isCollapsed={sidebarCollapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--color-border)]">
        <button
          onClick={handleSettingsClick}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
            'hover:bg-[var(--color-surface-hover)]',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          <Settings className="h-5 w-5" />
          {!sidebarCollapsed && (
            <span className="text-sm font-medium">{t.nav.settings}</span>
          )}
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            'text-[var(--color-text-muted)] hover:text-[var(--color-error)]',
            'hover:bg-[var(--color-error-bg)]',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!sidebarCollapsed && (
            <span className="text-sm font-medium">{t.nav.logout}</span>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
