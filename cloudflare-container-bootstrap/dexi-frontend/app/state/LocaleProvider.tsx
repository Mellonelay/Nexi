'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, LocaleCode, localeFromStoredValue, SUPPORTED_LOCALES } from './locale';
import { messageFor, UiMessageKey } from './messages';

type LocaleContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  languages: typeof SUPPORTED_LOCALES;
  t: (key: UiMessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  useEffect(() => {
    let profileLocale: string | null = null;
    try {
      const profile = JSON.parse(window.localStorage.getItem('user') || 'null') as { locale?: string } | null;
      profileLocale = profile?.locale ?? null;
    } catch {
      profileLocale = null;
    }
    const stored = window.localStorage.getItem('nexi-locale-code') ?? window.localStorage.getItem('nexi-locale') ?? profileLocale;
    const next = localeFromStoredValue(stored);
    setLocaleState(next);
    document.documentElement.lang = SUPPORTED_LOCALES.find((item) => item.code === next)?.htmlLang ?? 'en';
  }, []);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    window.localStorage.setItem('nexi-locale-code', next);
    window.localStorage.setItem('nexi-locale', next);
    try {
      const storedUser = window.localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser) as Record<string, unknown>;
        window.localStorage.setItem('user', JSON.stringify({ ...user, locale: next }));
      }
    } catch {
      // Keep the local preference even when a cached profile is malformed.
    }
    document.documentElement.lang = SUPPORTED_LOCALES.find((item) => item.code === next)?.htmlLang ?? 'en';
  }, []);

  const t = useCallback((key: UiMessageKey) => messageFor(locale, key), [locale]);
  const value = useMemo(() => ({ locale, setLocale, languages: SUPPORTED_LOCALES, t }), [locale, setLocale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside LocaleProvider');
  return value;
}
