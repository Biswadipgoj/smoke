// src/features/analytics/insights.ts
//
// §14 — Insight / Motivation Engine. Template-narrative, not raw numbers.
//
// The rule that shapes everything here: it compares two recent windows and
// only surfaces a *genuine improvement* as a sentence. An uptick produces
// silence, never a narrated decline. That's not the engine being coy — a
// smoker having a bad week already knows, and telling them again is the shame
// mechanic §1 exists to rule out. The charts on the same screen still show the
// real numbers in both directions; the sentences are the encouraging layer.

import type { TranslateFn } from '../../i18n';
import type { CigaretteLog, CravingLog, Trigger } from '../../types';
import { DAY_MS } from '../behavior/analysis';

/** Below this, a "change" is noise from a week with one odd evening in it. */
const MIN_MEANINGFUL_DROP = 0.1;

/** Below this many events in the earlier window, percentages lie. */
const MIN_SAMPLE = 5;

export interface Insight {
  id: string;
  text: string;
}

type PartOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

function partOfDay(timestampMs: number): PartOfDay {
  const hour = new Date(timestampMs).getHours();
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  if (hour < 23) return 'evening';
  return 'night';
}

function within<T extends { timestampMs: number }>(rows: T[], fromMs: number, toMs: number): T[] {
  return rows.filter((r) => r.timestampMs >= fromMs && r.timestampMs < toMs);
}

/** Percentage drop from `before` to `after`, or null when it isn't real. */
function drop(before: number, after: number, minSample = MIN_SAMPLE): number | null {
  if (before < minSample) return null;
  const delta = (before - after) / before;
  if (delta < MIN_MEANINGFUL_DROP) return null;
  return Math.round(delta * 100);
}

const PART_KEYS = {
  morning: 'insight.part.morning',
  afternoon: 'insight.part.afternoon',
  evening: 'insight.part.evening',
  night: 'insight.part.night',
} as const;

export function buildInsights(params: {
  cigarettes: CigaretteLog[];
  cravings: CravingLog[];
  t: TranslateFn;
  nowMs?: number;
  windowDays?: number;
}): Insight[] {
  const { cigarettes, cravings, t } = params;
  const nowMs = params.nowMs ?? Date.now();
  const windowDays = params.windowDays ?? 7;
  const windowMs = windowDays * DAY_MS;

  const recentFrom = nowMs - windowMs;
  const priorFrom = nowMs - 2 * windowMs;

  const recentCigs = within(cigarettes, recentFrom, nowMs);
  const priorCigs = within(cigarettes, priorFrom, recentFrom);
  const recentCravings = within(cravings, recentFrom, nowMs);
  const priorCravings = within(cravings, priorFrom, recentFrom);

  const insights: Insight[] = [];

  // 1. Overall volume.
  const overall = drop(priorCigs.length, recentCigs.length);
  if (overall !== null) {
    insights.push({ id: 'overall', text: t('insight.overall', { n: overall }) });
  }

  // 2. Time of day — report only the single biggest genuine drop, so the
  //    screen never reads as a list of ways the user is doing fine.
  let bestPart: { part: PartOfDay; pct: number } | null = null;
  for (const part of ['morning', 'afternoon', 'evening', 'night'] as PartOfDay[]) {
    const before = priorCigs.filter((c) => partOfDay(c.timestampMs) === part).length;
    const after = recentCigs.filter((c) => partOfDay(c.timestampMs) === part).length;
    const pct = drop(before, after, 4);
    if (pct !== null && (!bestPart || pct > bestPart.pct)) bestPart = { part, pct };
  }
  if (bestPart) {
    insights.push({
      id: `part-${bestPart.part}`,
      text: t('insight.partOfDay', {
        part: t(PART_KEYS[bestPart.part]),
        n: bestPart.pct,
      }),
    });
  }

  // 3. A specific trigger easing off.
  let bestTrigger: { trigger: Trigger; pct: number } | null = null;
  const triggers = new Set<Trigger>(priorCravings.map((c) => c.trigger));
  for (const trigger of triggers) {
    const before = priorCravings.filter((c) => c.trigger === trigger).length;
    const after = recentCravings.filter((c) => c.trigger === trigger).length;
    const pct = drop(before, after, 4);
    if (pct !== null && (!bestTrigger || pct > bestTrigger.pct)) bestTrigger = { trigger, pct };
  }
  if (bestTrigger) {
    insights.push({
      id: `trigger-${bestTrigger.trigger}`,
      text: t('insight.trigger', {
        trigger: t(`trigger.${bestTrigger.trigger}` as Parameters<TranslateFn>[0]).toLowerCase(),
        n: bestTrigger.pct,
      }),
    });
  }

  // 4. Cravings waited out — the one metric where *up* is the improvement.
  const priorResolved = priorCravings.filter((c) => c.outcome);
  const recentResolved = recentCravings.filter((c) => c.outcome);
  if (priorResolved.length >= MIN_SAMPLE && recentResolved.length >= MIN_SAMPLE) {
    const beforeRate =
      priorResolved.filter((c) => c.outcome === 'delayed').length / priorResolved.length;
    const afterRate =
      recentResolved.filter((c) => c.outcome === 'delayed').length / recentResolved.length;
    if (afterRate - beforeRate >= MIN_MEANINGFUL_DROP) {
      insights.push({
        id: 'delays',
        text: t('insight.delays', { n: Math.round(afterRate * 100) }),
      });
    }
  }

  // 5. Longest clean stretch, when it beat the previous window's.
  const recentGap = longestGapHours(recentCigs, recentFrom, nowMs);
  const priorGap = longestGapHours(priorCigs, priorFrom, recentFrom);
  if (recentGap >= 2 && recentGap > priorGap * 1.15) {
    insights.push({
      id: 'gap',
      text: t('insight.gap', { n: Math.round(recentGap) }),
    });
  }

  return insights;
}

/** Longest stretch with no cigarette inside a window, in hours. */
export function longestGapHours(cigs: CigaretteLog[], fromMs: number, toMs: number): number {
  const stamps = cigs.map((c) => c.timestampMs).sort((a, b) => a - b);
  if (stamps.length === 0) return (toMs - fromMs) / 3600000;
  let longest = Math.max(stamps[0] - fromMs, toMs - stamps[stamps.length - 1]);
  for (let i = 1; i < stamps.length; i += 1) {
    longest = Math.max(longest, stamps[i] - stamps[i - 1]);
  }
  return longest / 3600000;
}
