'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

// ============================================
// Dashboard Error Page
// ============================================

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-[var(--color-error-bg)] flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-[var(--color-error)]" />
          </div>
          
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Something went wrong
          </h2>
          
          <p className="text-[var(--color-text-muted)] mb-6">
            We encountered an error while loading this page. This has been logged 
            and our team will investigate.
          </p>
          
          {error.digest && (
            <p className="text-xs text-[var(--color-text-muted)] mb-4 font-mono">
              Error ID: {error.digest}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="secondary"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
            <Button
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={reset}
            >
              Try Again
            </Button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
            >
              <Home className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
