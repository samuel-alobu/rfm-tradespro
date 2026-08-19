'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';
import { Check, ChevronDown, Search } from 'lucide-react';

// ============================================
// Select Component
// ============================================

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  searchable = false,
  className,
  fullWidth = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedValue = value !== undefined ? value : internalValue;
  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const filteredOptions = searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (value === undefined) {
        setInternalValue(optionValue);
      }
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    },
    [value, onChange]
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (event.key === 'Enter' && !isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative', fullWidth && 'w-full', className)}
    >
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'w-full h-11 px-4',
          'flex items-center justify-between gap-2',
          'bg-[var(--color-surface)]',
          'border rounded-lg',
          'text-sm text-left',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          isOpen && 'ring-2 ring-[var(--color-primary)]/20 border-[var(--color-primary)]',
          error
            ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
            : 'border-[var(--color-border)] hover:border-[var(--color-border-light)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'flex items-center gap-2 truncate',
            selectedOption
              ? 'text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-muted)]'
          )}
        >
          {selectedOption?.icon}
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 w-full mt-1',
              'bg-[var(--color-surface-elevated)]',
              'border border-[var(--color-border)]',
              'rounded-lg shadow-xl',
              'overflow-hidden'
            )}
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-[var(--color-border)]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className={cn(
                      'w-full h-9 pl-9 pr-3',
                      'bg-[var(--color-surface)]',
                      'border border-[var(--color-border)]',
                      'rounded-md text-sm',
                      'placeholder:text-[var(--color-text-muted)]',
                      'focus:outline-none focus:border-[var(--color-primary)]'
                    )}
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[var(--color-text-muted)] text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'w-full px-4 py-2.5',
                      'flex items-center justify-between gap-2',
                      'text-sm text-left',
                      'transition-colors duration-150',
                      option.value === selectedValue
                        ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {option.icon}
                      {option.label}
                    </span>
                    {option.value === selectedValue && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-xs text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
};

// ============================================
// Multi-Select Component
// ============================================

export interface MultiSelectProps {
  options: SelectOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  maxSelections?: number;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  defaultValue = [],
  onChange,
  placeholder = 'Select options',
  label,
  error,
  disabled = false,
  maxSelections,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedValues = value !== undefined ? value : internalValue;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (optionValue: string) => {
    let newValues: string[];

    if (selectedValues.includes(optionValue)) {
      newValues = selectedValues.filter((v) => v !== optionValue);
    } else {
      if (maxSelections && selectedValues.length >= maxSelections) {
        return;
      }
      newValues = [...selectedValues, optionValue];
    }

    if (value === undefined) {
      setInternalValue(newValues);
    }
    onChange?.(newValues);
  };

  const selectedLabels = selectedValues
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full min-h-[44px] px-4 py-2',
          'flex items-center justify-between gap-2',
          'bg-[var(--color-surface)]',
          'border rounded-lg',
          'text-sm text-left',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          isOpen && 'ring-2 ring-[var(--color-primary)]/20 border-[var(--color-primary)]',
          error
            ? 'border-[var(--color-error)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-border-light)]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'truncate',
            selectedValues.length > 0
              ? 'text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-muted)]'
          )}
        >
          {selectedValues.length > 0 ? selectedLabels : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 w-full mt-1',
              'bg-[var(--color-surface-elevated)]',
              'border border-[var(--color-border)]',
              'rounded-lg shadow-xl',
              'max-h-60 overflow-y-auto py-1'
            )}
          >
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              const isDisabled =
                option.disabled ||
                (!isSelected &&
                  maxSelections !== undefined &&
                  selectedValues.length >= maxSelections);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !isDisabled && handleToggle(option.value)}
                  disabled={isDisabled}
                  className={cn(
                    'w-full px-4 py-2.5',
                    'flex items-center justify-between gap-2',
                    'text-sm text-left',
                    'transition-colors duration-150',
                    isSelected
                      ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    {option.icon}
                    {option.label}
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-1.5 text-xs text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
};

export { Select, MultiSelect };
