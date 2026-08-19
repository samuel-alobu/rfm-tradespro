'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Mail, Lock, AlertCircle, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Loading';
import { loginSchema, type LoginFormData } from '@/lib/validations';

// ============================================
// Login Form Component (uses useSearchParams)
// ============================================

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // First, check if 2FA is required
      const checkRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', email: data.email }),
      });
      const checkData = await checkRes.json();

      if (checkData.requires2FA) {
        // Store credentials and validate + send 2FA code
        setPendingEmail(data.email);
        setPendingPassword(data.password);
        setIsSendingCode(true);
        
        // This now validates credentials FIRST, then sends code if valid
        const sendRes = await fetch('/api/auth/2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'send', 
            email: data.email,
            password: data.password  // Pass password for validation
          }),
        });
        const sendData = await sendRes.json();
        
        if (sendRes.ok) {
          setMaskedEmail(sendData.maskedEmail);
          setRequires2FA(true);
        } else {
          // Credentials invalid or other error
          setError(sendData.error || 'Authentication failed');
        }
        setIsSendingCode(false);
        setIsLoading(false);
        return;
      }

      // No 2FA required, proceed with normal login
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Map NextAuth errors to user-friendly messages
        const errorMessage = result.error === 'CredentialsSignin' || result.error === 'Configuration'
          ? 'Invalid email or password'
          : result.error;
        setError(errorMessage);
        return;
      }

      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      // Verify the code
      const verifyRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'verify', 
          email: pendingEmail, 
          code: verificationCode 
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.error || 'Verification failed');
        setIsVerifying(false);
        return;
      }

      // Code verified, now sign in
      const result = await signIn('credentials', {
        email: pendingEmail,
        password: pendingPassword,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = result.error === 'CredentialsSignin' || result.error === 'Configuration'
          ? 'Invalid email or password'
          : result.error;
        setError(errorMessage);
        setIsVerifying(false);
        return;
      }

      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error('2FA verification error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsSendingCode(true);
      setError(null);
      
      // Resend requires password for re-validation
      const sendRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'send', 
          email: pendingEmail,
          password: pendingPassword
        }),
      });
      const sendData = await sendRes.json();
      
      if (!sendRes.ok) {
        setError(sendData.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleBack = () => {
    setRequires2FA(false);
    setPendingEmail('');
    setPendingPassword('');
    setVerificationCode('');
    setMaskedEmail('');
    setError(null);
  };

  // 2FA Verification View
  if (requires2FA) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center lg:text-left">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[#6b7a90] hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-[#22c55e]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Two-Factor Authentication
            </h1>
          </div>
          <p className="mt-2 text-[#6b7a90]">
            A verification code has been sent to <span className="text-white font-medium">{maskedEmail}</span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0" />
            <p className="text-sm text-[#ef4444]">{error}</p>
          </div>
        )}

        {/* Code Input */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(val);
              }}
              placeholder="Enter 6-digit code"
              className="w-full h-14 bg-[#151c24] border border-[#1e2733] rounded-lg px-4 text-center text-2xl font-mono tracking-[0.5em] text-white placeholder:text-[#6b7a90] placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-[#22c55e] transition-colors"
              autoFocus
            />
          </div>

          <Button
            onClick={handleVerify2FA}
            fullWidth
            size="lg"
            disabled={verificationCode.length !== 6 || isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              'Verify & Sign In'
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-[#6b7a90]">
              Didn&apos;t receive the code?{' '}
              <button
                onClick={handleResendCode}
                disabled={isSendingCode}
                className="text-[#22c55e] hover:underline disabled:opacity-50"
              >
                {isSendingCode ? 'Sending...' : 'Resend code'}
              </button>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-[#1e2733] rounded-lg p-4">
          <p className="text-xs text-[#6b7a90]">
            <strong className="text-white">Security Notice:</strong> This code expires in 10 minutes. 
            Never share your verification code with anyone. Our team will never ask for this code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-[#6b7a90]">
          Enter your credentials to access your account
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

        <div className="space-y-1.5">
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            leftIcon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-[#22c55e] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading || isSendingCode}
        >
          {isSendingCode ? 'Sending verification code...' : 'Sign in'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#1e2733]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[#0a0e14] text-[#6b7a90]">
            Don&apos;t have an account?
          </span>
        </div>
      </div>

      {/* Register Link */}
      <Link href="/register" className="block">
        <Button variant="secondary" fullWidth size="lg">
          Create an account
        </Button>
      </Link>
    </div>
  );
}

// ============================================
// Login Page with Suspense
// ============================================

function LoginFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
