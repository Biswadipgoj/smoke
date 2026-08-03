// src/hooks/useTranslation.ts
import { useDhruvStore } from '../store/useDhruvStore';
import { translations, TranslationKeys, Locale } from '../constants/translations';

export function useTranslation() {
  const profile = useDhruvStore((s) => s.profile);
  const locale: Locale = profile?.settings.locale ?? 'en';
  const t: TranslationKeys = translations[locale] ?? translations.en;
  return { t, locale };
}

/** Font family selection per active script — master doc §2.5. */
export function useScriptFontFamily() {
  const { locale } = useTranslation();
  if (locale === 'hi') return { body: 'NotoSansDevanagari_400Regular', bodyMedium: 'NotoSansDevanagari_500Medium', bodySemiBold: 'NotoSansDevanagari_600SemiBold', display: 'TiroDevanagariHindi_400Regular', script: 'devanagari' as const };
  if (locale === 'bn') return { body: 'NotoSansBengali_400Regular', bodyMedium: 'NotoSansBengali_500Medium', bodySemiBold: 'NotoSansBengali_600SemiBold', display: 'TiroBangla_400Regular', script: 'bengali' as const };
  return { body: 'NotoSans_400Regular', bodyMedium: 'NotoSans_500Medium', bodySemiBold: 'NotoSans_600SemiBold', display: 'NotoSans_700Bold', script: 'latin' as const };
}
