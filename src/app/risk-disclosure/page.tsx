import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

// ============================================
// Risk Disclosure Page
// ============================================

export default function RiskDisclosurePage() {
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
              <AlertTriangle className="h-10 w-10 text-[#f59e0b]" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Risk Disclosure Statement</h1>
            </div>
            <p className="text-[#6b7a90]">Last updated: January 15, 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto prose prose-invert prose-green">
            <div className="space-y-8 text-[#9ca3af]">
              
              <div className="bg-[#ef4444]/10 rounded-xl p-6 border border-[#ef4444]/30">
                <p className="text-[#ef4444] font-bold text-lg mb-2">⚠️ Important Risk Warning</p>
                <p className="text-white">
                  Trading and investing in financial instruments involves substantial risk of loss 
                  and is not suitable for all investors. You should carefully consider whether 
                  trading is appropriate for you in light of your financial condition. The high 
                  degree of leverage can work against you as well as for you. Before deciding to 
                  trade, you should be aware of all the risks associated with trading and seek 
                  advice from an independent financial advisor if you have any doubts.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">1. General Risk Warning</h2>
                <p className="leading-relaxed">
                  The risk of loss in online trading of stocks, options, futures, currencies, 
                  foreign equities, and fixed income can be substantial. Before trading, clients 
                  must read the relevant risk disclosure statements on our Warnings and Disclosures 
                  page. Trading on margin is only for experienced investors with high risk tolerance. 
                  You may lose more than your initial investment.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">2. Market Risk</h2>
                <p className="leading-relaxed">
                  Financial markets are subject to various risks that can affect the value of your 
                  investments:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li><strong className="text-white">Price Volatility:</strong> Prices can move rapidly and unpredictably. Past performance is not indicative of future results.</li>
                  <li><strong className="text-white">Market Gaps:</strong> Prices may gap significantly between trading sessions, potentially triggering stop-loss orders at unfavorable prices.</li>
                  <li><strong className="text-white">Liquidity Risk:</strong> In certain market conditions, you may find it difficult or impossible to execute orders at desired prices.</li>
                  <li><strong className="text-white">Weekend/Holiday Risk:</strong> Markets may open at significantly different prices after weekends or holidays.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">3. Leverage Risk</h2>
                <p className="leading-relaxed">
                  Leverage amplifies both potential profits and potential losses:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>A small market movement can result in proportionally much larger gains or losses</li>
                  <li>You may lose your entire investment and potentially owe additional funds</li>
                  <li>Margin requirements may increase at any time, requiring additional deposits</li>
                  <li>Positions may be liquidated without notice if margin requirements are not met</li>
                  <li>Interest charges on leveraged positions can accumulate over time</li>
                </ul>
                <div className="bg-[#f59e0b]/10 rounded-xl p-4 mt-4 border border-[#f59e0b]/30">
                  <p className="text-[#f59e0b] text-sm">
                    <strong>Example:</strong> With 100x leverage, a 1% adverse price movement 
                    results in a 100% loss of your margin. Leverage magnifies risk exponentially.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">4. Cryptocurrency-Specific Risks</h2>
                <p className="leading-relaxed mb-4">
                  Cryptocurrency trading carries additional unique risks:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-white">Extreme Volatility:</strong> Cryptocurrency prices can swing 10-20% or more in a single day</li>
                  <li><strong className="text-white">Regulatory Risk:</strong> Regulations may change rapidly and vary by jurisdiction</li>
                  <li><strong className="text-white">Technology Risk:</strong> Blockchain networks may experience congestion, forks, or failures</li>
                  <li><strong className="text-white">Security Risk:</strong> Despite security measures, hacking and theft risks exist</li>
                  <li><strong className="text-white">Project Risk:</strong> Many cryptocurrency projects fail or become worthless</li>
                  <li><strong className="text-white">Liquidity Risk:</strong> Some cryptocurrencies may have limited trading volume</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">5. Forex Trading Risks</h2>
                <p className="leading-relaxed mb-4">
                  Foreign exchange trading involves significant risks:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-white">Currency Risk:</strong> Exchange rates can fluctuate significantly based on economic and political factors</li>
                  <li><strong className="text-white">Interest Rate Risk:</strong> Central bank decisions can cause rapid price movements</li>
                  <li><strong className="text-white">Country Risk:</strong> Political instability can affect currency values</li>
                  <li><strong className="text-white">Weekend Gaps:</strong> Prices may move significantly over weekends when markets are closed</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">6. Futures and Derivatives Risks</h2>
                <p className="leading-relaxed">
                  Security futures involve a high degree of risk and are not suitable for all investors. 
                  The amount you may lose may be greater than your initial investment. Before trading 
                  security futures, read the Security Futures Risk Disclosure Statement.
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Futures contracts have expiration dates and may settle differently than expected</li>
                  <li>Margin requirements can change rapidly during volatile markets</li>
                  <li>Options may expire worthless, resulting in total loss of premium paid</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">7. Technology and Execution Risks</h2>
                <p className="leading-relaxed mb-4">
                  Trading electronically carries inherent risks:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-white">System Failures:</strong> Hardware, software, or network failures may prevent order execution</li>
                  <li><strong className="text-white">Connectivity Issues:</strong> Internet disruptions may prevent access to your account</li>
                  <li><strong className="text-white">Execution Delays:</strong> During high volatility, orders may not execute immediately</li>
                  <li><strong className="text-white">Slippage:</strong> Orders may execute at prices different from those displayed</li>
                  <li><strong className="text-white">Data Accuracy:</strong> Price quotes may be delayed or incorrect during system issues</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">8. Copy Trading Risks</h2>
                <p className="leading-relaxed mb-4">
                  While copy trading allows you to replicate other traders' strategies, it carries specific risks:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Past performance of traders you copy is not indicative of future results</li>
                  <li>You may not fully understand the strategies being employed</li>
                  <li>Execution may differ from the original trader due to timing and market conditions</li>
                  <li>You remain responsible for all trades executed in your account</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">9. No Guarantee of Profits</h2>
                <p className="leading-relaxed">
                  Oasis MarketPro does not guarantee any profits from trading. Any examples of 
                  potential profits or trading strategies are hypothetical and for educational 
                  purposes only. No representation is being made that any account will or is 
                  likely to achieve profits or losses similar to those discussed.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">10. Suitability</h2>
                <p className="leading-relaxed">
                  Trading may not be suitable for everyone. Before trading, you should carefully consider:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Your financial objectives and risk tolerance</li>
                  <li>Your level of experience and knowledge</li>
                  <li>Your financial resources and ability to bear losses</li>
                  <li>Your understanding of the products being traded</li>
                </ul>
                <p className="leading-relaxed mt-4">
                  If you have any doubts, you should seek advice from an independent financial advisor.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">11. Acknowledgment</h2>
                <p className="leading-relaxed">
                  By opening an account with Oasis MarketPro, you acknowledge that you have read, 
                  understood, and accepted this Risk Disclosure Statement. You confirm that you 
                  are aware of the risks involved in trading and are willing to accept these risks 
                  in order to trade in financial markets.
                </p>
              </div>

              <div className="bg-[#0f1419] rounded-xl p-6 border border-[#1e2733]">
                <h3 className="text-white font-semibold mb-2">Questions About Risk?</h3>
                <p className="text-sm">
                  If you have any questions about the risks involved in trading, please contact 
                  our support team at <a href="mailto:support@eliteprocapital.com" className="text-[#22c55e] hover:underline">support@eliteprocapital.com</a> 
                  {' '}or consult with an independent financial advisor.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
