import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { 
  Shield, 
  Zap, 
  TrendingUp, 
  Lock, 
  Headphones, 
  Globe,
  BarChart3,
  Wallet,
  Users,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

// ============================================
// Why Oasis MarketPro Page
// ============================================

const features = [
  {
    icon: Zap,
    title: 'Lightning-Fast Execution',
    description: 'Our proprietary trading engine executes orders in under 10 milliseconds. No slippage, no requotes—just instant execution at the price you see.',
    stats: '<10ms',
    statsLabel: 'Execution Speed',
  },
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: '256-bit SSL encryption, cold storage for 95% of assets, and $100M insurance coverage. Your funds are protected by the same security used by major financial institutions.',
    stats: '$100M',
    statsLabel: 'Insurance Coverage',
  },
  {
    icon: TrendingUp,
    title: 'Advanced Trading Tools',
    description: 'Professional charting with 100+ indicators, algorithmic trading support, and real-time market analysis. Everything you need to make informed decisions.',
    stats: '100+',
    statsLabel: 'Technical Indicators',
  },
  {
    icon: Globe,
    title: 'Global Market Access',
    description: 'Trade 500+ instruments across crypto, forex, stocks, and commodities—all from a single account. Access markets 24/7 from anywhere in the world.',
    stats: '500+',
    statsLabel: 'Tradeable Assets',
  },
  {
    icon: Headphones,
    title: '24/7 Expert Support',
    description: 'Our multilingual support team is available around the clock. Whether it\'s 3 AM or 3 PM, help is just a click away with average response times under 2 minutes.',
    stats: '<2min',
    statsLabel: 'Response Time',
  },
  {
    icon: Wallet,
    title: 'Competitive Pricing',
    description: 'Industry-leading spreads starting from 0.1 pips. No hidden fees, no commissions on standard accounts. Keep more of your profits.',
    stats: '0.1',
    statsLabel: 'Pips Spread',
  },
];

const comparisons = [
  { feature: 'Minimum Deposit', elite: '$10', others: '$100-500' },
  { feature: 'Execution Speed', elite: '<10ms', others: '50-200ms' },
  { feature: 'Spreads', elite: 'From 0.1 pips', others: 'From 1.5 pips' },
  { feature: 'Leverage', elite: 'Up to 1:500', others: 'Up to 1:100' },
  { feature: 'Withdrawal Time', elite: 'Instant-24h', others: '3-5 days' },
  { feature: 'Customer Support', elite: '24/7 Live', others: 'Business hours' },
  { feature: 'Insurance', elite: '$100M', others: 'Varies' },
  { feature: 'Mobile Trading', elite: 'Full-featured', others: 'Limited' },
];

const testimonials = [
  {
    quote: "I've tried multiple platforms, but Oasis MarketPro's execution speed is unmatched. My scalping strategy finally works as intended.",
    author: "Michael R.",
    role: "Professional Day Trader",
    location: "New York, USA",
  },
  {
    quote: "The copy trading feature has transformed my investment approach. I'm earning consistent returns by following top performers.",
    author: "Emma S.",
    role: "Part-time Investor",
    location: "London, UK",
  },
  {
    quote: "As a developer, I appreciate the robust API. Building my trading bots on Oasis MarketPro was seamless.",
    author: "Kenji T.",
    role: "Algorithmic Trader",
    location: "Tokyo, Japan",
  },
];

export default function WhyEliteProCapitalPage() {
  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose Oasis MarketPro?
            </h1>
            <p className="text-xl text-[#6b7a90] leading-relaxed mb-8">
              In a market flooded with trading platforms, here's why over 150,000 
              traders trust us with their investments. It's not just about trading—it's 
              about trading smarter.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
            >
              Start Trading Today
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-6 bg-[#0f1419]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              The Elite Advantage
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-[#0a0e14] rounded-xl p-6 border border-[#1e2733] hover:border-[#22c55e]/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-[#22c55e]/10 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-[#22c55e]" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#22c55e]">{feature.stats}</p>
                      <p className="text-xs text-[#6b7a90]">{feature.statsLabel}</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-[#6b7a90]">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              See How We Compare
            </h2>
            <p className="text-[#6b7a90] text-center mb-12">
              A side-by-side comparison with typical industry standards
            </p>
            <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
              <div className="grid grid-cols-3 bg-[#1e2733] p-4">
                <div className="text-[#6b7a90] font-medium">Feature</div>
                <div className="text-[#22c55e] font-semibold text-center">Oasis MarketPro</div>
                <div className="text-[#6b7a90] text-center">Industry Average</div>
              </div>
              {comparisons.map((row, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-3 p-4 border-t border-[#1e2733] hover:bg-[#151c24]"
                >
                  <div className="text-white">{row.feature}</div>
                  <div className="text-[#22c55e] font-medium text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {row.elite}
                  </div>
                  <div className="text-[#6b7a90] text-center">{row.others}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-6 bg-[#0f1419]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              What Our Traders Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index} 
                  className="bg-[#0a0e14] rounded-xl p-6 border border-[#1e2733]"
                >
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className="text-[#f59e0b]">★</span>
                    ))}
                  </div>
                  <p className="text-[#9ca3af] mb-6 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="text-white font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-[#6b7a90]">{testimonial.role}</p>
                    <p className="text-sm text-[#6b7a90]">{testimonial.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Regulatory Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Lock className="h-16 w-16 text-[#22c55e] mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Regulated & Compliant
            </h2>
            <p className="text-[#6b7a90] leading-relaxed mb-8">
              Oasis MarketPro operates under strict regulatory oversight. We're registered 
              with major financial authorities and maintain the highest standards of compliance. 
              Your funds are held in segregated accounts at tier-1 banks, completely separate 
              from company operating funds.
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">SEC</p>
                <p className="text-sm text-[#6b7a90]">Registered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">FCA</p>
                <p className="text-sm text-[#6b7a90]">Authorized</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">CySEC</p>
                <p className="text-sm text-[#6b7a90]">Licensed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">ASIC</p>
                <p className="text-sm text-[#6b7a90]">Regulated</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-[#22c55e]/10 to-[#16a34a]/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Experience the Difference?
            </h2>
            <p className="text-[#6b7a90] mb-8">
              Join thousands of traders who've already made the switch to Oasis MarketPro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
              >
                Open Free Account
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 bg-[#1e2733] text-white font-semibold rounded-lg hover:bg-[#2a3441] transition-colors"
              >
                Demo Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
