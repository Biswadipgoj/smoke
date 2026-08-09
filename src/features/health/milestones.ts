// src/features/health/milestones.ts
//
// §16 — well-established, non-personalised milestones only. Nothing here is
// derived from the user's own data, because a personalised health claim is a
// medical claim, and §5 rules those out. Every screen that renders these must
// also render `health.disclaimer`.

import type { TranslationKey } from '../../i18n';

export interface HealthMilestone {
  id: string;
  /** Time smoke-free before this applies. */
  afterMs: number;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;

export const HEALTH_MILESTONES: HealthMilestone[] = [
  {
    id: '20min',
    afterMs: 20 * MINUTE,
    titleKey: 'health.20min',
    bodyKey: 'health.20min.body',
  },
  {
    id: '12hr',
    afterMs: 12 * HOUR,
    titleKey: 'health.12hr',
    bodyKey: 'health.12hr.body',
  },
  {
    // The published range is 2 weeks to 3 months; the marker sits at the start
    // of it so it isn't awarded before the evidence supports it.
    id: '2wk',
    afterMs: 14 * DAY,
    titleKey: 'health.2wk',
    bodyKey: 'health.2wk.body',
  },
  {
    id: '1yr',
    afterMs: YEAR,
    titleKey: 'health.1yr',
    bodyKey: 'health.1yr.body',
  },
  {
    id: '5yr',
    afterMs: 5 * YEAR,
    titleKey: 'health.5yr',
    bodyKey: 'health.5yr.body',
  },
  {
    id: '10yr',
    afterMs: 10 * YEAR,
    titleKey: 'health.10yr',
    bodyKey: 'health.10yr.body',
  },
];

/**
 * Progress against each milestone from the last cigarette. With no cigarette
 * ever logged, nothing is marked reached — the app has no evidence either way
 * and inventing a start time would be a health claim built on a guess.
 */
export function milestoneProgress(lastCigaretteMs: number | null, nowMs = Date.now()) {
  const elapsed = lastCigaretteMs === null ? 0 : nowMs - lastCigaretteMs;
  return HEALTH_MILESTONES.map((milestone) => ({
    milestone,
    reached: lastCigaretteMs !== null && elapsed >= milestone.afterMs,
    progress: lastCigaretteMs === null ? 0 : Math.min(1, elapsed / milestone.afterMs),
  }));
}
