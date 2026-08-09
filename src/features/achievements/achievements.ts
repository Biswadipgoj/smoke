// src/features/achievements/achievements.ts
// ─────────────────────────────────────────────────────────────────────────────
// Milestones tied to real behaviour (§15, §13). Every condition below is a
// thing the user did — never "opened the app N days in a row", which rewards
// the app rather than the change.
// ─────────────────────────────────────────────────────────────────────────────

import type { TranslationKey } from '../../i18n';

export interface AchievementContext {
  totalLogged: number;
  totalDelayed: number;
  daysUnderBaseline: number;
  longestUnderBaselineRun: number;
  zeroDays: number;
  moneySaved: number;
  currency: string;
}

export interface Achievement {
  id: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  earned: boolean;
  /** Optional interpolation values for the title (e.g. a money amount). */
  vars?: Record<string, string | number>;
}

/** The money milestone is deliberately a round local number, not a dollar figure. */
const MONEY_MILESTONE = 500;

export function evaluateAchievements(ctx: AchievementContext): Achievement[] {
  return [
    {
      id: 'first-log',
      titleKey: 'achFirstLog',
      bodyKey: 'achFirstLogBody',
      earned: ctx.totalLogged >= 1,
    },
    {
      id: 'first-delay',
      titleKey: 'achFirstDelay',
      bodyKey: 'achFirstDelayBody',
      earned: ctx.totalDelayed >= 1,
    },
    {
      id: 'five-delays',
      titleKey: 'achFiveDelays',
      bodyKey: 'achFiveDelaysBody',
      earned: ctx.totalDelayed >= 5,
    },
    {
      id: 'twenty-delays',
      titleKey: 'achTwentyDelays',
      bodyKey: 'achTwentyDelaysBody',
      earned: ctx.totalDelayed >= 20,
    },
    {
      id: 'under-baseline',
      titleKey: 'achUnderBaseline',
      bodyKey: 'achUnderBaselineBody',
      earned: ctx.daysUnderBaseline >= 1,
    },
    {
      id: 'week-under',
      titleKey: 'achWeekUnder',
      bodyKey: 'achWeekUnderBody',
      earned: ctx.longestUnderBaselineRun >= 7,
    },
    {
      id: 'zero-day',
      titleKey: 'achSmokeFreeDay',
      bodyKey: 'achSmokeFreeDayBody',
      earned: ctx.zeroDays >= 1,
    },
    {
      id: 'money-back',
      titleKey: 'achMoneyBack',
      bodyKey: 'achMoneyBackBody',
      earned: ctx.moneySaved >= MONEY_MILESTONE,
      vars: { amount: `${ctx.currency}${MONEY_MILESTONE}` },
    },
  ];
}

/**
 * Days below baseline, the longest consecutive run of them, and days with
 * nothing logged at all — computed from the same daily-count series the
 * calendar and charts use, so the three can never disagree.
 *
 * Today is excluded: a day is only "under baseline" once it is over.
 */
export function summariseDays(
  counts: Array<{ dayMs: number; count: number }>,
  baselinePerDay: number,
  todayMs: number
): { daysUnderBaseline: number; longestUnderBaselineRun: number; zeroDays: number } {
  let daysUnderBaseline = 0;
  let longestUnderBaselineRun = 0;
  let currentRun = 0;
  let zeroDays = 0;

  for (const day of counts) {
    if (day.dayMs >= todayMs) continue;
    if (day.count < baselinePerDay) {
      daysUnderBaseline += 1;
      currentRun += 1;
      longestUnderBaselineRun = Math.max(longestUnderBaselineRun, currentRun);
    } else {
      currentRun = 0;
    }
    if (day.count === 0) zeroDays += 1;
  }

  return { daysUnderBaseline, longestUnderBaselineRun, zeroDays };
}
