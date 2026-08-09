// src/features/cravings/delayAlgorithm.ts
//
// §8 — the adaptive delay algorithm, in full:
//
//   recommend = baselineInterval × reductionFactor × START_FRACTION
//               × triggerMultiplier × intensityMultiplier × momentumMultiplier
//
// The governing idea, and the reason every multiplier points the way it does:
// the ask has to be winnable. An ask the user abandons teaches them they can't
// do this; a small ask they win teaches them they can, and the next one can be
// bigger. So the hardest contexts get the *easiest* asks, not the sternest.

import type { BehaviorSummary, Intensity, Trigger, UserProfile } from '../../types';
import { FALLBACK_INTERVAL_MINUTES, MOMENTUM_WINDOW } from '../behavior/analysis.ts';

/**
 * §8 — the ask is a fraction of the eventual target gap, not the whole thing.
 * Asking a two-pack-a-day smoker to wait the full target interval on day one
 * is how apps get uninstalled.
 */
export const START_FRACTION = 0.15;

/** Never ask for less than this — below it there's no interval to ride out. */
export const MIN_MINUTES = 2;

/**
 * Never ask for more than this in one sitting, however good the history. Past
 * about three quarters of an hour the user has stopped "waiting" and started
 * "having decided", and the flow stops being the thing that got them there.
 */
export const MAX_MINUTES = 45;

/**
 * §8 — social and alcohol cravings get an easier ask than boredom and habit.
 * These are the contexts with the least room to manoeuvre (you can't leave the
 * table), so they should be the most winnable.
 */
export const TRIGGER_MULTIPLIERS: Record<Trigger, number> = {
  social: 0.75,
  alcohol: 0.8,
  stress: 0.85,
  anxiety: 0.85,
  after_food: 0.95,
  tea_coffee: 0.95,
  work: 1.0,
  break: 1.0,
  other: 1.0,
  boredom: 1.1,
  habit: 1.15,
};

/** §8 — a 5/5 craving is asked for less than a 1/5. */
export const INTENSITY_MULTIPLIERS: Record<Intensity, number> = {
  1: 1.2,
  2: 1.1,
  3: 1.0,
  4: 0.85,
  5: 0.7,
};

/**
 * §8 — a good run stretches the ask; a bad week makes the next ask *easier*,
 * not harder. This is the single most important sign in the whole formula.
 */
export function momentumMultiplier(successRate: number): number {
  if (successRate >= 0.8) return 1.15;
  if (successRate <= 0.2) return 0.7;
  return 1.0;
}

/**
 * How much longer the eventual target gap is than today's. Reducing from 20 a
 * day to 10 means gaps twice as long, so the factor is baseline ÷ target.
 *
 * Capped at 2.5 because a quit goal (target 0) is otherwise an infinite gap,
 * and multiplying by infinity produces an ask nobody can meet. A quitter's
 * ask still grows — through the baseline interval itself lengthening as they
 * smoke less, which is the honest way for it to move.
 */
export function reductionFactor(profile: UserProfile): number {
  const baseline = Math.max(1, profile.baselineCigarettesPerDay);
  if (profile.goalType === 'quit') return 2.5;
  const target = Math.max(1, profile.targetCigarettesPerDay);
  return clamp(baseline / target, 1, 2.5);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Waking hours in a day, for turning a per-day count into a gap. */
const WAKING_MINUTES = 16 * 60;

/**
 * The gap to assume before there's any measured history.
 *
 * §8 specifies a flat 90-minute fallback. This departs from that deliberately,
 * in service of §8's own stated reason for existing: a flat 90 minutes means a
 * forty-a-day smoker — who is actually smoking every twenty-odd minutes — is
 * asked to wait about half an hour on their first ever craving, which is the
 * "how apps get uninstalled" case the section is written to prevent.
 *
 * We aren't in fact starting from nothing: onboarding asks how many they smoke
 * on a usual day. Spreading that over waking hours gives a far better first
 * estimate than a constant, and it converges to the measured value within a
 * day or two of real logging anyway. The flat 90 remains for the case where
 * even the self-report is missing.
 */
export function estimatedIntervalMinutes(baselineCigarettesPerDay: number): number {
  if (!Number.isFinite(baselineCigarettesPerDay) || baselineCigarettesPerDay <= 0) {
    return FALLBACK_INTERVAL_MINUTES;
  }
  // Clamped: below 20 minutes the ask stops being a wait at all, and above
  // three hours a very light smoker would be asked for an implausible first go.
  return clamp(WAKING_MINUTES / baselineCigarettesPerDay, 20, 180);
}

export interface DelayRecommendation {
  /** What to put on the button, in whole minutes. */
  minutes: number;
  /** Every factor, kept so the "why this long?" panel can be honest (§31). */
  breakdown: {
    baselineIntervalMinutes: number;
    measuredBaseline: boolean;
    reductionFactor: number;
    startFraction: number;
    triggerMultiplier: number;
    intensityMultiplier: number;
    momentumMultiplier: number;
    /** Before clamping — shown when clamping actually bit. */
    rawMinutes: number;
    clamped: boolean;
  };
}

export function recommendDelay(params: {
  profile: UserProfile;
  behavior: BehaviorSummary;
  trigger: Trigger;
  intensity: Intensity;
}): DelayRecommendation {
  const { profile, behavior, trigger, intensity } = params;

  const baseline = behavior.hasIntervalHistory
    ? behavior.baselineIntervalMinutes
    : estimatedIntervalMinutes(profile.baselineCigarettesPerDay);
  const reduction = reductionFactor(profile);
  const triggerMul = TRIGGER_MULTIPLIERS[trigger] ?? 1;
  const intensityMul = INTENSITY_MULTIPLIERS[intensity] ?? 1;
  const momentumMul = momentumMultiplier(behavior.recentSuccessRate);

  const raw = baseline * reduction * START_FRACTION * triggerMul * intensityMul * momentumMul;
  const minutes = Math.round(clamp(raw, MIN_MINUTES, MAX_MINUTES));

  return {
    minutes,
    breakdown: {
      baselineIntervalMinutes: baseline,
      measuredBaseline: behavior.hasIntervalHistory,
      reductionFactor: reduction,
      startFraction: START_FRACTION,
      triggerMultiplier: triggerMul,
      intensityMultiplier: intensityMul,
      momentumMultiplier: momentumMul,
      rawMinutes: raw,
      clamped: raw < MIN_MINUTES || raw > MAX_MINUTES,
    },
  };
}

/**
 * Plain-language reasons for the "why this long?" panel. Returned as
 * pre-composed English sentences rather than translation keys because each one
 * is conditional on the numbers — the panel is explicitly an English-first
 * surface until the hi/bn coaching bar is met (see the plan's pushback note).
 */
export function explainRecommendation(rec: DelayRecommendation): string[] {
  const b = rec.breakdown;
  const lines: string[] = [];

  lines.push(
    b.measuredBaseline
      ? `Your gaps between cigarettes have averaged about ${Math.round(
          b.baselineIntervalMinutes
        )} minutes over the last two weeks.`
      : `There isn't enough history yet, so this starts from the ${Math.round(
          b.baselineIntervalMinutes
        )}-minute gap your usual day works out at.`
  );

  lines.push(
    `The ask is a fraction of your eventual target gap, not the whole thing — small enough to win.`
  );

  if (b.triggerMultiplier < 1) {
    lines.push(`This trigger is one of the harder ones, so the ask is shorter than usual.`);
  } else if (b.triggerMultiplier > 1) {
    lines.push(`This one usually has more give in it, so the ask is a little longer.`);
  }

  if (b.intensityMultiplier < 1) {
    lines.push(`You said it's strong right now, so you're being asked for less.`);
  } else if (b.intensityMultiplier > 1) {
    lines.push(`It's mild right now, which is the easiest time to stretch a little.`);
  }

  if (b.momentumMultiplier > 1) {
    lines.push(
      `You've waited out most of your last ${MOMENTUM_WINDOW} cravings, so this one stretches a bit further.`
    );
  } else if (b.momentumMultiplier < 1) {
    lines.push(`The last few have been hard, so this ask is smaller than it would otherwise be.`);
  }

  if (b.clamped) {
    lines.push(`Kept within ${MIN_MINUTES}–${MAX_MINUTES} minutes, whatever the maths says.`);
  }

  return lines;
}
