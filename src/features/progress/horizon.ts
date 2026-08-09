// src/features/progress/horizon.ts
//
// §13 — the horizon *is* the progression system. No points screen, no coins,
// no separate meter. This module exists only to turn behaviour into the two
// numbers the visual needs, and the scoring is deliberately not shown to the
// user anywhere: the moment it becomes a score, it becomes a game.
//
// It advances only on the four events §13 names. Opening the app moves nothing.

import type { CigaretteLog, CravingLog, UserProfile } from '../../types';
import { DAY_MS } from '../behavior/analysis';

export type HorizonStage = 'haze' | 'firstLight' | 'breaking' | 'clear' | 'dawn';
export type TreeStage = 'bare' | 'budding' | 'canopy';

/** Weights, not scores. A day genuinely under baseline is worth more than a
 *  single delayed craving, and reflection is worth the same as one delay. */
const WEIGHT_DELAYED_CRAVING = 1;
const WEIGHT_DAY_UNDER_BASELINE = 2;
const WEIGHT_REFLECTION = 1;

const STAGE_THRESHOLDS: { stage: HorizonStage; at: number }[] = [
  { stage: 'dawn', at: 70 },
  { stage: 'clear', at: 35 },
  { stage: 'breaking', at: 15 },
  { stage: 'firstLight', at: 5 },
  { stage: 'haze', at: 0 },
];

const TREE_THRESHOLDS: { stage: TreeStage; at: number }[] = [
  { stage: 'canopy', at: 35 },
  { stage: 'budding', at: 15 },
  { stage: 'bare', at: 0 },
];

export interface HorizonState {
  /** 0 = full haze, 1 = full dawn. Drives the gradient and the light. */
  clarity: number;
  stage: HorizonStage;
  tree: TreeStage;
  /** Days on which fewer than baseline were smoked. */
  daysUnderBaseline: number;
  cravingsDelayed: number;
}

/** Days (local calendar) where the count came in under the baseline. */
export function daysUnderBaseline(
  cigarettes: CigaretteLog[],
  profile: UserProfile,
  nowMs = Date.now()
): number {
  if (cigarettes.length === 0) return 0;
  const perDay = new Map<string, number>();
  for (const log of cigarettes) {
    const d = new Date(log.timestampMs);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  // Today is excluded: it isn't over, and crediting a quiet morning as a win
  // that a heavy evening then takes back would be worse than waiting a day.
  const today = new Date(nowMs);
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  let count = 0;
  for (const [key, n] of perDay) {
    if (key === todayKey) continue;
    if (n < profile.baselineCigarettesPerDay) count += 1;
  }
  return count;
}

export function computeHorizon(params: {
  cigarettes: CigaretteLog[];
  cravings: CravingLog[];
  profile: UserProfile;
  /** Reflections completed — §13's fourth advancing event. */
  reflections?: number;
  nowMs?: number;
}): HorizonState {
  const { cigarettes, cravings, profile } = params;
  const nowMs = params.nowMs ?? Date.now();

  const delayed = cravings.filter((c) => c.outcome === 'delayed').length;
  const underBaseline = daysUnderBaseline(cigarettes, profile, nowMs);
  const reflections = params.reflections ?? 0;

  const points =
    delayed * WEIGHT_DELAYED_CRAVING +
    underBaseline * WEIGHT_DAY_UNDER_BASELINE +
    reflections * WEIGHT_REFLECTION;

  // Asymptotic rather than linear: early progress is very visible, and the
  // horizon never quite finishes clearing, because neither does this.
  const clarity = 1 - Math.exp(-points / 45);

  const stage = STAGE_THRESHOLDS.find((s) => points >= s.at)?.stage ?? 'haze';
  const tree = TREE_THRESHOLDS.find((s) => points >= s.at)?.stage ?? 'bare';

  return {
    clarity,
    stage,
    tree,
    daysUnderBaseline: underBaseline,
    cravingsDelayed: delayed,
  };
}

/** Days of history available, for screens that need to say "not yet". */
export function daysOfHistory(cigarettes: CigaretteLog[], cravings: CravingLog[]): number {
  const stamps = [...cigarettes, ...cravings].map((r) => r.timestampMs);
  if (stamps.length === 0) return 0;
  return Math.max(1, Math.ceil((Date.now() - Math.min(...stamps)) / DAY_MS));
}
