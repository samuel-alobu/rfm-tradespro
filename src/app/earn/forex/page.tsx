import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3,
  Globe,
  ArrowRight,
  Clock,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

// ============================================
// Forex Trading Page
// ============================================

const forexPairs = [
  { pair: 'EUR/USD', spread: '0.1', change: '+0.12%', price: '1.0856' },
  { pair: 'GBP/USD', spread: '0.3', change: '-0.08%', price: '1.2634' },
  { pair: 'USD/JPY', spread: '0.2', change: '+0.25%', price: '149.85' },
  { pair: 'AUD/USD', spread: '0.4', change: '+0.15%', price: '0.6542' },
  { pair: 'USD/CAD', spread: '0.5', change: '-0.05%', price: '1.3621' },
  { pair: 'EUR/GBP', spread: '0.4', change: '+0.18%', price: '0.8593' },
];

const features = [
  {
    icon: Zap,
    title: 'Tight Spreads',
    description: 'Trade major pairs from just 0.1 pips with no hidden markups.',
  },
  {
    icon: TrendingUp,
    title: 'Flexible Leverage',
    description: 'Access leverage up to 1:500 on forex pairs for experienced traders.',
  },
  {
    icon: Clock,
    title: '24/5 Trading',
    description: 'Trade forex around the clock from Sunday evening to Friday night.',
  },
  {
    icon: BarChart3,
    title: 'MT5 Platform',
    description: 'Trade on MetaTrader 5 with advanced analytics and automation.',
  },
];

const accountTypes = [
  {
    name: 'Standard',
    spread: 'From 1.0 pips',
    leverage: 'Up to 1:200',
    minDeposit: '$100',
    commission: '$0',
    features: ['All major pairs', 'Basic analytics', 'Email support'],
  },
  {
    name: 'Pro',
    spread: 'From 0.4 pips',
    leverage: 'Up to 1:400',
    minDeposit: '$1,000',
    commission: '$3/lot',
    features: ['All pairs + exotics', 'Advanced tools', 'Priority support'],
    popular: true,
  },
  {
    name: 'VIP',
    spread: 'From 0.1 pips',
    leverage: 'Up to 1:500',
    minDeposit: '$10,000',
    commission: '$1/lot',
    features: ['Raw spreads', 'Dedicated manager', '24/7 phone support'],
  },
];

export default function ForexPage() {
  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#22c55e]/10 rounded-full mb-6">
                  <DollarSign className="h-5 w-5 text-[#22c55e]" />
                  <span className="text-[#22c55e] font-medium">Forex Trading</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Trade the World's Largest Financial Market
                </h1>
                <p className="text-xl text-[#6b7a90] mb-8 leading-relaxed">
                  Access $6.6 trillion daily volume with spreads from 0.1 pips. 
                  Trade 80+ currency pairs with institutional-grade execution 
                  and the tools professional traders demand.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
                  >
                    Start Forex Trading
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/markets"
                    className="inline-flex items-center justify-center px-8 py-3 bg-[#1e2733] text-white font-semibold rounded-lg hover:bg-[#2a3441] transition-colors"
                  >
                    View All Pairs
                  </Link>
                </div>
              </div>
              <div className="bg-[#0f1419] rounded-2xl border border-[#1e2733] p-6">
                <h3 className="text-white font-semibold mb-4">Live Forex Rates</h3>
                <div className="space-y-4">
                  {forexPairs.map((pair, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-[#1e2733] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-[#22c55e]" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{pair.pair}</p>
                          <p className="text-sm text-[#6b7a90]">Spread: {pair.spread} pips</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{pair.price}</p>
                        <p className={`text-sm ${pair.change.startsWith('+') ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                          {pair.change}
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
              Why Trade Forex with Us
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

        {/* Account Types */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              Choose Your Account Type
            </h2>
            <p className="text-[#6b7a90] text-center mb-12 max-w-2xl mx-auto">
              From beginners to professionals, we have the perfect account for every trading style.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {accountTypes.map((account, index) => (
                <div 
                  key={index} 
                  className={`bg-[#0f1419] rounded-xl p-6 border ${
                    account.popular ? 'border-[#22c55e]' : 'border-[#1e2733]'
                  } relative`}
                >
                  {account.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#22c55e] text-white text-sm font-semibold rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white mb-4 mt-2">{account.name}</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-[#6b7a90]">Spread</span>
                      <span className="text-white font-medium">{account.spread}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7a90]">Leverage</span>
                      <span className="text-white font-medium">{account.leverage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7a90]">Min Deposit</span>
                      <span className="text-white font-medium">{account.minDeposit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7a90]">Commission</span>
                      <span className="text-white font-medium">{account.commission}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {account.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2 text-sm text-[#9ca3af]">
                        <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`block w-full py-3 text-center font-semibold rounded-lg transition-colors ${
                      account.popular 
                        ? 'bg-[#22c55e] text-white hover:bg-[#1ea550]'
                        : 'bg-[#1e2733] text-white hover:bg-[#2a3441]'
                    }`}
                  >
                    Open Account
                  </Link>
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
                <p className="text-4xl font-bold text-[#22c55e] mb-2">80+</p>
                <p className="text-[#6b7a90]">Currency Pairs</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#22c55e] mb-2">0.1</p>
                <p className="text-[#6b7a90]">Pips Min Spread</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#22c55e] mb-2">1:500</p>
                <p className="text-[#6b7a90]">Max Leverage</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#22c55e] mb-2">10ms</p>
                <p className="text-[#6b7a90]">Execution Speed</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Start Trading Forex Today
            </h2>
            <p className="text-[#6b7a90] mb-8">
              Join thousands of forex traders who trust RFM TradePro for their currency trading.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
            >
              Open Trading Account
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
