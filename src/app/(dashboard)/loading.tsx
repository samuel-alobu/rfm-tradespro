import React from 'react';

// ============================================
// Dashboard Loading Page
// ============================================

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-[var(--color-surface-elevated)] rounded-lg mb-2" />
          <div className="h-4 w-64 bg-[var(--color-surface-elevated)] rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-[var(--color-surface-elevated)] rounded-lg" />
          <div className="h-10 w-24 bg-[var(--color-surface-elevated)] rounded-lg" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-[var(--color-surface-elevated)] rounded-lg" />
              <div className="h-4 w-20 bg-[var(--color-surface-elevated)] rounded" />
            </div>
            <div className="h-8 w-32 bg-[var(--color-surface-elevated)] rounded" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart area */}
        <div className="lg:col-span-2 p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-32 bg-[var(--color-surface-elevated)] rounded" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-12 bg-[var(--color-surface-elevated)] rounded-lg" />
              ))}
            </div>
          </div>
          <div className="h-64 bg-[var(--color-surface-elevated)] rounded-xl" />
        </div>

        {/* Sidebar area */}
        <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
          <div className="h-6 w-24 bg-[var(--color-surface-elevated)] rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[var(--color-surface-elevated)] rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-[var(--color-surface-elevated)] rounded mb-1" />
                  <div className="h-3 w-16 bg-[var(--color-surface-elevated)] rounded" />
                </div>
                <div className="h-4 w-16 bg-[var(--color-surface-elevated)] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
        <div className="h-6 w-32 bg-[var(--color-surface-elevated)] rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--color-border)] last:border-0">
              <div className="h-10 w-10 bg-[var(--color-surface-elevated)] rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-[var(--color-surface-elevated)] rounded mb-1" />
                <div className="h-3 w-20 bg-[var(--color-surface-elevated)] rounded" />
              </div>
              <div className="h-4 w-20 bg-[var(--color-surface-elevated)] rounded" />
              <div className="h-4 w-16 bg-[var(--color-surface-elevated)] rounded" />
              <div className="h-4 w-12 bg-[var(--color-surface-elevated)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
