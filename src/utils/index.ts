import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================
// Class Name Utilities
// ============================================

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================
// Formatting Utilities
// ============================================

/**
 * Format number as currency
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Format number with compact notation (1K, 1M, etc.)
 */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format number with specified decimal places
 */
export function formatNumber(
  value: number,
  decimals: number = 2,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...options,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 2,
  includeSign: boolean = true
): string {
  const formatted = value.toFixed(decimals);
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${formatted}%`;
}

/**
 * Format crypto amount (handle very small numbers)
 */
export function formatCryptoAmount(value: number, symbol?: string): string {
  let formatted: string;
  
  if (value === 0) {
    formatted = '0';
  } else if (Math.abs(value) < 0.00001) {
    formatted = value.toExponential(4);
  } else if (Math.abs(value) < 1) {
    formatted = value.toFixed(6);
  } else if (Math.abs(value) < 1000) {
    formatted = value.toFixed(4);
  } else {
    formatted = formatCompact(value);
  }
  
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Format date relative to now
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

/**
 * Format date
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(date));
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(new Date(date));
}

// ============================================
// Validation Utilities
// ============================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate wallet address (basic validation)
 */
export function isValidWalletAddress(address: string, type: string): boolean {
  switch (type) {
    case 'ethereum':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'bitcoin':
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
    case 'solana':
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    default:
      return address.length > 20;
  }
}

// ============================================
// String Utilities
// ============================================

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

/**
 * Truncate wallet address (show first and last chars)
 */
export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Generate random string
 */
export function generateId(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate reference number
 */
export function generateReference(prefix: string = 'TXN'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitle(str: string): string {
  return str
    .split('_')
    .map((word) => capitalize(word))
    .join(' ');
}

// ============================================
// Object Utilities
// ============================================

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Pick specific keys from object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omit specific keys from object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
}

// ============================================
// Array Utilities
// ============================================

/**
 * Remove duplicates from array
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Group array by key
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array by key
 */
export function sortBy<T>(
  arr: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// ============================================
// Async Utilities
// ============================================

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ============================================
// Color Utilities
// ============================================

/**
 * Get color for price change
 */
export function getPriceChangeColor(change: number): string {
  if (change > 0) return 'text-[var(--color-bullish)]';
  if (change < 0) return 'text-[var(--color-bearish)]';
  return 'text-[var(--color-neutral)]';
}

/**
 * Get background color for price change
 */
export function getPriceChangeBgColor(change: number): string {
  if (change > 0) return 'bg-[var(--color-success-bg)]';
  if (change < 0) return 'bg-[var(--color-error-bg)]';
  return 'bg-[var(--color-surface-elevated)]';
}

/**
 * Get status color
 */
export function getStatusColor(
  status: string
): { bg: string; text: string; dot: string } {
  const statusMap: Record<string, { bg: string; text: string; dot: string }> = {
    pending: {
      bg: 'bg-[var(--color-warning-bg)]',
      text: 'text-[var(--color-warning)]',
      dot: 'bg-[var(--color-warning)]',
    },
    processing: {
      bg: 'bg-[var(--color-info-bg)]',
      text: 'text-[var(--color-info)]',
      dot: 'bg-[var(--color-info)]',
    },
    completed: {
      bg: 'bg-[var(--color-success-bg)]',
      text: 'text-[var(--color-success)]',
      dot: 'bg-[var(--color-success)]',
    },
    active: {
      bg: 'bg-[var(--color-success-bg)]',
      text: 'text-[var(--color-success)]',
      dot: 'bg-[var(--color-success)]',
    },
    failed: {
      bg: 'bg-[var(--color-error-bg)]',
      text: 'text-[var(--color-error)]',
      dot: 'bg-[var(--color-error)]',
    },
    rejected: {
      bg: 'bg-[var(--color-error-bg)]',
      text: 'text-[var(--color-error)]',
      dot: 'bg-[var(--color-error)]',
    },
    cancelled: {
      bg: 'bg-[var(--color-surface-elevated)]',
      text: 'text-[var(--color-text-muted)]',
      dot: 'bg-[var(--color-text-muted)]',
    },
  };
  
  return (
    statusMap[status.toLowerCase()] || {
      bg: 'bg-[var(--color-surface-elevated)]',
      text: 'text-[var(--color-text-secondary)]',
      dot: 'bg-[var(--color-text-secondary)]',
    }
  );
}

// ============================================
// Local Storage Utilities
// ============================================

/**
 * Get item from localStorage with type safety
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Set item in localStorage
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

// ============================================
// URL Utilities
// ============================================

/**
 * Build URL with query params
 */
export function buildUrl(
  base: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(base, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Parse query params from URL
 */
export function parseQueryParams(url: string): Record<string, string> {
  const params = new URLSearchParams(new URL(url).search);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

// ============================================
// Crypto Price Utilities (re-export)
// ============================================

export {
  fetchCryptoPrices,
  getCryptoPrice,
  getCryptoPriceAsync,
  usdToToken,
  usdToTokenAsync,
  tokenToUsd,
  formatTokenAmount,
  getAllCryptoPrices,
} from './cryptoPrices';
