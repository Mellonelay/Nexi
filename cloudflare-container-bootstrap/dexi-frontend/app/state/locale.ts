export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English', htmlLang: 'en' },
  { code: 'zh-CN', label: '简体中文', htmlLang: 'zh-CN' },
  { code: 'ko', label: '한국어', htmlLang: 'ko' },
  { code: 'ru', label: 'Русский', htmlLang: 'ru' },
  { code: 'es', label: 'Español', htmlLang: 'es' },
  { code: 'ms', label: 'Bahasa Melayu', htmlLang: 'ms' },
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code'];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export function isSupportedLocale(value: string | null | undefined): value is LocaleCode {
  return SUPPORTED_LOCALES.some((locale) => locale.code === value);
}

export function localeFromStoredValue(value: string | null | undefined): LocaleCode {
  if (isSupportedLocale(value)) return value;
  const byLabel = SUPPORTED_LOCALES.find((locale) => locale.label === value);
  return byLabel?.code ?? DEFAULT_LOCALE;
}

export function localeLabel(code: LocaleCode) {
  return SUPPORTED_LOCALES.find((locale) => locale.code === code)?.label ?? 'English';
}
