'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/utils';

// ============================================
// Logo Component - Oasis MarketPro
// A unique logo featuring stylized ascending bars
// forming an abstract growth trajectory with green theme
// ============================================

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  href?: string;
  variant?: 'default' | 'light';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className,
  href = '/',
  variant = 'default',
}) => {
  const sizes = {
    sm: {
      icon: 'h-8 w-8',
      text: 'text-sm',
    },
    md: {
      icon: 'h-10 w-10',
      text: 'text-lg',
    },
    lg: {
      icon: 'h-12 w-12',
      text: 'text-xl',
    },
  };

  const textColor = variant === 'light' ? 'text-white' : 'text-[var(--color-text-primary)]';

  const LogoContent = () => (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Icon - Abstract ascending chart bars with arrow - Green theme */}
      <div
        className={cn(
          "relative flex items-center justify-center",
          "transition-transform duration-200 hover:scale-105",
          sizes[size].icon,
        )}
      >
        <svg
          viewBox="0 0 612 612"
          fill="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="oasisBarGradient"
              x1="306"
              y1="128"
              x2="306"
              y2="466"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#0EA5E9" />
              <stop offset="0.45" stopColor="#0877B8" />
              <stop offset="1" stopColor="#034B73" />
            </linearGradient>
          </defs>

          {/* Bottom swoosh */}
          <path
            d="M86 481C187 452 337 438 505 479C383 459 226 458 86 481Z"
            fill="#086497"
          />
          <path
            d="M86 481C214 459 386 458 505 479"
            stroke="#0EA5E9"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Growth bars */}
          <path
            d="M124 388L162 353V462H124V388Z"
            fill="url(#oasisBarGradient)"
          />
          <path
            d="M175 342L214 306V457H175V342Z"
            fill="url(#oasisBarGradient)"
          />
          <path
            d="M227 359L266 322V454H227V359Z"
            fill="url(#oasisBarGradient)"
          />
          <path
            d="M278 310L318 256V452H278V310Z"
            fill="url(#oasisBarGradient)"
          />
          <path
            d="M330 251L370 283V454H330V251Z"
            fill="url(#oasisBarGradient)"
          />
          <path
            d="M382 284L421 246V462H382V284Z"
            fill="url(#oasisBarGradient)"
          />
          <path
            d="M435 231L474 193V470H435V231Z"
            fill="url(#oasisBarGradient)"
          />

          {/* Trend line */}
          <path
            d="M104 408L213 318L249 348L334 226L379 261L483 158"
            stroke="#0B6FA9"
            strokeWidth="24"
            strokeLinejoin="miter"
            strokeLinecap="square"
          />
          <path
            d="M104 408L213 318L249 348L334 226L379 261L483 158"
            stroke="#0EA5E9"
            strokeWidth="12"
            strokeLinejoin="miter"
            strokeLinecap="square"
          />

          {/* Arrow head */}
          <path d="M449 140L509 130L495 190L483 158L449 140Z" fill="#0EA5E9" />
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <span
          className={cn(
            "font-extrabold tracking-tight",
            textColor,
            sizes[size].text,
          )}
        >
          Oasis <span className="text-sky-500">MarketPro</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-lg">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
};

// ============================================
// Logo Icon Only
// ============================================

export interface LogoIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: { container: 'h-8 w-8' },
    md: { container: 'h-10 w-10' },
    lg: { container: 'h-12 w-12' },
    xl: { container: 'h-16 w-16' },
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        sizes[size].container,
        className,
      )}
    >
      <svg
        viewBox="0 0 612 612"
        fill="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="oasisBarGradient"
            x1="306"
            y1="128"
            x2="306"
            y2="466"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#0EA5E9" />
            <stop offset="0.45" stopColor="#0877B8" />
            <stop offset="1" stopColor="#034B73" />
          </linearGradient>
        </defs>

        {/* Bottom swoosh */}
        <path
          d="M86 481C187 452 337 438 505 479C383 459 226 458 86 481Z"
          fill="#086497"
        />
        <path
          d="M86 481C214 459 386 458 505 479"
          stroke="#0EA5E9"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Growth bars */}
        <path d="M124 388L162 353V462H124V388Z" fill="url(#oasisBarGradient)" />
        <path d="M175 342L214 306V457H175V342Z" fill="url(#oasisBarGradient)" />
        <path d="M227 359L266 322V454H227V359Z" fill="url(#oasisBarGradient)" />
        <path d="M278 310L318 256V452H278V310Z" fill="url(#oasisBarGradient)" />
        <path d="M330 251L370 283V454H330V251Z" fill="url(#oasisBarGradient)" />
        <path d="M382 284L421 246V462H382V284Z" fill="url(#oasisBarGradient)" />
        <path d="M435 231L474 193V470H435V231Z" fill="url(#oasisBarGradient)" />

        {/* Trend line */}
        <path
          d="M104 408L213 318L249 348L334 226L379 261L483 158"
          stroke="#0B6FA9"
          strokeWidth="24"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />
        <path
          d="M104 408L213 318L249 348L334 226L379 261L483 158"
          stroke="#0EA5E9"
          strokeWidth="12"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />

        {/* Arrow head */}
        <path d="M449 140L509 130L495 190L483 158L449 140Z" fill="#0EA5E9" />
      </svg>
    </div>
  );
};
