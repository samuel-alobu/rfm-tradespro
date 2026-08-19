'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ArrowLeft, Check, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Loading';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations';
import { cn } from '@/utils';

// ============================================
// Reset Password Form (uses useSearchParams)
// ============================================

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      token: '',
    },
  });

  const password = watch('password');

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const result = await response.json();

        if (response.ok && result.success) {
          setIsValidToken(true);
          setValue('token', token);
        } else {
          setIsValidToken(false);
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, setValue]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to reset password');
        return;
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="text-center space-y-6">
        <Spinner size="lg" />
        <p className="text-[#6b7a90]">Validating reset link...</p>
      </div>
    );
  }

  // Invalid token
  if (!isValidToken) {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#ef4444]/10 mx-auto">
          <XCircle className="h-8 w-8 text-[#ef4444]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Invalid or expired link
          </h1>
          <p className="mt-2 text-[#6b7a90]">
            This password reset link is invalid or has expired.
            <br />
            Please request a new one.
          </p>
        </div>
        <Link href="/forgot-password">
          <Button fullWidth>Request new reset link</Button>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[#6b7a90] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#22c55e]/10 mx-auto">
          <Check className="h-8 w-8 text-[#22c55e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Password reset successful!
          </h1>
          <p className="mt-2 text-[#6b7a90]">
            Your password has been reset successfully.
            <br />
            You can now log in with your new password.
          </p>
        </div>
        <p className="text-sm text-[#6b7a90]">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Reset your password
        </h1>
        <p className="mt-2 text-[#6b7a90]">
          Enter your new password below
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg">
          <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0" />
          <p className="text-sm text-[#ef4444]">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <input type="hidden" {...register('token')} />

        <div className="space-y-2">
          <Input
            label="New password"
            type="password"
            placeholder="Create a strong password"
            leftIcon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Password Strength */}
          {password && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={cn(
                'flex items-center gap-1.5',
                hasMinLength ? 'text-[#22c55e]' : 'text-[#6b7a90]'
              )}>
                <Check className="h-3 w-3" />
                8+ characters
              </div>
              <div className={cn(
                'flex items-center gap-1.5',
                hasUppercase ? 'text-[#22c55e]' : 'text-[#6b7a90]'
              )}>
                <Check className="h-3 w-3" />
                Uppercase letter
              </div>
              <div className={cn(
                'flex items-center gap-1.5',
                hasLowercase ? 'text-[#22c55e]' : 'text-[#6b7a90]'
              )}>
                <Check className="h-3 w-3" />
                Lowercase letter
              </div>
              <div className={cn(
                'flex items-center gap-1.5',
                hasNumber ? 'text-[#22c55e]' : 'text-[#6b7a90]'
              )}>
                <Check className="h-3 w-3" />
                Number
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm new password"
          type="password"
          placeholder="Confirm your new password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
        >
          Reset password
        </Button>
      </form>

      {/* Back to Login */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[#6b7a90] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}

// ============================================
// Reset Password Page with Suspense
// ============================================

function ResetPasswordFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
