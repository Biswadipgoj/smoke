// src/services/ai/memory.ts
// ─────────────────────────────────────────────────────────────────────────────
// AI memory (§6). What is stored is an aggregated behavioural summary — top
// triggers, what has worked, preferred coaching style. What is *not* stored is
// anything the user typed: no transcripts, on the device or on the server.
//
// That boundary is the whole point of the AI Memory screen (§25 #19): the user
// can read every word the coach remembers about them, and delete it.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TFunction } from '../../i18n';
import { interventionCopy, triggerLabel } from '../../features/cravings/interventionEngine';
import type { AiMemory, BehaviorStats, CoachStyle, TodayStats, UserProfile } from '../../types';
import { hasSupabaseConfig, supabase } from '../supabase/client';

const MEMORY_KEY = 'smokeless.aiMemory.v1';

/** Build the summary from local stats. Pure — no I/O, so it is easy to inspect. */
export function buildMemory(
  userId: string,
  stats: BehaviorStats,
  style: CoachStyle,
  t: TFunction
): AiMemory {
  const topTriggers = stats.triggerFrequency.slice(0, 3).map((entry) => entry.trigger);
  const effective = stats.effectiveInterventions
    .filter((entry) => entry.uses >= 2 && entry.successRate >= 0.5)
    .slice(0, 3)
    .map((entry) => entry.intervention);

  const parts: string[] = [];
  if (topTriggers.length > 0) {
    parts.push(
      `Most common triggers: ${topTriggers.map((trigger) => triggerLabel(trigger, t)).join(', ')}.`
    );
  }
  if (effective.length > 0) {
    parts.push(
      `Interventions that have worked: ${effective
        .map((id) => interventionCopy(id, t).title)
        .join(', ')}.`
    );
  }
  if (stats.totalCravings > 0) {
    parts.push(
      `${stats.totalDelayed} of ${stats.totalCravings} logged cravings were let pass without smoking.`
    );
  }
  parts.push(`Prefers a ${style} coaching tone.`);

  return {
    userId,
    topTriggers,
    effectiveInterventions: effective,
    coachStyle: style,
    summary: parts.join(' '),
    updatedAtMs: Date.now(),
  };
}

/** A one-line factual situation report for the prompt. Numbers only, no framing. */
export function situationLine(
  today: TodayStats,
  profile: UserProfile | null,
  stats: BehaviorStats
): string {
  const bits = [
    `${today.cigarettesToday} cigarettes today`,
    `baseline ${profile?.baselinePerDay ?? 0}/day`,
    `${today.cravingsDelayedToday} of ${today.cravingsToday} cravings let pass today`,
    `cigarettes currently ~${stats.baselineIntervalMinutes} minutes apart`,
  ];
  return bits.join(', ');
}

export async function loadMemory(): Promise<AiMemory | null> {
  try {
    const raw = await AsyncStorage.getItem(MEMORY_KEY);
    return raw ? (JSON.parse(raw) as AiMemory) : null;
  } catch {
    return null;
  }
}

export async function saveMemory(memory: AiMemory): Promise<void> {
  await AsyncStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  if (!hasSupabaseConfig()) return;
  try {
    await supabase.from('ai_memory').upsert(
      {
        user_id: memory.userId,
        memory: {
          topTriggers: memory.topTriggers,
          effectiveInterventions: memory.effectiveInterventions,
          coachStyle: memory.coachStyle,
          summary: memory.summary,
        },
        updated_at: new Date(memory.updatedAtMs).toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch {
    // Memory is a convenience, not a record — a failed upsert costs the coach
    // a little context next session and nothing else.
  }
}

/**
 * Deletes the local copy first, then the remote row. A remote failure throws,
 * deliberately: "delete my data" is the one place where a silent partial
 * success would be a lie, so app/ai-memory.tsx surfaces it and lets the user
 * try again.
 */
export async function deleteMemory(userId: string | null): Promise<void> {
  await AsyncStorage.removeItem(MEMORY_KEY);
  if (!hasSupabaseConfig() || !userId) return;
  const { error } = await supabase.from('ai_memory').delete().eq('user_id', userId);
  if (error) throw new Error(error.message);
}
