import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3,
  Building2,
  ArrowRight,
  PieChart,
  CheckCircle2,
  Briefcase
} from 'lucide-react';

// ============================================
// Stocks Trading Page
// ============================================

const featuredStocks = [
  { name: 'Apple Inc.', symbol: 'AAPL', change: '+1.25%', price: '$178.72' },
  { name: 'Microsoft', symbol: 'MSFT', change: '+0.89%', price: '$415.56' },
  { name: 'NVIDIA', symbol: 'NVDA', change: '+3.45%', price: '$875.45' },
  { name: 'Tesla', symbol: 'TSLA', change: '-0.67%', price: '$175.34' },
  { name: 'Amazon', symbol: 'AMZN', change: '+1.12%', price: '$178.25' },
  { name: 'Meta', symbol: 'META', change: '+2.34%', price: '$505.23' },
];

const features = [
  {
    icon: Building2,
    title: 'Global Markets',
    description: 'Access NYSE, NASDAQ, LSE, and more from a single account.',
  },
  {
    icon: PieChart,
    title: 'Fractional Shares',
    description: 'Invest in expensive stocks with as little as $1.',
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Data',
    description: 'Live streaming quotes and professional-grade research.',
  },
  {
    icon: Shield,
    title: 'SIPC Protected',
    description: 'Your investments are protected up to $500,000.',
  },
];

const benefits = [
  {
    title: 'Commission-Free Trading',
    description: 'Trade US stocks with zero commission. No hidden fees, no markup on spreads.',
    icon: Zap,
  },
  {
    title: 'Extended Hours Trading',
    description: 'Trade before the market opens and after it closes. Access pre-market from 4 AM ET.',
    icon: BarChart3,
  },
  {
    title: 'Dividend Reinvestment',
    description: 'Automatically reinvest dividends to compound your returns over time.',
    icon: TrendingUp,
  },
  {
    title: 'Professional Research',
    description: 'Access analyst ratings, earnings reports, and institutional-grade research tools.',
    icon: Briefcase,
  },
];

const markets = [
  { name: 'United States', exchanges: 'NYSE, NASDAQ', stocks: '8,000+' },
  { name: 'United Kingdom', exchanges: 'LSE', stocks: '2,000+' },
  { name: 'Germany', exchanges: 'XETRA', stocks: '1,500+' },
  { name: 'Japan', exchanges: 'TSE', stocks: '3,500+' },
  { name: 'Hong Kong', exchanges: 'HKEX', stocks: '2,500+' },
  { name: 'Australia', exchanges: 'ASX', stocks: '2,000+' },
];

export default function StocksPage() {
  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#3b82f6]/10 rounded-full mb-6">
                  <Building2 className="h-5 w-5 text-[#3b82f6]" />
                  <span className="text-[#3b82f6] font-medium">Stock Trading</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Invest in the World's Best Companies
                </h1>
                <p className="text-xl text-[#6b7a90] mb-8 leading-relaxed">
                  Trade 15,000+ stocks from major global exchanges with zero commission. 
                  From blue-chip giants to emerging growth stocks—build the portfolio 
                  you've always wanted.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
                  >
                    Start Investing
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/markets"
                    className="inline-flex items-center justify-center px-8 py-3 bg-[#1e2733] text-white font-semibold rounded-lg hover:bg-[#2a3441] transition-colors"
                  >
                    Browse Stocks
                  </Link>
                </div>
              </div>
              <div className="bg-[#0f1419] rounded-2xl border border-[#1e2733] p-6">
                <h3 className="text-white font-semibold mb-4">Trending Stocks</h3>
                <div className="space-y-4">
                  {featuredStocks.map((stock, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-[#1e2733] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                          <span className="text-[#3b82f6] font-bold text-sm">{stock.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{stock.name}</p>
                          <p className="text-sm text-[#6b7a90]">{stock.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{stock.price}</p>
                        <p className={`text-sm ${stock.change.startsWith('+') ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                          {stock.change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6 bg-[#0f1419]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Why Invest with Us
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-[#22c55e]/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-8 w-8 text-[#22c55e]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-[#6b7a90]">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              The Oasis MarketPro Advantage
            </h2>
            <p className="text-[#6b7a90] text-center mb-12 max-w-2xl mx-auto">
              Everything you need to become a successful stock investor, all in one platform.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex gap-4 bg-[#0f1419] rounded-xl p-6 border border-[#1e2733]"
                >
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-[#22c55e]/10 flex items-center justify-center">
                    <benefit.icon className="h-6 w-6 text-[#22c55e]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                    <p className="text-[#6b7a90]">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Global Markets */}
        <section className="py-20 px-6 bg-[#0f1419]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              Access Global Markets
            </h2>
            <p className="text-[#6b7a90] text-center mb-12 max-w-2xl mx-auto">
              Diversify your portfolio with stocks from the world's leading exchanges.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market, index) => (
                <div 
                  key={index} 
                  className="bg-[#0a0e14] rounded-xl p-6 border border-[#1e2733]"
                >
                  <h3 className="text-xl font-semibold text-white mb-3">{market.name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#6b7a90]">Exchanges</span>
                      <span className="text-white">{market.exchanges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7a90]">Available Stocks</span>
                      <span className="text-[#22c55e] font-medium">{market.stocks}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-[#22c55e] mb-2">15,000+</p>
                <p className="text-[#6b7a90]">Stocks Available</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#22c55e] mb-2">$0</p>
                <p className="text-[#6b7a90]">Commission</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#22c55e] mb-2">$1</p>
                <p className="text-[#6b7a90]">Min Investment</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#22c55e] mb-2">15+</p>
                <p className="text-[#6b7a90]">Global Exchanges</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-[#0f1419]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Start Building Your Portfolio
            </h2>
            <p className="text-[#6b7a90] mb-8">
              Join millions of investors who trust Oasis MarketPro for their stock investments.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
            >
              Open Investment Account
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
