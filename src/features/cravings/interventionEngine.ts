// src/features/cravings/interventionEngine.ts
// ─────────────────────────────────────────────────────────────────────────────
// Craving Intervention Engine (§3-6): a rule-based trigger → intervention map,
// personalised by what has actually worked for this user.
//
// This is not a placeholder waiting for the model to take over. It runs with
// zero network calls and is what the craving screen uses every time; the AI
// Coach adds language on top of this decision, it does not replace it.
// ─────────────────────────────────────────────────────────────────────────────

import type { BehaviorStats, Intensity, InterventionId, Trigger } from '../../types';
import type { TFunction, TranslationKey } from '../../i18n';

/**
 * Ordered candidates per trigger, most apt first. The reasoning behind each
 * is short and worth keeping: an intervention has to answer the *shape* of the
 * craving, not just fill time.
 */
const BY_TRIGGER: Record<Trigger, InterventionId[]> = {
  // Physiological arousal — the breath is the only thing that touches it fast.
  stress: ['breathe', 'walk', 'step_outside', 'write_it_down'],
  anxiety: ['breathe', 'hands', 'walk', 'call_someone'],
  // Nothing to do is the whole problem — give the hands and the body a job.
  boredom: ['hands', 'walk', 'call_someone', 'water'],
  habit: ['hands', 'water', 'delay_timer', 'brush_teeth'],
  // Taste-linked cues: change what the mouth is doing.
  after_food: ['brush_teeth', 'walk', 'water', 'hands'],
  tea_coffee: ['water', 'walk', 'hands', 'delay_timer'],
  // Context cues: change the room.
  work: ['step_outside', 'walk', 'breathe', 'water'],
  bathroom: ['water', 'delay_timer', 'hands', 'brush_teeth'],
  // Social settings are the hardest to leave, so the ask is small and portable.
  social: ['hands', 'water', 'delay_timer', 'step_outside'],
  alcohol: ['water', 'hands', 'delay_timer', 'step_outside'],
  other: ['delay_timer', 'breathe', 'water', 'walk'],
};

/** At 4-5/5 the body is loud; slow, physical options beat cognitive ones. */
const HIGH_INTENSITY_PREFERENCE: InterventionId[] = ['breathe', 'water', 'walk', 'step_outside'];

export interface InterventionChoice {
  intervention: InterventionId;
  /** Alternatives, in case the recommended one is impossible right now. */
  alternatives: InterventionId[];
  /** True when the choice came from this user's own success history. */
  personalised: boolean;
}

export function chooseIntervention(
  trigger: Trigger,
  intensity: Intensity,
  stats: BehaviorStats
): InterventionChoice {
  const candidates = [...(BY_TRIGGER[trigger] ?? BY_TRIGGER.other)];

  if (intensity >= 4) {
    candidates.sort((a, b) => rank(HIGH_INTENSITY_PREFERENCE, a) - rank(HIGH_INTENSITY_PREFERENCE, b));
  }

  // Personalisation only kicks in once there is enough evidence to mean
  // something: three uses and a better-than-even record. Below that, the
  // trigger map's reasoning beats a two-sample average.
  const proven = stats.effectiveInterventions.find(
    (entry) => entry.uses >= 3 && entry.successRate >= 0.6 && candidates.includes(entry.intervention)
  );

  const intervention = proven?.intervention ?? candidates[0];
  return {
    intervention,
    alternatives: candidates.filter((id) => id !== intervention).slice(0, 3),
    personalised: Boolean(proven),
  };
}

function rank(order: InterventionId[], id: InterventionId): number {
  const index = order.indexOf(id);
  return index === -1 ? order.length : index;
}

const LABEL_KEYS: Record<InterventionId, { title: TranslationKey; body: TranslationKey }> = {
  breathe: { title: 'intBreathe', body: 'intBreatheBody' },
  water: { title: 'intWater', body: 'intWaterBody' },
  walk: { title: 'intWalk', body: 'intWalkBody' },
  hands: { title: 'intHands', body: 'intHandsBody' },
  delay_timer: { title: 'intDelayTimer', body: 'intDelayTimerBody' },
  call_someone: { title: 'intCallSomeone', body: 'intCallSomeoneBody' },
  brush_teeth: { title: 'intBrushTeeth', body: 'intBrushTeethBody' },
  step_outside: { title: 'intStepOutside', body: 'intStepOutsideBody' },
  write_it_down: { title: 'intWriteItDown', body: 'intWriteItDownBody' },
};

export function interventionCopy(
  id: InterventionId,
  t: TFunction
): { title: string; body: string } {
  const keys = LABEL_KEYS[id];
  return { title: t(keys.title), body: t(keys.body) };
}

const TRIGGER_KEYS: Record<Trigger, TranslationKey> = {
  stress: 'triggerStress',
  boredom: 'triggerBoredom',
  after_food: 'triggerAfterFood',
  tea_coffee: 'triggerTeaCoffee',
  work: 'triggerWork',
  social: 'triggerSocial',
  habit: 'triggerHabit',
  anxiety: 'triggerAnxiety',
  alcohol: 'triggerAlcohol',
  bathroom: 'triggerBathroom',
  other: 'triggerOther',
};

export function triggerLabel(trigger: Trigger, t: TFunction): string {
  return t(TRIGGER_KEYS[trigger]);
}
