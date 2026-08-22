import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { Shield, TrendingUp, BarChart3, Globe } from "lucide-react";
import { getCopyrightYearRange } from "@/utils";

// ============================================
// Auth Layout - Professional Split Design
// Forces dark theme regardless of system preference
// ============================================

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const copyrightYearRange = getCopyrightYearRange();

  return (
    <div className="min-h-screen flex bg-[#0a0e14]">
      {/* Left Side - Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image - City skyline / financial district */}
        <Image
          src="https://images.unsplash.com/photo-1621264448270-9ef00e88a935?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzZ8fGZpbmFuY2V8ZW58MHx8MHx8fDA%3D"
          alt="Financial district"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/95 via-[#0a1628]/85 to-[#1a365d]/80" />

        {/* Animated Accent Lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#22c55e]/30 to-transparent" />
          <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-[#22c55e]/20 to-transparent" />
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-[#22c55e]/30 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <Logo size="lg" href="/" variant="light" />

          {/* Main Content */}
          <div className="my-auto">
            {/* Live Trading Platform badge - commented out
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-white/80">Live Trading Platform</span>
            </div>
            */}

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mt-6 mb-6">
              Trade Smarter.
              <br />
              <span className="bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#86efac] bg-clip-text text-transparent">
                Invest Better.
              </span>
              <br />
              Grow Faster.
            </h1>

            <p className="text-lg text-white/70 max-w-md mb-10">
              Access global markets, trade stocks, crypto, forex, and real
              estate investments — all from one powerful platform.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <Shield className="h-6 w-6 text-[#22c55e] mb-3" />
                <p className="font-medium text-white text-sm">
                  Bank-Grade Security
                </p>
                <p className="text-xs text-white/50 mt-1">256-bit encryption</p>
              </div>
              <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <TrendingUp className="h-6 w-6 text-[#4ade80] mb-3" />
                <p className="font-medium text-white text-sm">
                  Real-Time Trading
                </p>
                <p className="text-xs text-white/50 mt-1">
                  Lightning-fast execution
                </p>
              </div>
              <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <BarChart3 className="h-6 w-6 text-[#86efac] mb-3" />
                <p className="font-medium text-white text-sm">
                  Advanced Analytics
                </p>
                <p className="text-xs text-white/50 mt-1">
                  Professional charts
                </p>
              </div>
              <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <Globe className="h-6 w-6 text-[#22c55e] mb-3" />
                <p className="font-medium text-white text-sm">Global Markets</p>
                <p className="text-xs text-white/50 mt-1">180+ countries</p>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="flex items-center gap-8 pt-8 border-t border-white/10">
            <div>
              <p className="text-2xl font-bold text-white">$100M+</p>
              <p className="text-xs text-white/50">Paid to traders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">50K+</p>
              <p className="text-xs text-white/50">Active traders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">4.9★</p>
              <p className="text-xs text-white/50">User rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form (forced dark theme) */}
      <div className="flex-1 flex flex-col bg-[#0a0e14]">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b border-[#1e2733]">
          <Logo size="sm" href="/" />
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t border-[#1e2733]">
          <p className="text-sm text-[#6b7a90]">
            © {copyrightYearRange} Oasis MarketPro. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link
              href="/privacy-policy"
              className="text-sm text-[#6b7a90] hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-sm text-[#6b7a90] hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
