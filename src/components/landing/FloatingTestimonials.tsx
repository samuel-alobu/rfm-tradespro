'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { Star } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/utils';

// ============================================
// Testimonial Data with Real Images
// ============================================

interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  title: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Louis van Nuekerk',
    role: 'Professional Trader',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    title: 'Incredible company',
    content: "Incredible company, I've been trading for a while with them, had two quick withdrawals and fee refund in less than 48 hours. I absolutely recommend the firm",
    rating: 5,
  },
  {
    id: 2,
    name: 'Agata Vincent',
    role: 'Trader',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    title: 'Amazing platform',
    content: 'This is an amazing platform which gives you opportunity to achieve their goals and become successful traders with the support of finances.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Jakub Szulc',
    role: 'Trader',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    title: 'Highly recommended',
    content: 'Great company, no issues with payouts, great customer support. Highly recommended for experienced traders.',
    rating: 5,
  },
  {
    id: 4,
    name: 'Dee',
    role: 'Review Expert',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    title: 'Great',
    content: 'Legitimate! Thank you for the opportunity, nothing out there can compare',
    rating: 4,
  },
  {
    id: 5,
    name: 'Adam',
    role: 'User',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    title: 'Excellent platform',
    content: "RFM TradePro has everything you could ask for, I'm super happy it has been recommended to me as my first broker",
    rating: 5,
  },
  {
    id: 6,
    name: 'Pro Kittisak',
    role: 'User',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    title: 'Really good experience',
    content: 'Amazing experience. I have a very nice experience using this platform. Execution speed is one of the best all over the market.',
    rating: 4,
  },
  {
    id: 7,
    name: 'Sarah Mitchell',
    role: 'Day Trader',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    title: 'Best trading platform',
    content: 'The charting tools and real-time data are exceptional. Customer support responds within minutes.',
    rating: 5,
  },
  {
    id: 8,
    name: 'Michael Chen',
    role: 'Crypto Investor',
    image: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
    title: 'Seamless experience',
    content: 'From deposit to withdrawal, everything is smooth and transparent. The cold storage feature gives me peace of mind.',
    rating: 5,
  },
  {
    id: 9,
    name: 'Elena Rodriguez',
    role: 'Portfolio Manager',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    title: 'Professional grade tools',
    content: 'Managing multiple portfolios here has been a breeze. The analytics dashboard is comprehensive and intuitive.',
    rating: 5,
  },
];

// ============================================
// Star Rating Component
// ============================================

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(
          'h-4 w-4',
          i < rating
            ? 'fill-[#00D4FF] text-[#00D4FF]'
            : 'fill-[var(--color-border)] text-[var(--color-border)]'
        )}
      />
    ))}
  </div>
);

// ============================================
// Testimonial Card Component
// ============================================

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  return (
    <div className="p-6 bg-white dark:bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 mb-4">
      {/* Rating */}
      <StarRating rating={testimonial.rating} />
      
      {/* Title */}
      <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mt-3 mb-2">
        &ldquo;{testimonial.title}&rdquo;
      </h4>
      
      {/* Content */}
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">
        {testimonial.content}
      </p>
      
      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border)]">
        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-[var(--color-surface-elevated)]">
          <Image
            src={testimonial.image}
            alt={testimonial.name}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {testimonial.name}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {testimonial.role}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Infinite Scroll Column Component
// ============================================

interface ScrollColumnProps {
  items: Testimonial[];
  direction: 'up' | 'down';
  speed?: number;
}

const ScrollColumn: React.FC<ScrollColumnProps> = ({ 
  items, 
  direction, 
  speed = 25 
}) => {
  const columnRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Create seamless loop by duplicating items
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div
      className="relative h-[700px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        ref={columnRef}
        className="flex flex-col"
        animate={{
          y: direction === 'up' ? ['0%', '-33.33%'] : ['-33.33%', '0%'],
        }}
        transition={{
          y: {
            duration: speed,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'loop',
          },
        }}
        style={{
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {duplicatedItems.map((testimonial, index) => (
          <TestimonialCard
            key={`${testimonial.id}-${index}`}
            testimonial={testimonial}
          />
        ))}
      </motion.div>

      {/* Gradient overlays for smooth fade effect */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0a0e14] via-[#0a0e14]/80 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14]/80 to-transparent pointer-events-none z-10" />
    </div>
  );
};

// ============================================
// Floating Testimonials Component
// ============================================

interface FloatingTestimonialsProps {
  className?: string;
}

export const FloatingTestimonials: React.FC<FloatingTestimonialsProps> = ({
  className,
}) => {
  // Split testimonials into 3 columns
  const column1 = testimonials.filter((_, i) => i % 3 === 0);
  const column2 = testimonials.filter((_, i) => i % 3 === 1);
  const column3 = testimonials.filter((_, i) => i % 3 === 2);

  return (
    <div className={cn('relative', className)}>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Built for today&apos;s
          <br />
          ambitious earners
        </h2>
        <p className="text-lg text-white/60 max-w-2xl mx-auto">
          Thousands of forward-thinking users rely on RFM TradePro everyday to
          turbo-charge their financial operations
        </p>
      </motion.div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <ScrollColumn items={column1} direction="up" speed={30} />
        <ScrollColumn items={column2} direction="down" speed={35} />
        <div className="hidden lg:block">
          <ScrollColumn items={column3} direction="up" speed={28} />
        </div>
      </div>
    </div>
  );
};

export default FloatingTestimonials;
