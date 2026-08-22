import React from "react";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import {
  Scale,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Building2,
  Globe,
} from "lucide-react";

// ============================================
// Legal Overview Page
// ============================================

const legalDocuments = [
  {
    icon: FileText,
    title: "Terms of Service",
    description:
      "The terms and conditions governing your use of Oasis MarketPro services.",
    href: "/terms-of-service",
    updated: "January 15, 2026",
  },
  {
    icon: Shield,
    title: "Privacy Policy",
    description: "How we collect, use, and protect your personal information.",
    href: "/privacy-policy",
    updated: "January 15, 2026",
  },
  {
    icon: AlertTriangle,
    title: "Risk Disclosure",
    description:
      "Important information about the risks associated with trading.",
    href: "/risk-disclosure",
    updated: "January 15, 2026",
  },
  // {
  //   icon: Scale,
  //   title: "Regulatory Information",
  //   description: "Details about our regulatory status and compliance.",
  //   href: "/regulatory",
  //   updated: "January 15, 2026",
  // },
];

const regulations = [
  {
    region: "United States",
    body: "SEC & FINRA",
    status: "Registered",
    description: "Securities and Exchange Commission registered broker-dealer.",
  },
  {
    region: "United Kingdom",
    body: "FCA",
    status: "Authorized",
    description: "Financial Conduct Authority authorized and regulated.",
  },
  {
    region: "European Union",
    body: "CySEC",
    status: "Licensed",
    description: "Cyprus Securities and Exchange Commission licensed.",
  },
  {
    region: "Australia",
    body: "ASIC",
    status: "Regulated",
    description: "Australian Securities and Investments Commission regulated.",
  },
];

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Scale className="h-16 w-16 text-[#22c55e] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Legal Information
            </h1>
            <p className="text-xl text-[#6b7a90] leading-relaxed">
              Transparency and compliance are fundamental to how we operate.
              Here you'll find all the legal documents and regulatory
              information governing our services.
            </p>
          </div>
        </section>

        {/* Legal Documents */}
        <section className="py-16 px-6 bg-[#0f1419]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">
              Legal Documents
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {legalDocuments.map((doc, index) => (
                <Link
                  key={index}
                  href={doc.href}
                  className="bg-[#0a0e14] rounded-xl p-6 border border-[#1e2733] hover:border-[#22c55e]/50 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                      <doc.icon className="h-6 w-6 text-[#22c55e]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-white group-hover:text-[#22c55e] transition-colors">
                          {doc.title}
                        </h3>
                        <ArrowRight className="h-5 w-5 text-[#6b7a90] group-hover:text-[#22c55e] transition-colors" />
                      </div>
                      <p className="text-[#6b7a90] mb-2">{doc.description}</p>
                      <p className="text-sm text-[#6b7a90]">
                        Last updated: {doc.updated}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Regulatory Status */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">
                Regulatory Status
              </h2>
              <p className="text-[#6b7a90] max-w-2xl mx-auto">
                Oasis MarketPro operates under strict regulatory oversight in
                multiple jurisdictions, ensuring the highest standards of
                investor protection.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regulations.map((reg, index) => (
                <div
                  key={index}
                  className="bg-[#0f1419] rounded-xl p-6 border border-[#1e2733]"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="h-5 w-5 text-[#22c55e]" />
                    <span className="text-white font-semibold">
                      {reg.region}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#6b7a90]">Regulatory Body</span>
                      <span className="text-white font-medium">{reg.body}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7a90]">Status</span>
                      <span className="text-[#22c55e] font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {reg.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[#6b7a90] mt-4">
                    {reg.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Client Protection */}
        <section className="py-16 px-6 bg-[#0f1419]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              Client Protection
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-[#22c55e]/10 flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-[#22c55e]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Segregated Accounts
                </h3>
                <p className="text-[#6b7a90] text-sm">
                  Client funds are held in segregated accounts at tier-1 banks,
                  completely separate from company operating funds.
                </p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-[#22c55e]/10 flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-[#22c55e]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Insurance Coverage
                </h3>
                <p className="text-[#6b7a90] text-sm">
                  Up to $100 million in insurance coverage protects against
                  theft, cyber attacks, and unauthorized access.
                </p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-[#22c55e]/10 flex items-center justify-center mb-4">
                  <Scale className="h-8 w-8 text-[#22c55e]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Dispute Resolution
                </h3>
                <p className="text-[#6b7a90] text-sm">
                  Fair and transparent dispute resolution processes with access
                  to independent financial ombudsman services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Legal */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Legal Inquiries
            </h2>
            <p className="text-[#6b7a90] mb-6">
              For legal inquiries, compliance questions, or regulatory matters,
              please contact our legal department.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:legal@oasismarketpro.com"
                className="px-8 py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
              >
                legal@oasismarketpro.com
              </a>
              <Link
                href="/contact"
                className="px-8 py-3 bg-[#1e2733] text-white font-semibold rounded-lg hover:bg-[#2a3441] transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
