// src/features/behavior/analysis.ts
//
// §3-6 Behaviour Analysis Engine — the bottom layer of the stack. Everything
// below it in the diagram (intervention engine, delay algorithm, insights)
// reads this summary, and none of them touch the network. Pure functions over
// rows, so the whole chain is testable without a device.

import type { BehaviorSummary, CigaretteLog, CravingLog, Trigger } from '../../types';
import { TRIGGERS } from '../../types/index.ts';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** §8 — the interval to assume before there's any history to measure. */
export const FALLBACK_INTERVAL_MINUTES = 90;

/** How far back the rolling baseline looks. */
export const BASELINE_WINDOW_DAYS = 14;

/**
 * Gaps longer than this are treated as "not a smoking interval" — almost all
 * of them are sleep, and letting an eight-hour night into a mean of
 * twenty-minute gaps would quietly triple every recommendation. Capping rather
 * than dropping keeps a genuinely long clean stretch counting for something.
 */
const MAX_CREDITED_GAP_MINUTES = 8 * 60;

/** The rolling window the momentum multiplier reads (§8). */
export const MOMENTUM_WINDOW = 5;

/**
 * 14-day rolling average gap between cigarettes, in minutes. Falls back to 90
 * when there isn't enough history to measure one.
 */
export function baselineIntervalMinutes(
  cigarettes: CigaretteLog[],
  nowMs = Date.now()
): { minutes: number; measured: boolean } {
  const since = nowMs - BASELINE_WINDOW_DAYS * DAY_MS;
  const stamps = cigarettes
    .map((c) => c.timestampMs)
    .filter((ts) => ts >= since)
    .sort((a, b) => a - b);

  if (stamps.length < 3) {
    return { minutes: FALLBACK_INTERVAL_MINUTES, measured: false };
  }

  let total = 0;
  let counted = 0;
  for (let i = 1; i < stamps.length; i += 1) {
    const gap = (stamps[i] - stamps[i - 1]) / 60000;
    if (gap <= 0) continue;
    total += Math.min(gap, MAX_CREDITED_GAP_MINUTES);
    counted += 1;
  }

  if (counted === 0) return { minutes: FALLBACK_INTERVAL_MINUTES, measured: false };
  return { minutes: total / counted, measured: true };
}

function triggerFrequency(
  cravings: CravingLog[],
  cigarettes: CigaretteLog[]
): BehaviorSummary['triggerFrequency'] {
  const counts = new Map<Trigger, number>();
  for (const c of cravings) counts.set(c.trigger, (counts.get(c.trigger) ?? 0) + 1);
  for (const c of cigarettes) {
    if (c.trigger) counts.set(c.trigger, (counts.get(c.trigger) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return TRIGGERS.map((trigger) => ({
    trigger,
    count: counts.get(trigger) ?? 0,
    share: (counts.get(trigger) ?? 0) / total,
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
}

function hourHistogram(cigarettes: CigaretteLog[]): number[] {
  const buckets = new Array<number>(24).fill(0);
  for (const c of cigarettes) buckets[new Date(c.timestampMs).getHours()] += 1;
  return buckets;
}

/**
 * Share of the last few resolved cravings that ended in a delay. Unresolved
 * cravings are excluded rather than counted as failures — an abandoned flow
 * usually means the phone was put down, not that the user smoked.
 */
export function recentSuccessRate(cravings: CravingLog[], window = MOMENTUM_WINDOW): number {
  const resolved = cravings
    .filter((c) => c.outcome === 'delayed' || c.outcome === 'smoked')
    .sort((a, b) => b.timestampMs - a.timestampMs)
    .slice(0, window);
  if (resolved.length === 0) return 0.5; // neutral: neither a good nor bad week
  const wins = resolved.filter((c) => c.outcome === 'delayed').length;
  return wins / resolved.length;
}

function interventionEffectiveness(
  cravings: CravingLog[]
): BehaviorSummary['interventionEffectiveness'] {
  const stats = new Map<string, { uses: number; wins: number }>();
  for (const c of cravings) {
    if (c.outcome !== 'delayed' && c.outcome !== 'smoked') continue;
    const entry = stats.get(c.interventionId) ?? { uses: 0, wins: 0 };
    entry.uses += 1;
    if (c.outcome === 'delayed') entry.wins += 1;
    stats.set(c.interventionId, entry);
  }
  return [...stats.entries()]
    .map(([interventionId, { uses, wins }]) => ({
      interventionId,
      uses,
      rate: wins / uses,
    }))
    .sort((a, b) => b.rate - a.rate || b.uses - a.uses);
}

/** Cigarettes per day over the last 7 days of observed history. */
export function recentCigarettesPerDay(cigarettes: CigaretteLog[], nowMs = Date.now()): number {
  const since = nowMs - 7 * DAY_MS;
  const recent = cigarettes.filter((c) => c.timestampMs >= since);
  if (recent.length === 0) return 0;
  const earliest = Math.min(...recent.map((c) => c.timestampMs));
  // Partial first day still counts as a day, so a heavy first afternoon
  // doesn't read as an implausible per-day rate.
  const days = Math.max(1, (nowMs - earliest) / DAY_MS);
  return recent.length / days;
}

export function analyseBehavior(
  cigarettes: CigaretteLog[],
  cravings: CravingLog[],
  nowMs = Date.now()
): BehaviorSummary {
  const baseline = baselineIntervalMinutes(cigarettes, nowMs);
  const resolved = cravings.filter((c) => c.outcome === 'delayed' || c.outcome === 'smoked');
  return {
    baselineIntervalMinutes: baseline.minutes,
    hasIntervalHistory: baseline.measured,
    triggerFrequency: triggerFrequency(cravings, cigarettes),
    hourHistogram: hourHistogram(cigarettes),
    recentSuccessRate: recentSuccessRate(cravings),
    resolvedCravingCount: resolved.length,
    interventionEffectiveness: interventionEffectiveness(cravings),
    cigarettesPerDayRecent: recentCigarettesPerDay(cigarettes, nowMs),
  };
}

/** An empty summary, for the first launch before anything has been logged. */
export function emptyBehaviorSummary(): BehaviorSummary {
  return {
    baselineIntervalMinutes: FALLBACK_INTERVAL_MINUTES,
    hasIntervalHistory: false,
    triggerFrequency: [],
    hourHistogram: new Array<number>(24).fill(0),
    recentSuccessRate: 0.5,
    resolvedCravingCount: 0,
    interventionEffectiveness: [],
    cigarettesPerDayRecent: 0,
  };
}
