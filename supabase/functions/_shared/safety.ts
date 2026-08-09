// supabase/functions/_shared/safety.ts
// ─────────────────────────────────────────────────────────────────────────────
// The Safety Layer (§5). One implementation, two runtimes: the Edge Function
// imports it directly, and the app re-exports it from src/services/ai/safety.ts
// so the same rules apply to the offline fallback and to anything that runs
// client-side in development.
//
// It lives here rather than in src/ because the Supabase CLI bundles
// `_shared` alongside each function; a copy on each side would drift, and a
// safety filter that drifts is worse than no filter, because you stop
// checking it.
//
// Scope and honesty about it: this is a keyword/pattern guard. It is a v1
// (§30), not a finished safety system. It catches the failure modes that are
// *phrased* — diagnosis language, shame, pressure, medical claims — and it
// short-circuits crisis language before the model is ever called. It does not
// catch a subtly judgemental paragraph with no banned words in it. That gap
// closes with the eval harness and human review, not with more regexes.
//
// Zero dependencies, on purpose: it must run under Deno and React Native
// unchanged.
// ─────────────────────────────────────────────────────────────────────────────

export type SafetyStatus = 'ok' | 'filtered' | 'blocked';

export interface SafetyVerdict {
  status: SafetyStatus;
  /** The text safe to show. Never empty. */
  text: string;
  /** Which rules fired, for the eval harness and for debugging. */
  flags: string[];
}

interface Rule {
  id: string;
  pattern: RegExp;
}

/**
 * Language the coach must never produce. Grouped by *why* it is banned, since
 * the reason is what a future reviewer needs, not the regex.
 */
const BANNED_RULES: Rule[] = [
  // Diagnosis — the coach is not a clinician and must not speak like one.
  { id: 'diagnosis', pattern: /\b(you (are|'re) (an? )?(addict|alcoholic|dependent))\b/i },
  // Words can sit between the verb and the noun ("you have a substance use
  // disorder"), so this matches across a short window rather than adjacently.
  { id: 'diagnosis', pattern: /\byou (have|suffer from)\b[^.!?]{0,40}\b(addiction|disorder|disease|dependency)\b/i },
  { id: 'diagnosis', pattern: /\b(i )?(diagnose|diagnosing|my diagnosis)\b/i },
  // No \b on the Devanagari/Bengali patterns: JavaScript's \b is defined on
  // ASCII word characters, so it never matches at the edge of an Indic
  // grapheme and would silently disable every rule below.
  { id: 'diagnosis', pattern: /आप (एक )?(नशेड़ी|लती) ह(ैं|ो)/ },
  { id: 'diagnosis', pattern: /আপনি (একজন )?(নেশাগ্রস্ত|আসক্ত)/ },

  // Medical claims — no promises about outcomes, no prescribing.
  { id: 'medical-claim', pattern: /\b(this will (cure|heal|fix)|guaranteed to (quit|stop|work))\b/i },
  { id: 'medical-claim', pattern: /\b(you should (take|stop taking)|i (prescribe|recommend a dose))\b/i },
  { id: 'medical-claim', pattern: /\b(nicotine patch|varenicline|bupropion|champix|zyban)\b.{0,40}\b(you should|take|start)\b/i },

  // Shame, guilt, humiliation — the single hardest rule in the product (§1).
  { id: 'shame', pattern: /\b(you (should be )?(ashamed|embarrassed)|shame on you)\b/i },
  { id: 'shame', pattern: /\b(you (failed|have failed|are a failure|let (me|yourself) down))\b/i },
  { id: 'shame', pattern: /\b(disappointing|disappointed in you|pathetic|weak-willed|no willpower)\b/i },
  { id: 'shame', pattern: /\b(back to (square one|zero)|you (lost|broke) your streak|start(ing)? over)\b/i },
  { id: 'shame', pattern: /(शर्म|नाकाम|कमज़ोर इच्छाशक्ति|निराश किया)/ },
  { id: 'shame', pattern: /(লজ্জা|ব্যর্থ|দুর্বল ইচ্ছাশক্তি|হতাশ করেছেন)/ },

  // Fear and pressure — scare copy reliably backfires in cessation.
  { id: 'fear', pattern: /\b(you (will|are going to) (die|get cancer)|killing yourself)\b/i },
  { id: 'fear', pattern: /\b(if you don'?t (quit|stop) now)\b/i },
  { id: 'pressure', pattern: /\b(you (must|have to) (quit|stop) (now|today|immediately))\b/i },
];

/**
 * Crisis language. This does not filter the model — it stops the request
 * before the model is called at all, and returns a supportive handoff (§5).
 * Deliberately broad: a false positive costs one gentle, unhelpful-but-kind
 * message; a false negative costs something that does not bear writing down.
 */
const CRISIS_RULES: Rule[] = [
  { id: 'crisis', pattern: /\b(kill (myself|me)|killing myself|end (my life|it all)|take my (own )?life)\b/i },
  { id: 'crisis', pattern: /\b(suicide|suicidal|want to die|don'?t want to (live|be here|wake up))\b/i },
  { id: 'crisis', pattern: /\b(hurt(ing)? myself|harm(ing)? myself|self[- ]harm|cut(ting)? myself)\b/i },
  { id: 'crisis', pattern: /\b(no (point|reason) (in )?(living|going on)|better off without me)\b/i },
  { id: 'crisis', pattern: /(आत्महत्या|खुदकुशी|खुद को (मार|नुकसान)|जीना नहीं चाहता|मरना चाहता)/ },
  { id: 'crisis', pattern: /(আত্মহত্যা|নিজেকে (মেরে|শেষ)|বাঁচতে ইচ্ছে করছে না|মরে যেতে চাই)/ },
];

/** Fallback shown when every sentence in a reply had to be dropped. */
export const SAFE_FALLBACK =
  'Let’s keep this simple: the craving you’re having will pass whether or not you smoke. Give it a few minutes and see where it goes.';

/** Returned instead of a model call when crisis language is detected (§5). */
export const CRISIS_RESPONSE = [
  'I’m glad you told me, and I want to be honest: this is bigger than something I can help with here.',
  '',
  'Please talk to someone who can right now — a person you trust, a doctor, or a crisis helpline in your country. In India you can reach Tele-MANAS on 14416, any time, free.',
  '',
  'If you’re in immediate danger, call your local emergency number.',
].join('\n');

export function detectCrisis(text: string): boolean {
  return CRISIS_RULES.some((rule) => rule.pattern.test(text));
}

/**
 * Splits on sentence boundaries and drops only the offending sentences, so a
 * good four-sentence reply with one bad clause survives as three sentences
 * rather than being replaced wholesale.
 */
export function applySafetyFilter(text: string): SafetyVerdict {
  const trimmed = text.trim();
  if (!trimmed) return { status: 'blocked', text: SAFE_FALLBACK, flags: ['empty'] };

  const flags = new Set<string>();
  const sentences = splitSentences(trimmed);
  const kept: string[] = [];

  for (const sentence of sentences) {
    const hit = BANNED_RULES.find((rule) => rule.pattern.test(sentence));
    if (hit) {
      flags.add(hit.id);
    } else {
      kept.push(sentence);
    }
  }

  if (flags.size === 0) return { status: 'ok', text: trimmed, flags: [] };
  if (kept.length === 0) {
    return { status: 'blocked', text: SAFE_FALLBACK, flags: [...flags] };
  }
  return { status: 'filtered', text: kept.join(' ').trim(), flags: [...flags] };
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?।])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
