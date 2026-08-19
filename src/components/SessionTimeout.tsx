'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// ============================================
// Session Timeout Component
// Auto-logout after inactivity based on admin settings
// ============================================

export function SessionTimeout() {
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [timeoutMinutes, setTimeoutMinutes] = useState(30);
  const [isEnabled, setIsEnabled] = useState(false);

  // Skip on admin and auth pages
  const isAdminPage = pathname?.startsWith('/admin');
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  // Fetch settings
  useEffect(() => {
    if (isAdminPage || isAuthPage) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success) {
          setIsEnabled(data.autoLogoutEnabled);
          setTimeoutMinutes(data.sessionTimeoutMinutes || 30);
        }
      } catch {
        // Fallback to defaults
      }
    };

    fetchSettings();
  }, [isAdminPage, isAuthPage]);

  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    await signOut({ callbackUrl: '/login?reason=timeout' });
  }, []);

  const resetTimer = useCallback(() => {
    if (!isEnabled || isAdminPage || isAuthPage) return;

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    setShowWarning(false);

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = timeoutMs - (60 * 1000); // Show warning 1 minute before

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, warningMs);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [isEnabled, timeoutMinutes, isAdminPage, isAuthPage, handleLogout]);

  // Set up activity listeners
  useEffect(() => {
    if (!isEnabled || isAdminPage || isAuthPage) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimer();
    };

    // Start the timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [isEnabled, resetTimer, isAdminPage, isAuthPage]);

  // Don't render anything if not enabled or on admin/auth pages
  if (!isEnabled || isAdminPage || isAuthPage || !showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--color-warning)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--color-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Session Expiring Soon
          </h3>
          <p className="text-[var(--color-text-muted)] mb-6">
            You will be logged out in 1 minute due to inactivity. Move your mouse or press any key to stay logged in.
          </p>
          <div className="flex gap-3">
            <button
              onClick={resetTimer}
              className="flex-1 py-3 px-4 bg-[var(--color-primary)] text-white font-medium rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Stay Logged In
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-3 px-4 bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-medium rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              Log Out Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
