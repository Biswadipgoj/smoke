// src/lib/offlineCoach.ts
// The Offline Coach — master doc §14, doc 02 §7. A curated, scripted
// decision-tree library. Fully offline, no model in the loop. This is a
// starting set (roughly a dozen authored paths); doc 02 §7 calls for ~40
// across the three tracks by the end of Phase 1 — extend this list rather
// than replacing its shape.
import { TrackType } from '../domain/types';

export type CoachCategory = 'urge' | 'halt' | 'lapse' | 'delay';

export interface CoachPath {
  id: string;
  category: CoachCategory;
  track: TrackType | 'any';
  title: string;
  steps: string[];
}

export const OFFLINE_COACH_PATHS: CoachPath[] = [
  {
    id: 'urge-any-1', category: 'urge', track: 'any', title: 'Name what’s happening',
    steps: [
      'This feeling has a name: an urge. It rises, it peaks, and it falls — usually within twenty minutes.',
      'You don’t have to fight it or win against it. You just have to still be here when it passes.',
      'Try the full urge flow if you want the Tide to show you where you are in the wave.',
    ],
  },
  {
    id: 'urge-tobacco-1', category: 'urge', track: 'tobacco', title: 'The first pull is the loudest',
    steps: [
      'The urge is loudest in the first sixty seconds. It doesn’t stay this loud.',
      'Put something else in your hand — water, a pen, your phone turned face-down.',
      'If you can, change location for two minutes. A different room, a balcony, a doorway.',
    ],
  },
  {
    id: 'urge-alcohol-1', category: 'urge', track: 'alcohol', title: 'Delay the first sip',
    steps: [
      'Pour a glass of water or something cold and drink it slowly first.',
      'Set a mental line: fifteen minutes before you decide anything.',
      'If people around you are drinking, it’s fine to hold a drink you’re not finishing.',
    ],
  },
  {
    id: 'urge-porn-1', category: 'urge', track: 'porn', title: 'Change the room, not just the mind',
    steps: [
      'If you can, physically leave the room you’re in. The urge is partly tied to the place.',
      'Put the phone somewhere you’d have to stand up to reach.',
      'Text or call one person — doesn’t matter who, doesn’t matter what about.',
    ],
  },
  {
    id: 'halt-hungry', category: 'halt', track: 'any', title: 'Hungry',
    steps: ['Low blood sugar reads in the body a lot like craving.', 'Eat something now, even something small.', 'Re-check the urge in ten minutes — it often isn’t the same one.'],
  },
  {
    id: 'halt-angry', category: 'halt', track: 'any', title: 'Angry',
    steps: ['Anger looks for the fastest exit, and the habit is often it.', 'Name what you’re angry about, out loud or in a note, before doing anything else.', 'Move your body for two minutes — the anger needs somewhere to go.'],
  },
  {
    id: 'halt-lonely', category: 'halt', track: 'any', title: 'Lonely',
    steps: ['Loneliness and craving live very close together.', 'Message one real person, even just “thinking of you.”', 'You don’t need a reason to reach out.'],
  },
  {
    id: 'halt-tired', category: 'halt', track: 'any', title: 'Tired',
    steps: ['Willpower runs on the same tank as sleep. Low tank, harder fight.', 'If you can rest for ten minutes, do that before deciding anything.', 'Tomorrow, this exact moment will be easier.'],
  },
  {
    id: 'lapse-grounding-1', category: 'lapse', track: 'any', title: 'Right after',
    steps: ['Okay. That happened.', 'You don’t need to decide anything else tonight.', 'Drink some water, and get to bed if you can. Tomorrow is a normal day, not a probation.'],
  },
  {
    id: 'lapse-grounding-2', category: 'lapse', track: 'any', title: 'What was going on',
    steps: ['No judgment — just curiosity. What was happening right before?', 'Was it a place, a person, a feeling, a time of day?', 'Write it down if you want. It’s information for next time, not evidence against you.'],
  },
  {
    id: 'delay-physical', category: 'delay', track: 'any', title: 'Reset your body',
    steps: ['Drink a full glass of water, slowly.', 'Stand and stretch your arms overhead for twenty seconds.', 'Roll your shoulders back five times and unclench your jaw.'],
  },
  {
    id: 'delay-cognitive', category: 'delay', track: 'any', title: 'Sit with one question',
    steps: ['This craving passes whether you act on it or not.', 'What would the version of you a year from now want, right now?', 'You don’t have to answer. Just let the question sit for a minute.'],
  },
  {
    id: 'delay-distraction', category: 'delay', track: 'any', title: 'Give your mind a small task',
    steps: ['Name five things you can see, four you can hear, three you can touch.', 'Count backwards from 100 in sevens: 100, 93, 86…', 'Send someone you care about a single kind sentence.'],
  },
];

export function getPathsFor(category: CoachCategory, track?: TrackType): CoachPath[] {
  return OFFLINE_COACH_PATHS.filter((p) => p.category === category && (p.track === 'any' || p.track === track));
}

export function getPathById(id: string): CoachPath | undefined {
  return OFFLINE_COACH_PATHS.find((p) => p.id === id);
}
