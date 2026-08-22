"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { cn, getCopyrightYearRange } from "@/utils";

// ============================================
// Footer Links Data (Matching Design)
// ============================================

const footerLinks = {
  about: {
    title: "About",
    links: [
      { href: "/about", label: "About us" },
      { href: "/why-oasis-marketpro", label: "Why Oasis MarketPro" },
    ],
  },
  earn: {
    title: "Earn",
    links: [
      { href: "/earn/crypto", label: "Crypto" },
      { href: "/earn/forex", label: "Forex" },
      { href: "/earn/stocks", label: "Stocks" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { href: "/legal", label: "Legal" },
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/terms-of-service", label: "Terms of service" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Send us an email" },
    ],
  },
};

// ============================================
// Footer Component
// ============================================

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const copyrightYearRange = getCopyrightYearRange();

  return (
    <footer className={cn("bg-[#0a0e14]", className)}>
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="text-sm text-[#6b7a90] mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white hover:text-[#22c55e] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Brand & Risk Disclaimers */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* Logo */}
        <div className="mb-8">
          <Logo size="sm" />
        </div>

        {/* Risk Disclaimers */}
        <div className="space-y-6 text-sm text-[#6b7a90] leading-relaxed">
          <p>
            Oasis Pro Markets, LLC is a member of FINRA / SIPC, and an SEC
            registered broker-dealer and Alternative Trading System. Oasis Pro
            Markets LLC is a subsidiary of Oasis Pro Inc/ Oasis MarketPro.
          </p>
          <p>
            The risk of loss in online trading of stocks, options, futures,
            currencies, foreign equities, and fixed Income can be substantial.
          </p>
          <p>
            Before trading, clients must read the relevant risk disclosure
            statements on our Warnings and Disclosures page. Trading on margin
            is only for experienced investors with high risk tolerance. You may
            lose more than your initial investment. For additional information
            about rates on margin loans, please see Margin Loan Rates. Security
            futures involve a high degree of risk and are not suitable for all
            investors. The amount you may lose may be greater than your initial
            investment.
          </p>
          <p>
            For trading security futures, read the Security Futures Risk
            Disclosure Statement. Structured products and fixed income products
            such as bonds are complex products that are more risky and are not
            suitable for all investors. Before trading, please read the Risk
            Warning and Disclosure Statement.
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-[#1e2733]">
          <p className="text-sm text-[#6b7a90]">
            © {copyrightYearRange} Oasis MarketPro, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
