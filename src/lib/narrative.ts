// src/lib/narrative.ts
// ─────────────────────────────────────────────────────────────────────────────
// Data as narrative. Numbers alone don't move people — meaning does. These
// helpers translate raw progress into tangible, emotionally resonant stories:
// money becomes "a celebratory dinner", avoided cigarettes become "minutes of
// clean breathing" and "life reclaimed".
// ─────────────────────────────────────────────────────────────────────────────
import { TranslationKeys } from '../constants/translations';

// Public-health estimates, deliberately conservative and framed as "estimated".
const MINUTES_CLEAN_BREATHING_PER_CIG = 6; // easier-breathing minutes regained
const MINUTES_LIFE_PER_CIG = 11;           // widely-cited ~11 min/cigarette

export function cleanBreathingMinutes(cigsAvoided: number): number {
  return Math.max(0, Math.round(cigsAvoided * MINUTES_CLEAN_BREATHING_PER_CIG));
}

export function lifeMinutesRegained(cigsAvoided: number): number {
  return Math.max(0, Math.round(cigsAvoided * MINUTES_LIFE_PER_CIG));
}

/**
 * Frame an amount of saved money as something the user could enjoy. Tiers are
 * intentionally currency-agnostic (based on the user's own pack cost so the
 * story scales with local prices).
 */
export function moneyStory(saved: number, costPerPack: number, t: TranslationKeys): string {
  const packs = costPerPack > 0 ? saved / costPerPack : 0;
  if (packs < 1) return t.moneyStoryStart;
  if (packs < 3) return t.moneyStoryCoffee;
  if (packs < 8) return t.moneyStoryMeal;
  if (packs < 20) return t.moneyStoryDinner;
  if (packs < 50) return t.moneyStoryTreat;
  return t.moneyStoryGetaway;
}

/** Rough number of cigarettes avoided vs. the pre-app baseline. */
export function cigsAvoided(
  dailyBaseline: number,
  startDate: string,
  cigsSmokedTotal: number
): number {
  const days = Math.max(
    1,
    Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000)
  );
  return Math.max(0, dailyBaseline * days - cigsSmokedTotal);
}

/** "3h 20m" style compaction for larger minute counts. */
export function humanizeMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)}`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h < 48) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
}
