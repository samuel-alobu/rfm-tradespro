"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/utils";

// ============================================
// Logo Component - RFM Trades Pro
// A unique logo featuring stylized ascending bars
// forming an abstract growth trajectory with green theme
// ============================================

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  href?: string;
  variant?: "default" | "light";
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = true,
  className,
  href = "/",
  variant = "default",
}) => {
  const sizes = {
    sm: {
      icon: "h-8 w-8",
      text: "text-sm",
    },
    md: {
      icon: "h-10 w-10",
      text: "text-lg",
    },
    lg: {
      icon: "h-12 w-12",
      text: "text-xl",
    },
  };

  const textColor =
    variant === "light" ? "text-white" : "text-[var(--color-text-primary)]";

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
          viewBox="0 0 40 40"
          fill="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background - Rounded square with green gradient */}
          <rect width="40" height="40" rx="8" fill="url(#rfm-bg-gradient)" />

          {/* Trading bars - ascending pattern */}
          <rect
            x="8"
            y="22"
            width="5"
            height="10"
            rx="1.5"
            fill="white"
            opacity="0.6"
          />
          <rect
            x="15"
            y="17"
            width="5"
            height="15"
            rx="1.5"
            fill="white"
            opacity="0.8"
          />
          <rect x="22" y="12" width="5" height="20" rx="1.5" fill="white" />

          {/* Upward arrow - growth indicator */}
          <path
            d="M29 14L33 8L37 14"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M33 8V20"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient
              id="rfm-bg-gradient"
              x1="0"
              y1="0"
              x2="40"
              y2="40"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#22c55e" />
              <stop offset="0.5" stopColor="#16a34a" />
              <stop offset="1" stopColor="#15803d" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight",
            textColor,
            sizes[size].text,
          )}
        >
          RFM Trades Pro
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-lg"
      >
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
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  size = "md",
  className,
}) => {
  const sizes = {
    sm: { container: "h-8 w-8" },
    md: { container: "h-10 w-10" },
    lg: { container: "h-12 w-12" },
    xl: { container: "h-16 w-16" },
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
        viewBox="0 0 40 40"
        fill="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="8" fill="url(#rfm-icon-bg-gradient)" />

        {/* Trading bars */}
        <rect
          x="8"
          y="22"
          width="5"
          height="10"
          rx="1.5"
          fill="white"
          opacity="0.6"
        />
        <rect
          x="15"
          y="17"
          width="5"
          height="15"
          rx="1.5"
          fill="white"
          opacity="0.8"
        />
        <rect x="22" y="12" width="5" height="20" rx="1.5" fill="white" />

        {/* Upward arrow */}
        <path
          d="M29 14L33 8L37 14"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M33 8V20"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient
            id="rfm-icon-bg-gradient"
            x1="0"
            y1="0"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#22c55e" />
            <stop offset="0.5" stopColor="#16a34a" />
            <stop offset="1" stopColor="#15803d" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
