// src/hooks/useTranslation.ts
import { useAppStore } from '../store/useAppStore';
import { translations, TranslationKeys, Locale } from '../constants/translations';

export function useTranslation() {
  const profile = useAppStore((s) => s.profile);
  const locale: Locale = profile?.locale ?? 'en';
  const t: TranslationKeys = translations[locale] ?? translations.en;
  return { t, locale };
}
