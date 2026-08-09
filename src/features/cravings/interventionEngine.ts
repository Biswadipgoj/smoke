// src/features/cravings/interventionEngine.ts
//
// §3-6 Craving Intervention Engine — a rule-based trigger→intervention map.
//
// This is not a placeholder waiting for the model to take over. It is the
// layer that has to work when there's no signal, in the thirty seconds when it
// matters, so it is deterministic, offline, and instant. The AI Coach is a
// language layer *over* this, never a replacement for it.

import type { BehaviorSummary, Intensity, Trigger } from '../../types';
import type { TranslationKey } from '../../i18n';

export type InterventionKind = 'breathing' | 'movement' | 'sensory' | 'social' | 'reframe';

export interface Intervention {
  id: string;
  kind: InterventionKind;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  /** Rough time the action itself takes; the delay timer is separate. */
  actionSeconds: number;
}

export const INTERVENTIONS: Intervention[] = [
  {
    id: 'box_breath',
    kind: 'breathing',
    titleKey: 'intervention.box_breath.title',
    bodyKey: 'intervention.box_breath.body',
    actionSeconds: 60,
  },
  {
    id: 'water',
    kind: 'sensory',
    titleKey: 'intervention.water.title',
    bodyKey: 'intervention.water.body',
    actionSeconds: 45,
  },
  {
    id: 'walk',
    kind: 'movement',
    titleKey: 'intervention.walk.title',
    bodyKey: 'intervention.walk.body',
    actionSeconds: 180,
  },
  {
    id: 'hands',
    kind: 'sensory',
    titleKey: 'intervention.hands.title',
    bodyKey: 'intervention.hands.body',
    actionSeconds: 90,
  },
  {
    id: 'step_out',
    kind: 'movement',
    titleKey: 'intervention.step_out.title',
    bodyKey: 'intervention.step_out.body',
    actionSeconds: 120,
  },
  {
    id: 'name_it',
    kind: 'reframe',
    titleKey: 'intervention.name_it.title',
    bodyKey: 'intervention.name_it.body',
    actionSeconds: 60,
  },
  {
    id: 'cold',
    kind: 'sensory',
    titleKey: 'intervention.cold.title',
    bodyKey: 'intervention.cold.body',
    actionSeconds: 45,
  },
  {
    id: 'message',
    kind: 'social',
    titleKey: 'intervention.message.title',
    bodyKey: 'intervention.message.body',
    actionSeconds: 120,
  },
];

const BY_ID = new Map(INTERVENTIONS.map((i) => [i.id, i]));

export function getIntervention(id: string): Intervention {
  return BY_ID.get(id) ?? INTERVENTIONS[0];
}

/**
 * Candidates per trigger, best-fit first. Every trigger has at least three so
 * a user who dislikes one is never cornered into it.
 */
const TRIGGER_MAP: Record<Trigger, string[]> = {
  stress: ['box_breath', 'walk', 'cold', 'name_it'],
  anxiety: ['box_breath', 'name_it', 'cold', 'message'],
  boredom: ['walk', 'message', 'hands', 'name_it'],
  habit: ['hands', 'name_it', 'water', 'walk'],
  after_food: ['water', 'walk', 'hands'],
  tea_coffee: ['water', 'hands', 'walk'],
  work: ['walk', 'box_breath', 'water'],
  social: ['step_out', 'water', 'box_breath'],
  alcohol: ['water', 'step_out', 'cold'],
  break: ['walk', 'box_breath', 'hands'],
  other: ['box_breath', 'walk', 'name_it'],
};

/**
 * A craving at 5/5 is not a moment for a reframe — the body is loud and the
 * answer has to be physical. These get promoted to the front at high intensity.
 */
const HIGH_INTENSITY_PREFERRED: InterventionKind[] = ['sensory', 'breathing', 'movement'];

export function selectIntervention(params: {
  trigger: Trigger;
  intensity: Intensity;
  behavior: BehaviorSummary;
  /** Ids offered in the last few cravings, most recent first. */
  recentlyOffered?: string[];
}): Intervention {
  const { trigger, intensity, behavior, recentlyOffered = [] } = params;

  let candidates = (TRIGGER_MAP[trigger] ?? TRIGGER_MAP.other).map(getIntervention);

  if (intensity >= 4) {
    candidates = [
      ...candidates.filter((c) => HIGH_INTENSITY_PREFERRED.includes(c.kind)),
      ...candidates.filter((c) => !HIGH_INTENSITY_PREFERRED.includes(c.kind)),
    ];
  }

  // What has actually worked for this person outranks what the table thinks
  // should work — but only once there's enough of a sample to mean anything.
  const effectiveness = new Map(
    behavior.interventionEffectiveness
      .filter((e) => e.uses >= 3)
      .map((e) => [e.interventionId, e.rate])
  );

  const scored = candidates.map((intervention, index) => {
    // Table order is the prior; measured effectiveness nudges it.
    let score = candidates.length - index;
    const rate = effectiveness.get(intervention.id);
    if (rate !== undefined) score += (rate - 0.5) * 6;
    // Don't offer the same thing twice running — variety is part of why this
    // keeps working past week one.
    const recency = recentlyOffered.indexOf(intervention.id);
    if (recency === 0) score -= 4;
    else if (recency === 1) score -= 1.5;
    return { intervention, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].intervention;
}

/** The other things worth trying, for the "something else" affordance. */
export function alternativesFor(trigger: Trigger, chosenId: string): Intervention[] {
  return (TRIGGER_MAP[trigger] ?? TRIGGER_MAP.other)
    .filter((id) => id !== chosenId)
    .map(getIntervention);
}
