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
    const stored = window.localStorage.getItem('nexi-locale-code') ?? window.localStorage.getItem('nexi-locale');
    const next = localeFromStoredValue(stored);
    setLocaleState(next);
    document.documentElement.lang = SUPPORTED_LOCALES.find((item) => item.code === next)?.htmlLang ?? 'en';
  }, []);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    window.localStorage.setItem('nexi-locale-code', next);
    window.localStorage.setItem('nexi-locale', next);
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
