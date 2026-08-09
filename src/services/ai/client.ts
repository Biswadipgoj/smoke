// src/services/ai/client.ts
// ─────────────────────────────────────────────────────────────────────────────
// The app's one path to the coach (§3-6).
//
// Order of operations, and none of it is optional:
//   1. Crisis language is caught here, before anything is sent anywhere. The
//      Edge Function checks again — belt and braces, because the client check
//      is the one that keeps a crisis message off the wire at all.
//   2. If there is no backend, no session, or no network, we answer from the
//      rule engines instead of showing an error. A craving is happening now.
//   3. Whatever comes back is already safety-filtered server-side; we do not
//      re-filter, we just carry the flags through for the UI to label.
// ─────────────────────────────────────────────────────────────────────────────

import type { TFunction } from '../../i18n';
import type { BehaviorStats, ChatMessage, CoachStyle, Locale, Trigger } from '../../types';
import { hasSupabaseConfig, supabase } from '../supabase/client';
import { offlineReply } from './offlineCoach';
import { detectCrisis } from './safety';

export interface AskCoachInput {
  message: string;
  style: CoachStyle;
  locale: Locale;
  history: ChatMessage[];
  memorySummary: string | null;
  situation: string | null;
  stats: BehaviorStats;
  baselinePerDay: number;
  targetPerDay: number | null;
  likelyTrigger: Trigger;
}

export interface CoachReply {
  text: string;
  status: 'ok' | 'filtered' | 'blocked' | 'crisis';
  offline: boolean;
}

/** Anything slower than this and the offline answer is the better answer. */
const TIMEOUT_MS = 15_000;

export async function askCoach(input: AskCoachInput, t: TFunction): Promise<CoachReply> {
  if (detectCrisis(input.message)) {
    return { text: crisisText(t), status: 'crisis', offline: false };
  }

  const fallback = (): CoachReply => ({
    text: offlineReply(
      {
        message: input.message,
        stats: input.stats,
        baselinePerDay: input.baselinePerDay,
        targetPerDay: input.targetPerDay,
        likelyTrigger: input.likelyTrigger,
      },
      t
    ),
    status: 'ok',
    offline: true,
  });

  if (!hasSupabaseConfig()) return fallback();

  try {
    const result = await withTimeout(
      supabase.functions.invoke('ai-coach', {
        body: {
          message: input.message,
          style: input.style,
          locale: input.locale,
          memorySummary: input.memorySummary,
          situation: input.situation,
          history: input.history.map((m) => ({ role: m.role, text: m.text })),
        },
      }),
      TIMEOUT_MS
    );

    if (result.error || !result.data) return fallback();

    const data = result.data as { text?: string; status?: CoachReply['status'] };
    if (!data.text) return fallback();
    if (data.status === 'crisis') return { text: crisisText(t), status: 'crisis', offline: false };

    return { text: data.text, status: data.status ?? 'ok', offline: false };
  } catch {
    return fallback();
  }
}

/**
 * The crisis message is rendered from the app's own dictionary rather than the
 * server's English string — someone in this state should not be handed a
 * language they have to translate.
 */
export function crisisText(t: TFunction): string {
  return [t('crisisBody'), '', t('crisisHelpline'), t('crisisEmergency')].join('\n');
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
