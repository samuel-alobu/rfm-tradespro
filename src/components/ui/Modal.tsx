'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

// ============================================
// Modal Component
// ============================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
  footer,
  className,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTab = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTab);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTab);
      };
    }
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[var(--z-modal)]">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleOverlayClick}
          />

          {/* Modal Container */}
          <div
            className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto"
            onClick={handleOverlayClick}
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'relative w-full',
                'bg-[var(--color-surface)]',
                'border border-[var(--color-border)]',
                'rounded-xl shadow-xl',
                sizes[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-start justify-between gap-4 p-5 border-b border-[var(--color-border)]">
                  <div className="flex flex-col gap-1">
                    {title && (
                      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {description}
                      </p>
                    )}
                  </div>
                  {showCloseButton && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="shrink-0 -mr-2 -mt-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="p-5">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--color-border)]">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ============================================
// Confirmation Modal Component
// ============================================

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const buttonVariants = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    info: 'primary' as const,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={buttonVariants[variant]}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
    </Modal>
  );
};

// ============================================
// Slide Over (Side Panel) Component
// ============================================

export interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  description,
  position = 'right',
  size = 'md',
  showCloseButton = true,
  children,
  footer,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const slideVariants = {
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
    },
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
    },
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[var(--z-modal)]">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={slideVariants[position].initial}
            animate={slideVariants[position].animate}
            exit={slideVariants[position].exit}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
              'absolute top-0 bottom-0 w-full',
              'bg-[var(--color-surface)]',
              'border-l border-[var(--color-border)]',
              'flex flex-col',
              sizes[size],
              position === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 p-5 border-b border-[var(--color-border)]">
                <div className="flex flex-col gap-1">
                  {title && (
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--color-border)]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export { Modal, ConfirmModal, SlideOver };
