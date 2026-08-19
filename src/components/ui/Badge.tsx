'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils';

// ============================================
// Badge Component
// ============================================

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  icon?: React.ReactNode;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      dot = false,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center gap-1.5',
      'font-medium rounded-full whitespace-nowrap'
    );

    const variants = {
      default: cn(
        'bg-[var(--color-surface-elevated)]',
        'text-[var(--color-text-secondary)]'
      ),
      primary: cn(
        'bg-[var(--color-primary-muted)]',
        'text-[var(--color-primary)]'
      ),
      success: cn(
        'bg-[var(--color-success-bg)]',
        'text-[var(--color-success)]'
      ),
      warning: cn(
        'bg-[var(--color-warning-bg)]',
        'text-[var(--color-warning)]'
      ),
      error: cn(
        'bg-[var(--color-error-bg)]',
        'text-[var(--color-error)]'
      ),
      info: cn(
        'bg-[var(--color-info-bg)]',
        'text-[var(--color-info)]'
      ),
      outline: cn(
        'bg-transparent',
        'border border-[var(--color-border)]',
        'text-[var(--color-text-secondary)]'
      ),
    };

    const sizes = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-xs px-2.5 py-1',
      lg: 'text-sm px-3 py-1.5',
    };

    const dotColors = {
      default: 'bg-[var(--color-text-muted)]',
      primary: 'bg-[var(--color-primary)]',
      success: 'bg-[var(--color-success)]',
      warning: 'bg-[var(--color-warning)]',
      error: 'bg-[var(--color-error)]',
      info: 'bg-[var(--color-info)]',
      outline: 'bg-[var(--color-text-muted)]',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              dotColors[variant]
            )}
          />
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// ============================================
// Status Badge Component (Specialized)
// ============================================

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  processing: { variant: 'info', label: 'Processing' },
  completed: { variant: 'success', label: 'Completed' },
  active: { variant: 'success', label: 'Active' },
  approved: { variant: 'success', label: 'Approved' },
  failed: { variant: 'error', label: 'Failed' },
  rejected: { variant: 'error', label: 'Rejected' },
  cancelled: { variant: 'default', label: 'Cancelled' },
  suspended: { variant: 'warning', label: 'Suspended' },
  banned: { variant: 'error', label: 'Banned' },
  verified: { variant: 'success', label: 'Verified' },
  unverified: { variant: 'warning', label: 'Unverified' },
  open: { variant: 'primary', label: 'Open' },
  closed: { variant: 'default', label: 'Closed' },
  funded: { variant: 'success', label: 'Funded' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusMap[status.toLowerCase()] || {
    variant: 'default' as const,
    label: status,
  };

  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
    </Badge>
  );
};

export { Badge, StatusBadge };
