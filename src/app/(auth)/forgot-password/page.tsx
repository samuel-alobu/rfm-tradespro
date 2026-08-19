'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations';

// ============================================
// Forgot Password Page
// ============================================

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok && result.error) {
        setError(result.error);
        return;
      }

      setSubmittedEmail(data.email);
      setSuccess(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#22c55e]/10 mx-auto">
          <Check className="h-8 w-8 text-[#22c55e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Check your email
          </h1>
          <p className="mt-2 text-[#6b7a90]">
            We&apos;ve sent a password reset link to
            <br />
            <strong className="text-white">{submittedEmail}</strong>
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-[#6b7a90]">
            Didn&apos;t receive the email? Check your spam folder or
          </p>
          <Button
            variant="secondary"
            onClick={() => setSuccess(false)}
          >
            Try another email
          </Button>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[#22c55e] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Forgot your password?
        </h1>
        <p className="mt-2 text-[#6b7a90]">
          No worries! Enter your email and we&apos;ll send you a reset link.
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
        <Input
          label="Email address"
          type="email"
          placeholder="Enter your email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
        >
          Send reset link
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
