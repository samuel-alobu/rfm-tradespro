import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3,
  Wallet,
  ArrowRight,
  Clock,
  CheckCircle2,
  Bitcoin
} from 'lucide-react';

// ============================================
// Crypto Trading Page
// ============================================

const cryptoAssets = [
  { name: 'Bitcoin', symbol: 'BTC', change: '+2.45%', price: '$67,234' },
  { name: 'Ethereum', symbol: 'ETH', change: '+1.89%', price: '$3,456' },
  { name: 'Solana', symbol: 'SOL', change: '+5.67%', price: '$178' },
  { name: 'BNB', symbol: 'BNB', change: '+0.98%', price: '$605' },
  { name: 'Cardano', symbol: 'ADA', change: '-0.45%', price: '$0.45' },
  { name: 'Ripple', symbol: 'XRP', change: '+3.21%', price: '$0.62' },
];

const features = [
  {
    icon: Zap,
    title: 'Instant Execution',
    description: 'Execute trades in milliseconds with our high-performance trading engine.',
  },
  {
    icon: Shield,
    title: 'Secure Storage',
    description: '95% of assets stored in cold wallets with multi-signature protection.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Charts',
    description: 'Professional TradingView charts with 100+ technical indicators.',
  },
  {
    icon: Wallet,
    title: 'Multiple Wallets',
    description: 'Connect your favorite wallets or use our secure built-in solution.',
  },
];

const tradingOptions = [
  {
    title: 'Spot Trading',
    description: 'Buy and sell cryptocurrencies at current market prices.',
    features: ['0% maker fees', 'Real-time pricing', '200+ trading pairs'],
  },
  {
    title: 'Margin Trading',
    description: 'Amplify your positions with up to 100x leverage.',
    features: ['Up to 100x leverage', 'Isolated & Cross margin', 'Risk management tools'],
  },
  {
    title: 'Futures Trading',
    description: 'Trade perpetual contracts with advanced order types.',
    features: ['Perpetual contracts', 'Quarterly futures', 'Funding rate arbitrage'],
  },
  {
    title: 'Copy Trading',
    description: 'Automatically copy successful crypto traders.',
    features: ['Top performer rankings', 'Risk-adjusted copying', 'Portfolio diversification'],
  },
];

export default function CryptoPage() {
  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f59e0b]/10 rounded-full mb-6">
                  <Bitcoin className="h-5 w-5 text-[#f59e0b]" />
                  <span className="text-[#f59e0b] font-medium">Cryptocurrency Trading</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Trade Crypto with Confidence
                </h1>
                <p className="text-xl text-[#6b7a90] mb-8 leading-relaxed">
                  Access 200+ cryptocurrencies with industry-leading security, 
                  lightning-fast execution, and the lowest fees in the market. 
                  From Bitcoin to emerging altcoins—trade them all in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
                  >
                    Start Trading Crypto
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/markets"
                    className="inline-flex items-center justify-center px-8 py-3 bg-[#1e2733] text-white font-semibold rounded-lg hover:bg-[#2a3441] transition-colors"
                  >
                    View Markets
                  </Link>
                </div>
              </div>
              <div className="bg-[#0f1419] rounded-2xl border border-[#1e2733] p-6">
                <h3 className="text-white font-semibold mb-4">Live Crypto Prices</h3>
                <div className="space-y-4">
                  {cryptoAssets.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-[#1e2733] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#f59e0b]/10 flex items-center justify-center">
                          <span className="text-[#f59e0b] font-bold text-sm">{asset.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{asset.name}</p>
                          <p className="text-sm text-[#6b7a90]">{asset.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{asset.price}</p>
                        <p className={`text-sm ${asset.change.startsWith('+') ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                          {asset.change}
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
              Why Trade Crypto with Us
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

        {/* Trading Options */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              Multiple Ways to Trade
            </h2>
            <p className="text-[#6b7a90] text-center mb-12 max-w-2xl mx-auto">
              Whether you're a beginner or a professional, we have the right trading 
              options for your strategy and risk appetite.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              {tradingOptions.map((option, index) => (
                <div 
                  key={index} 
                  className="bg-[#0f1419] rounded-xl p-6 border border-[#1e2733] hover:border-[#22c55e]/50 transition-colors"
                >
                  <h3 className="text-xl font-semibold text-white mb-2">{option.title}</h3>
                  <p className="text-[#6b7a90] mb-4">{option.description}</p>
                  <ul className="space-y-2">
                    {option.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2 text-sm text-[#9ca3af]">
                        <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 px-6 bg-[#0f1419]">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-[#22c55e] mb-2">200+</p>
                <p className="text-[#6b7a90]">Cryptocurrencies</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#22c55e] mb-2">$1.2B</p>
                <p className="text-[#6b7a90]">Daily Volume</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#22c55e] mb-2">0%</p>
                <p className="text-[#6b7a90]">Maker Fees</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#22c55e] mb-2">24/7</p>
                <p className="text-[#6b7a90]">Market Access</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Start Your Crypto Journey Today
            </h2>
            <p className="text-[#6b7a90] mb-8">
              Open your account in minutes and start trading with as little as $10.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
            >
              Create Free Account
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
