// src/services/ai/index.ts
//
// The AI Coach client. Two things this file exists to guarantee:
//
//   1. The Gemini key never ships in the APK. Calls go to a Supabase Edge
//      Function (supabase/functions/ai-coach) which holds the key server-side.
//      Calling Gemini directly from the phone would put the key inside the
//      compiled binary, extractable by anyone with a decompiler — see the
//      plan's pushback note on API key security.
//   2. There is always an answer. No config, no signal, a failing function, a
//      slow function — every one of those paths ends in the rule-based coach,
//      never in an error state (§3-6, §20-21).

import { translate, type TranslateFn } from '../../i18n';
import type { AiMemory, BehaviorSummary, CoachMessage, UserProfile } from '../../types';
import { newId } from '../db/localDb';
import { hasSupabaseConfig, supabase } from '../supabase/client';
import { offlineMessage } from './offlineCoach';
import { buildSystemPrompt, COACH_PROMPT_VERSION, type PromptContext } from './prompt';
import { applySafetyFilter, detectCrisis } from './safety';

/** Past this, the wait is worse than a good offline answer. */
const REQUEST_TIMEOUT_MS = 12000;

/**
 * §6 — a short rolling window kept client-side for conversational continuity
 * within a session. Never persisted, never sent to storage, gone on app close.
 */
const HISTORY_TURNS = 6;

export interface AskCoachParams {
  input: string;
  profile: UserProfile;
  behavior: BehaviorSummary;
  memory: AiMemory | null;
  /** Recent messages, oldest first. Trimmed to the rolling window here. */
  history: CoachMessage[];
  cravingContext?: PromptContext['cravingContext'];
  t: TranslateFn;
}

function coachMessage(
  text: string,
  extra: { offline?: boolean; crisis?: boolean } = {}
): CoachMessage {
  return { id: newId(), role: 'coach', text, createdAtMs: Date.now(), ...extra };
}

export async function askCoach(params: AskCoachParams): Promise<CoachMessage> {
  const { input, profile, behavior, memory, history, cravingContext, t } = params;

  // §5 — crisis language short-circuits before anything else, including the
  // network check. The model is never asked, so it can never be steered into
  // answering instead.
  if (detectCrisis(input)) {
    return coachMessage(translate(profile.language, 'crisis.body'), {
      offline: true,
      crisis: true,
    });
  }

  if (!hasSupabaseConfig()) {
    return offlineMessage({ input, behavior, t });
  }

  const systemPrompt = buildSystemPrompt({ profile, behavior, memory, cravingContext });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const { data, error } = await supabase.functions.invoke<{ reply?: string }>('ai-coach', {
      body: {
        promptVersion: COACH_PROMPT_VERSION,
        systemPrompt,
        language: profile.language,
        // Only the rolling window goes over the wire, and only its text — no
        // ids, no timestamps, nothing that could rebuild a session later.
        history: history.slice(-HISTORY_TURNS).map((m) => ({
          role: m.role === 'coach' ? 'model' : 'user',
          text: m.text,
        })),
        input,
      },
      // supabase-js forwards the signal to fetch.
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (error || !data?.reply) {
      return offlineMessage({ input, behavior, t });
    }

    // The edge function runs the identical filter before replying. Running it
    // again here is deliberate belt-and-braces: this is the layer that can't
    // be bypassed by a stale function deploy.
    const safe = applySafetyFilter(data.reply);
    return coachMessage(safe.text);
  } catch {
    // Offline, aborted, or the function is down. All the same to the user.
    return offlineMessage({ input, behavior, t });
  }
}

/**
 * §6 — derive the aggregate memory from behaviour. Called after each craving
 * resolves. Note what is absent: no message text, no transcript, nothing that
 * could reconstruct a conversation.
 */
export function deriveMemory(params: {
  behavior: BehaviorSummary;
  profile: UserProfile;
  previous: AiMemory | null;
}): AiMemory {
  const { behavior, profile, previous } = params;
  return {
    dominantTriggers: behavior.triggerFrequency.slice(0, 3).map((t) => t.trigger),
    effectiveInterventions: behavior.interventionEffectiveness
      .filter((e) => e.uses >= 3 && e.rate >= 0.5)
      .slice(0, 3)
      .map((e) => e.interventionId),
    preferredStyle: profile.coachStyle,
    notableWins: previous?.notableWins ?? [],
    updatedAtMs: Date.now(),
  };
}

export { COACH_PROMPT_VERSION } from './prompt';
export { applySafetyFilter, detectCrisis } from './safety';
