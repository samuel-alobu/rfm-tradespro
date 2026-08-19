'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/utils';

// ============================================
// Language Selector Component
// ============================================

interface LanguageSelectorProps {
  variant?: 'icon' | 'full';
  className?: string;
}

export function LanguageSelector({ variant = 'icon', className }: LanguageSelectorProps) {
  const { language, setLanguage, languageOption, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (langCode: string) => {
    setLanguage(langCode as typeof language);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === 'icon' ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-[#6b7a90] hover:text-white transition-colors rounded-lg hover:bg-[#1e2733] flex items-center gap-1"
          aria-label={t.settings.language}
        >
          <Globe className="h-5 w-5" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-[#0a0e14] border border-[#1e2733] rounded-lg hover:border-[#22c55e] transition-colors"
        >
          <span className="text-xl">{languageOption.flag}</span>
          <span className="text-white text-sm">{languageOption.nativeName}</span>
          <ChevronDown className={cn(
            "h-4 w-4 text-[#6b7a90] transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-[#0f1419] border border-[#1e2733] rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#1e2733]">
              <p className="text-sm font-medium text-white">{t.settings.language}</p>
              <p className="text-xs text-[#6b7a90]">Select your preferred language</p>
            </div>

            {/* Language List */}
            <div className="max-h-[320px] overflow-y-auto py-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#151c24] transition-colors",
                    language === lang.code && "bg-[#22c55e]/10"
                  )}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <p className={cn(
                      "text-sm font-medium",
                      language === lang.code ? "text-[#22c55e]" : "text-white"
                    )}>
                      {lang.nativeName}
                    </p>
                    <p className="text-xs text-[#6b7a90]">{lang.name}</p>
                  </div>
                  {language === lang.code && (
                    <Check className="h-4 w-4 text-[#22c55e]" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LanguageSelector;
