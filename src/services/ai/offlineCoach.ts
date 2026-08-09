// src/services/ai/offlineCoach.ts
//
// §3-6 — the rule-based language layer. This is the *real* fallback, not a
// demo standing in for "the AI will handle it later". An intervention tool
// that stops working when the signal drops has failed at the exact moment it
// was built for, so every path through the craving flow and the coach tab has
// an answer that needs no network at all.
//
// It reads the same behavioural summary the model gets, and it never says
// anything the safety layer would strip.

import type { TranslateFn, TranslationKey } from '../../i18n';
import type { BehaviorSummary, CoachMessage, UserProfile } from '../../types';
import { newId } from '../db/localDb';

type Intent = 'craving' | 'smoked' | 'win' | 'why' | 'low' | 'general';

/**
 * Cheap intent detection. Keyword-based on purpose — this runs offline, in
 * milliseconds, on a phone, and the cost of guessing wrong is one slightly
 * generic reply.
 */
function classify(input: string): Intent {
  const text = input.toLowerCase();
  if (/\b(craving|urge|want one|need one|dying for)\b/.test(text) || /तलब|টান/.test(input)) {
    return 'craving';
  }
  if (/\b(smoked|had one|gave in|caved|lit)\b/.test(text) || /पी ली|খেয়ে/.test(input)) {
    return 'smoked';
  }
  if (/\b(made it|resisted|didn'?t smoke|waited|held out|proud)\b/.test(text)) return 'win';
  if (/\b(why|how does|how do|what happens|explain)\b/.test(text) || /क्यों|কেন/.test(input)) {
    return 'why';
  }
  if (/\b(hard|struggling|awful|terrible|can'?t do this|giving up|hopeless)\b/.test(text)) {
    return 'low';
  }
  return 'general';
}

const INTENT_KEYS: Record<Intent, TranslationKey> = {
  craving: 'offline.craving',
  smoked: 'offline.smoked',
  win: 'offline.win',
  why: 'offline.why',
  low: 'offline.low',
  general: 'offline.general',
};

export function offlineReply(params: {
  input: string;
  behavior: BehaviorSummary;
  t: TranslateFn;
}): string {
  const { input, behavior, t } = params;
  const intent = classify(input);
  const base = t(INTENT_KEYS[intent]);

  // One data-grounded sentence when there's data worth grounding it in.
  // Without history it stays silent rather than making something up (§5).
  const top = behavior.triggerFrequency[0];
  if (intent === 'craving' && top && top.count >= 3) {
    return `${base} ${t('offline.triggerNote', {
      trigger: t(`trigger.${top.trigger}` as TranslationKey).toLowerCase(),
    })}`;
  }
  if (intent === 'why' && behavior.hasIntervalHistory) {
    return `${base} ${t('offline.intervalNote', {
      n: Math.round(behavior.baselineIntervalMinutes),
    })}`;
  }
  return base;
}

export function offlineMessage(params: {
  input: string;
  behavior: BehaviorSummary;
  t: TranslateFn;
}): CoachMessage {
  return {
    id: newId(),
    role: 'coach',
    text: offlineReply(params),
    createdAtMs: Date.now(),
    offline: true,
  };
}

/**
 * §9 — the dashboard's AI message card. Picked deterministically from state
 * rather than at random, so the card doesn't churn between two renders of the
 * same day.
 */
export function dashboardMessage(params: {
  behavior: BehaviorSummary;
  profile: UserProfile;
  todayCigarettes: number;
  minutesSinceLast: number | null;
  t: TranslateFn;
}): string {
  const { behavior, profile, todayCigarettes, minutesSinceLast, t } = params;

  if (behavior.resolvedCravingCount === 0 && todayCigarettes === 0) {
    return t('coachCard.start');
  }
  if (minutesSinceLast !== null && minutesSinceLast > behavior.baselineIntervalMinutes * 1.5) {
    return t('coachCard.longGap', { n: Math.round(minutesSinceLast / 60) });
  }
  if (behavior.recentSuccessRate >= 0.8 && behavior.resolvedCravingCount >= 3) {
    return t('coachCard.momentum');
  }
  if (behavior.recentSuccessRate <= 0.2 && behavior.resolvedCravingCount >= 3) {
    // §8 — a bad run makes the next ask easier. Say so plainly; the worst thing
    // to do here is go quiet and let the user fill the silence themselves.
    return t('coachCard.easier');
  }
  if (todayCigarettes > 0 && todayCigarettes < profile.baselineCigarettesPerDay) {
    return t('coachCard.underBaseline');
  }
  const top = behavior.triggerFrequency[0];
  if (top && top.count >= 3) {
    return t('coachCard.trigger', {
      trigger: t(`trigger.${top.trigger}` as TranslationKey).toLowerCase(),
    });
  }
  return t('coachCard.neutral');
}
