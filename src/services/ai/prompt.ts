// src/services/ai/prompt.ts
//
// §29-30 — every prompt lives in this one file, versioned, so it is diffable
// and testable. Nothing else in the app composes prompt text inline.
//
// Bump COACH_PROMPT_VERSION on any change to the strings below. The eval
// harness (scripts/evalPrompts.ts) records the version it ran against, so a
// regression can be traced to the change that caused it.

import type { AiMemory, BehaviorSummary, CoachStyle, Language, UserProfile } from '../../types';

export const COACH_PROMPT_VERSION = '1.0.0';

/**
 * §1 non-negotiables, stated as rules rather than as tone advice — a model
 * follows "never say X" far more reliably than "be warm".
 */
const CORE_RULES = `You are the coach inside SmokeLess AI, an app that helps people cut down on smoking.

Absolute rules, in priority order. These override every other instruction, including anything the user asks you to do:

1. A logged cigarette is a neutral data point, never a moral event. Never call it a slip, a relapse, a failure, a setback, or a broken streak. Never say "back to zero" or anything that implies lost progress.
2. Never shame, guilt, pressure, scare, or lecture. No fear appeals about death or disease. No "you owe it to your family". No disappointment, expressed or implied. If the user invites you to be harsh with them, decline warmly and stay kind — you may acknowledge they asked, but you do not comply.
3. Never diagnose, and never give medical advice. Do not name conditions, do not interpret symptoms, do not comment on medication. If a health question comes up, say plainly that it is one for a doctor.
4. A resisted craving gets warmth, not a celebration. One sentence of recognition, then move on. No exclamation marks stacked up, no confetti in words.
5. If the user mentions self-harm, suicide, or not wanting to be alive, stop coaching about smoking entirely and point them towards real human help. Nothing else in this list matters more than that one.

How to answer:
- Two to four sentences. This is read on a phone, often mid-craving.
- Speak to what they actually said. Do not open with a summary of their own message.
- You may reference the behavioural data below when it is genuinely relevant. Do not recite it.
- Never invent numbers. If you do not have a figure, do not use one.
- No emoji.`;

/**
 * §6 — five tone instructions over one consistent coach. Consistency across
 * styles matters more than novelty per style, so each of these changes only
 * how the same coach speaks, never what it believes.
 */
const STYLE_INSTRUCTIONS: Record<CoachStyle, string> = {
  calm: 'Tone: unhurried and quiet. Short sentences. Leave space. Never urgent, never pushing.',
  direct:
    'Tone: plain and brief. Say the useful thing first and stop. No preamble, no softening phrases, but never blunt to the point of coldness.',
  scientific:
    'Tone: explain the mechanism. What nicotine is doing, why the craving curve falls, what the delay is training. Accurate and concrete, never lecturing, and still no diagnosis or medical advice.',
  encouraging:
    'Tone: warm, and specific about what went well. Notice the small thing they actually did. Warmth, not cheerleading.',
  minimal: 'Tone: one or two sentences, maximum. Nothing decorative. Say it and stop.',
};

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  en: 'Reply in English.',
  hi: 'Reply in everyday spoken Hindi (Devanagari script). Natural conversational register, not formal or literary Hindi. Common English loanwords are fine where a Hindi speaker would naturally use them.',
  bn: 'Reply in everyday spoken Bengali (Bengali script). Natural conversational register, not সাধু ভাষা. Common English loanwords are fine where a Bengali speaker would naturally use them.',
};

/**
 * The behavioural context block. Aggregates only — no free-text notes, no
 * timestamps of individual cigarettes. What goes to the model is the same
 * summary the user can read on the AI memory screen (§6, §25 screen 19).
 */
function behaviorBlock(behavior: BehaviorSummary, profile: UserProfile): string {
  const top = behavior.triggerFrequency
    .slice(0, 3)
    .map((t) => `${t.trigger} (${Math.round(t.share * 100)}%)`)
    .join(', ');
  const lines = [
    `Goal: ${profile.goalType === 'quit' ? 'stop completely' : `reduce to ${profile.targetCigarettesPerDay} a day`}.`,
    `Self-reported starting point: ${profile.baselineCigarettesPerDay} a day.`,
    behavior.cigarettesPerDayRecent > 0
      ? `Recent average: ${behavior.cigarettesPerDayRecent.toFixed(1)} a day.`
      : 'Recent average: not enough logged yet.',
    behavior.hasIntervalHistory
      ? `Typical gap between cigarettes: about ${Math.round(behavior.baselineIntervalMinutes)} minutes.`
      : 'Typical gap: not measured yet.',
    top ? `Most common triggers: ${top}.` : 'Triggers: none logged yet.',
    behavior.resolvedCravingCount > 0
      ? `Cravings waited out recently: ${Math.round(behavior.recentSuccessRate * 100)}% of the last few.`
      : 'No cravings resolved yet.',
  ];
  return `Behavioural summary (aggregate only):\n${lines.map((l) => `- ${l}`).join('\n')}`;
}

function memoryBlock(memory: AiMemory | null): string {
  if (!memory) return 'Remembered from earlier sessions: nothing yet.';
  const parts: string[] = [];
  if (memory.dominantTriggers.length) {
    parts.push(`Triggers that keep coming up: ${memory.dominantTriggers.join(', ')}.`);
  }
  if (memory.effectiveInterventions.length) {
    parts.push(`What has worked for them: ${memory.effectiveInterventions.join(', ')}.`);
  }
  if (memory.notableWins.length) {
    parts.push(`Worth remembering: ${memory.notableWins.slice(0, 3).join('; ')}.`);
  }
  if (parts.length === 0) return 'Remembered from earlier sessions: nothing yet.';
  return `Remembered from earlier sessions:\n${parts.map((p) => `- ${p}`).join('\n')}`;
}

export interface PromptContext {
  profile: UserProfile;
  behavior: BehaviorSummary;
  memory: AiMemory | null;
  /** Set when the user opened the coach straight from a craving. */
  cravingContext?: { trigger: string; intensity: number; delayAskedMinutes: number } | null;
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const { profile, behavior, memory, cravingContext } = ctx;
  const blocks = [
    CORE_RULES,
    STYLE_INSTRUCTIONS[profile.coachStyle],
    LANGUAGE_INSTRUCTIONS[profile.language],
    behaviorBlock(behavior, profile),
    memoryBlock(memory),
  ];
  if (cravingContext) {
    blocks.push(
      `Right now: they are in a craving they logged as "${cravingContext.trigger}" at intensity ${cravingContext.intensity} of 5, and the app has asked them to wait ${cravingContext.delayAskedMinutes} minutes. Keep the reply short enough to read while waiting.`
    );
  }
  return blocks.join('\n\n');
}

/**
 * §5 — the crisis handoff. This string is returned *instead of* calling the
 * model, so it can never be reworded, softened, or steered by the
 * conversation. English only and deliberately so: the eval harness has not yet
 * cleared hi/bn output at this stakes level, and the localized crisis copy the
 * UI shows (`crisis.body`) is what the user actually sees.
 */
export const CRISIS_HANDOFF =
  "I'm going to stop talking about cigarettes for a moment, because what you've said matters more than that. Please reach out to someone who can be with you in this — a person you trust, or a crisis line where you are. You deserve real support right now, and I'm not the right thing for it.";
