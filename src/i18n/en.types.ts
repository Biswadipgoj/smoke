// src/i18n/en.types.ts
// Split out from en.ts so hi.ts and bn.ts can type themselves against the
// English dictionary without importing its runtime object (and without a
// circular import through i18n/index.ts).

import type en from './en';

export type Dictionary = typeof en;
export type TranslationKey = keyof Dictionary;
