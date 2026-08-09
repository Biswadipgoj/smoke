// src/services/ai/safety.ts
//
// §5 Safety Layer. Two jobs, in this order:
//
//   1. detectCrisis(userInput) — self-harm language short-circuits straight to
//      a supportive handoff, bypassing the model entirely. Nothing about
//      smoking is worth a round-trip in that moment.
//   2. applySafetyFilter(modelOutput) — a pattern guard against the language
//      §1 and §5 rule out: shame, pressure, fear appeals, diagnosis.
//
// Honest about what this is: a v1 keyword/pattern check, not a solved problem.
// §30 sequences it into an eval-backed system; scripts/evalPrompts.ts is the
// start of that. It should not stay a keyword list forever.
//
// This module is deliberately dependency-free (no React Native, no Expo) so
// the identical logic can run in the Deno edge function. The copy at
// supabase/functions/ai-coach/safety.ts must be kept byte-identical — the
// eval harness runs against this one.

export type SafetyCategory = 'shame' | 'pressure' | 'fear' | 'diagnosis';

interface Rule {
  category: SafetyCategory;
  pattern: RegExp;
}

/**
 * Output rules. Matching one means the reply is replaced wholesale rather than
 * patched: a sentence that reached for shame is usually shaped around it, and
 * deleting the word leaves the shape.
 */
const OUTPUT_RULES: Rule[] = [
  // §1 — no streak-breaking language, no moral framing of a cigarette.
  { category: 'shame', pattern: /\b(relapse[ds]?|relapsing)\b/i },
  { category: 'shame', pattern: /\bslip[- ]?up\b|\byou slipped\b/i },
  { category: 'shame', pattern: /\b(fail(ed|ure|ing)?|failed again)\b/i },
  { category: 'shame', pattern: /\bstreak (is |was )?(broken|reset|lost|over)\b/i },
  { category: 'shame', pattern: /\bback to (zero|square one|the start|day one)\b/i },
  { category: 'shame', pattern: /\b(disappoint(ed|ing|ment)?|let (yourself|me|us) down)\b/i },
  { category: 'shame', pattern: /\b(ashamed|shameful|guilty about|feel guilty)\b/i },
  { category: 'shame', pattern: /\byou (lost|threw away|wasted) (your )?progress\b/i },
  { category: 'shame', pattern: /\bsetback\b/i },

  // §5 — no pressure.
  { category: 'pressure', pattern: /\byou (must|have to|need to) (stop|quit)\b/i },
  { category: 'pressure', pattern: /\bno excuses?\b/i },
  { category: 'pressure', pattern: /\byou owe it to\b/i },
  { category: 'pressure', pattern: /\bdon'?t let (me|yourself|them) down\b/i },
  { category: 'pressure', pattern: /\btry harder\b/i },

  // §5 — no fear appeals.
  { category: 'fear', pattern: /\b(will|could|can) kill you\b/i },
  { category: 'fear', pattern: /\byou (will|could|might) die\b/i },
  { category: 'fear', pattern: /\bevery cigarette takes\b.*\b(minutes?|life)\b/i },
  { category: 'fear', pattern: /\byou'?re (killing|destroying) (yourself|your lungs)\b/i },

  // §5 — no diagnosis, no medical claims about this person.
  { category: 'diagnosis', pattern: /\b(i )?diagnos(e|is|ing|ed)\b/i },
  {
    category: 'diagnosis',
    pattern:
      /\byou (have|are|may have|might have|probably have|likely have)\b[^.?!]{0,60}\b(copd|emphysema|cancer|depression|anxiety disorder|addiction|dependence|withdrawal syndrome)\b/i,
  },
  { category: 'diagnosis', pattern: /\byou should (take|start|stop taking)\b[^.?!]{0,40}\b(medication|patches?|gum|varenicline|bupropion|zyban|champix)\b/i },
  { category: 'diagnosis', pattern: /\byour (lungs|heart|body) (is|are) (damaged|diseased)\b/i },
];

/**
 * Crisis patterns, checked against *user input*. English plus the most common
 * Hindi and Bengali phrasings. Recall matters far more than precision here:
 * a false positive costs one gentle, slightly off-topic message; a false
 * negative costs something we cannot take back.
 */
const CRISIS_PATTERNS: RegExp[] = [
  /\b(kill(ing)? myself|end(ing)? my life|take my own life)\b/i,
  /\bsuicid(e|al)\b/i,
  /\b(want|wanted|wish) to die\b/i,
  /\bdon'?t want to (be alive|live|wake up)\b/i,
  /\b(self[- ]?harm|hurt(ing)? myself|cut(ting)? myself)\b/i,
  /\bno (point|reason) (in )?(living|going on|being here)\b/i,
  /\bbetter off (without me|dead)\b/i,
  // Hindi
  /आत्महत्या|खुदकुशी|मरना चाहता|मरना चाहती|जीना नहीं चाहता|जीना नहीं चाहती|खुद को (मार|नुकसान)/,
  // Bengali
  /আত্মহত্যা|মরে যেতে চাই|বাঁচতে চাই না|নিজেকে (শেষ|আঘাত)/,
];

export function detectCrisis(userInput: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(userInput));
}

export interface SafetyResult {
  /** Safe text to show. Equals the input when nothing matched. */
  text: string;
  /** Categories that matched, for logging and for the eval harness. */
  flags: SafetyCategory[];
  /** True when the original was replaced rather than passed through. */
  blocked: boolean;
}

/**
 * What the user sees when a reply had to be dropped. Deliberately says nothing
 * about a filter: the failure is ours, and explaining it mid-craving helps
 * nobody.
 */
export const SAFE_FALLBACK =
  "Let's stay with what's in front of you. What's happening right now, and how long has it been going on?";

export function applySafetyFilter(output: string): SafetyResult {
  const flags: SafetyCategory[] = [];
  for (const rule of OUTPUT_RULES) {
    if (rule.pattern.test(output) && !flags.includes(rule.category)) {
      flags.push(rule.category);
    }
  }
  if (flags.length === 0) return { text: output, flags, blocked: false };
  return { text: SAFE_FALLBACK, flags, blocked: true };
}
