'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';

// ============================================
// Button Component
// ============================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center gap-2',
      'font-medium rounded-lg transition-all duration-200',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'focus-visible:ring-offset-[var(--color-background)]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-[0.98]'
    );

    const variants = {
      primary: cn(
        'bg-[var(--color-primary)] text-[var(--color-background)]',
        'hover:bg-[var(--color-primary-hover)]',
        'focus-visible:ring-[var(--color-primary)]',
        'shadow-sm hover:shadow-md'
      ),
      secondary: cn(
        'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]',
        'border border-[var(--color-border)]',
        'hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-light)]',
        'focus-visible:ring-[var(--color-border-light)]'
      ),
      outline: cn(
        'bg-transparent text-[var(--color-primary)]',
        'border border-[var(--color-primary)]',
        'hover:bg-[var(--color-primary)] hover:text-[var(--color-background)]',
        'focus-visible:ring-[var(--color-primary)]'
      ),
      ghost: cn(
        'bg-transparent text-[var(--color-text-secondary)]',
        'hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]',
        'focus-visible:ring-[var(--color-border)]'
      ),
      danger: cn(
        'bg-[var(--color-error)] text-white',
        'hover:bg-red-600',
        'focus-visible:ring-[var(--color-error)]'
      ),
      success: cn(
        'bg-[var(--color-success)] text-[var(--color-background)]',
        'hover:bg-green-600',
        'focus-visible:ring-[var(--color-success)]'
      ),
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-6 text-sm',
      xl: 'h-12 px-8 text-base',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
