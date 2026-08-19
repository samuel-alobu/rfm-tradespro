'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================
// Error Boundary Component
// ============================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="h-16 w-16 rounded-full bg-[var(--color-error-bg)] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-[var(--color-error)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              Something went wrong
            </h2>
            <p className="text-[var(--color-text-muted)] mb-6">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text-primary)]">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-[var(--color-surface-elevated)] rounded-lg text-xs overflow-auto text-[var(--color-error)]">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                leftIcon={<Home className="h-4 w-4" />}
                onClick={() => window.location.href = '/dashboard'}
              >
                Go Home
              </Button>
              <Button
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// Error Page Component (for route errors)
// ============================================

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error, reset }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--color-background)]">
      <div className="text-center max-w-md">
        <div className="h-20 w-20 rounded-full bg-[var(--color-error-bg)] flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-[var(--color-error)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Oops! Something went wrong
        </h1>
        <p className="text-[var(--color-text-muted)] mb-6">
          We&apos;re sorry for the inconvenience. Our team has been notified and is working to fix the issue.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            leftIcon={<Home className="h-4 w-4" />}
            onClick={() => window.location.href = '/dashboard'}
          >
            Go Home
          </Button>
          <Button
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={reset}
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
