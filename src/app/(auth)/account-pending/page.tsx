'use client';

import React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Clock, Mail, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

// ============================================
// Account Pending Page
// ============================================

export default function AccountPendingPage() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0e14]">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Logo */}
        <Logo size="lg" showText={false} href="/" className="justify-center" />

        {/* Icon */}
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-[#f59e0b]/10 mx-auto">
          <Clock className="h-10 w-10 text-[#f59e0b]" />
        </div>

        {/* Content */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Account Under Review
          </h1>
          <p className="mt-4 text-[#6b7a90]">
            Your account is currently being reviewed by our team.
            This process typically takes 1-2 business days.
          </p>
        </div>

        {/* Info Card */}
        <div className="p-6 bg-[#0f1419] rounded-xl border border-[#1e2733] text-left">
          <h3 className="font-semibold text-white mb-3">
            What happens next?
          </h3>
          <ul className="space-y-3 text-sm text-[#6b7a90]">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium shrink-0">
                1
              </span>
              <span>Our team will verify your account details</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium shrink-0">
                2
              </span>
              <span>You&apos;ll receive an email once your account is approved</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium shrink-0">
                3
              </span>
              <span>Then you can start trading and using all features</span>
            </li>
          </ul>
        </div>

        {/* Need Help */}
        <div className="p-4 bg-[#151c24] rounded-lg border border-[#1e2733]">
          <div className="flex items-center justify-center gap-3">
            <Mail className="h-5 w-5 text-[#6b7a90]" />
            <p className="text-sm text-[#6b7a90]">
              Questions? Contact us at{' '}
              <a
                href="mailto:support@rfmtradepro.com"
                className="text-[#22c55e] hover:underline"
              >
                support@rfmtradepro.com
              </a>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/" className="block">
            <Button
              variant="secondary"
              fullWidth
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Return to homepage
            </Button>
          </Link>
          <Button
            variant="ghost"
            fullWidth
            onClick={handleLogout}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
