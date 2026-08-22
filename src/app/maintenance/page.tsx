"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wrench, RefreshCw, Mail, Clock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { getCopyrightYearRange } from "@/utils";

// ============================================
// Maintenance Page
// ============================================

export default function MaintenancePage() {
  const [message, setMessage] = useState(
    "We are currently performing scheduled maintenance. Please check back soon.",
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const copyrightYearRange = getCopyrightYearRange();

  useEffect(() => {
    // Fetch maintenance message
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status");
        const data = await res.json();
        if (data.message) {
          setMessage(data.message);
        }
        // If maintenance is off, redirect to home
        if (!data.maintenance) {
          window.location.href = "/";
        }
      } catch {
        // Keep default message
      }
    };
    fetchStatus();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      if (!data.maintenance) {
        window.location.href = "/";
      }
    } catch {
      // Keep on page
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Logo size="md" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full text-center"
        >
          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#22c55e]/10 mb-8"
          >
            <Wrench className="h-12 w-12 text-[#22c55e]" />
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            We&apos;ll Be Back Soon
          </h1>

          {/* Message */}
          <p className="text-lg text-[#6b7a90] mb-8 leading-relaxed">
            {message}
          </p>

          {/* Status Card */}
          <div className="bg-[#151c24] border border-[#1e2733] rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <div className="w-3 h-3 bg-[#f59e0b] rounded-full" />
                <div className="absolute inset-0 w-3 h-3 bg-[#f59e0b] rounded-full animate-ping" />
              </div>
              <span className="text-[#f59e0b] font-medium">
                Maintenance in Progress
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-3 bg-[#0a0e14] rounded-lg">
                <div className="flex items-center gap-2 text-[#6b7a90] text-sm mb-1">
                  <Clock className="h-4 w-4" />
                  Expected Duration
                </div>
                <p className="text-white font-medium">~30 minutes</p>
              </div>
              <div className="p-3 bg-[#0a0e14] rounded-lg">
                <div className="flex items-center gap-2 text-[#6b7a90] text-sm mb-1">
                  <RefreshCw className="h-4 w-4" />
                  Auto-refresh
                </div>
                <p className="text-white font-medium">Every 5 minutes</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Checking..." : "Check Status"}
            </button>
            <a
              href="mailto:support@rfmtradepro.com"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1e2733] hover:bg-[#252d38] text-white font-medium rounded-xl transition-colors"
            >
              <Mail className="h-5 w-5" />
              Contact Support
            </a>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-[#6b7a90]">
          © {copyrightYearRange} Oasis MarketPro. All rights reserved.
        </p>
      </footer>

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#22c55e]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#22c55e]/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
