// supabase/functions/ai-coach/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// The AI Coach endpoint. Deno, deployed with `supabase functions deploy ai-coach`.
//
// Why this exists at all: calling Gemini straight from the phone means the API
// key ships inside the compiled APK, where anyone with a decompiler can lift
// it and spend your quota. The key lives here as a function secret and never
// leaves the server. The app sends a message and gets a string back.
//
// This function also owns the parts of safety that must not be skippable:
//   · crisis language short-circuits before the model is ever called
//   · every model reply is run through applySafetyFilter on the way out
// A client-side check can be bypassed by anyone who repoints the app at their
// own build; this one cannot.
//
// Secrets required:
//   GEMINI_API_KEY   — from Google AI Studio
//   GEMINI_MODEL     — optional, defaults to gemini-2.5-flash
// ─────────────────────────────────────────────────────────────────────────────

import {
  CRISIS_RESPONSE,
  SAFE_FALLBACK,
  applySafetyFilter,
  detectCrisis,
} from '../_shared/safety.ts';
import { buildSystemPrompt, COACH_PROMPT_VERSION, type CoachStyle, type PromptLocale } from '../_shared/prompt.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CoachRequest {
  message: string;
  style?: CoachStyle;
  locale?: PromptLocale;
  memorySummary?: string | null;
  situation?: string | null;
  /** Short rolling window for continuity. The client never persists this. */
  history?: Array<{ role: 'user' | 'coach'; text: string }>;
}

interface CoachResponse {
  text: string;
  status: 'ok' | 'filtered' | 'blocked' | 'crisis';
  flags: string[];
  promptVersion: string;
}

/** Hard cap on what we forward, so a pasted wall of text can't run up a bill. */
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_TURNS = 8;

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (request.method !== 'POST') {
    return json({ error: 'POST only' }, 405);
  }

  let body: CoachRequest;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const message = (body.message ?? '').toString().slice(0, MAX_MESSAGE_CHARS).trim();
  if (!message) return json({ error: 'message is required' }, 400);

  // Crisis handling comes first, and bypasses the model entirely (§5).
  if (detectCrisis(message)) {
    return json<CoachResponse>({
      text: CRISIS_RESPONSE,
      status: 'crisis',
      flags: ['crisis'],
      promptVersion: COACH_PROMPT_VERSION,
    });
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    // Not an error the user should see as a stack trace: the app falls back to
    // its offline coach on a non-2xx, which is a working experience.
    return json({ error: 'GEMINI_API_KEY is not configured' }, 503);
  }

  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  const systemPrompt = buildSystemPrompt({
    style: body.style ?? 'calm',
    locale: body.locale ?? 'en',
    memorySummary: body.memorySummary ?? null,
    situation: body.situation ?? null,
  });

  const contents = [
    ...(body.history ?? []).slice(-MAX_HISTORY_TURNS).map((turn) => ({
      role: turn.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(turn.text).slice(0, MAX_MESSAGE_CHARS) }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400,
          },
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error('Gemini error', response.status, detail);
      return json({ error: 'Upstream model error' }, 502);
    }

    const payload = await response.json();
    const raw: string =
      payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';

    const verdict = applySafetyFilter(raw || SAFE_FALLBACK);
    if (verdict.flags.length > 0) {
      // Worth knowing about: a filtered reply is a prompt problem, and these
      // logs are the input to the eval harness's next case list (§30).
      console.warn('safety filter fired', {
        flags: verdict.flags,
        promptVersion: COACH_PROMPT_VERSION,
      });
    }

    return json<CoachResponse>({
      text: verdict.text,
      status: verdict.status,
      flags: verdict.flags,
      promptVersion: COACH_PROMPT_VERSION,
    });
  } catch (error) {
    console.error('ai-coach failed', error);
    return json({ error: 'Coach unavailable' }, 502);
  }
});

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}
