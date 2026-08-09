// src/features/cravings/delayAlgorithm.ts
// ─────────────────────────────────────────────────────────────────────────────
// The adaptive delay algorithm (§8). A pure function of the user's own
// history — no network, no model, no randomness — which is why it is both the
// offline fallback and the thing worth unit-testing first (§28).
//
//   recommend = baselineInterval × reductionFactor × START_FRACTION
//               × triggerMultiplier × intensityMultiplier × momentumMultiplier
//
// The design commitments encoded here, each of which is easy to get backwards:
//
//   · The ask is a *fraction* of the eventual target gap, not the whole gap.
//     Asking a two-pack-a-day smoker to wait the full target interval on day
//     one is how apps get uninstalled.
//   · The hardest contexts get the *easiest* ask. Social and alcohol cravings
//     are the most likely to be lost, so they are made the most winnable.
//   · A stronger craving is asked for *less*, not more.
//   · A bad week makes the next ask easier. Momentum stretches the ask only
//     when the user's own recent record says they can hold it.
// ─────────────────────────────────────────────────────────────────────────────

import type { BehaviorStats, Intensity, Trigger } from '../../types';

/** The opening ask is 15% of the target gap (§8). */
export const START_FRACTION = 0.15;

/** Never ask for less than this — below it the delay stops being a delay. */
export const MIN_MINUTES = 2;

/** Never ask for more than this in one go, however good the history looks. */
export const MAX_MINUTES = 40;

/**
 * Social and alcohol cravings get an easier ask; boredom and habit — the ones
 * with the least real pull behind them — get a harder one.
 */
export const TRIGGER_MULTIPLIERS: Record<Trigger, number> = {
  social: 0.75,
  alcohol: 0.8,
  anxiety: 0.85,
  stress: 0.9,
  after_food: 1.0,
  tea_coffee: 1.0,
  work: 1.0,
  other: 1.0,
  bathroom: 1.05,
  habit: 1.1,
  boredom: 1.15,
};

/** A 5/5 craving is asked for less than a 1/5. */
export const INTENSITY_MULTIPLIERS: Record<Intensity, number> = {
  1: 1.2,
  2: 1.1,
  3: 1.0,
  4: 0.85,
  5: 0.7,
};

export interface DelayInput {
  stats: BehaviorStats;
  trigger: Trigger;
  intensity: Intensity;
  /** Self-reported cigarettes per day at signup. */
  baselinePerDay: number;
  /** Current goal, if any. 0 means "stop completely". */
  targetPerDay?: number | null;
}

export interface DelayRecommendation {
  minutes: number;
  /** Every factor, kept for the eval harness, tests, and the "why" copy. */
  breakdown: {
    baselineIntervalMinutes: number;
    reductionFactor: number;
    startFraction: number;
    triggerMultiplier: number;
    intensityMultiplier: number;
    momentumMultiplier: number;
    rawMinutes: number;
  };
}

/**
 * How much longer the eventual gap between cigarettes needs to be to hit the
 * user's goal. Quitting entirely (target 0) would be an infinite gap, so it is
 * clamped: the algorithm's job is the next twenty minutes, not the last one.
 */
export function reductionFactor(baselinePerDay: number, targetPerDay?: number | null): number {
  if (baselinePerDay <= 0) return 1;
  if (targetPerDay === null || targetPerDay === undefined) return 1.2;
  const target = Math.max(targetPerDay, 1);
  return clamp(baselinePerDay / target, 1, 2);
}

/**
 * Rolling success over the last 5 cravings: ≥80% stretches the ask by 15%,
 * ≤20% shrinks it by 30%. Anything in between leaves it alone.
 */
export function momentumMultiplier(recentSuccessRate: number): number {
  if (recentSuccessRate >= 0.8) return 1.15;
  if (recentSuccessRate <= 0.2) return 0.7;
  return 1;
}

export function recommendDelay(input: DelayInput): DelayRecommendation {
  const { stats, trigger, intensity, baselinePerDay, targetPerDay } = input;

  const reduction = reductionFactor(baselinePerDay, targetPerDay);
  const triggerMultiplier = TRIGGER_MULTIPLIERS[trigger] ?? 1;
  const intensityMultiplier = INTENSITY_MULTIPLIERS[intensity];
  const momentum = momentumMultiplier(stats.recentSuccessRate);

  const rawMinutes =
    stats.baselineIntervalMinutes *
    reduction *
    START_FRACTION *
    triggerMultiplier *
    intensityMultiplier *
    momentum;

  return {
    minutes: roundAsk(clamp(rawMinutes, MIN_MINUTES, MAX_MINUTES)),
    breakdown: {
      baselineIntervalMinutes: stats.baselineIntervalMinutes,
      reductionFactor: reduction,
      startFraction: START_FRACTION,
      triggerMultiplier,
      intensityMultiplier,
      momentumMultiplier: momentum,
      rawMinutes,
    },
  };
}

/**
 * Round to something a person would say out loud. "Wait 7 minutes" reads as a
 * considered number; "wait 6.83 minutes" reads as a machine talking.
 */
function roundAsk(minutes: number): number {
  if (minutes < 10) return Math.max(MIN_MINUTES, Math.round(minutes));
  return Math.round(minutes / 5) * 5;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
