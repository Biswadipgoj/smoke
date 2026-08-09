// supabase/functions/ai-coach/safety.ts
//
// A byte-identical copy of src/services/ai/safety.ts.
//
// Why a copy rather than an import: this file runs in Deno on Supabase's edge
// runtime and cannot reach into the app's source tree at deploy time. The app
// module is the one the eval harness runs against (scripts/evalPrompts.ts), so
// treat that one as canonical and copy any change across — the two are checked
// against each other by `npm run check:safety`.

export type SafetyCategory = 'shame' | 'pressure' | 'fear' | 'diagnosis';

interface Rule {
  category: SafetyCategory;
  pattern: RegExp;
}

const OUTPUT_RULES: Rule[] = [
  { category: 'shame', pattern: /\b(relapse[ds]?|relapsing)\b/i },
  { category: 'shame', pattern: /\bslip[- ]?up\b|\byou slipped\b/i },
  { category: 'shame', pattern: /\b(fail(ed|ure|ing)?|failed again)\b/i },
  { category: 'shame', pattern: /\bstreak (is |was )?(broken|reset|lost|over)\b/i },
  { category: 'shame', pattern: /\bback to (zero|square one|the start|day one)\b/i },
  { category: 'shame', pattern: /\b(disappoint(ed|ing|ment)?|let (yourself|me|us) down)\b/i },
  { category: 'shame', pattern: /\b(ashamed|shameful|guilty about|feel guilty)\b/i },
  { category: 'shame', pattern: /\byou (lost|threw away|wasted) (your )?progress\b/i },
  { category: 'shame', pattern: /\bsetback\b/i },

  { category: 'pressure', pattern: /\byou (must|have to|need to) (stop|quit)\b/i },
  { category: 'pressure', pattern: /\bno excuses?\b/i },
  { category: 'pressure', pattern: /\byou owe it to\b/i },
  { category: 'pressure', pattern: /\bdon'?t let (me|yourself|them) down\b/i },
  { category: 'pressure', pattern: /\btry harder\b/i },

  { category: 'fear', pattern: /\b(will|could|can) kill you\b/i },
  { category: 'fear', pattern: /\byou (will|could|might) die\b/i },
  { category: 'fear', pattern: /\bevery cigarette takes\b.*\b(minutes?|life)\b/i },
  { category: 'fear', pattern: /\byou'?re (killing|destroying) (yourself|your lungs)\b/i },

  { category: 'diagnosis', pattern: /\b(i )?diagnos(e|is|ing|ed)\b/i },
  {
    category: 'diagnosis',
    pattern:
      /\byou (have|are|may have|might have|probably have|likely have)\b[^.?!]{0,60}\b(copd|emphysema|cancer|depression|anxiety disorder|addiction|dependence|withdrawal syndrome)\b/i,
  },
  { category: 'diagnosis', pattern: /\byou should (take|start|stop taking)\b[^.?!]{0,40}\b(medication|patches?|gum|varenicline|bupropion|zyban|champix)\b/i },
  { category: 'diagnosis', pattern: /\byour (lungs|heart|body) (is|are) (damaged|diseased)\b/i },
];

const CRISIS_PATTERNS: RegExp[] = [
  /\b(kill(ing)? myself|end(ing)? my life|take my own life)\b/i,
  /\bsuicid(e|al)\b/i,
  /\b(want|wanted|wish) to die\b/i,
  /\bdon'?t want to (be alive|live|wake up)\b/i,
  /\b(self[- ]?harm|hurt(ing)? myself|cut(ting)? myself)\b/i,
  /\bno (point|reason) (in )?(living|going on|being here)\b/i,
  /\bbetter off (without me|dead)\b/i,
  /आत्महत्या|खुदकुशी|मरना चाहता|मरना चाहती|जीना नहीं चाहता|जीना नहीं चाहती|खुद को (मार|नुकसान)/,
  /আত্মহত্যা|মরে যেতে চাই|বাঁচতে চাই না|নিজেকে (শেষ|আঘাত)/,
];

export function detectCrisis(userInput: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(userInput));
}

export interface SafetyResult {
  text: string;
  flags: SafetyCategory[];
  blocked: boolean;
}

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
