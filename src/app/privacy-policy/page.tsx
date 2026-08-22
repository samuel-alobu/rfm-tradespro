import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Shield, ArrowLeft } from 'lucide-react';

// ============================================
// Privacy Policy Page
// ============================================

export default function PrivacyPolicyPage() {
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
              <Shield className="h-10 w-10 text-[#22c55e]" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Privacy Policy
              </h1>
            </div>
            <p className="text-[#6b7a90]">Last updated: January 15, 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto prose prose-invert prose-green">
            <div className="space-y-8 text-[#9ca3af]">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  1. Introduction
                </h2>
                <p className="leading-relaxed">
                  Oasis MarketPro, Inc. ("we," "us," or "our") respects your
                  privacy and is committed to protecting your personal data.
                  This Privacy Policy explains how we collect, use, disclose,
                  and safeguard your information when you use our trading
                  platform, website, mobile applications, and related services
                  (collectively, the "Services").
                </p>
                <p className="leading-relaxed mt-4">
                  By accessing or using our Services, you agree to this Privacy
                  Policy. If you do not agree with the terms of this Privacy
                  Policy, please do not access the Services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  2. Information We Collect
                </h2>

                <h3 className="text-xl font-semibold text-white mb-3">
                  2.1 Personal Information
                </h3>
                <p className="leading-relaxed mb-4">
                  We collect personal information that you voluntarily provide,
                  including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Full name, date of birth, and government-issued
                    identification
                  </li>
                  <li>
                    Contact information (email address, phone number, mailing
                    address)
                  </li>
                  <li>
                    Financial information (bank account details, payment card
                    information)
                  </li>
                  <li>Employment and income information</li>
                  <li>Tax identification numbers</li>
                  <li>Investment experience and risk tolerance</li>
                  <li>Source of funds documentation</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3 mt-6">
                  2.2 Automatically Collected Information
                </h3>
                <p className="leading-relaxed mb-4">
                  When you access our Services, we automatically collect:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Device information (type, operating system, unique
                    identifiers)
                  </li>
                  <li>IP address and geolocation data</li>
                  <li>Browser type and version</li>
                  <li>
                    Usage data (pages visited, time spent, click patterns)
                  </li>
                  <li>Trading activity and transaction history</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  3. How We Use Your Information
                </h2>
                <p className="leading-relaxed mb-4">
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-white">Account Management:</strong>{" "}
                    To create and manage your trading account
                  </li>
                  <li>
                    <strong className="text-white">Service Delivery:</strong> To
                    process transactions and provide our Services
                  </li>
                  <li>
                    <strong className="text-white">Compliance:</strong> To
                    comply with KYC/AML regulations and legal obligations
                  </li>
                  <li>
                    <strong className="text-white">Security:</strong> To detect
                    and prevent fraud, unauthorized access, and abuse
                  </li>
                  <li>
                    <strong className="text-white">Communication:</strong> To
                    send account updates, security alerts, and marketing (with
                    consent)
                  </li>
                  <li>
                    <strong className="text-white">Improvement:</strong> To
                    analyze usage and improve our Services
                  </li>
                  <li>
                    <strong className="text-white">Legal:</strong> To enforce
                    our terms and respond to legal requests
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  4. Information Sharing
                </h2>
                <p className="leading-relaxed mb-4">
                  We may share your information with:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-white">Service Providers:</strong>{" "}
                    Third-party vendors who assist in operating our Services
                    (payment processors, cloud providers, analytics services)
                  </li>
                  <li>
                    <strong className="text-white">Financial Partners:</strong>{" "}
                    Banks, liquidity providers, and clearing houses necessary
                    for trade execution
                  </li>
                  <li>
                    <strong className="text-white">
                      Regulatory Authorities:
                    </strong>{" "}
                    Government agencies and regulators as required by law
                  </li>
                  <li>
                    <strong className="text-white">Legal Requirements:</strong>{" "}
                    In response to court orders, subpoenas, or legal processes
                  </li>
                  <li>
                    <strong className="text-white">Business Transfers:</strong>{" "}
                    In connection with mergers, acquisitions, or asset sales
                  </li>
                </ul>
                <p className="leading-relaxed mt-4">
                  We do not sell your personal information to third parties for
                  marketing purposes.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  5. Data Security
                </h2>
                <p className="leading-relaxed">
                  We implement robust security measures to protect your personal
                  information:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>256-bit SSL/TLS encryption for all data transmission</li>
                  <li>AES-256 encryption for data at rest</li>
                  <li>Multi-factor authentication (MFA)</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>SOC 2 Type II certified data centers</li>
                  <li>24/7 security monitoring and incident response</li>
                  <li>Employee background checks and security training</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  6. Data Retention
                </h2>
                <p className="leading-relaxed">
                  We retain your personal information for as long as necessary
                  to provide our Services, comply with legal obligations,
                  resolve disputes, and enforce our agreements. Generally:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>
                    Account data: Retained for the duration of your account plus
                    7 years
                  </li>
                  <li>
                    Transaction records: Retained for 7 years as required by
                    financial regulations
                  </li>
                  <li>Communication records: Retained for 5 years</li>
                  <li>Marketing preferences: Until you withdraw consent</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  7. Your Rights
                </h2>
                <p className="leading-relaxed mb-4">
                  Depending on your jurisdiction, you may have the following
                  rights:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-white">Access:</strong> Request a
                    copy of your personal data
                  </li>
                  <li>
                    <strong className="text-white">Correction:</strong> Request
                    correction of inaccurate data
                  </li>
                  <li>
                    <strong className="text-white">Deletion:</strong> Request
                    deletion of your data (subject to legal requirements)
                  </li>
                  <li>
                    <strong className="text-white">Portability:</strong> Receive
                    your data in a portable format
                  </li>
                  <li>
                    <strong className="text-white">Objection:</strong> Object to
                    certain processing activities
                  </li>
                  <li>
                    <strong className="text-white">Restriction:</strong> Request
                    restriction of processing
                  </li>
                  <li>
                    <strong className="text-white">Withdraw Consent:</strong>{" "}
                    Withdraw consent for marketing communications
                  </li>
                </ul>
                <p className="leading-relaxed mt-4">
                  To exercise these rights, contact us at
                  privacy@eliteprocapital.com.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  8. Cookies and Tracking
                </h2>
                <p className="leading-relaxed">
                  We use cookies and similar technologies to enhance your
                  experience, analyze usage, and deliver personalized content.
                  You can manage cookie preferences through your browser
                  settings. Note that disabling certain cookies may affect
                  functionality.
                </p>
                <p className="leading-relaxed mt-4">Types of cookies we use:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>
                    <strong className="text-white">Essential:</strong> Required
                    for basic site functionality
                  </li>
                  <li>
                    <strong className="text-white">Performance:</strong> Help us
                    understand how visitors use our site
                  </li>
                  <li>
                    <strong className="text-white">Functional:</strong> Remember
                    your preferences
                  </li>
                  <li>
                    <strong className="text-white">Marketing:</strong> Deliver
                    relevant advertisements (with consent)
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  9. International Transfers
                </h2>
                <p className="leading-relaxed">
                  Your information may be transferred to and processed in
                  countries other than your country of residence. We ensure
                  appropriate safeguards are in place, including Standard
                  Contractual Clauses approved by the European Commission and
                  compliance with applicable data protection frameworks.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  10. Children's Privacy
                </h2>
                <p className="leading-relaxed">
                  Our Services are not intended for individuals under 18 years
                  of age. We do not knowingly collect personal information from
                  children. If you believe we have collected information from a
                  child, please contact us immediately.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  11. Changes to This Policy
                </h2>
                <p className="leading-relaxed">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any material changes by posting the new policy
                  on this page and updating the "Last updated" date. Your
                  continued use of the Services after changes constitutes
                  acceptance of the updated policy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  12. Contact Us
                </h2>
                <p className="leading-relaxed">
                  If you have questions about this Privacy Policy or our data
                  practices, please contact:
                </p>
                <div className="bg-[#0f1419] rounded-xl p-6 mt-4 border border-[#1e2733]">
                  <p className="text-white font-semibold mb-2">
                    Oasis MarketPro Privacy Team
                  </p>
                  <p>Email: privacy@oasismarketpro.com</p>
                  <p>
                    Address: 1266 east main street suite 603 stamford CT 06902.
                    USA
                  </p>
                  <p>Data Protection Officer: dpo@oasismarketpro.com</p>
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
