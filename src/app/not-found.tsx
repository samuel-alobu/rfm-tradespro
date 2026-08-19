'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================
// 404 Not Found Page
// ============================================

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--color-background)]">
      <div className="text-center max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <span className="text-[150px] font-bold text-[var(--color-surface-elevated)] leading-none">
              404
            </span>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Search className="h-20 w-20 text-[var(--color-primary)]" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
            Page Not Found
          </h1>
          <p className="text-[var(--color-text-muted)] mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. 
            Let&apos;s get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="secondary"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
            <Link href="/dashboard">
              <Button leftIcon={<Home className="h-4 w-4" />}>
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          className="mt-12 pt-8 border-t border-[var(--color-border)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Popular pages:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/trade', label: 'Trade' },
              { href: '/markets', label: 'Markets' },
              { href: '/settings', label: 'Settings' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] rounded-lg hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
