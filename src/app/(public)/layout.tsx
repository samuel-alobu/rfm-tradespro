import React from 'react';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <div data-layout-segment="header">
        <Header />
      </div>
      <div data-layout-segment="content">{children}</div>
      <div data-layout-segment="footer">
        <Footer />
      </div>
    </div>
  );
}
