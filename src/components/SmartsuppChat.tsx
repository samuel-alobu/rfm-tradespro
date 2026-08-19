'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// ============================================
// Smartsupp Chat Component
// Loads Smartsupp chat widget on all pages except admin
// ============================================

interface SmartsuppChatProps {
  smartsuppKey?: string;
}

// Extend window for Smartsupp
declare global {
  interface Window {
    smartsupp?: ((...args: unknown[]) => void) & { _?: unknown[][] };
    _smartsupp?: { key: string };
  }
}

export const SmartsuppChat: React.FC<SmartsuppChatProps> = ({ 
  smartsuppKey = process.env.NEXT_PUBLIC_SMARTSUPP_KEY 
}) => {
  const pathname = usePathname();
  
  // Check if we're on an admin page
  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    // Don't load Smartsupp on admin pages or if no key
    if (isAdminPage || !smartsuppKey) {
      // Hide Smartsupp if it exists and we're on admin page
      if (window.smartsupp && isAdminPage) {
        window.smartsupp('chat:hide');
      }
      return;
    }

    // Check if Smartsupp script is already loaded
    const existingScript = document.getElementById('smartsupp-script');
    if (existingScript) {
      // Show Smartsupp if it was hidden
      if (window.smartsupp) {
        window.smartsupp('chat:show');
      }
      return;
    }

    // Initialize Smartsupp configuration
    window._smartsupp = { key: smartsuppKey };
    
    // Create smartsupp queue function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).smartsupp = function(...args: unknown[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fn = (window as any).smartsupp;
      fn._ = fn._ || [];
      fn._.push(args);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).smartsupp._ = [];

    // Load Smartsupp script
    const script = document.createElement('script');
    script.id = 'smartsupp-script';
    script.src = 'https://www.smartsuppchat.com/loader.js?';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Hide chat when navigating to admin
      if (window.smartsupp && isAdminPage) {
        window.smartsupp('chat:hide');
      }
    };
  }, [smartsuppKey, isAdminPage]);

  // Don't render anything on admin pages
  if (isAdminPage) {
    return null;
  }

  return null;
};

export default SmartsuppChat;
