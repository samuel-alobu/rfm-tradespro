'use client';

import React, { useState } from 'react';
import {
  Globe,
  DollarSign,
  Moon,
  Sun,
  Monitor,
  Clock,
  Check,
  Palette,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';

// ============================================
// Preferences Section Component
// ============================================

type Theme = 'light' | 'dark' | 'system';
type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD';
type Language = 'en' | 'es' | 'fr' | 'de' | 'zh';

interface PreferenceOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

const themeOptions: PreferenceOption<Theme>[] = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

const currencyOptions: PreferenceOption<Currency>[] = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
];

const languageOptions: PreferenceOption<Language>[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: '中文' },
];

const timezones = [
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

export const PreferencesSection: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [language, setLanguage] = useState<Language>('en');
  const [timezone, setTimezone] = useState('America/New_York');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              Choose your preferred theme
            </p>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 p-4 rounded-xl border transition-all',
                    theme === option.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                  )}
                >
                  <span className={cn(
                    theme === option.value
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)]'
                  )}>
                    {option.icon}
                  </span>
                  <span className={cn(
                    'font-medium',
                    theme === option.value
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-primary)]'
                  )}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              Select your preferred display currency
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {currencyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCurrency(option.value)}
                  className={cn(
                    'p-3 rounded-xl border text-center transition-all',
                    currency === option.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                  )}
                >
                  <span className={cn(
                    'font-medium',
                    currency === option.value
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-primary)]'
                  )}>
                    {option.value}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              Select your preferred language
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {languageOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLanguage(option.value)}
                  className={cn(
                    'p-3 rounded-xl border text-center transition-all',
                    language === option.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                  )}
                >
                  <span className={cn(
                    'font-medium',
                    language === option.value
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-primary)]'
                  )}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timezone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              Select your timezone for accurate timestamps
            </p>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full p-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Trading Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                Confirm Before Trading
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Show confirmation dialog before executing trades
              </p>
            </div>
            <button
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors bg-[var(--color-primary)]'
              )}
            >
              <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white translate-x-5" />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                Sound Effects
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Play sounds for trade executions and alerts
              </p>
            </div>
            <button
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors bg-[var(--color-border)]'
              )}
            >
              <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white" />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                Show Chart Tooltips
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Display tooltips when hovering over chart elements
              </p>
            </div>
            <button
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors bg-[var(--color-primary)]'
              )}
            >
              <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white translate-x-5" />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                Auto-refresh Data
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Automatically refresh market data every 5 seconds
              </p>
            </div>
            <button
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors bg-[var(--color-primary)]'
              )}
            >
              <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white translate-x-5" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saved && (
          <div className="flex items-center gap-2 text-[var(--color-success)]">
            <Check className="h-4 w-4" />
            <span className="text-sm">Preferences saved</span>
          </div>
        )}
        <Button onClick={handleSave} isLoading={isSaving}>
          Save All Preferences
        </Button>
      </div>
    </div>
  );
};

export default PreferencesSection;
