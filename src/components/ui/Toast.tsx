'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { cn } from '@/utils';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// ============================================
// Toast Types
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================
// Toast Store
// ============================================

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clearAllToasts: () => {
    set({ toasts: [] });
  },
}));

// ============================================
// Toast Helper Functions
// ============================================

export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) => {
    useToastStore.getState().addToast({ type: 'success', title, message, ...options });
  },
  error: (title: string, message?: string, options?: Partial<Toast>) => {
    useToastStore.getState().addToast({ type: 'error', title, message, ...options });
  },
  warning: (title: string, message?: string, options?: Partial<Toast>) => {
    useToastStore.getState().addToast({ type: 'warning', title, message, ...options });
  },
  info: (title: string, message?: string, options?: Partial<Toast>) => {
    useToastStore.getState().addToast({ type: 'info', title, message, ...options });
  },
};

// ============================================
// Toast Item Component
// ============================================

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-[var(--color-success)]" />,
    error: <AlertCircle className="h-5 w-5 text-[var(--color-error)]" />,
    warning: <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" />,
    info: <Info className="h-5 w-5 text-[var(--color-info)]" />,
  };

  const borderColors = {
    success: 'border-l-[var(--color-success)]',
    error: 'border-l-[var(--color-error)]',
    warning: 'border-l-[var(--color-warning)]',
    info: 'border-l-[var(--color-info)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'w-80 pointer-events-auto',
        'bg-[var(--color-surface-elevated)]',
        'border border-[var(--color-border)] border-l-4',
        'rounded-lg shadow-xl',
        'overflow-hidden',
        borderColors[toast.type]
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {toast.message}
              </p>
            )}
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  onRemove();
                }}
                className="mt-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                {toast.action.label}
              </button>
            )}
          </div>

          <button
            onClick={onRemove}
            className="shrink-0 p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// Toast Container Component
// ============================================

export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const ToastContainer: React.FC<ToastContainerProps> = ({ position = 'top-right' }) => {
  const { toasts, removeToast } = useToastStore();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return createPortal(
    <div
      className={cn(
        'fixed z-[var(--z-toast)]',
        'flex flex-col gap-3',
        'pointer-events-none',
        positions[position]
      )}
    >
      <AnimatePresence mode="sync">
        {toasts.map((toastItem) => (
          <ToastItem
            key={toastItem.id}
            toast={toastItem}
            onRemove={() => removeToast(toastItem.id)}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export { ToastContainer };
