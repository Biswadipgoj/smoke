// src/features/rewards/horizon.ts
// ─────────────────────────────────────────────────────────────────────────────
// The horizon/tree *is* the progression system (§13). There are no points, no
// coins and no separate meter, so this file is the entire gamification layer.
//
// It advances only on things the user actually did:
//   · a craving they let pass
//   · a day genuinely under their baseline
// It never advances for opening the app, and it never moves backwards — a
// harder week stalls progress rather than taking anything away (§1).
// ─────────────────────────────────────────────────────────────────────────────

export type TreeStage = 1 | 2 | 3 | 4;

export interface HorizonState {
  /** 0 = full haze, 1 = fully cleared. Drives the background gradient. */
  clearness: number;
  stage: TreeStage;
  points: number;
  /** Points still needed for the next stage; 0 at full canopy. */
  toNextStage: number;
}

/** A day under baseline is worth more than one craving — it is a whole day. */
const POINTS_PER_DELAYED_CRAVING = 1;
const POINTS_PER_DAY_UNDER_BASELINE = 2;

const STAGE_THRESHOLDS: Record<TreeStage, number> = { 1: 0, 2: 6, 3: 18, 4: 40 };

export function horizonState(delayedCravings: number, daysUnderBaseline: number): HorizonState {
  const points =
    delayedCravings * POINTS_PER_DELAYED_CRAVING +
    daysUnderBaseline * POINTS_PER_DAY_UNDER_BASELINE;

  const stage: TreeStage =
    points >= STAGE_THRESHOLDS[4] ? 4 : points >= STAGE_THRESHOLDS[3] ? 3 : points >= STAGE_THRESHOLDS[2] ? 2 : 1;

  const nextThreshold = stage === 4 ? STAGE_THRESHOLDS[4] : STAGE_THRESHOLDS[(stage + 1) as TreeStage];

  return {
    clearness: Math.min(1, points / STAGE_THRESHOLDS[4]),
    stage,
    points,
    toNextStage: stage === 4 ? 0 : nextThreshold - points,
  };
}
