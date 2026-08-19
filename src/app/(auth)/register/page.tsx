'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Phone, Globe, Gift, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { cn } from '@/utils';

// ============================================
// Register Page
// ============================================

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      country: '',
      referralCode: '',
      agreeToTerms: false,
    },
  });

  const password = watch('password');

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Registration failed');
        return;
      }

      setSuccess(true);
      
      // Redirect to verify email page after 3 seconds
      setTimeout(() => {
        router.push('/verify-email?email=' + encodeURIComponent(data.email));
      }, 3000);
    } catch (err) {
      console.error('Registration error:', err);
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
            Account created!
          </h1>
          <p className="mt-2 text-[#6b7a90]">
            We&apos;ve sent a verification email to your inbox.
            <br />
            Please check your email to activate your account.
          </p>
        </div>
        <p className="text-sm text-[#6b7a90]">
          Redirecting to verification page...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Create an account
        </h1>
        <p className="mt-2 text-[#6b7a90]">
          Start your trading journey with RFM TradePro
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            placeholder="John"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            placeholder="Doe"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        {/* Email */}
        <Input
          label="Email address"
          type="email"
          placeholder="john@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password */}
        <div className="space-y-2">
          <Input
            label="Password"
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

        {/* Confirm Password */}
        <Input
          label="Confirm password"
          type="password"
          placeholder="Confirm your password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {/* Phone and Country - Required */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone"
            type="tel"
            placeholder="+1234567890"
            leftIcon={<Phone className="h-4 w-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Country"
            placeholder="United States"
            leftIcon={<Globe className="h-4 w-4" />}
            error={errors.country?.message}
            {...register('country')}
          />
        </div>

        {/* Referral Code */}
        <Input
          label="Referral code (optional)"
          placeholder="Enter referral code"
          leftIcon={<Gift className="h-4 w-4" />}
          error={errors.referralCode?.message}
          {...register('referralCode')}
        />

        {/* Terms Checkbox - Fixed alignment */}
        <div className="space-y-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#1e2733] bg-[#151c24] text-[#22c55e] focus:ring-[#22c55e] focus:ring-offset-0 focus:ring-offset-[#0a0e14] shrink-0"
              {...register('agreeToTerms')}
            />
            <span className="text-sm text-[#6b7a90] group-hover:text-[#9ca3af] leading-tight">
              I agree to the{' '}
              <Link
                href="/terms-of-service"
                className="text-[#22c55e] hover:underline"
                target="_blank"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy-policy"
                className="text-[#22c55e] hover:underline"
                target="_blank"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-xs text-[#ef4444] ml-7">
              {errors.agreeToTerms.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
        >
          Create account
        </Button>
      </form>

      {/* Login Link */}
      <p className="text-center text-sm text-[#6b7a90]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-[#22c55e] hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
