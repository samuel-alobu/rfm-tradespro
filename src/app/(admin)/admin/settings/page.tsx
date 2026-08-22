'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Globe,
  DollarSign,
  Check,
  Save,
  RefreshCw,
  AlertCircle,
  Loader2,
  Wrench,
  Mail,
  Lock,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { cn } from '@/utils';

// ============================================
// Admin Settings Page - Functional
// ============================================

interface SiteSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  requireKycForWithdrawal: boolean;
  autoLogoutEnabled: boolean;
  sessionTimeoutMinutes: number;
  withdrawalMinimum: number;
  withdrawalDailyLimitUnverified: number;
  withdrawalDailyLimitVerified: number;
  withdrawalMonthlyLimitUnverified: number;
  withdrawalMonthlyLimitVerified: number;
  depositMinimum: number;
  depositMaximum: number;
  depositAlertEmail: string;
  depositAlertEnabled: boolean;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [settings, setSettings] = useState<SiteSettings>({
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    requireKycForWithdrawal: true,
    autoLogoutEnabled: true,
    sessionTimeoutMinutes: 30,
    withdrawalMinimum: 10,
    withdrawalDailyLimitUnverified: 1000,
    withdrawalDailyLimitVerified: 100000,
    withdrawalMonthlyLimitUnverified: 5000,
    withdrawalMonthlyLimitVerified: 1000000,
    depositMinimum: 100,
    depositMaximum: 1000000,
    depositAlertEmail: '',
    depositAlertEnabled: true,
  });

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      
      if (data.success) {
        setSettings(data.settings);
        setIsSuperAdmin(data.isSuperAdmin);
      } else {
        addToast('error', data.error || 'Failed to fetch settings');
      }
    } catch {
      addToast('error', 'Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      
      if (data.success) {
        addToast('success', 'Settings saved successfully');
        setHasChanges(false);
        setSettings(data.settings);
      } else {
        addToast('error', data.error || 'Failed to save settings');
      }
    } catch {
      addToast('error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleToggle = async (key: keyof SiteSettings) => {
    const newValue = !settings[key];
    updateSetting(key, newValue as SiteSettings[typeof key]);
    
    // For maintenance mode, save immediately
    if (key === 'maintenanceMode') {
      try {
        const res = await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: newValue }),
        });
        const data = await res.json();
        
        if (data.success) {
          addToast('success', newValue ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
          setHasChanges(false);
        } else {
          // Revert on error
          updateSetting(key, !newValue as SiteSettings[typeof key]);
          addToast('error', data.error || 'Failed to update');
        }
      } catch {
        updateSetting(key, !newValue as SiteSettings[typeof key]);
        addToast('error', 'Failed to update');
      }
    }
  };

  const Toggle = ({ 
    checked, 
    onChange, 
    disabled = false 
  }: { 
    checked: boolean; 
    onChange: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface)]',
        checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              'fixed top-4 left-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2',
              toast.type === 'success' ? 'bg-[#22c55e] text-white' : 'bg-[#ef4444] text-white'
            )}
          >
            {toast.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Configure platform settings and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="warning" size="sm">Unsaved changes</Badge>
          )}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={fetchSettings}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<Save className="h-4 w-4" />}
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="limits">Fees & Limits</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="space-y-6">
            {/* Maintenance Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Maintenance Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">Enable Maintenance Mode</p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Temporarily disable user access during maintenance. Admin panel remains accessible.
                    </p>
                  </div>
                  <Toggle
                    checked={settings.maintenanceMode}
                    onChange={() => handleToggle('maintenanceMode')}
                  />
                </div>

                {settings.maintenanceMode && (
                  <div className="p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-[var(--color-warning)] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[var(--color-warning)]">Maintenance Mode Active</p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        Users are currently seeing the maintenance page. Only admins can access the platform.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    value={settings.maintenanceMessage}
                    onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                    placeholder="Message to display during maintenance..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Deposit Alert Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Deposit Alert Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">Enable Deposit Alerts</p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Receive email notifications when users make deposits
                    </p>
                  </div>
                  <Toggle
                    checked={settings.depositAlertEnabled}
                    onChange={() => {
                      if (!isSuperAdmin) {
                        addToast('error', 'Only super admins can change notification settings');
                        return;
                      }
                      updateSetting('depositAlertEnabled', !settings.depositAlertEnabled);
                    }}
                    disabled={!isSuperAdmin}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Alert Email Address
                    {!isSuperAdmin && (
                      <span className="ml-2 text-xs text-[var(--color-text-muted)]">(Super Admin only)</span>
                    )}
                  </label>
                  <input
                    type="email"
                    value={settings.depositAlertEmail}
                    onChange={(e) => updateSetting('depositAlertEmail', e.target.value)}
                    disabled={!isSuperAdmin}
                    placeholder="admin@oasismarketpro.com"
                    className={cn(
                      'w-full px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
                      !isSuperAdmin && 'opacity-50 cursor-not-allowed'
                    )}
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Professional deposit alerts will be sent to this email for every deposit transaction.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Trading Engine', status: 'Operational', color: 'success' },
                    { label: 'Database', status: 'Operational', color: 'success' },
                    { label: 'Email Service', status: 'Operational', color: 'success' },
                  ].map((item) => (
                    <div key={item.label} className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--color-text-muted)]">{item.label}</span>
                        <Badge variant={item.color as 'success' | 'warning' | 'error'} size="sm">{item.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* KYC for Withdrawals */}
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">Require KYC for Withdrawals</p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Users must complete KYC verification before withdrawing funds
                    </p>
                  </div>
                  <Toggle
                    checked={settings.requireKycForWithdrawal}
                    onChange={() => updateSetting('requireKycForWithdrawal', !settings.requireKycForWithdrawal)}
                  />
                </div>

                {/* Session Timeout */}
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">Auto-Logout Inactive Users</p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Automatically log out users after period of inactivity
                    </p>
                  </div>
                  <Toggle
                    checked={settings.autoLogoutEnabled}
                    onChange={() => updateSetting('autoLogoutEnabled', !settings.autoLogoutEnabled)}
                  />
                </div>

                {settings.autoLogoutEnabled && (
                  <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
                      <label className="text-sm font-medium text-[var(--color-text-primary)]">
                        Session Timeout (minutes)
                      </label>
                    </div>
                    <input
                      type="number"
                      value={settings.sessionTimeoutMinutes}
                      onChange={(e) => updateSetting('sessionTimeoutMinutes', parseInt(e.target.value) || 30)}
                      min={5}
                      max={120}
                      className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                      Users will be logged out after {settings.sessionTimeoutMinutes} minutes of inactivity
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: '2FA Authentication', status: 'Available for all users', enabled: true },
                    { label: 'Email Verification', status: 'Required for registration', enabled: true },
                    { label: 'Login Attempt Limiting', status: '5 attempts before lockout', enabled: true },
                    { label: 'Password Encryption', status: 'bcrypt with salt rounds', enabled: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          item.enabled ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-muted)]'
                        )} />
                        <span className="text-[var(--color-text-primary)]">{item.label}</span>
                      </div>
                      <span className="text-sm text-[var(--color-text-muted)]">{item.status}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fees & Limits Settings */}
        <TabsContent value="limits">
          <div className="space-y-6">
            {/* Withdrawal Limits */}
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Minimum Withdrawal */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                    Minimum Withdrawal Amount
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">$</span>
                    <input
                      type="number"
                      value={settings.withdrawalMinimum}
                      onChange={(e) => updateSetting('withdrawalMinimum', parseFloat(e.target.value) || 0)}
                      min={0}
                      className="w-full pl-8 pr-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Users cannot withdraw less than this amount
                  </p>
                </div>

                <div className="border-t border-[var(--color-border)] pt-4">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] mb-4">Daily & Monthly Limits</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                        Daily Limit (Unverified)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">$</span>
                        <input
                          type="number"
                          value={settings.withdrawalDailyLimitUnverified}
                          onChange={(e) => updateSetting('withdrawalDailyLimitUnverified', parseFloat(e.target.value) || 0)}
                          min={0}
                          className="w-full pl-8 pr-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                        Daily Limit (Verified)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">$</span>
                        <input
                          type="number"
                          value={settings.withdrawalDailyLimitVerified}
                          onChange={(e) => updateSetting('withdrawalDailyLimitVerified', parseFloat(e.target.value) || 0)}
                          min={0}
                          className="w-full pl-8 pr-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                        Monthly Limit (Unverified)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">$</span>
                        <input
                          type="number"
                          value={settings.withdrawalMonthlyLimitUnverified}
                          onChange={(e) => updateSetting('withdrawalMonthlyLimitUnverified', parseFloat(e.target.value) || 0)}
                          min={0}
                          className="w-full pl-8 pr-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                        Monthly Limit (Verified)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">$</span>
                        <input
                          type="number"
                          value={settings.withdrawalMonthlyLimitVerified}
                          onChange={(e) => updateSetting('withdrawalMonthlyLimitVerified', parseFloat(e.target.value) || 0)}
                          min={0}
                          className="w-full pl-8 pr-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deposit Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Deposit Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                      Minimum Deposit
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">$</span>
                      <input
                        type="number"
                        value={settings.depositMinimum}
                        onChange={(e) => updateSetting('depositMinimum', parseFloat(e.target.value) || 0)}
                        min={0}
                        className="w-full pl-8 pr-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                      Maximum Deposit
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">$</span>
                      <input
                        type="number"
                        value={settings.depositMaximum}
                        onChange={(e) => updateSetting('depositMaximum', parseFloat(e.target.value) || 0)}
                        min={0}
                        className="w-full pl-8 pr-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    <strong className="text-[var(--color-text-primary)]">Note:</strong> Deposits are crypto-only. 
                    These limits will be enforced when users initiate deposit transactions.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Limits Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Limits Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-muted)]">Type</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[var(--color-text-muted)]">Unverified</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[var(--color-text-muted)]">Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[var(--color-border)]">
                        <td className="py-3 px-4 text-[var(--color-text-primary)]">Daily Withdrawal</td>
                        <td className="py-3 px-4 text-right text-[var(--color-text-primary)]">${settings.withdrawalDailyLimitUnverified.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-[var(--color-success)]">${settings.withdrawalDailyLimitVerified.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b border-[var(--color-border)]">
                        <td className="py-3 px-4 text-[var(--color-text-primary)]">Monthly Withdrawal</td>
                        <td className="py-3 px-4 text-right text-[var(--color-text-primary)]">${settings.withdrawalMonthlyLimitUnverified.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-[var(--color-success)]">${settings.withdrawalMonthlyLimitVerified.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-[var(--color-text-primary)]">Deposit Range</td>
                        <td colSpan={2} className="py-3 px-4 text-right text-[var(--color-text-primary)]">
                          ${settings.depositMinimum.toLocaleString()} - ${settings.depositMaximum.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
