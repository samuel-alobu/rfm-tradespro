'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils';

// ============================================
// Card Component
// ============================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hover = false,
      clickable = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-xl transition-all duration-200';

    const variants = {
      default: cn(
        'bg-[var(--color-surface)]',
        'border border-[var(--color-border)]'
      ),
      elevated: cn(
        'bg-[var(--color-surface-elevated)]',
        'border border-[var(--color-border)]',
        'shadow-md'
      ),
      outlined: cn(
        'bg-transparent',
        'border border-[var(--color-border)]'
      ),
      glass: cn(
        'bg-[var(--color-surface)]/80',
        'backdrop-blur-xl',
        'border border-[var(--color-border)]/50'
      ),
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    };

    const hoverStyles = hover
      ? 'hover:border-[var(--color-border-light)] hover:bg-[var(--color-surface-elevated)]'
      : '';

    const clickableStyles = clickable
      ? 'cursor-pointer active:scale-[0.99]'
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          hoverStyles,
          clickableStyles,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================
// Card Header Component
// ============================================

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-4 mb-4', className)}
        {...props}
      >
        {children || (
          <>
            <div className="flex flex-col gap-1">
              {title && (
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-[var(--color-text-muted)]">
                  {description}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </>
        )}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// ============================================
// Card Content Component
// ============================================

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// ============================================
// Card Footer Component
// ============================================

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 mt-4 pt-4',
          'border-t border-[var(--color-border)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// ============================================
// Card Title Component
// ============================================

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold text-[var(--color-text-primary)]', className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = 'CardTitle';

// ============================================
// Card Description Component
// ============================================

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-[var(--color-text-muted)]', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription };
