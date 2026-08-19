'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

// ============================================
// Tabs Context
// ============================================

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs component');
  }
  return context;
};

// ============================================
// Tabs Root Component
// ============================================

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalValue;

  const setActiveTab = useCallback(
    (id: string) => {
      if (value === undefined) {
        setInternalValue(id);
      }
      onValueChange?.(id);
    },
    [value, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

// ============================================
// Tabs List Component
// ============================================

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

const TabsList: React.FC<TabsListProps> = ({
  children,
  className,
  variant = 'default',
}) => {
  const variants = {
    default: cn(
      'inline-flex items-center gap-1 p-1',
      'bg-[var(--color-surface-elevated)]',
      'border border-[var(--color-border)]',
      'rounded-lg'
    ),
    pills: 'inline-flex items-center gap-2',
    underline: cn(
      'flex items-center gap-6',
      'border-b border-[var(--color-border)]'
    ),
  };

  return (
    <div className={cn(variants[variant], className)} role="tablist">
      {children}
    </div>
  );
};

// ============================================
// Tabs Trigger Component
// ============================================

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'pills' | 'underline';
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className,
  disabled = false,
  variant = 'default',
}) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  const baseStyles = cn(
    'relative inline-flex items-center justify-center',
    'text-sm font-medium transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  const variants = {
    default: cn(
      'px-3 py-1.5 rounded-md',
      isActive
        ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
    ),
    pills: cn(
      'px-4 py-2 rounded-full',
      isActive
        ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
        : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
    ),
    underline: cn(
      'pb-3 -mb-px',
      isActive
        ? 'text-[var(--color-primary)]'
        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
    ),
  };

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={cn(baseStyles, variants[variant], className)}
    >
      {children}
      
      {/* Underline indicator */}
      {variant === 'underline' && isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
          transition={{ duration: 0.2 }}
        />
      )}
    </button>
  );
};

// ============================================
// Tabs Content Component
// ============================================

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  forceMount?: boolean;
}

const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className,
  forceMount = false,
}) => {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive && !forceMount) {
    return null;
  }

  return (
    <motion.div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      hidden={!isActive}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
      transition={{ duration: 0.2 }}
      className={cn('mt-4 focus:outline-none', className)}
      tabIndex={0}
    >
      {children}
    </motion.div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
