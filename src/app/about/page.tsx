import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Shield, Users, Globe, Award, TrendingUp, Lock, Headphones, Zap } from 'lucide-react';

// ============================================
// About Us Page
// ============================================

const stats = [
  { value: '$2.5B+', label: 'Trading Volume' },
  { value: '150K+', label: 'Active Traders' },
  { value: '98.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
];

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'Bank-grade encryption and multi-layer security protocols protect your assets around the clock.',
  },
  {
    icon: Users,
    title: 'Client-Centric',
    description: 'Every decision we make starts with one question: How does this benefit our traders?',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Serving traders in 180+ countries with localized support and compliance.',
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'Committed to delivering the best trading experience through continuous innovation.',
  },
];

const leadership = [
  {
    name: "Pat Lavecchia",
    role: "Chief Executive Officer",
    bio: 'CEO of Oasis Pro Markets LLC, the first US-regulatedalternative trading system ("ATS") authorized to allow its Subscribers to tradedigital ("blockchain") securities and make payment for those digital securitiesin digital cash. Over his 25+ year career, he has led capital markets teams andspearheaded the financing, acquisition and/or sale of well over 150 companiesinvolving transactions comprising of over $20 billion across a variety ofindustries including technology, fintech, and blockchain.',
  },
  {
    name: "John Kasselakis",
    role: "Chief Technology Officer",
    bio: 'John Kasselakis is an executive with 20+ years of structuring, financing, programming, developing and overseeing complex, high-value and strategically relevant international businesses with project costs in the billions of USD in partnership with leading governmental, financial and private and publicly-traded counterparts based in East Asia, Central Asia, the Middle East, Europe and the Americas.',
  },
  {
    name: "Galen Murphy",
    role: "Chief Investment Officer",
    bio: "Hedge fund manager with $500M+ in assets under management.",
  },
  {
    name: "Elena Rodriguez",
    role: "Chief Compliance Officer",
    bio: "Former SEC regulator ensuring our global regulatory compliance.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              About Oasis MarketPro
            </h1>
            <p className="text-xl text-[#6b7a90] leading-relaxed">
              Since 2019, we've been on a mission to democratize financial
              markets, providing institutional-grade trading tools to everyone.
              From our humble beginnings to serving over 150,000 traders
              worldwide, our commitment remains unchanged: your success is our
              success.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-6 bg-[#0f1419]">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-[#22c55e] mb-2">
                    {stat.value}
                  </p>
                  <p className="text-[#6b7a90]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Our Story
            </h2>
            <div className="space-y-6 text-[#9ca3af] leading-relaxed">
              <p>
                Oasis MarketPro was founded in 2019 by Wall Street veteran Pat
                LaVecchia with the mission to build a regulated bridge between
                traditional finance (Web2) and the digital asset space (Web3)
                Oasis pro LLC established a strong track record by becoming an
                SEC-registered broker-dealer and FINRA member in 2020.
              </p>
              <p>
                It launched OATSPRO, a multi-asset Alternative Trading System
                (ATS) that became one of the first in the U.S. authorized to
                settle digital securities in both fiat and stablecoins like USDC
                and DAI.
              </p>
              <p>
                Today, the platform serves institutional investors, accredited
                investors, and issuers by facilitating the primary issuance and
                secondary trading of digital securities and copy trading.
              </p>
              {/* <p>
                What sets us apart isn't just our technology—it's our people.
                Our global team of over 500 professionals works around the clock
                to ensure your trading experience is seamless, secure, and
                profitable.
              </p> */}
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-20 px-6 bg-[#0f1419]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Our Values
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="text-center">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-[#22c55e]/10 flex items-center justify-center mb-4">
                    <value.icon className="h-8 w-8 text-[#22c55e]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-[#6b7a90]">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Leadership Team
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {leadership.map((person, index) => (
                <div
                  key={index}
                  className="bg-[#0f1419] rounded-xl p-6 border border-[#1e2733]"
                >
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center mb-4">
                    <span className="text-white text-xl font-bold">
                      {person.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {person.name}
                  </h3>
                  <p className="text-[#22c55e] text-sm mb-3">{person.role}</p>
                  <p className="text-sm text-[#6b7a90]">{person.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-[#22c55e]/10 to-[#16a34a]/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-[#6b7a90] mb-8">
              Join over 150,000 traders who trust Oasis MarketPro with their
              investments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
              >
                Create Free Account
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 bg-[#1e2733] text-white font-semibold rounded-lg hover:bg-[#2a3441] transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
