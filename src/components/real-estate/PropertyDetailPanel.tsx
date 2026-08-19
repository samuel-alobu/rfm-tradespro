'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { cn, formatCurrency, formatPercentage } from '@/utils';
import { useLanguage } from '@/lib/i18n';
import { Property } from './PropertyCard';

// ============================================
// Image Carousel Component
// ============================================

interface ImageCarouselProps {
  images: string[];
  alt: string;
  badge?: string;
  isClosed?: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, alt, badge, isClosed }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Ensure we have at least one image
  const imageList = images && images.length > 0 ? images : ['/images/placeholder-property.jpg'];
  const totalImages = imageList.length;
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };
  
  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative h-56 bg-[#0c1320] overflow-hidden group">
      {/* Current Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <Image
            src={imageList[currentIndex]}
            alt={`${alt} - Image ${currentIndex + 1}`}
            fill
            className={cn('object-cover', isClosed && 'grayscale')}
            sizes="512px"
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Badge */}
      {badge && (
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2 py-1 bg-black/70 text-white text-xs rounded">
            {badge}
          </span>
        </div>
      )}
      
      {/* Navigation Arrows - Only show if multiple images */}
      {totalImages > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
      
      {/* Image Counter */}
      {totalImages > 1 && (
        <div className="absolute bottom-3 right-3 z-10 px-2 py-1 bg-black/70 rounded text-white text-xs font-medium">
          {currentIndex + 1} / {totalImages}
        </div>
      )}
      
      {/* Dot Indicators */}
      {totalImages > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {imageList.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex 
                  ? 'bg-[#22c55e] w-4' 
                  : 'bg-white/50 hover:bg-white/80'
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Property Detail Panel Component
// ============================================

interface PropertyDetailPanelProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onInvest?: (property: Property) => void;
}

export const PropertyDetailPanel: React.FC<PropertyDetailPanelProps> = ({
  property,
  isOpen,
  onClose,
  onInvest,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'project' | 'documents'>('project');

  if (!property) return null;

  // Handle both old format (single image) and new format (images array)
  const images = property.images && property.images.length > 0 
    ? property.images 
    : property.image 
      ? [property.image] 
      : [];

  const documents = property.documents || [
    { name: 'Site plans', title: 'Site plans', url: '#' },
    { name: 'Organizational chart', title: 'Organizational chart', url: '#' },
    { name: 'Sponsor track record', title: 'Sponsor track record', url: '#' },
  ];

  const isClosed = property.status === 'closed';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0a0e14] border-l border-[#1e2733] z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0a0e14] border-b border-[#1e2733] p-4 z-10 flex items-center justify-between">
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-sm text-[#6b7a90] hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.realEstateSection.backToProjects}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-[#6b7a90] hover:text-white hover:bg-[#1e2733] rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Image Carousel */}
            <ImageCarousel 
              images={images} 
              alt={property.name}
              badge={property.type}
              isClosed={isClosed}
            />

            {/* Content */}
            <div className="p-5 space-y-6">
              {/* Title & Description */}
              <div>
                <h2 className="font-heading text-xl font-bold text-white mb-2">
                  {property.name}
                </h2>
                <p className="text-sm text-[#8b9ab4] leading-relaxed">
                  {property.description}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.minimum}</p>
                  <p className="text-lg font-bold text-white">
                    {formatCurrency(property.minInvestment || property.minimum || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.roi}</p>
                  <p className="text-lg font-bold text-white">
                    {formatPercentage(property.roi || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.strategy}</p>
                  <p className="text-lg font-bold text-white capitalize">
                    {(property.strategy || '').replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-6 border-b border-[#1e2733]">
                <button
                  onClick={() => setActiveTab('project')}
                  className={cn(
                    'pb-3 text-sm font-medium transition-colors relative',
                    activeTab === 'project' ? 'text-white' : 'text-[#6b7a90] hover:text-white'
                  )}
                >
                  {t.realEstateSection.thisProject}
                  {activeTab === 'project' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={cn(
                    'pb-3 text-sm font-medium transition-colors relative',
                    activeTab === 'documents' ? 'text-white' : 'text-[#6b7a90] hover:text-white'
                  )}
                >
                  {t.realEstateSection.documents}
                  {activeTab === 'documents' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
                  )}
                </button>
              </div>

              {/* Project Tab Content */}
              {activeTab === 'project' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading font-semibold text-white mb-3">
                      {t.realEstateSection.projectOverview}
                    </h3>
                    <p className="text-sm text-[#8b9ab4] leading-relaxed">
                      {property.projectOverview || `${property.name} is a premier ${property.type?.toLowerCase() || 'real estate'} asset strategically positioned in ${property.location || property.breakdown?.location || 'a prime location'}. This offering presents an exceptional opportunity for investors seeking ${(property.strategy || '').replace(/_/g, ' ').toLowerCase()} returns through a professionally managed real estate investment.`}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-heading font-semibold text-white mb-3">
                      {t.realEstateSection.projectBreakdown}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#0c1320] rounded-lg">
                        <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.type}</p>
                        <p className="font-medium text-white text-sm">{property.type || property.breakdown?.type || 'Real Estate'}</p>
                      </div>
                      <div className="p-3 bg-[#0c1320] rounded-lg">
                        <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.location}</p>
                        <p className="font-medium text-white text-sm">{property.location || property.breakdown?.location || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-[#0c1320] rounded-lg">
                        <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.strategy}</p>
                        <p className="font-medium text-white text-sm capitalize">{(property.strategy || property.breakdown?.strategy || '').replace(/_/g, ' ')}</p>
                      </div>
                      <div className="p-3 bg-[#0c1320] rounded-lg">
                        <p className="text-xs text-[#6b7a90] mb-1">{t.realEstateSection.status}</p>
                        <p className={cn(
                          'font-medium text-sm',
                          property.status === 'open' || property.breakdown?.status === 'funding' ? 'text-[#22c55e]' : 'text-[#6b7a90]'
                        )}>
                          {property.status === 'open' || property.breakdown?.status === 'funding' 
                            ? t.realEstateSection.openForInvestment 
                            : property.breakdown?.status === 'in_progress'
                              ? t.realEstateSection.inProgress
                              : t.realEstateSection.closed}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Why This Project - Only show if has content */}
                  {property.whyThisProject && property.whyThisProject.length > 0 && (
                    <div>
                      <h3 className="font-heading font-semibold text-white mb-3">
                        {t.realEstateSection.whyThisProject}
                      </h3>
                      <ul className="space-y-3">
                        {property.whyThisProject.map((point, index) => (
                          <li key={index} className="flex gap-3 text-sm text-[#8b9ab4]">
                            <span className="text-[#22c55e] shrink-0">•</span>
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Why This Sponsor - Only show if has content */}
                  {property.whyThisSponsor && property.whyThisSponsor.length > 0 && (
                    <div>
                      <h3 className="font-heading font-semibold text-white mb-3">
                        {t.realEstateSection.whyThisSponsor}
                      </h3>
                      <ul className="space-y-3">
                        {property.whyThisSponsor.map((point, index) => (
                          <li key={index} className="flex gap-3 text-sm text-[#8b9ab4]">
                            <span className="text-[#22c55e] shrink-0">•</span>
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Documents Tab Content */}
              {activeTab === 'documents' && (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <a
                      key={index}
                      href={doc.url && doc.url !== '#' ? doc.url : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!doc.url || doc.url === '#') {
                          e.preventDefault();
                        }
                      }}
                      className={cn(
                        'flex items-center justify-between p-3 bg-[#0c1320] rounded-lg transition-colors group',
                        doc.url && doc.url !== '#' 
                          ? 'hover:bg-[#111827] cursor-pointer' 
                          : 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#1a2332] flex items-center justify-center">
                          <span className="text-sm font-bold text-[#22c55e]">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-white text-sm">{doc.title || doc.name}</span>
                      </div>
                      {doc.url && doc.url !== '#' ? (
                        <ExternalLink className="h-4 w-4 text-[#6b7a90] group-hover:text-[#22c55e] transition-colors" />
                      ) : (
                        <span className="text-xs text-[#6b7a90]">{t.realEstateSection.notUploaded}</span>
                      )}
                    </a>
                  ))}
                  {documents.length === 0 && (
                    <p className="text-center text-[#6b7a90] py-4">{t.realEstateSection.noDocumentsAvailable}</p>
                  )}
                </div>
              )}

              {/* Invest Button */}
              {isClosed ? (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-lg bg-[#1a2332] text-[#6b7a90] text-sm font-medium cursor-not-allowed"
                >
                  {t.realEstateSection.projectClosed}
                </button>
              ) : (
                <button
                  onClick={() => onInvest?.(property)}
                  className="w-full py-3 px-4 rounded-lg bg-[#22c55e] text-white text-sm font-medium hover:bg-[#1ea550] transition-colors"
                >
                  {t.realEstateSection.investNow}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PropertyDetailPanel;
