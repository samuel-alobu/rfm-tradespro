// ============================================
// Verified Badge Component
// Twitter/X style blue tick for verified traders
// ============================================

import React from 'react';
import { cn } from '@/utils';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ 
  className,
  size = 'md' 
}) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizes[size], 'shrink-0', className)}
      aria-label="Verified"
    >
      <path 
        d="M16.5264 4.1543L19.6836 4.31152L19.8428 7.46875L22.498 9.18359L21.0576 11.9971L22.5 14.8096L19.8457 16.5264L19.6885 19.6836L16.5312 19.8428L14.8164 22.498L12.0029 21.0576L9.19043 22.5L7.47363 19.8457L4.31641 19.6885L4.15723 16.5312L1.50195 14.8164L2.94238 12.0029L1.5 9.19043L4.1543 7.47363L4.31152 4.31641L7.46875 4.15723L9.18359 1.50195L11.9971 2.94238L14.8096 1.5L16.5264 4.1543ZM10.7139 13.5234L8.51074 11.3193L7.44922 12.3799L10.6982 15.6279L16.542 9.96289L15.498 8.88574L10.7139 13.5234Z" 
        fill="#1D9BF0"
      />
    </svg>
  );
};

export default VerifiedBadge;
