// src/lib/crisis.ts
// Locale- and time-aware crisis resource resolution. Deterministic, offline,
// no model or network in the loop — master doc §15.6, doc 02 §6.3.
// Showing a closed helpline to someone in crisis is worse than showing none,
// so the time check for Bangladesh is mandatory, not cosmetic.

export interface CrisisResource {
  name: string;
  phone: string;
  note: string;
}

/**
 * We don't have reliable device-locale → country mapping without a network
 * call, so this takes an explicit country hint (settings / onboarding
 * geography question, or Locale as a rough proxy) rather than guessing from
 * IP. Defaults to the global fallback when unknown — never fabricate a
 * regional number.
 */
export type CrisisCountry = 'IN' | 'BD' | 'unknown';

export function getCrisisResources(country: CrisisCountry, now: Date = new Date()): CrisisResource[] {
  if (country === 'IN') {
    return [
      { name: 'Tele-MANAS (India)', phone: '14416', note: 'Free, 24×7, ~20 languages' },
      { name: 'Tele-MANAS (toll-free)', phone: '1-800-891-4416', note: 'Free, 24×7' },
    ];
  }
  if (country === 'BD') {
    const hour = now.getHours();
    const kaanPeteRoiOpen = hour >= 15 || hour < 3; // 3:00 PM – 3:00 AM
    if (kaanPeteRoiOpen) {
      return [{ name: 'Kaan Pete Roi', phone: '09612-119911', note: 'Open now — 3:00 PM to 3:00 AM' }];
    }
    return [{ name: 'National Emergency (Bangladesh)', phone: '999', note: 'Kaan Pete Roi is closed right now (opens 3:00 PM)' }];
  }
  return [{ name: 'Find a helpline', phone: '', note: 'findahelpline.com — international directory' }];
}

/** Alcohol medical gate trigger — master doc §15.6. */
export function needsAlcoholMedicalGate(heavyDailyDrinking: boolean, withdrawalSymptoms: boolean): boolean {
  return heavyDailyDrinking || withdrawalSymptoms;
}
