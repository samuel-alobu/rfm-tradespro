'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Download,
  Calendar,
  PieChart,
  Activity,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatCurrency } from '@/utils';

// ============================================
// Admin Reports Page
// ============================================

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState('30d');

  const stats = [
    { label: 'Total Revenue', value: '$1,245,890', change: 12.5, trend: 'up' },
    { label: 'Trading Volume', value: '$84.2M', change: 8.2, trend: 'up' },
    { label: 'New Users', value: '2,456', change: 15.3, trend: 'up' },
    { label: 'Active Traders', value: '8,234', change: -2.4, trend: 'down' },
  ];

  const reports = [
    { name: 'Monthly Revenue Report', type: 'Financial', date: 'Mar 2026', size: '2.4 MB' },
    { name: 'User Growth Analysis', type: 'Analytics', date: 'Mar 2026', size: '1.8 MB' },
    { name: 'Trading Volume Summary', type: 'Trading', date: 'Mar 2026', size: '3.2 MB' },
    { name: 'KYC Compliance Report', type: 'Compliance', date: 'Mar 2026', size: '1.1 MB' },
    { name: 'Fee Collection Report', type: 'Financial', date: 'Mar 2026', size: '0.9 MB' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Reports</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Platform analytics and reporting</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export All
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-[var(--color-text-muted)] mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">{stat.value}</p>
                <div className={cn(
                  'flex items-center gap-1 text-sm',
                  stat.trend === 'up' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                )}>
                  {stat.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{Math.abs(stat.change)}% vs last period</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {[65, 45, 78, 52, 88, 72, 95, 68, 82, 75, 90, 85].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-[var(--color-primary)] rounded-t transition-all hover:bg-[var(--color-primary-dark)]"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              User Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="relative h-48 w-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-surface-elevated)" strokeWidth="20" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-primary)" strokeWidth="20" strokeDasharray="125.6 251.2" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-success)" strokeWidth="20" strokeDasharray="75.4 251.2" strokeDashoffset="-125.6" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-warning)" strokeWidth="20" strokeDasharray="50.2 251.2" strokeDashoffset="-201" />
                </svg>
              </div>
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[var(--color-primary)]" />
                  <span className="text-sm text-[var(--color-text-muted)]">Active (50%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[var(--color-success)]" />
                  <span className="text-sm text-[var(--color-text-muted)]">Verified (30%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[var(--color-warning)]" />
                  <span className="text-sm text-[var(--color-text-muted)]">Pending (20%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Generated Reports</CardTitle>
          <Button variant="secondary" size="sm">Generate New</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-muted)] flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">{report.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{report.type} • {report.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[var(--color-text-muted)]">{report.size}</span>
                  <Button variant="ghost" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
