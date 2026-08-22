'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, LineChart, Coins, Globe, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Header,
  Footer,
  FeaturesSection,
  StatsSection,
  FloatingTestimonials,
  MarketsTable,
} from '@/components/landing';

// ============================================
// Landing Page - Professional Design
// ============================================

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <Header />

      {/* Hero Section - Dark with Trading Background */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-[#0a0e14]">
        {/* Background - Trading Chart Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{ 
              backgroundImage: 'url(https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e14]/60 via-[#0a0e14]/40 to-[#0a0e14]" />
        </div>

        {/* Content - Centered */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6">
              <span className="text-white">
                Revolutionizing your digital
              </span>
              <br />
              <span className="text-white">
                trading experience
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10">
              Seamlessly merging complexity with ease, Oasis MarketPro offers
              top-notch security, 24/7 support, and an intuitive platform for
              your tenacious trading and investment needs.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  Get started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="xl">
                  Log in
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Dark */}
      <StatsSection className="bg-[#0a0e14] border-y border-white/10" />

      {/* Features Section - Light */}
      <section id="features" className="bg-white">
        <FeaturesSection />
      </section>

      {/* Asset Classes Section - Dark */}
      <section className="py-20 px-6 bg-[#0a0e14]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Trade Multiple Asset Classes
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Diversify your portfolio across stocks, cryptocurrencies, forex, and real estate investments — all in one powerful platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: LineChart, title: 'Stocks', desc: 'Trade global equities', color: 'text-blue-400' },
              { icon: Coins, title: 'Crypto', desc: 'Bitcoin, Ethereum & more', color: 'text-orange-400' },
              { icon: Globe, title: 'Forex', desc: 'Currency pairs 24/5', color: 'text-green-400' },
              { icon: Building2, title: 'Real Estate', desc: 'Property investments', color: 'text-purple-400' },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center hover:bg-white/10 transition-colors"
              >
                <item.icon className={`h-10 w-10 mx-auto mb-4 ${item.color}`} />
                <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-white/50">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets Section - Light */}
      <section id="markets" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Popular Markets to Trade
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trade the world&apos;s most popular assets with competitive spreads and lightning-fast execution.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden"
          >
            <MarketsTable limit={15} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-8"
          >
            <Link href="/markets">
              <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View all markets
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - Dark */}
      <section id="testimonials" className="py-20 px-6 bg-[#0a0e14]">
        <div className="max-w-6xl mx-auto">
          <FloatingTestimonials />
        </div>
      </section>

      {/* CTA Section - Gradient */}
      <section className="py-24 px-6 bg-gradient-to-br from-[var(--color-primary)] via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Start Your Trading Journey?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Join Oasis MarketPro today and access powerful trading tools, expert insights, and a community of successful traders across stocks, crypto, forex, and real estate.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="xl" variant="secondary" className="bg-white text-[var(--color-primary)] hover:bg-gray-100" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  Create free account
                </Button>
              </Link>
              <Link href="/login">
                <Button size="xl" variant="ghost" className="text-white border-white/30 hover:bg-white/10">
                  Sign in to your account
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
