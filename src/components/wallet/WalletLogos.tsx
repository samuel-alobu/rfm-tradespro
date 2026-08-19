'use client';

import React from 'react';

// ============================================
// Wallet Logo Components with Embedded SVGs
// These are inline SVGs - guaranteed to work!
// ============================================

interface LogoProps {
  size?: number;
  className?: string;
}

// MetaMask Fox Logo
export function MetaMaskLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M35.5 3L22.1 13.1L24.5 7.1L35.5 3Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.5 3L17.8 13.2L15.5 7.1L4.5 3Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30.7 27.1L27.1 32.6L34.7 34.7L36.9 27.3L30.7 27.1Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.1 27.3L5.3 34.7L12.9 32.6L9.3 27.1L3.1 27.3Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.5 17.5L10.4 20.7L17.9 21L17.6 12.9L12.5 17.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M27.5 17.5L22.3 12.8L22.1 21L29.6 20.7L27.5 17.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.9 32.6L17.4 30.4L13.5 27.3L12.9 32.6Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22.6 30.4L27.1 32.6L26.5 27.3L22.6 30.4Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M27.1 32.6L22.6 30.4L22.9 33L22.9 34.6L27.1 32.6Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.9 32.6L17.1 34.6L17.1 33L17.4 30.4L12.9 32.6Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.2 25.5L13.4 24.4L16.1 23.2L17.2 25.5Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22.8 25.5L23.9 23.2L26.6 24.4L22.8 25.5Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.9 32.6L13.5 27.1L9.3 27.3L12.9 32.6Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26.5 27.1L27.1 32.6L30.7 27.3L26.5 27.1Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M29.6 20.7L22.1 21L22.8 25.5L23.9 23.2L26.6 24.4L29.6 20.7Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.4 24.4L16.1 23.2L17.2 25.5L17.9 21L10.4 20.7L13.4 24.4Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.4 20.7L13.5 27.3L13.4 24.4L10.4 20.7Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26.6 24.4L26.5 27.3L29.6 20.7L26.6 24.4Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.9 21L17.2 25.5L18.1 30L18.3 23.8L17.9 21Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22.1 21L21.7 23.8L21.9 30L22.8 25.5L22.1 21Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22.8 25.5L21.9 30L22.6 30.4L26.5 27.3L26.6 24.4L22.8 25.5Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.4 24.4L13.5 27.3L17.4 30.4L18.1 30L17.2 25.5L13.4 24.4Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22.9 34.6L22.9 33L22.6 32.7H17.4L17.1 33L17.1 34.6L12.9 32.6L14.4 33.9L17.3 36H22.6L25.5 33.9L27.1 32.6L22.9 34.6Z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22.6 30.4L21.9 30H18.1L17.4 30.4L17.1 33L17.4 32.7H22.6L22.9 33L22.6 30.4Z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M36.1 13.8L37 9.2L35.5 3L22.6 12.7L27.5 17.5L34.5 19.5L36.2 17.5L35.4 16.9L36.6 15.8L35.6 15L36.8 14.1L36.1 13.8Z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 9.2L3.9 13.8L3.2 14.1L4.4 15L3.4 15.8L4.6 16.9L3.8 17.5L5.5 19.5L12.5 17.5L17.4 12.7L4.5 3L3 9.2Z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M34.5 19.5L27.5 17.5L29.6 20.7L26.5 27.3L30.7 27.2H36.9L34.5 19.5Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.5 17.5L5.5 19.5L3.1 27.2H9.3L13.5 27.3L10.4 20.7L12.5 17.5Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22.1 21L22.6 12.7L24.5 7.1H15.5L17.4 12.7L17.9 21L18.1 23.8V30H21.9V23.8L22.1 21Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Trust Wallet Logo
export function TrustWalletLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M20 4C20 4 8 9 8 18C8 27 20 36 20 36C20 36 32 27 32 18C32 9 20 4 20 4Z" fill="#3375BB"/>
      <path d="M20 8C20 8 12 11.5 12 18C12 24.5 20 32 20 32C20 32 28 24.5 28 18C28 11.5 20 8 20 8Z" fill="white"/>
      <path d="M20 12C20 12 15 14.5 15 19C15 23.5 20 28 20 28C20 28 25 23.5 25 19C25 14.5 20 12 20 12Z" fill="#3375BB"/>
    </svg>
  );
}

// Coinbase Wallet Logo
export function CoinbaseLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <circle cx="20" cy="20" r="18" fill="#0052FF"/>
      <rect x="14" y="14" width="12" height="12" rx="2" fill="white"/>
      <rect x="17" y="17" width="6" height="6" rx="1" fill="#0052FF"/>
    </svg>
  );
}

// Phantom Logo
export function PhantomLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="url(#phantom-grad)"/>
      <path d="M29.5 20.5C29.5 25.47 25.47 29.5 20.5 29.5H12.5C11.4 29.5 10.5 28.6 10.5 27.5V20.5C10.5 15.53 14.53 11.5 19.5 11.5C24.47 11.5 28.5 15.53 28.5 20.5H29.5Z" fill="white"/>
      <circle cx="16" cy="20" r="2" fill="#AB9FF2"/>
      <circle cx="23" cy="20" r="2" fill="#AB9FF2"/>
      <defs>
        <linearGradient id="phantom-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#534BB1"/>
          <stop offset="1" stopColor="#551BF9"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// OKX Logo
export function OKXLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="black"/>
      <rect x="10" y="10" width="8" height="8" rx="1" fill="white"/>
      <rect x="22" y="10" width="8" height="8" rx="1" fill="white"/>
      <rect x="10" y="22" width="8" height="8" rx="1" fill="white"/>
      <rect x="22" y="22" width="8" height="8" rx="1" fill="white"/>
      <rect x="16" y="16" width="8" height="8" rx="1" fill="white"/>
    </svg>
  );
}

// Binance Logo
export function BinanceLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="#F3BA2F"/>
      <path d="M20 8L23.5 11.5L17 18L13.5 14.5L20 8Z" fill="white"/>
      <path d="M26.5 14.5L30 18L20 28L10 18L13.5 14.5L20 21L26.5 14.5Z" fill="white"/>
      <path d="M20 32L16.5 28.5L20 25L23.5 28.5L20 32Z" fill="white"/>
      <path d="M9 21L12.5 17.5L9 14L5.5 17.5L9 21Z" fill="white"/>
      <path d="M31 21L34.5 17.5L31 14L27.5 17.5L31 21Z" fill="white"/>
    </svg>
  );
}

// SafePal Logo
export function SafePalLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="#4A21EF"/>
      <path d="M20 6L32 12V20C32 26.6 27 32.2 20 34C13 32.2 8 26.6 8 20V12L20 6Z" fill="white"/>
      <path d="M20 10L28 14V20C28 24.8 24.4 28.8 20 30C15.6 28.8 12 24.8 12 20V14L20 10Z" fill="#4A21EF"/>
      <path d="M18 19L16 21L19 24L25 18L23 16L19 20L18 19Z" fill="white"/>
    </svg>
  );
}

// Exodus Logo
export function ExodusLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="url(#exodus-grad)"/>
      <path d="M8 14H24L22 20L24 26H8L12 20L8 14Z" fill="white"/>
      <path d="M26 14H32V26H26L28 20L26 14Z" fill="white"/>
      <defs>
        <linearGradient id="exodus-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6"/>
          <stop offset="0.5" stopColor="#3B82F6"/>
          <stop offset="1" stopColor="#0EA5E9"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// Ledger Logo
export function LedgerLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="black"/>
      <path d="M8 8H16V10H10V24H8V8Z" fill="white"/>
      <path d="M8 26H10V32H24V34H8V26Z" fill="white"/>
      <path d="M26 26H32V34H26V32H30V28H26V26Z" fill="white"/>
      <path d="M18 8H32V16H30V10H18V8Z" fill="white"/>
      <rect x="18" y="18" width="8" height="8" fill="white"/>
    </svg>
  );
}

// Trezor Logo
export function TrezorLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="black"/>
      <path d="M20 6C14 6 10 10 10 15V18H12V15C12 11 15 8 20 8C25 8 28 11 28 15V18H30V15C30 10 26 6 20 6Z" fill="white"/>
      <rect x="10" y="18" width="20" height="16" rx="2" fill="white"/>
      <circle cx="20" cy="26" r="3" fill="black"/>
      <path d="M20 26V30" stroke="black" strokeWidth="2"/>
    </svg>
  );
}

// Rainbow Logo
export function RainbowLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#001E59"/>
      <path d="M8 28C8 17 16 10 26 10" stroke="#FF4000" strokeWidth="4" strokeLinecap="round"/>
      <path d="M8 28C8 20 14 14 22 14" stroke="#FFD700" strokeWidth="4" strokeLinecap="round"/>
      <path d="M8 28C8 23 12 18 18 18" stroke="#00E676" strokeWidth="4" strokeLinecap="round"/>
      <path d="M8 28C8 26 10 22 14 22" stroke="#00B0FF" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="10" cy="28" r="4" fill="#7B61FF"/>
    </svg>
  );
}

// Argent Logo
export function ArgentLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#FF875B"/>
      <path d="M20 8L10 32H16L18 27H22L24 32H30L20 8ZM19 23L20 16L21 23H19Z" fill="white"/>
    </svg>
  );
}

// Zerion Logo
export function ZerionLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#2962EF"/>
      <path d="M10 14H24L10 26H30V22H16L30 10H10V14Z" fill="white"/>
    </svg>
  );
}

// imToken Logo
export function ImTokenLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#11C4D1"/>
      <circle cx="20" cy="20" r="12" stroke="white" strokeWidth="3"/>
      <circle cx="20" cy="20" r="6" fill="white"/>
    </svg>
  );
}

// Crypto.com Logo
export function CryptoComLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="#002D74"/>
      <path d="M20 8L8 20L20 32L32 20L20 8Z" fill="white"/>
      <path d="M20 12L12 20L20 28L28 20L20 12Z" fill="#002D74"/>
      <path d="M20 16L16 20L20 24L24 20L20 16Z" fill="white"/>
    </svg>
  );
}

// Atomic Wallet Logo
export function AtomicLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#1D1E22"/>
      <circle cx="20" cy="20" r="4" fill="#37D7E3"/>
      <ellipse cx="20" cy="20" rx="14" ry="6" stroke="#37D7E3" strokeWidth="2" transform="rotate(-30 20 20)"/>
      <ellipse cx="20" cy="20" rx="14" ry="6" stroke="#37D7E3" strokeWidth="2" transform="rotate(30 20 20)"/>
      <ellipse cx="20" cy="20" rx="14" ry="6" stroke="#37D7E3" strokeWidth="2" transform="rotate(90 20 20)"/>
    </svg>
  );
}

// Solflare Logo
export function SolflareLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="url(#solflare-grad)"/>
      <circle cx="20" cy="20" r="8" fill="white"/>
      <path d="M20 8L22 16L30 14L24 20L30 26L22 24L20 32L18 24L10 26L16 20L10 14L18 16L20 8Z" fill="url(#solflare-grad2)"/>
      <defs>
        <linearGradient id="solflare-grad" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#FFC919"/>
          <stop offset="1" stopColor="#FC7E33"/>
        </linearGradient>
        <linearGradient id="solflare-grad2" x1="10" y1="8" x2="30" y2="32">
          <stop stopColor="#FFC919"/>
          <stop offset="1" stopColor="#FC7E33"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// Keplr Logo
export function KeplrLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="url(#keplr-grad)"/>
      <path d="M12 10V30L20 24V16L12 10Z" fill="white"/>
      <path d="M20 16V24L28 30V10L20 16Z" fill="white" fillOpacity="0.6"/>
      <defs>
        <linearGradient id="keplr-grad" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#314FE2"/>
          <stop offset="1" stopColor="#A726C7"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// Rabby Logo
export function RabbyLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="url(#rabby-grad)"/>
      <ellipse cx="20" cy="22" rx="12" ry="10" fill="white"/>
      <circle cx="15" cy="20" r="3" fill="#8697FF"/>
      <circle cx="25" cy="20" r="3" fill="#8697FF"/>
      <ellipse cx="20" cy="12" rx="8" ry="5" fill="white"/>
      <defs>
        <linearGradient id="rabby-grad" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#8697FF"/>
          <stop offset="1" stopColor="#6B7AED"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// Bybit Logo
export function BybitLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="#F7A600"/>
      <path d="M10 12H18V16H14V24H18V28H10V12Z" fill="black"/>
      <path d="M22 12H30V16H26V18H30V22H26V24H30V28H22V12Z" fill="black"/>
    </svg>
  );
}

// Gate.io Logo
export function GateLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="#2354E6"/>
      <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="3"/>
      <path d="M20 14V20H26" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// KuCoin Logo
export function KuCoinLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="#23AF91"/>
      <path d="M20 10L10 20L20 30L30 20L20 10Z" fill="white"/>
      <circle cx="20" cy="20" r="4" fill="#23AF91"/>
    </svg>
  );
}

// Backpack Logo
export function BackpackLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#E33E3F"/>
      <rect x="12" y="14" width="16" height="18" rx="3" fill="white"/>
      <rect x="16" y="8" width="8" height="8" rx="2" fill="white"/>
      <rect x="15" y="18" width="10" height="4" rx="1" fill="#E33E3F"/>
    </svg>
  );
}

// Electrum Logo
export function ElectrumLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="#1E3A5F"/>
      <circle cx="20" cy="20" r="12" stroke="#3B82F6" strokeWidth="2"/>
      <path d="M20 10L22 18H30L24 23L26 31L20 26L14 31L16 23L10 18H18L20 10Z" fill="#3B82F6"/>
    </svg>
  );
}

// BlueWallet Logo
export function BlueWalletLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#1D6AE5"/>
      <rect x="10" y="14" width="20" height="14" rx="3" fill="white"/>
      <rect x="14" y="18" width="12" height="2" fill="#1D6AE5"/>
      <rect x="14" y="22" width="8" height="2" fill="#1D6AE5"/>
    </svg>
  );
}

// ZenGo Logo
export function ZenGoLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#037DD6"/>
      <path d="M10 14H26L10 26H30V22H14L30 10H10V14Z" fill="white"/>
    </svg>
  );
}

// 1inch Logo
export function OneInchLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#1B314F"/>
      <circle cx="20" cy="18" r="8" fill="#ED5252"/>
      <path d="M16 22C16 22 18 28 20 32C22 28 24 22 24 22" stroke="#ED5252" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// Guarda Logo  
export function GuardaLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#14D395"/>
      <path d="M20 8L30 14V22C30 28 26 32 20 34C14 32 10 28 10 22V14L20 8Z" fill="white"/>
      <path d="M20 12L26 16V22C26 26 23 28 20 30C17 28 14 26 14 22V16L20 12Z" fill="#14D395"/>
    </svg>
  );
}

// Frontier Logo
export function FrontierLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#CC703C"/>
      <rect x="10" y="10" width="8" height="20" rx="2" fill="white"/>
      <rect x="22" y="10" width="8" height="12" rx="2" fill="white"/>
      <rect x="22" y="26" width="8" height="4" rx="1" fill="white"/>
    </svg>
  );
}

// TokenPocket Logo
export function TokenPocketLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#2980FE"/>
      <rect x="12" y="10" width="16" height="20" rx="4" fill="white"/>
      <rect x="16" y="14" width="8" height="12" rx="2" fill="#2980FE"/>
    </svg>
  );
}

// Coin98 Logo
export function Coin98Logo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#D9B432"/>
      <circle cx="16" cy="16" r="6" stroke="black" strokeWidth="3"/>
      <circle cx="24" cy="24" r="6" stroke="black" strokeWidth="3"/>
    </svg>
  );
}

// Math Wallet Logo
export function MathWalletLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="black"/>
      <rect x="10" y="18" width="20" height="4" fill="#00D395"/>
      <rect x="18" y="10" width="4" height="20" fill="#00D395"/>
    </svg>
  );
}

// UniSat Logo
export function UniSatLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#000"/>
      <circle cx="20" cy="20" r="10" fill="#F7931A"/>
      <path d="M20 12V28M14 16L26 24M26 16L14 24" stroke="white" strokeWidth="2"/>
    </svg>
  );
}

// Blockchain.com Logo
export function BlockchainComLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="#121D33"/>
      <rect x="10" y="10" width="8" height="8" fill="#3C6DF0" transform="rotate(45 14 14)"/>
      <rect x="22" y="10" width="8" height="8" fill="#85E5C9" transform="rotate(45 26 14)"/>
      <rect x="10" y="22" width="8" height="8" fill="#85E5C9" transform="rotate(45 14 26)"/>
      <rect x="22" y="22" width="8" height="8" fill="#3C6DF0" transform="rotate(45 26 26)"/>
    </svg>
  );
}

// XDEFI Logo
export function XDEFILogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#335DD2"/>
      <path d="M10 10L20 20L10 30" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 10L30 20L20 30" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// BitKeep (Bitget) Logo
export function BitKeepLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="url(#bitkeep-grad)"/>
      <path d="M12 14L20 10L28 14V20L20 30L12 20V14Z" fill="white"/>
      <path d="M20 14L24 16V20L20 26L16 20V16L20 14Z" fill="url(#bitkeep-grad2)"/>
      <defs>
        <linearGradient id="bitkeep-grad" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#54FFF5"/>
          <stop offset="1" stopColor="#00D4FF"/>
        </linearGradient>
        <linearGradient id="bitkeep-grad2" x1="16" y1="14" x2="24" y2="26">
          <stop stopColor="#54FFF5"/>
          <stop offset="1" stopColor="#00D4FF"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ONTO Logo
export function ONTOLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#32A4BE"/>
      <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="3"/>
      <circle cx="20" cy="20" r="4" fill="white"/>
    </svg>
  );
}

// Unstoppable Logo
export function UnstoppableLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#F5A623"/>
      <rect x="12" y="14" width="16" height="4" fill="white"/>
      <rect x="12" y="22" width="12" height="4" fill="white"/>
    </svg>
  );
}

// Frame Logo
export function FrameLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#1A1A2E"/>
      <rect x="10" y="10" width="20" height="20" rx="2" stroke="#00D395" strokeWidth="3"/>
      <circle cx="20" cy="20" r="4" fill="#00D395"/>
    </svg>
  );
}

// KeepKey Logo
export function KeepKeyLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="#000"/>
      <rect x="14" y="8" width="12" height="24" rx="2" fill="white"/>
      <rect x="16" y="12" width="8" height="6" fill="black"/>
      <rect x="16" y="22" width="8" height="2" fill="black"/>
      <rect x="16" y="26" width="8" height="2" fill="black"/>
    </svg>
  );
}

// Keystone Logo
export function KeystoneLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="#1A73E8"/>
      <path d="M20 8L30 14V26L20 32L10 26V14L20 8Z" fill="white"/>
      <path d="M20 14L25 17V23L20 26L15 23V17L20 14Z" fill="#1A73E8"/>
    </svg>
  );
}

// Sparrow Logo
export function SparrowLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="#D97706"/>
      <ellipse cx="20" cy="20" rx="10" ry="8" fill="white"/>
      <ellipse cx="14" cy="18" rx="2" ry="3" fill="#D97706"/>
      <path d="M24 16L30 12L28 18L24 16Z" fill="white"/>
    </svg>
  );
}

// Wasabi Logo
export function WasabiLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="8" fill="#77B41E"/>
      <circle cx="20" cy="20" r="12" fill="white"/>
      <path d="M14 20C14 16 17 14 20 14C23 14 26 16 26 20" stroke="#77B41E" strokeWidth="3" strokeLinecap="round"/>
      <path d="M14 20C14 24 17 26 20 26C23 26 26 24 26 20" stroke="#77B41E" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 3"/>
    </svg>
  );
}

// Terra Station Logo
export function TerraStationLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" rx="10" fill="#0E3CA5"/>
      <circle cx="20" cy="20" r="10" fill="white"/>
      <circle cx="20" cy="20" r="6" fill="#0E3CA5"/>
      <circle cx="20" cy="20" r="2" fill="#FFD83D"/>
    </svg>
  );
}

// Wallet Logo Map
export const walletLogoComponents: Record<string, React.FC<LogoProps>> = {
  metamask: MetaMaskLogo,
  trustwallet: TrustWalletLogo,
  coinbase: CoinbaseLogo,
  phantom: PhantomLogo,
  okx: OKXLogo,
  binance: BinanceLogo,
  safepal: SafePalLogo,
  exodus: ExodusLogo,
  ledger: LedgerLogo,
  trezor: TrezorLogo,
  rainbow: RainbowLogo,
  argent: ArgentLogo,
  zerion: ZerionLogo,
  imtoken: ImTokenLogo,
  'crypto.com': CryptoComLogo,
  atomic: AtomicLogo,
  solflare: SolflareLogo,
  keplr: KeplrLogo,
  rabby: RabbyLogo,
  bybit: BybitLogo,
  gate: GateLogo,
  kucoin: KuCoinLogo,
  backpack: BackpackLogo,
  electrum: ElectrumLogo,
  bluewallet: BlueWalletLogo,
  zengo: ZenGoLogo,
  '1inch': OneInchLogo,
  guarda: GuardaLogo,
  frontier: FrontierLogo,
  tokenpocket: TokenPocketLogo,
  coin98: Coin98Logo,
  mathwallet: MathWalletLogo,
  unisat: UniSatLogo,
  'blockchain.com': BlockchainComLogo,
  xdefi: XDEFILogo,
  bitkeep: BitKeepLogo,
  onto: ONTOLogo,
  unstoppable: UnstoppableLogo,
  frame: FrameLogo,
  keepkey: KeepKeyLogo,
  keystone: KeystoneLogo,
  sparrow: SparrowLogo,
  wasabi: WasabiLogo,
  terrastation: TerraStationLogo,
};

// Universal Wallet Logo Component
export function WalletLogo({ 
  walletId, 
  name, 
  size = 40, 
  className 
}: { 
  walletId: string; 
  name: string; 
  size?: number; 
  className?: string;
}) {
  const LogoComponent = walletLogoComponents[walletId];
  
  if (LogoComponent) {
    return <LogoComponent size={size} className={className} />;
  }
  
  // Fallback to colored initials
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  
  return (
    <div 
      className="rounded-xl flex items-center justify-center text-white font-bold"
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: colors[colorIndex],
        fontSize: size * 0.35
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
