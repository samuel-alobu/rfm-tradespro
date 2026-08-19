'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Language, 
  LanguageOption, 
  TranslationKeys, 
  languages, 
  translations 
} from './translations';

// ============================================
// Language Context
// ============================================

interface LanguageContextType {
  language: Language;
  languageOption: LanguageOption;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  languages: LanguageOption[];
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ============================================
// Language Provider
// ============================================

interface LanguageProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'rfm-tradepro-language';

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEY) as Language;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (translations[browserLang]) {
        setLanguageState(browserLang);
      }
    }
    setMounted(true);
  }, []);

  // Update document direction for RTL languages
  useEffect(() => {
    if (mounted) {
      const langOption = languages.find(l => l.code === language);
      if (langOption) {
        document.documentElement.dir = langOption.dir;
        document.documentElement.lang = language;
      }
    }
  }, [language, mounted]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    
    // Update document direction immediately
    const langOption = languages.find(l => l.code === lang);
    if (langOption) {
      document.documentElement.dir = langOption.dir;
      document.documentElement.lang = lang;
    }
  }, []);

  const languageOption = languages.find(l => l.code === language) || languages[0];
  const t = translations[language] || translations.en;
  const dir = languageOption.dir;

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <LanguageContext.Provider 
        value={{ 
          language: 'en', 
          languageOption: languages[0], 
          setLanguage, 
          t: translations.en, 
          languages,
          dir: 'ltr'
        }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        languageOption, 
        setLanguage, 
        t, 
        languages,
        dir
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// ============================================
// useLanguage Hook
// ============================================

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// ============================================
// useTranslation Hook (alias)
// ============================================

export function useTranslation() {
  const { t, language, setLanguage } = useLanguage();
  return { t, language, setLanguage };
}

export { languages, type Language, type LanguageOption };
