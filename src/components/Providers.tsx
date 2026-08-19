'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from '@/components/ui/Toast';
import { SmartsuppChat } from '@/components/SmartsuppChat';
import { SessionTimeout } from '@/components/SessionTimeout';

// ============================================
// Providers Component
// ============================================

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastContainer position="top-right" />
      <SmartsuppChat />
      <SessionTimeout />
    </QueryClientProvider>
  );
}
