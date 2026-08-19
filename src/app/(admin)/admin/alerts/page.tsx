'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  Bell,
  Settings,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';

// ============================================
// Admin Alerts Page
// ============================================

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: string;
}

const mockAlerts: Alert[] = [
  { id: '1', type: 'critical', title: 'High withdrawal volume detected', message: 'Unusual withdrawal activity from multiple accounts. Total: $450,000 in the last hour.', timestamp: new Date(Date.now() - 10 * 60 * 1000), read: false, category: 'Security' },
  { id: '2', type: 'warning', title: 'Payment gateway latency', message: 'Credit card processing is experiencing delays. Average response time: 5.2s', timestamp: new Date(Date.now() - 30 * 60 * 1000), read: false, category: 'System' },
  { id: '3', type: 'info', title: 'Scheduled maintenance', message: 'System maintenance scheduled for tonight 2:00 AM - 4:00 AM UTC', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), read: true, category: 'System' },
  { id: '4', type: 'warning', title: 'KYC backlog increasing', message: '45 KYC verifications pending for more than 24 hours', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), read: true, category: 'Compliance' },
  { id: '5', type: 'success', title: 'Daily backup completed', message: 'All databases successfully backed up to secondary servers', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), read: true, category: 'System' },
  { id: '6', type: 'critical', title: 'Suspicious login attempts', message: '15 failed login attempts detected from IP 192.168.1.100', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), read: true, category: 'Security' },
];

const alertIcons = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
  success: CheckCircle,
};

const alertColors = {
  critical: { bg: 'bg-[var(--color-error-bg)]', text: 'text-[var(--color-error)]', border: 'border-[var(--color-error)]' },
  warning: { bg: 'bg-[var(--color-warning-bg)]', text: 'text-[var(--color-warning)]', border: 'border-[var(--color-warning)]' },
  info: { bg: 'bg-[var(--color-info-bg)]', text: 'text-[var(--color-info)]', border: 'border-[var(--color-info)]' },
  success: { bg: 'bg-[var(--color-success-bg)]', text: 'text-[var(--color-success)]', border: 'border-[var(--color-success)]' },
};

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [filter, setFilter] = useState<string>('all');

  const unreadCount = alerts.filter((a) => !a.read).length;
  const criticalCount = alerts.filter((a) => a.type === 'critical' && !a.read).length;

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !alert.read;
    return alert.type === filter;
  });

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return date.toLocaleDateString();
  };

  const markAsRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">System Alerts</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Monitor and manage platform alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Settings className="h-4 w-4" />}>
            Alert Settings
          </Button>
          <Button variant="secondary" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={criticalCount > 0 ? 'border-[var(--color-error)]' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[var(--color-error-bg)] flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-[var(--color-error)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-error)]">{criticalCount}</p>
                <p className="text-sm text-[var(--color-text-muted)]">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[var(--color-warning-bg)] flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-[var(--color-warning)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {alerts.filter((a) => a.type === 'warning').length}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[var(--color-info-bg)] flex items-center justify-center">
                <Bell className="h-5 w-5 text-[var(--color-info)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{unreadCount}</p>
                <p className="text-sm text-[var(--color-text-muted)]">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[var(--color-success-bg)] flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-[var(--color-success)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{alerts.length}</p>
                <p className="text-sm text-[var(--color-text-muted)]">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'unread', 'critical', 'warning', 'info', 'success'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize',
                  filter === f
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert, index) => {
          const Icon = alertIcons[alert.type];
          const colors = alertColors[alert.type];

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card className={cn(!alert.read && `border-l-4 ${colors.border}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', colors.bg)}>
                      <Icon className={cn('h-5 w-5', colors.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={cn('font-medium', !alert.read ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]')}>
                              {alert.title}
                            </h3>
                            {!alert.read && <Badge variant="primary" size="sm">New</Badge>}
                          </div>
                          <p className="text-sm text-[var(--color-text-muted)] mt-1">{alert.message}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="default" size="sm">{alert.category}</Badge>
                            <span className="text-xs text-[var(--color-text-muted)]">{formatTime(alert.timestamp)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!alert.read && (
                            <Button variant="ghost" size="sm" onClick={() => markAsRead(alert.id)}>
                              Mark Read
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => dismissAlert(alert.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3" />
              <p className="text-[var(--color-text-muted)]">No alerts found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
