import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { FileText, ArrowLeft } from 'lucide-react';

// ============================================
// Terms of Service Page
// ============================================

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Header />

      <main className="pt-20">
        {/* Header */}
        <section className="py-12 px-6 bg-[#0f1419]">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/legal"
              className="inline-flex items-center gap-2 text-[#6b7a90] hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Legal
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <FileText className="h-10 w-10 text-[#22c55e]" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Terms of Service
              </h1>
            </div>
            <p className="text-[#6b7a90]">Last updated: January 15, 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto prose prose-invert prose-green">
            <div className="space-y-8 text-[#9ca3af]">
              <div className="bg-[#0f1419] rounded-xl p-6 border border-[#f59e0b]/30">
                <p className="text-[#f59e0b] font-semibold mb-2">
                  Important Notice
                </p>
                <p className="text-sm">
                  Please read these Terms of Service carefully before using
                  Oasis MarketPro. By accessing or using our services, you agree
                  to be bound by these terms. If you do not agree to these
                  terms, do not use our services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  1. Agreement to Terms
                </h2>
                <p className="leading-relaxed">
                  These Terms of Service ("Terms") constitute a legally binding
                  agreement between you ("User," "you," or "your") and Oasis
                  MarketPro, Inc. ("Company," "we," "us," or "our") governing
                  your access to and use of the Oasis MarketPro trading
                  platform, website, mobile applications, APIs, and all related
                  services (collectively, the "Services").
                </p>
                <p className="leading-relaxed mt-4">
                  By creating an account, accessing, or using our Services, you
                  acknowledge that you have read, understood, and agree to be
                  bound by these Terms, our Privacy Policy, and all applicable
                  laws and regulations.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  2. Eligibility
                </h2>
                <p className="leading-relaxed mb-4">
                  To use our Services, you must:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Be at least 18 years of age (or the age of majority in your
                    jurisdiction)
                  </li>
                  <li>
                    Have the legal capacity to enter into binding contracts
                  </li>
                  <li>
                    Not be located in a jurisdiction where our Services are
                    prohibited
                  </li>
                  <li>
                    Not be subject to economic sanctions or on any government
                    prohibited list
                  </li>
                  <li>Complete our identity verification (KYC) process</li>
                  <li>
                    Provide accurate and complete registration information
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  3. Account Registration and Security
                </h2>

                <h3 className="text-xl font-semibold text-white mb-3">
                  3.1 Account Creation
                </h3>
                <p className="leading-relaxed">
                  You must register for an account to access most features of
                  our Services. You agree to provide accurate, current, and
                  complete information during registration and to update such
                  information to keep it accurate.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3 mt-6">
                  3.2 Account Security
                </h3>
                <p className="leading-relaxed">
                  You are responsible for maintaining the confidentiality of
                  your account credentials and for all activities that occur
                  under your account. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Create a strong, unique password</li>
                  <li>
                    Enable two-factor authentication (strongly recommended)
                  </li>
                  <li>Not share your login credentials with anyone</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Log out from shared devices after each session</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  4. Trading Services
                </h2>

                <h3 className="text-xl font-semibold text-white mb-3">
                  4.1 Trading Activities
                </h3>
                <p className="leading-relaxed">
                  We provide a platform for trading various financial
                  instruments including cryptocurrencies, forex, stocks, and
                  derivatives. All trades are executed at your sole discretion
                  and risk.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3 mt-6">
                  4.2 Order Execution
                </h3>
                <p className="leading-relaxed">
                  We strive to execute orders promptly at the best available
                  prices. However, we do not guarantee execution at any specific
                  price. Market conditions, liquidity, and system performance
                  may affect order execution.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3 mt-6">
                  4.3 Trading Limits
                </h3>
                <p className="leading-relaxed">
                  We may impose limits on trading activities, including position
                  sizes, leverage, and withdrawal amounts. These limits may vary
                  based on your account verification level, trading history, and
                  regulatory requirements.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  5. Deposits and Withdrawals
                </h2>
                <p className="leading-relaxed mb-4">
                  When depositing or withdrawing funds, you agree to the
                  following:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All deposits must come from accounts in your name</li>
                  <li>
                    Withdrawals will be processed to verified payment methods
                    only
                  </li>
                  <li>
                    Processing times may vary based on payment method and
                    verification status
                  </li>
                  <li>
                    We may require additional verification for large
                    transactions
                  </li>
                  <li>
                    You are responsible for any fees charged by your bank or
                    payment provider
                  </li>
                  <li>
                    We reserve the right to delay or refuse suspicious
                    transactions
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  6. Fees and Charges
                </h2>
                <p className="leading-relaxed">
                  Our fee structure is detailed on our website and includes
                  trading fees, spreads, overnight financing, withdrawal fees,
                  and other applicable charges. We reserve the right to modify
                  our fees with reasonable notice. You are responsible for
                  understanding all fees before trading.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  7. Risk Disclosure
                </h2>
                <div className="bg-[#ef4444]/10 rounded-xl p-6 border border-[#ef4444]/30">
                  <p className="text-[#ef4444] font-semibold mb-2">
                    ⚠️ Risk Warning
                  </p>
                  <p className="text-sm leading-relaxed">
                    Trading in financial instruments involves substantial risk
                    of loss and is not suitable for all investors. You may lose
                    more than your initial investment. Past performance is not
                    indicative of future results. Before trading, you should
                    carefully consider your investment objectives, level of
                    experience, and risk appetite. You should not invest money
                    that you cannot afford to lose.
                  </p>
                </div>
                <p className="leading-relaxed mt-4">
                  By using our Services, you acknowledge that you understand and
                  accept the risks associated with trading, including but not
                  limited to market risk, leverage risk, liquidity risk, and
                  counterparty risk.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  8. Prohibited Activities
                </h2>
                <p className="leading-relaxed mb-4">You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Use the Services for any illegal purpose or in violation of
                    any laws
                  </li>
                  <li>
                    Engage in market manipulation, wash trading, or fraudulent
                    activities
                  </li>
                  <li>
                    Use bots, scripts, or automated systems without
                    authorization
                  </li>
                  <li>
                    Attempt to gain unauthorized access to our systems or other
                    accounts
                  </li>
                  <li>Transmit malware, viruses, or harmful code</li>
                  <li>Interfere with the proper functioning of our Services</li>
                  <li>
                    Use the Services to launder money or finance illegal
                    activities
                  </li>
                  <li>Create multiple accounts or use false identities</li>
                  <li>Reverse engineer or decompile our software</li>
                  <li>
                    Violate any applicable laws, regulations, or these Terms
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  9. Intellectual Property
                </h2>
                <p className="leading-relaxed">
                  All content, trademarks, logos, and intellectual property on
                  our platform are owned by Oasis MarketPro or its licensors.
                  You may not use, copy, modify, distribute, or reproduce any
                  content without our written permission. Your use of our
                  Services does not grant you any ownership rights.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  10. Limitation of Liability
                </h2>
                <p className="leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, ELITE PRO CAPITAL
                  SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED
                  TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE
                  OF THE SERVICES.
                </p>
                <p className="leading-relaxed mt-4">
                  Our total liability for any claims arising from these Terms or
                  your use of the Services shall not exceed the fees paid by you
                  in the twelve (12) months preceding the claim.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  11. Indemnification
                </h2>
                <p className="leading-relaxed">
                  You agree to indemnify, defend, and hold harmless Oasis
                  MarketPro, its affiliates, officers, directors, employees, and
                  agents from any claims, damages, losses, liabilities, and
                  expenses (including legal fees) arising from your use of the
                  Services, violation of these Terms, or infringement of any
                  third-party rights.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  12. Account Termination
                </h2>
                <p className="leading-relaxed">
                  We reserve the right to suspend or terminate your account at
                  any time for any reason, including violation of these Terms,
                  suspicious activity, or regulatory requirements. Upon
                  termination, you must withdraw any remaining funds within the
                  specified timeframe. We may retain certain information as
                  required by law.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  13. Dispute Resolution
                </h2>
                <p className="leading-relaxed">
                  Any disputes arising from these Terms or your use of the
                  Services shall be resolved through binding arbitration in
                  accordance with the rules of the American Arbitration
                  Association. The arbitration shall take place in New York, New
                  York. You agree to waive any right to participate in a class
                  action lawsuit or class-wide arbitration.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  14. Governing Law
                </h2>
                <p className="leading-relaxed">
                  These Terms shall be governed by and construed in accordance
                  with the laws of the State of New York, United States, without
                  regard to its conflict of law provisions.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  15. Changes to Terms
                </h2>
                <p className="leading-relaxed">
                  We may modify these Terms at any time. We will provide notice
                  of material changes through our platform or via email. Your
                  continued use of the Services after such changes constitutes
                  acceptance of the modified Terms. If you do not agree to the
                  changes, you must stop using the Services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  16. Contact Information
                </h2>
                <p className="leading-relaxed">
                  If you have any questions about these Terms, please contact
                  us:
                </p>
                <div className="bg-[#0f1419] rounded-xl p-6 mt-4 border border-[#1e2733]">
                  <p className="text-white font-semibold mb-2">
                    Oasis MarketPro Legal Department
                  </p>
                  <p>Email: legal@oasismarketpro.com</p>
                  <p>
                    Address: 1266 east main street suite 603 stamford CT 06902.
                    USA
                  </p>
                  <p>Phone: +1 (908) 279-9340</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
