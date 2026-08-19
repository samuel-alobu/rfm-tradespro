'use client';

import React, { useState } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { Sidebar, DashboardHeader, MobileSidebar, SettingsPanel, KYCVerificationPanel } from '@/components/dashboard';
import { LanguageProvider } from '@/lib/i18n';
import { useUIStore } from '@/store';
import { cn } from '@/utils';

// ============================================
// Dashboard Layout Content (needs session access)
// ============================================

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();
  const { data: session } = useSession();
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isKYCPanelOpen, setIsKYCPanelOpen] = useState(false);

  const userName = `${session?.user?.firstName || 'User'} ${session?.user?.lastName || ''}`.trim();
  const userEmail = session?.user?.email || 'user@example.com';

  const handleOpenSettings = () => {
    setIsSettingsPanelOpen(true);
  };

  const handleKYCSubmit = () => {
    // Notification will be handled by the panel itself
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar onOpenSettings={handleOpenSettings} />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar onOpenSettings={handleOpenSettings} />

      {/* Header */}
      <DashboardHeader />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-[margin-left] duration-200',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        )}
      >
        <div className="p-6">{children}</div>
      </main>

      {/* Settings Panel (triggered from sidebar) */}
      <SettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={() => setIsSettingsPanelOpen(false)}
        user={{ name: userName, email: userEmail }}
        onOpenKYC={() => {
          setIsSettingsPanelOpen(false);
          setIsKYCPanelOpen(true);
        }}
      />

      {/* KYC Verification Panel */}
      <KYCVerificationPanel
        isOpen={isKYCPanelOpen}
        onClose={() => setIsKYCPanelOpen(false)}
        onSubmit={handleKYCSubmit}
      />
    </div>
  );
}

// ============================================
// Dashboard Layout
// ============================================

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </LanguageProvider>
    </SessionProvider>
  );
}
