'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/utils';

// ============================================
// Animated Counter Component
// ============================================

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  duration = 2500,
  prefix = '',
  suffix = '',
  decimals = 0,
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    let startTime: number | null = null;
    let animationFrame: number;

    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      
      const currentValue = easedProgress * end;
      setCount(decimals > 0 ? parseFloat(currentValue.toFixed(decimals)) : Math.floor(currentValue));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    // Small delay before starting animation
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isInView, end, duration, decimals]);

  const formatNumber = (num: number): string => {
    if (decimals > 0) return num.toFixed(decimals);
    return num.toLocaleString();
  };

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
};

// ============================================
// Stats Section Component
// ============================================

interface StatsSectionProps {
  className?: string;
}

const stats = [
  { 
    value: 100, 
    prefix: '$', 
    suffix: 'M+', 
    label: 'Paid out to traders',
    description: 'Total payouts processed'
  },
  { 
    value: 180, 
    suffix: '+', 
    label: 'Countries registered with us',
    description: 'Global coverage'
  },
  { 
    value: 13, 
    suffix: 'M+', 
    label: 'Volume of trades monthly',
    description: 'Monthly trading volume'
  },
  { 
    value: 3, 
    suffix: 'h', 
    label: 'Avg. payout processing time',
    description: 'Fast withdrawals'
  },
];

export const StatsSection: React.FC<StatsSectionProps> = ({ className }) => {
  return (
    <section className={cn('py-20 px-6', className)}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Trusted by thousands of
            <br />
            users worldwide
          </h2>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Accent Line */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--color-primary)] to-transparent rounded-full" />
              
              <div className="pl-6">
                <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
                  <AnimatedCounter
                    end={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    duration={2000 + index * 200}
                  />
                </p>
                <p className="text-sm md:text-base text-white/60 leading-relaxed">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
