'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { HelpCircle, ChevronDown, Search, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';

// ============================================
// FAQ Page
// ============================================

const faqCategories = [
  {
    name: 'Getting Started',
    faqs: [
      {
        question: 'How do I create an account?',
        answer: 'Creating an account is simple. Click the "Sign Up" button, enter your email address, create a secure password, and verify your email. Once verified, you\'ll need to complete our identity verification (KYC) process by uploading a government-issued ID and proof of address. The entire process typically takes less than 10 minutes.',
      },
      {
        question: 'What documents do I need for verification?',
        answer: 'For identity verification, you\'ll need: (1) A valid government-issued photo ID (passport, driver\'s license, or national ID card), and (2) Proof of address dated within the last 3 months (utility bill, bank statement, or government letter). All documents must be clear, legible, and show your full name and current address.',
      },
      {
        question: 'Is there a minimum deposit to start trading?',
        answer: 'Yes, the minimum deposit is $10 for most payment methods. This low barrier allows you to start trading with minimal risk while you learn the platform. For some premium features like copy trading, higher minimums may apply.',
      },
      {
        question: 'Which countries do you support?',
        answer: 'Oasis MarketPro serves traders in over 180 countries worldwide. However, due to regulatory restrictions, we cannot provide services to residents of certain jurisdictions including the United States (for certain products), North Korea, Iran, and other sanctioned regions. Please check our restricted countries list during registration.',
      },
    ],
  },
  {
    name: 'Deposits & Withdrawals',
    faqs: [
      {
        question: 'What deposit methods do you accept?',
        answer: 'We accept a variety of deposit methods including: Bank transfers (SWIFT/SEPA), Credit/debit cards (Visa, Mastercard), Cryptocurrencies (BTC, ETH, USDT, USDC, and 20+ others), and E-wallets. Deposit methods may vary by region.',
      },
      {
        question: 'How long do withdrawals take?',
        answer: 'Withdrawal processing times depend on the method: Cryptocurrency withdrawals are typically processed within 1-2 hours; E-wallet withdrawals within 24 hours; Bank transfers within 1-5 business days. All withdrawals are subject to security review and may require additional verification for large amounts.',
      },
      {
        question: 'Are there any withdrawal fees?',
        answer: 'We do not charge fees for most withdrawal methods. However, for cryptocurrency withdrawals, network fees apply and are deducted from your withdrawal amount. Bank wire transfers may incur fees from intermediary banks. Check our fee schedule for specific details.',
      },
      {
        question: 'Why is my withdrawal pending?',
        answer: 'Withdrawals may be pending due to: security verification for new withdrawal addresses, daily/monthly withdrawal limits, incomplete KYC verification, or manual review for large amounts. If your withdrawal has been pending for more than 48 hours, please contact our support team.',
      },
    ],
  },
  {
    name: 'Trading',
    faqs: [
      {
        question: 'What assets can I trade?',
        answer: 'Oasis MarketPro offers access to 500+ tradeable assets across multiple markets: 200+ cryptocurrencies (Bitcoin, Ethereum, etc.), 80+ forex pairs (major, minor, and exotic), 15,000+ global stocks and ETFs, commodities (gold, silver, oil, etc.), and indices (S&P 500, NASDAQ, etc.).',
      },
      {
        question: 'What is leverage and how does it work?',
        answer: 'Leverage allows you to control a larger position with a smaller amount of capital. For example, with 10x leverage, a $1,000 deposit can control a $10,000 position. While leverage can amplify profits, it also magnifies losses. We offer leverage up to 1:500 for forex, 1:100 for crypto, and 1:20 for stocks, depending on the asset and your account type.',
      },
      {
        question: 'What are spreads and commissions?',
        answer: 'Spreads are the difference between the buy and sell price of an asset. Our spreads start from 0.1 pips on major forex pairs and 0% on spot crypto. Commission structures vary by account type—Standard accounts have zero commission with wider spreads, while Pro accounts have lower spreads plus a small per-trade commission.',
      },
      {
        question: 'Do you offer copy trading?',
        answer: 'Yes! Our copy trading feature allows you to automatically replicate the trades of successful traders. Browse our leaderboard of top performers, view their stats and strategies, and allocate funds to copy their trades in real-time. You maintain full control and can stop copying at any time.',
      },
      {
        question: 'What is stop-loss and take-profit?',
        answer: 'Stop-loss and take-profit are risk management tools. A stop-loss automatically closes your position when the price moves against you by a specified amount, limiting potential losses. A take-profit closes your position when the price reaches your target profit level, securing your gains. We strongly recommend using these tools on every trade.',
      },
    ],
  },
  {
    name: 'Security',
    faqs: [
      {
        question: 'How secure is my account?',
        answer: 'We implement bank-grade security measures including: 256-bit SSL encryption, two-factor authentication (2FA), biometric login options, cold storage for 95% of crypto assets, regular security audits, and 24/7 monitoring. Additionally, we maintain $100 million in insurance coverage against cyber threats.',
      },
      {
        question: 'What is two-factor authentication (2FA)?',
        answer: '2FA adds an extra layer of security by requiring a second form of verification beyond your password. We support authenticator apps (Google Authenticator, Authy), SMS verification, and email verification. We strongly recommend enabling 2FA to protect your account.',
      },
      {
        question: 'What happens if I lose access to my 2FA device?',
        answer: 'When you set up 2FA, you\'re provided with backup codes. Store these securely. If you lose access to your 2FA device and backup codes, contact our support team with your registered email and identity documents. After verification, we can help you regain access, though this process may take 24-48 hours for security purposes.',
      },
      {
        question: 'How do you protect my funds?',
        answer: 'Client funds are held in segregated accounts at tier-1 banks, completely separate from company operational funds. Cryptocurrency assets are stored in cold wallets with multi-signature protection. We maintain comprehensive insurance coverage and comply with strict regulatory requirements to ensure the safety of your funds.',
      },
    ],
  },
  {
    name: 'Account & Support',
    faqs: [
      {
        question: 'How do I contact customer support?',
        answer: 'We offer 24/7 support through multiple channels: Live chat (available on our website and app), Email (support@eliteprocapital.com), Phone support for VIP clients, and comprehensive help center articles. Our average response time is under 2 minutes for live chat and under 2 hours for email.',
      },
      {
        question: 'How do I upgrade my account tier?',
        answer: 'Account upgrades are based on your trading volume and account balance. To request an upgrade, go to Settings > Account > Request Upgrade. Our team will review your application within 24 hours. VIP upgrades may require additional verification and a personal account manager review.',
      },
      {
        question: 'Can I have multiple accounts?',
        answer: 'No, each person is limited to one account. Creating multiple accounts violates our Terms of Service and may result in account suspension. If you need different accounts for personal and business purposes, please contact our support team to discuss options.',
      },
      {
        question: 'How do I close my account?',
        answer: 'To close your account, first withdraw all funds and close any open positions. Then go to Settings > Account > Close Account. You\'ll need to confirm your identity and provide a reason for closure. Note that account closure is permanent and some data must be retained for regulatory compliance.',
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Getting Started');

  const filteredCategories = searchQuery
    ? faqCategories.map(cat => ({
        ...cat,
        faqs: cat.faqs.filter(
          faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.faqs.length > 0)
    : faqCategories;

  const toggleFaq = (question: string) => {
    setOpenFaq(openFaq === question ? null : question);
  };

  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 px-6 bg-[#0f1419]">
          <div className="max-w-4xl mx-auto text-center">
            <HelpCircle className="h-16 w-16 text-[#22c55e] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-[#6b7a90] mb-8">
              Find answers to common questions about Oasis MarketPro. If you can\'t find what you\'re looking for, our support team is here to help 24/7.
            </p>
            
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6b7a90]" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#0a0e14] border border-[#1e2733] rounded-xl text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
              />
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Category Sidebar */}
              <div className="lg:w-64 shrink-0">
                <div className="sticky top-24 space-y-2">
                  {faqCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setActiveCategory(category.name)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-lg transition-colors',
                        activeCategory === category.name
                          ? 'bg-[#22c55e]/10 text-[#22c55e] font-medium'
                          : 'text-[#6b7a90] hover:text-white hover:bg-[#1e2733]'
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ List */}
              <div className="flex-1">
                {filteredCategories.map((category) => (
                  <div
                    key={category.name}
                    className={cn(
                      'mb-8',
                      !searchQuery && activeCategory !== category.name && 'hidden lg:hidden'
                    )}
                    style={{ display: !searchQuery && activeCategory !== category.name ? 'none' : 'block' }}
                  >
                    <h2 className="text-2xl font-bold text-white mb-6">{category.name}</h2>
                    <div className="space-y-4">
                      {category.faqs.map((faq, index) => (
                        <div
                          key={index}
                          className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden"
                        >
                          <button
                            onClick={() => toggleFaq(faq.question)}
                            className="w-full flex items-center justify-between p-6 text-left"
                          >
                            <span className="text-white font-medium pr-4">{faq.question}</span>
                            <ChevronDown
                              className={cn(
                                'h-5 w-5 text-[#6b7a90] shrink-0 transition-transform',
                                openFaq === faq.question && 'rotate-180 text-[#22c55e]'
                              )}
                            />
                          </button>
                          <AnimatePresence>
                            {openFaq === faq.question && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="px-6 pb-6 text-[#9ca3af] leading-relaxed border-t border-[#1e2733] pt-4">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-[#6b7a90] mb-4">No results found for "{searchQuery}"</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[#22c55e] hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Still Need Help */}
        <section className="py-16 px-6 bg-[#0f1419]">
          <div className="max-w-4xl mx-auto text-center">
            <MessageCircle className="h-12 w-12 text-[#22c55e] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Still have questions?</h2>
            <p className="text-[#6b7a90] mb-8">
              Our support team is available 24/7 to help you with any questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
              >
                Contact Support
              </Link>
              <a
                href="mailto:support@oasismarketpro.com"
                className="px-8 py-3 bg-[#1e2733] text-white font-semibold rounded-lg hover:bg-[#2a3441] transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
