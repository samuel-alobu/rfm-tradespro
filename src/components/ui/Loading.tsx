'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';

// ============================================
// Skeleton Component
// ============================================

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = 'default',
      width,
      height,
      animate = true,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'bg-[var(--color-surface-elevated)]',
      animate && 'animate-pulse'
    );

    const variants = {
      default: 'rounded-md',
      circular: 'rounded-full',
      text: 'rounded h-4 w-full',
      rectangular: 'rounded-none',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// ============================================
// Spinner Component
// ============================================

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'muted';
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', color = 'primary', ...props }, ref) => {
    const sizes = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-8 w-8',
    };

    const colors = {
      primary: 'text-[var(--color-primary)]',
      white: 'text-white',
      muted: 'text-[var(--color-text-muted)]',
    };

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center justify-center', className)}
        {...props}
      >
        <Loader2 className={cn('animate-spin', sizes[size], colors[color])} />
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

// ============================================
// Loading Overlay Component
// ============================================

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading: boolean;
  text?: string;
  blur?: boolean;
}

const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ className, isLoading, text, blur = true, children, ...props }, ref) => {
    if (!isLoading) return <>{children}</>;

    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <div className={cn(blur && 'blur-sm pointer-events-none')}>{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-background)]/60 backdrop-blur-sm rounded-lg">
          <Spinner size="lg" />
          {text && (
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

// ============================================
// Page Loader Component
// ============================================

export interface PageLoaderProps {
  text?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ text = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-background)]">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Logo */}
        <div className="relative">
          <div className="h-16 w-16 rounded-xl bg-[var(--color-primary)] flex items-center justify-center animate-pulse">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8 text-[var(--color-background)]"
            >
              <path
                d="M3 17L9 11L13 15L21 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 7H21V11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="absolute -inset-1 rounded-xl bg-[var(--color-primary)]/20 animate-ping" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            RFM TradePro
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">{text}</p>
        </div>

        {/* Loading Bar */}
        <div className="w-48 h-1 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-[var(--color-primary)] animate-[loading-bar_1s_ease-in-out_infinite]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(200%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
};

// ============================================
// Skeleton Variants for Common Use Cases
// ============================================

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]', className)}>
    <div className="flex items-start gap-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton height={16} width="60%" />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton height={12} />
      <Skeleton height={12} width="80%" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className,
}) => (
  <div className={cn('space-y-3', className)}>
    <div className="flex gap-4 pb-3 border-b border-[var(--color-border)]">
      <Skeleton height={14} width="20%" />
      <Skeleton height={14} width="25%" />
      <Skeleton height={14} width="20%" />
      <Skeleton height={14} width="15%" />
      <Skeleton height={14} width="20%" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3">
        <Skeleton height={14} width="20%" />
        <Skeleton height={14} width="25%" />
        <Skeleton height={14} width="20%" />
        <Skeleton height={14} width="15%" />
        <Skeleton height={14} width="20%" />
      </div>
    ))}
  </div>
);

export { Skeleton, Spinner, LoadingOverlay, PageLoader };
