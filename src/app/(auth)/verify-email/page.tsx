'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Check, XCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Loading';

// ============================================
// Verify Email Content (uses useSearchParams)
// ============================================

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'pending'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Verify token if present
  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('pending');
        return;
      }

      setStatus('verifying');

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setStatus('success');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setError(result.error || 'Verification failed');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setError('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [token, router]);

  // Resend verification email
  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      const response = await fetch(`/api/auth/verify-email?email=${encodeURIComponent(email)}`);
      const result = await response.json();

      if (response.ok) {
        setResendSuccess(true);
      } else {
        setError(result.error || 'Failed to resend email');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  // Verifying state
  if (status === 'verifying') {
    return (
      <div className="text-center space-y-6">
        <Spinner size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-white">
            Verifying your email
          </h1>
          <p className="mt-2 text-[#6b7a90]">
            Please wait while we verify your email address...
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#22c55e]/10 mx-auto">
          <Check className="h-8 w-8 text-[#22c55e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Email verified!
          </h1>
          <p className="mt-2 text-[#6b7a90]">
            Your email has been verified successfully.
            <br />
            You can now log in to your account.
          </p>
        </div>
        <p className="text-sm text-[#6b7a90]">
          Redirecting to login...
        </p>
        <Link href="/login">
          <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
            Go to login
          </Button>
        </Link>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#ef4444]/10 mx-auto">
          <XCircle className="h-8 w-8 text-[#ef4444]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Verification failed
          </h1>
          <p className="mt-2 text-[#6b7a90]">
            {error || 'The verification link is invalid or has expired.'}
          </p>
        </div>
        {email && (
          <div className="space-y-3">
            <Button
              onClick={handleResend}
              isLoading={isResending}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Resend verification email
            </Button>
            {resendSuccess && (
              <p className="text-sm text-[#22c55e]">
                Verification email sent!
              </p>
            )}
          </div>
        )}
        <Link
          href="/login"
          className="block text-sm text-[#22c55e] hover:underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  // Pending state (waiting for user to check email)
  return (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#22c55e]/10 mx-auto">
        <Mail className="h-8 w-8 text-[#22c55e]" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">
          Check your email
        </h1>
        <p className="mt-2 text-[#6b7a90]">
          We&apos;ve sent a verification link to
          {email && (
            <>
              <br />
              <strong className="text-white">{email}</strong>
            </>
          )}
        </p>
      </div>

      <div className="p-4 bg-[#151c24] rounded-lg border border-[#1e2733]">
        <p className="text-sm text-[#6b7a90]">
          Click the link in the email to verify your account.
          <br />
          The link will expire in 24 hours.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-[#6b7a90]">
          Didn&apos;t receive the email?
        </p>
        {email ? (
          <>
            <Button
              variant="secondary"
              onClick={handleResend}
              isLoading={isResending}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Resend verification email
            </Button>
            {resendSuccess && (
              <p className="text-sm text-[#22c55e]">
                Verification email sent!
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-[#6b7a90]">
            Check your spam folder or contact support.
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-[#1e2733]">
        <Link
          href="/login"
          className="text-sm text-[#22c55e] hover:underline"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}

// ============================================
// Verify Email Page with Suspense
// ============================================

function VerifyEmailFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
