import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/Providers';
import '@/styles/globals.css';
import Script from 'next/script';

// ============================================
// Metadata Configuration
// ============================================

export const metadata: Metadata = {
  title: {
    default: "Oasis MarketPro | Trading & Investment Platform",
    template: "%s | Oasis MarketPro",
  },
  description:
    "Revolutionizing your digital trading experience. Seamlessly manage your portfolio with top-notch security, 24/7 support, and an intuitive platform.",
  keywords: [
    "trading",
    "investment",
    "cryptocurrency",
    "stocks",
    "forex",
    "portfolio management",
    "copy trading",
    "real estate investment",
  ],
  authors: [{ name: "Oasis MarketPro" }],
  creator: "Oasis MarketPro",
  publisher: "Oasis MarketPro",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://oasismarketpro.com",
    siteName: "Oasis MarketPro",
    title: "Oasis MarketPro | Trading & Investment Platform",
    description:
      "Revolutionizing your digital trading experience with top-notch security and 24/7 support.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Oasis MarketPro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oasis MarketPro | Trading & Investment Platform",
    description:
      "Revolutionizing your digital trading experience with top-notch security and 24/7 support.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0e14',
  colorScheme: 'dark',
};

// ============================================
// Root Layout
// ============================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Oasis MarketPro" />
        <meta name="apple-mobile-web-app-title" content="Oasis MarketPro" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://api.coingecko.com" />
      </head>
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] antialiased">
        <Providers>{children}</Providers>

        <Script id="smartsupp-chat" strategy="afterInteractive">
          {`
      var _smartsupp = _smartsupp || {};
      _smartsupp.key = '${process.env.NEXT_PUBLIC_SMARTSUPP_KEY}';

      window.smartsupp || (function(d) {
        var s, c, o = smartsupp = function() {
          o._.push(arguments)
        };
        o._ = [];
        s = d.getElementsByTagName('script')[0];
        c = d.createElement('script');
        c.type = 'text/javascript';
        c.charset = 'utf-8';
        c.async = true;
        c.src = 'https://www.smartsuppchat.com/loader.js?';
        s.parentNode.insertBefore(c, s);
      })(document);
    `}
        </Script>
      </body>
    </html>
  );
}
