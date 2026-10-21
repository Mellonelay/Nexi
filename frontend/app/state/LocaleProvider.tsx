'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { DEFAULT_LOCALE, LocaleCode, localeFromStoredValue, SUPPORTED_LOCALES } from './locale';
import { messageFor, PublicMessageOverrides, UiMessageKey } from './messages';
import { normalizePublicLocalization } from './public-settings';

type LocaleContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  languages: typeof SUPPORTED_LOCALES;
  t: (key: UiMessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);
  const [translations, setTranslations] = useState<PublicMessageOverrides>({});

  useEffect(() => {
    const stored = window.localStorage.getItem('nexi-locale-code') ?? window.localStorage.getItem('nexi-locale');
    const next = localeFromStoredValue(stored);
    setLocaleState(next);
    document.documentElement.lang = SUPPORTED_LOCALES.find((item) => item.code === next)?.htmlLang ?? 'en';
  }, []);

  useEffect(() => {
    let active = true;
    void api.get<unknown>('/public/config/localization')
      .then(({ data }) => {
        if (active) setTranslations(normalizePublicLocalization(data));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    window.localStorage.setItem('nexi-locale-code', next);
    window.localStorage.setItem('nexi-locale', next);
    document.documentElement.lang = SUPPORTED_LOCALES.find((item) => item.code === next)?.htmlLang ?? 'en';
  }, []);

  const t = useCallback((key: UiMessageKey) => messageFor(locale, key, translations), [locale, translations]);
  const value = useMemo(() => ({ locale, setLocale, languages: SUPPORTED_LOCALES, t }), [locale, setLocale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside LocaleProvider');
  return value;
}
