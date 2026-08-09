// src/i18n/index.ts
//
// §17 — a plain dictionary lookup, hook-shaped. No provider: the active
// language lives on the profile store, so the language screen can set it
// before an account exists and every consumer re-renders from one source.

import { useCallback } from 'react';

import { useProfileStore } from '../store/useProfileStore';
import type { Language } from '../types';
import en from './en';

/** Every language must define exactly the keys English defines. */
export type TranslationKey = keyof typeof en;
export type Dictionary = Record<TranslationKey, string>;

// Imported after the type so hi/bn can be typed against `Dictionary`.
import bn from './bn';
import hi from './hi';

const dictionaries: Record<Language, Dictionary> = { en, hi, bn };

/** Values substituted into `{name}` placeholders. */
export type TranslationVars = Record<string, string | number>;

/**
 * Pure lookup — usable outside React (notification bodies, the offline coach,
 * the eval harness).
 */
export function translate(
  language: Language,
  key: TranslationKey,
  vars?: TranslationVars
): string {
  const dict = dictionaries[language] ?? en;
  // Falling back to English rather than showing the raw key: a partially
  // translated build should read as mixed-language, never as broken.
  let value: string = dict[key] ?? en[key] ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.split(`{${name}}`).join(String(replacement));
    }
  }
  return value;
}

export function useLanguage(): Language {
  return useProfileStore((s) => s.profile.language);
}

export type TranslateFn = (key: TranslationKey, vars?: TranslationVars) => string;

export function useT(): TranslateFn {
  const language = useLanguage();
  return useCallback(
    (key: TranslationKey, vars?: TranslationVars) => translate(language, key, vars),
    [language]
  );
}

/** Native names, shown in the language picker in their own script. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
};
