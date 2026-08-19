'use client';

import React, { forwardRef, useState, useId } from 'react';
import { cn } from '@/utils';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

// ============================================
// Input Component
// ============================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      hint,
      success,
      leftIcon,
      rightIcon,
      fullWidth = true,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const isPassword = type === 'password';

    const inputStyles = cn(
      'w-full h-11 px-4 text-sm',
      'bg-[var(--color-surface)] text-[var(--color-text-primary)]',
      'border rounded-lg transition-all duration-200',
      'placeholder:text-[var(--color-text-muted)]',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      leftIcon && 'pl-11',
      (rightIcon || isPassword) && 'pr-11',
      error
        ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
        : success
        ? 'border-[var(--color-success)] focus:border-[var(--color-success)] focus:ring-[var(--color-success)]/20'
        : 'border-[var(--color-border)] hover:border-[var(--color-border-light)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20',
      disabled && 'opacity-50 cursor-not-allowed bg-[var(--color-surface-elevated)]'
    );

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            className={cn(inputStyles, className)}
            disabled={disabled}
            {...props}
          />
          
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
          
          {!isPassword && rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {rightIcon}
            </div>
          )}
          
          {error && !isPassword && !rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-error)]">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
          
          {success && !error && !isPassword && !rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-success)]">
              <CheckCircle className="h-4 w-4" />
            </div>
          )}
        </div>
        
        {(error || hint) && (
          <p
            className={cn(
              'text-xs',
              error ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================
// Textarea Component
// ============================================

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      fullWidth = true,
      disabled,
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `textarea-${generatedId}`;

    const textareaStyles = cn(
      'w-full px-4 py-3 text-sm',
      'bg-[var(--color-surface)] text-[var(--color-text-primary)]',
      'border rounded-lg transition-all duration-200',
      'placeholder:text-[var(--color-text-muted)]',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'resize-none',
      error
        ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
        : 'border-[var(--color-border)] hover:border-[var(--color-border-light)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20',
      disabled && 'opacity-50 cursor-not-allowed bg-[var(--color-surface-elevated)]'
    );

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={inputId}
          className={cn(textareaStyles, className)}
          disabled={disabled}
          rows={rows}
          {...props}
        />
        
        {(error || hint) && (
          <p
            className={cn(
              'text-xs',
              error ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Input, Textarea };
