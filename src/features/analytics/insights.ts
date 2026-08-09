// src/features/analytics/insights.ts
// ─────────────────────────────────────────────────────────────────────────────
// Insight/Motivation Engine (§14). Turns deltas into sentences, never raw
// numbers on their own.
//
// The rule that shapes everything here: it compares a metric across two recent
// windows and only speaks when there is a genuine improvement. It is
// deliberately *silent* on an uptick rather than narrating a decline — a
// harder week is exactly when a paragraph about your decline does damage, and
// the user can already see the chart. Consistent with the no-shame rule (§1).
// ─────────────────────────────────────────────────────────────────────────────

import type { TFunction, TranslationKey } from '../../i18n';
import type { BehaviorStats, CigaretteLog, CravingLog, InterventionId } from '../../types';
import { DAY_MS } from '../../utils/format';
import { money } from '../../utils/format';

export interface Insight {
  id: string;
  text: string;
  /** 'growth' insights are wins; 'neutral' ones are observations worth acting on. */
  tone: 'growth' | 'neutral';
}

/** Below this, a change is noise from a couple of unusual days, not a trend. */
const MEANINGFUL_DROP = 0.1;

const PART_KEYS: Array<{ key: TranslationKey; from: number; to: number }> = [
  { key: 'partMorning', from: 5, to: 12 },
  { key: 'partAfternoon', from: 12, to: 17 },
  { key: 'partEvening', from: 17, to: 22 },
  { key: 'partNight', from: 22, to: 5 },
];

export interface InsightInput {
  stats: BehaviorStats;
  cigarettes: CigaretteLog[];
  cravings: CravingLog[];
  totalSaved: number;
  currency: string;
  interventionLabel: (id: InterventionId) => string;
  triggerLabel: (trigger: BehaviorStats['triggerFrequency'][number]['trigger']) => string;
}

export function generateInsights(input: InsightInput, t: TFunction): Insight[] {
  const { stats, cigarettes, cravings, totalSaved, currency } = input;
  const insights: Insight[] = [];

  // 1. Overall daily average, this week vs. the week before.
  if (stats.priorDailyAverage > 0) {
    const drop = (stats.priorDailyAverage - stats.recentDailyAverage) / stats.priorDailyAverage;
    if (drop >= MEANINGFUL_DROP) {
      insights.push({
        id: 'daily-drop',
        tone: 'growth',
        text: t('insightDailyDrop', { percent: Math.round(drop * 100) }),
      });
    }
  }

  // 2. The same comparison per part of day — this is usually where a real
  //    change first shows up, before the daily total moves at all.
  const partDrop = biggestPartOfDayDrop(cigarettes);
  if (partDrop && partDrop.drop >= MEANINGFUL_DROP) {
    insights.push({
      id: `part-drop-${partDrop.key}`,
      tone: 'growth',
      text: t('insightPartOfDayDrop', {
        part: t(partDrop.key),
        percent: Math.round(partDrop.drop * 100),
      }),
    });
  }

  // 3. Cravings that went by, with the minutes attached — the minutes are the
  //    point, because that is the thing the user actually did.
  const delayed = cravings.filter((c) => c.outcome === 'delayed');
  if (delayed.length >= 3) {
    const minutes = Math.round(delayed.reduce((sum, c) => sum + c.actualDelayMinutes, 0));
    insights.push({
      id: 'delayed-total',
      tone: 'growth',
      text: t('insightDelayed', { count: delayed.length, minutes }),
    });
  }

  // 4. Money, only once it is a number worth saying out loud.
  if (totalSaved >= 50) {
    insights.push({
      id: 'money',
      tone: 'growth',
      text: t('insightMoney', { amount: money(totalSaved, currency) }),
    });
  }

  // 5. What has worked. Needs enough uses to be a pattern rather than luck.
  const best = stats.effectiveInterventions.find((e) => e.uses >= 3 && e.successRate >= 0.5);
  if (best) {
    insights.push({
      id: `intervention-${best.intervention}`,
      tone: 'growth',
      text: t('insightIntervention', {
        intervention: input.interventionLabel(best.intervention),
        percent: Math.round(best.successRate * 100),
      }),
    });
  }

  // 6. The dominant trigger. Neutral rather than celebratory: it is a thing to
  //    plan around, and naming it is useful even in a bad week.
  const top = stats.triggerFrequency[0];
  if (top && top.count >= 5) {
    insights.push({
      id: `trigger-${top.trigger}`,
      tone: 'neutral',
      text: t('insightTrigger', { trigger: input.triggerLabel(top.trigger) }),
    });
  }

  // 7. Spacing — the metric that moves before the daily count does.
  if (stats.baselineIntervalMinutes > 0 && stats.totalCravings >= 3) {
    insights.push({
      id: 'spacing',
      tone: 'neutral',
      text: t('insightSpacing', { minutes: stats.baselineIntervalMinutes }),
    });
  }

  return insights;
}

/**
 * Compares each part of the day across two 14-day windows and returns the part
 * with the largest genuine drop, or null if nothing moved enough to say.
 */
export function biggestPartOfDayDrop(
  cigarettes: CigaretteLog[],
  now = Date.now()
): { key: TranslationKey; drop: number } | null {
  const recentFrom = now - 14 * DAY_MS;
  const priorFrom = now - 28 * DAY_MS;

  let best: { key: TranslationKey; drop: number } | null = null;

  for (const part of PART_KEYS) {
    const inPart = (ms: number) => {
      const hour = new Date(ms).getHours();
      return part.from < part.to
        ? hour >= part.from && hour < part.to
        : hour >= part.from || hour < part.to;
    };
    const recent = cigarettes
      .filter((c) => c.timestampMs >= recentFrom && inPart(c.timestampMs))
      .reduce((n, c) => n + c.count, 0);
    const prior = cigarettes
      .filter((c) => c.timestampMs >= priorFrom && c.timestampMs < recentFrom && inPart(c.timestampMs))
      .reduce((n, c) => n + c.count, 0);

    // Needs a real prior baseline — a drop from 2 to 1 is not a story.
    if (prior < 5) continue;
    const drop = (prior - recent) / prior;
    if (drop > 0 && (!best || drop > best.drop)) best = { key: part.key, drop };
  }

  return best;
}
