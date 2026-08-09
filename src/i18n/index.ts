// src/i18n/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// A dictionary lookup, not a framework (§17).
//
// Deliberately not i18next: this string set has no plural rules and only
// simple {named} interpolation, so the dependency and bundle cost buy nothing
// today. Revisit if plurals or per-locale date formatting show up.
//
// `Dictionary` is inferred from en.ts, so a key missing from hi/bn is a type
// error at build time rather than an English word appearing mid-sentence.
// ─────────────────────────────────────────────────────────────────────────────

import { getLocales } from 'expo-localization';
import { useAppStore } from '../store/useAppStore';
import type { Locale } from '../types';
import bn from './bn';
import en from './en';
import type { Dictionary, TranslationKey } from './en.types';
import hi from './hi';

export type { Dictionary, TranslationKey };

const dictionaries: Record<Locale, Dictionary> = { en, hi, bn };

export const LOCALES: Locale[] = ['en', 'hi', 'bn'];

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी',
  bn: 'বাংলা',
};

/** The device's language if we support it, English otherwise. */
export function detectLocale(): Locale {
  try {
    for (const entry of getLocales()) {
      const code = entry.languageCode as Locale | null;
      if (code && LOCALES.includes(code)) return code;
    }
  } catch {
    // expo-localization can throw on an unusual platform locale — English is
    // a safe default and the user picks a language in onboarding anyway.
  }
  return 'en';
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  return interpolate(dictionaries[locale][key], vars);
}

export type TFunction = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/**
 * The hook every screen uses. Re-renders on locale change because it reads
 * the locale straight out of the store.
 */
export function useTranslation(): { t: TFunction; locale: Locale } {
  const locale = useAppStore((s) => s.profile?.locale ?? 'en');
  return {
    locale,
    t: (key, vars) => translate(locale, key, vars),
  };
}
