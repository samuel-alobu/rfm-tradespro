'use client';

import React, { forwardRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/utils';
import { User } from 'lucide-react';

// ============================================
// Avatar Component
// ============================================

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
  fallback?: React.ReactNode;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt = 'Avatar',
      name,
      size = 'md',
      status,
      showStatus = false,
      fallback,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    const sizes = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-14 w-14 text-lg',
      '2xl': 'h-16 w-16 text-xl',
    };

    const imageSizesPx = {
      xs: '24px',
      sm: '32px',
      md: '40px',
      lg: '48px',
      xl: '56px',
      '2xl': '64px',
    };

    const statusSizes = {
      xs: 'h-1.5 w-1.5',
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
      xl: 'h-3.5 w-3.5',
      '2xl': 'h-4 w-4',
    };

    const statusColors = {
      online: 'bg-[var(--color-success)]',
      offline: 'bg-[var(--color-text-muted)]',
      away: 'bg-[var(--color-warning)]',
      busy: 'bg-[var(--color-error)]',
    };

    const getInitials = (name: string): string => {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const renderContent = () => {
      if (src && !imageError) {
        return (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={imageSizesPx[size]}
            className="object-cover"
            onError={() => setImageError(true)}
          />
        );
      }

      if (fallback) {
        return fallback;
      }

      if (name) {
        return (
          <span className="font-medium text-[var(--color-text-secondary)]">
            {getInitials(name)}
          </span>
        );
      }

      return <User className="h-1/2 w-1/2 text-[var(--color-text-muted)]" />;
    };

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex shrink-0', className)}
        {...props}
      >
        <div
          className={cn(
            'relative flex items-center justify-center',
            'rounded-full overflow-hidden',
            'bg-[var(--color-surface-elevated)]',
            'border border-[var(--color-border)]',
            sizes[size]
          )}
        >
          {renderContent()}
        </div>

        {showStatus && status && (
          <span
            className={cn(
              'absolute bottom-0 right-0',
              'rounded-full ring-2 ring-[var(--color-background)]',
              statusSizes[size],
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// ============================================
// Avatar Group Component
// ============================================

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: Array<{
    src?: string;
    name?: string;
    alt?: string;
  }>;
  max?: number;
  size?: AvatarProps['size'];
}

const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, avatars, max = 4, size = 'md', ...props }, ref) => {
    const displayed = avatars.slice(0, max);
    const remaining = avatars.length - max;

    const overlapSizes = {
      xs: '-space-x-2',
      sm: '-space-x-2.5',
      md: '-space-x-3',
      lg: '-space-x-3.5',
      xl: '-space-x-4',
      '2xl': '-space-x-5',
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center', overlapSizes[size], className)}
        {...props}
      >
        {displayed.map((avatar, index) => (
          <Avatar
            key={index}
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt || avatar.name}
            size={size}
            className="ring-2 ring-[var(--color-background)]"
          />
        ))}

        {remaining > 0 && (
          <div
            className={cn(
              'relative flex items-center justify-center',
              'rounded-full',
              'bg-[var(--color-surface-elevated)]',
              'border border-[var(--color-border)]',
              'ring-2 ring-[var(--color-background)]',
              'text-xs font-medium text-[var(--color-text-secondary)]',
              size === 'xs' && 'h-6 w-6',
              size === 'sm' && 'h-8 w-8',
              size === 'md' && 'h-10 w-10',
              size === 'lg' && 'h-12 w-12',
              size === 'xl' && 'h-14 w-14',
              size === '2xl' && 'h-16 w-16'
            )}
          >
            +{remaining}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarGroup };
