'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  LayoutGrid,
  Headphones,
} from 'lucide-react';
import { cn } from '@/utils';

// ============================================
// Feature Data - Matching Reference Design
// ============================================

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const primaryFeatures: Feature[] = [
  {
    icon: <TrendingUp className="h-7 w-7" />,
    title: 'Analytics',
    description:
      'Our platform delivers insightful analytics and strategic guidance, enabling you to optimize your financial decisions and achieve your financial objectives',
  },
  {
    icon: <LayoutGrid className="h-7 w-7" />,
    title: 'Diverse portfolio',
    description:
      'Utilize our platform to safeguard a substantial portfolio of assets, ensuring secure management and protection tailored to your individual needs.',
  },
  {
    icon: <Headphones className="h-7 w-7" />,
    title: 'Live support',
    description:
      'Our dedicated team of knowledgeable representatives is always ready to assist you with any concerns, or support you may need at any time of day.',
  },
];

// ============================================
// Feature Card Component
// ============================================

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="text-center px-6 py-8"
    >
      {/* Icon */}
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-[#3B82F6] text-white mb-6 shadow-lg shadow-[#3B82F6]/25">
        {feature.icon}
      </div>
      
      {/* Title */}
      <h3 className="text-xl font-semibold text-[#3B82F6] mb-4">
        {feature.title}
      </h3>
      
      {/* Description */}
      <p className="text-[var(--color-text-muted)] leading-relaxed max-w-sm mx-auto">
        {feature.description}
      </p>
    </motion.div>
  );
};

// ============================================
// Features Section Component
// ============================================

interface FeaturesSectionProps {
  className?: string;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ className }) => {
  return (
    <section className={cn('py-24 px-6 bg-white dark:bg-[var(--color-background)]', className)}>
      <div className="max-w-6xl mx-auto">
        {/* Features Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {primaryFeatures.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
