'use client';

import React from 'react';
import Image from 'next/image';
import { cn, formatCurrency, formatPercentage } from '@/utils';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Property Interface - Supports multiple images
// ============================================

export interface PropertyDocument {
  title?: string;
  name?: string;
  slug?: string;
  url: string;
  publicId?: string;
  order?: number;
}

export interface Property {
  id: string;
  _id?: string;
  name: string;
  slug?: string;
  location?: string;
  description: string;
  image?: string; // Primary/featured image (legacy)
  images?: string[]; // Multiple images (new format)
  minInvestment?: number; // Legacy field
  minimum?: number; // New field from DB
  roi: number;
  strategy: string;
  status?: 'open' | 'closed' | 'coming_soon';
  type?: string;
  totalRaised?: number;
  targetAmount?: number;
  raisedAmount?: number;
  percentFunded?: number;
  investors?: number;
  documents?: PropertyDocument[];
  projectOverview?: string;
  breakdown?: {
    text?: string;
    type?: string;
    location?: string;
    strategy?: string;
    status?: 'funding' | 'in_progress' | 'completed';
  };
  // Optional "Why" sections (bullet points)
  whyThisProject?: string[];
  whyThisSponsor?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  // Admin fields
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: string;
}

// ============================================
// Property Card Component - Clean Design
// ============================================

interface PropertyCardProps {
  property: Property;
  onViewProject?: (property: Property) => void;
  onInvest?: (property: Property) => void;
  className?: string;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onViewProject,
  onInvest,
  className,
}) => {
  const { t } = useLanguage();
  const isClosed = property.status === 'closed' || property.breakdown?.status === 'completed';
  
  // Handle both old and new field formats
  const minInvestment = property.minInvestment || property.minimum || 0;
  const raisedPercent = property.raisedAmount && property.targetAmount 
    ? Math.round((property.raisedAmount / property.targetAmount) * 100)
    : property.percentFunded || (property.totalRaised && property.targetAmount 
      ? Math.round((property.totalRaised / property.targetAmount) * 100)
      : null);
  
  // Get the first image from images array or fall back to image field
  const displayImage = property.images && property.images.length > 0 
    ? property.images[0] 
    : property.image || '/images/placeholder-property.jpg';
  
  return (
    <div
      className={cn(
        'group bg-[#0f1419] rounded-2xl overflow-hidden transition-all duration-300 ease-out',
        'hover:shadow-xl hover:shadow-black/30',
        className
      )}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={displayImage}
          alt={property.name}
          fill
          className={cn(
            'object-cover transition-transform duration-500 ease-out',
            isClosed ? 'grayscale' : 'group-hover:scale-110'
          )}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-heading font-semibold text-lg text-white mb-2 line-clamp-1">
          {property.name}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-[#8b9ab4] leading-relaxed mb-5 line-clamp-2 min-h-[40px]">
          {property.description}
        </p>

        {/* Stats Row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.minimum}</p>
            <p className="font-semibold text-white text-sm">
              {formatCurrency(minInvestment)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.roi}</p>
            <p className="font-semibold text-[#22c55e] text-sm">
              {formatPercentage(property.roi)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.strategy}</p>
            <p className="font-semibold text-[#22c55e] text-sm capitalize">
              {(property.strategy || '').replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {/* Progress Bar (if funding data exists) */}
        {raisedPercent !== null && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6b7a90]">
                {formatCurrency(property.raisedAmount || property.totalRaised || 0)} {t.realEstateSection.raised}
              </span>
              <span className="text-xs text-[#6b7a90]">
                {raisedPercent}%
              </span>
            </div>
            <div className="h-1.5 bg-[#1e2733] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#22c55e] rounded-full transition-all duration-500"
                style={{ width: `${raisedPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isClosed ? (
          <button
            disabled
            className="w-full py-3 px-4 rounded-lg bg-[#1a2332] text-[#6b7a90] text-sm font-medium cursor-not-allowed"
          >
            {t.realEstateSection.projectClosed}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => onViewProject?.(property)}
              className="flex-1 py-3 px-4 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm font-medium hover:bg-[#232d3b] transition-colors"
            >
              {t.realEstateSection.viewProject}
            </button>
            <button
              onClick={() => onInvest?.(property)}
              className="flex-1 py-3 px-4 rounded-lg bg-[#22c55e] text-white text-sm font-medium hover:bg-[#1ea550] transition-colors"
            >
              {t.realEstateSection.investNow}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
