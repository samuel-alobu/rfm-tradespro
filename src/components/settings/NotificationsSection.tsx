'use client';

import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  TrendingUp,
  Wallet,
  Users,
  Radio,
  Shield,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';

// ============================================
// Notifications Section Component
// ============================================

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  email: boolean;
  push: boolean;
}

const defaultSettings: NotificationSetting[] = [
  {
    id: 'trades',
    title: 'Trade Executions',
    description: 'Notifications when your trades are executed',
    icon: <TrendingUp className="h-5 w-5" />,
    email: true,
    push: true,
  },
  {
    id: 'deposits',
    title: 'Deposits & Withdrawals',
    description: 'Notifications for account transactions',
    icon: <Wallet className="h-5 w-5" />,
    email: true,
    push: true,
  },
  {
    id: 'signals',
    title: 'Trading Signals',
    description: 'New signal alerts and updates',
    icon: <Radio className="h-5 w-5" />,
    email: true,
    push: true,
  },
  {
    id: 'copy-trading',
    title: 'Copy Trading',
    description: 'Updates from traders you follow',
    icon: <Users className="h-5 w-5" />,
    email: false,
    push: true,
  },
  {
    id: 'security',
    title: 'Security Alerts',
    description: 'Login attempts and security changes',
    icon: <Shield className="h-5 w-5" />,
    email: true,
    push: true,
  },
  {
    id: 'marketing',
    title: 'Marketing & Promotions',
    description: 'News, updates, and special offers',
    icon: <Bell className="h-5 w-5" />,
    email: false,
    push: false,
  },
];

export const NotificationsSection: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleSetting = (id: string, type: 'email' | 'push') => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, [type]: !setting[type] } : setting
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const enableAll = () => {
    setSettings((prev) =>
      prev.map((setting) => ({ ...setting, email: true, push: true }))
    );
  };

  const disableAll = () => {
    setSettings((prev) =>
      prev.map((setting) => ({ ...setting, email: false, push: false }))
    );
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <p className="text-[var(--color-text-primary)]">Quick Actions</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={enableAll}>
                Enable All
              </Button>
              <Button variant="secondary" size="sm" onClick={disableAll}>
                Disable All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 pb-3 mb-4 border-b border-[var(--color-border)]">
            <div className="col-span-8">
              <span className="text-sm font-medium text-[var(--color-text-muted)]">
                Notification Type
              </span>
            </div>
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Mail className="h-4 w-4 text-[var(--color-text-muted)]" />
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  Email
                </span>
              </div>
            </div>
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Smartphone className="h-4 w-4 text-[var(--color-text-muted)]" />
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  Push
                </span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="grid grid-cols-12 gap-4 items-center py-3"
              >
                <div className="col-span-8 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-text-muted)]">
                    {setting.icon}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {setting.title}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {setting.description}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <button
                    onClick={() => toggleSetting(setting.id, 'email')}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors',
                      setting.email
                        ? 'bg-[var(--color-primary)]'
                        : 'bg-[var(--color-border)]'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
                        setting.email && 'translate-x-5'
                      )}
                    />
                  </button>
                </div>
                <div className="col-span-2 flex justify-center">
                  <button
                    onClick={() => toggleSetting(setting.id, 'push')}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors',
                      setting.push
                        ? 'bg-[var(--color-primary)]'
                        : 'bg-[var(--color-border)]'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
                        setting.push && 'translate-x-5'
                      )}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-[var(--color-border)]">
            {saved && (
              <div className="flex items-center gap-2 text-[var(--color-success)]">
                <Check className="h-4 w-4" />
                <span className="text-sm">Settings saved</span>
              </div>
            )}
            <Button onClick={handleSave} isLoading={isSaving}>
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                Daily Summary
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Receive a daily summary of your portfolio activity
              </p>
            </div>
            <button
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors bg-[var(--color-primary)]'
              )}
            >
              <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white translate-x-5" />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                Weekly Report
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Receive a weekly performance report
              </p>
            </div>
            <button
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors bg-[var(--color-primary)]'
              )}
            >
              <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white translate-x-5" />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                Price Alerts
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Get notified when assets hit your target prices
              </p>
            </div>
            <button
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors bg-[var(--color-border)]'
              )}
            >
              <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsSection;
