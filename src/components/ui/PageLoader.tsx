'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

// ============================================
// Page Loader Component
// ============================================

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Loading...',
  fullScreen = false,
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center',
      fullScreen ? 'fixed inset-0 bg-[var(--color-background)] z-50' : 'py-20'
    )}>
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className="h-16 w-16 rounded-full border-4 border-[var(--color-surface-elevated)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
        {/* Spinning ring */}
        <motion.div
          className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-[var(--color-primary)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        {/* Inner pulse */}
        <motion.div
          className="absolute inset-3 rounded-full bg-[var(--color-primary-muted)]"
          animate={{ scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <motion.p
        className="mt-4 text-sm text-[var(--color-text-muted)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.p>
    </div>
  );
};

// ============================================
// Skeleton Components
// ============================================

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn(
      'animate-pulse bg-[var(--color-surface-elevated)] rounded',
      className
    )}
  />
);

export const SkeletonCard: React.FC = () => (
  <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-8 w-full mb-3" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
    <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-4 border-b border-[var(--color-border)] last:border-0">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-6 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-12 rounded-lg" />
        <Skeleton className="h-8 w-12 rounded-lg" />
        <Skeleton className="h-8 w-12 rounded-lg" />
      </div>
    </div>
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

// ============================================
// Empty State Component
// ============================================

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <motion.div
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="h-16 w-16 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center mb-4 text-[var(--color-text-muted)]">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
      {title}
    </h3>
    <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-4">
      {description}
    </p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
      >
        {action.label}
      </button>
    )}
  </motion.div>
);

export default PageLoader;
