// src/services/ai/offlineCoach.ts
// ─────────────────────────────────────────────────────────────────────────────
// The coach with the network taken away (§3-6, §20).
//
// This is not an error state dressed up as a feature. An intervention tool for
// a craving that is happening *right now* has to work on a train, in a
// basement, on a dead prepaid balance. So when the model is unreachable, the
// coach answers from the same rule engines the rest of the app runs on:
// classify what the user is asking, answer from the trigger/intervention map,
// and use the user's own numbers.
// ─────────────────────────────────────────────────────────────────────────────

import type { TFunction } from '../../i18n';
import type { BehaviorStats, Intensity, Trigger } from '../../types';
import { chooseIntervention, interventionCopy } from '../../features/cravings/interventionEngine';
import { recommendDelay } from '../../features/cravings/delayAlgorithm';

type Intent = 'craving' | 'smoked' | 'why' | 'general';

/**
 * Keyword classification across all three languages. Crude on purpose — the
 * cost of misreading "I just smoked" as a general question is one slightly
 * off-target paragraph, and the alternative is shipping nothing offline.
 */
const INTENT_PATTERNS: Array<{ intent: Intent; pattern: RegExp }> = [
  {
    intent: 'smoked',
    pattern:
      /\b(i (just )?(smoked|had one|caved|gave in)|smoked one)\b|(पी ली|पी लिया|सिगरेट पी)|(খেয়ে ফেলেছি|খেয়েছি)/i,
  },
  {
    intent: 'craving',
    pattern:
      /\b(craving|urge|want (a|to) (cigarette|smoke)|need a (smoke|cigarette)|dying for)\b|(तलब|मन कर रहा|पीने का मन)|(ইচ্ছে করছে|আকাঙ্ক্ষা|খেতে ইচ্ছে)/i,
  },
  {
    intent: 'why',
    pattern: /\b(why|how (does|do)|what happens|explain)\b|(क्यों|कैसे होता)|(কেন|কীভাবে)/i,
  },
];

export interface OfflineCoachInput {
  message: string;
  stats: BehaviorStats;
  baselinePerDay: number;
  targetPerDay: number | null;
  /** Most frequent trigger, used when the message doesn't name one. */
  likelyTrigger: Trigger;
}

export function classifyIntent(message: string): Intent {
  for (const entry of INTENT_PATTERNS) {
    if (entry.pattern.test(message)) return entry.intent;
  }
  return 'general';
}

export function offlineReply(input: OfflineCoachInput, t: TFunction): string {
  const intent = classifyIntent(input.message);

  switch (intent) {
    case 'craving': {
      // Assume a strong craving when someone stops to type about it.
      const intensity: Intensity = 4;
      const { minutes } = recommendDelay({
        stats: input.stats,
        trigger: input.likelyTrigger,
        intensity,
        baselinePerDay: input.baselinePerDay,
        targetPerDay: input.targetPerDay,
      });
      const choice = chooseIntervention(input.likelyTrigger, intensity, input.stats);
      const copy = interventionCopy(choice.intervention, t);
      return t('ocCraving', { minutes, action: copy.title, how: copy.body });
    }
    case 'smoked':
      return t('ocSmoked');
    case 'why':
      return t('ocWhy');
    default:
      return t('ocDefault');
  }
}
