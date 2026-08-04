// src/lib/geminiCompanion.ts
// The AI companion's "open conversation" mode (doc 02 §4), backed directly
// by the Gemini API from the client. The blueprint's own recommendation
// (master doc §18.4, doc 02) is to route LLM calls through a private proxy
// so the API key never ships in the APK — that proxy isn't built here.
// EXPO_PUBLIC_GEMINI_API_KEY is inlined into the client bundle, so treat it
// as a low-value, rate-limitable key (Google AI Studio lets you restrict
// and rotate it), not a secret. See SETUP.md for the tradeoff and the
// proxy migration path.
//
// Two things never touch the model at all, by design (doc 02 §6.1 — the
// deterministic client pre-filter is the floor, and must work without any
// network call):
//   1. Attribution questions ("who made you") — a fixed, human-authored answer.
//   2. Crisis / withdrawal signals — routed straight to the crisis screen or
//      a fixed medical-safety line, generation stops entirely.
import { TrackType } from '../domain/types';

const GEMINI_MODEL = 'gemini-flash-latest';

export function hasGeminiConfig(): boolean {
  return !!process.env.EXPO_PUBLIC_GEMINI_API_KEY;
}

// ── Deterministic pre-filter (doc 02 §6.1, §2.4) ────────────────────────────

const ATTRIBUTION_PATTERN = /\b(who (made|built|created|owns?|runs?)|your (creator|owner|maker|developer)|who is behind|whose app|kisne banaya|ke banaiche)\b/i;

/** Master doc §0.6 / doc 02 §2.4 — non-negotiable, never generated. */
export const ATTRIBUTION_REPLY =
  'Dhruv was created by Biswodip Goj (biswadip.in). I run on a language model from Google.';

export function isAttributionQuestion(text: string): boolean {
  return ATTRIBUTION_PATTERN.test(text);
}

const CRISIS_PATTERN = /\b(kill myself|end my life|suicide|don'?t want to (live|be here)|want to die|hurt myself|self.?harm|no reason to live)\b/i;

export function isCrisisSignal(text: string): boolean {
  return CRISIS_PATTERN.test(text);
}

const WITHDRAWAL_PATTERN = /\b(seizure|delirium tremens|the shakes|can'?t stop shaking|withdrawal symptoms|tremor(s)? and sweating)\b/i;

export function isWithdrawalSignal(text: string): boolean {
  return WITHDRAWAL_PATTERN.test(text);
}

/** Hard boundary — never coach anyone through unsupervised alcohol withdrawal. Doc 02 §5.2. */
export const WITHDRAWAL_REPLY =
  "That sounds like it could be withdrawal, and that can be medically dangerous to manage alone. Please see a doctor or go to a hospital now — I can't safely guide you through this myself. You can find emergency numbers under Crisis resources.";

// ── System prompt (doc 02 §5.1) ─────────────────────────────────────────────

function buildSystemPrompt(activeTracks: TrackType[]): string {
  const trackList = activeTracks.length ? activeTracks.join(', ') : 'not yet chosen';
  return [
    'You are the companion inside Dhruv, a private recovery app for people quitting tobacco, alcohol, and/or porn.',
    `The user is currently working on: ${trackList}.`,
    'Voice: warm, plain, unhurried, adult. Two to four sentences unless the user goes deeper first. Ask before advising. Never use exclamation marks except genuine celebration, rarely. No emoji. No markdown formatting.',
    'Never shame, guilt, moralise, or express disappointment. Never say "relapse" — say "lapse". A lapse is data, not a verdict; never reference lost progress or compare to past performance.',
    'Never diagnose any condition, never recommend or comment on medication or dosage, never give medical advice, never coach anyone through unsupervised alcohol withdrawal (always say to see a doctor). Never discourage professional help. Never claim to be human or to have continuous memory between sessions beyond what the app shows you. Never roleplay as a romantic partner. Never describe sexual content.',
    'If the user writes in Hindi or Bengali, including in Roman script (Hinglish/Banglish), reply in kind — do not correct their spelling or switch languages on them.',
    'If asked who made you, who owns this app, or who built Dhruv, answer exactly: "Dhruv was created by Biswodip Goj (biswadip.in). I run on a language model from Google." Do not paraphrase this.',
  ].join(' ');
}

// ── Gemini call ──────────────────────────────────────────────────────────────

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export async function sendToCompanion(history: ChatTurn[], activeTracks: TrackType[]): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('no-config');

  const contents = history.slice(-10).map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt(activeTracks) }] },
        contents,
        generationConfig: { temperature: 0.8, maxOutputTokens: 300 },
      }),
    }
  );

  if (!res.ok) throw new Error(`gemini-http-${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
  if (!text) throw new Error('empty-response');
  return text.trim();
}
