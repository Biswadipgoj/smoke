// src/services/sync/syncQueue.ts
// ─────────────────────────────────────────────────────────────────────────────
// The sync queue (§20). Local SQLite is the source of truth for writes; this
// drains everything with `synced = 0` up to Supabase whenever there is a
// session and the network cooperates.
//
// Conflict policy, stated plainly because implicit ones cause data loss:
//   · Push is an upsert keyed on the row id, which was generated on-device.
//     Rows are immutable records of things that happened, so last-write-wins
//     is safe here in a way it would not be for a mutable document.
//   · Pull only inserts rows the device doesn't have; it never deletes local
//     rows, so a failed push can't erase an entry the user can see.
//   · Nothing in the UI awaits this. A sync failure is invisible by design.
// ─────────────────────────────────────────────────────────────────────────────

import {
  claimRowsForUser,
  markSynced,
  replaceFromRemote,
  unsyncedRows,
  type UnsyncedBatch,
} from '../db/localDb';
import { hasSupabaseConfig, supabase } from '../supabase/client';

export type SyncResult =
  | { status: 'skipped'; reason: 'no-backend' | 'no-session' }
  | { status: 'ok'; pushed: number; pulled: number }
  | { status: 'failed'; error: string };

export async function syncNow(userIdValue: string | null): Promise<SyncResult> {
  if (!hasSupabaseConfig()) return { status: 'skipped', reason: 'no-backend' };
  if (!userIdValue) return { status: 'skipped', reason: 'no-session' };

  try {
    // Rows written before sign-in belong to this account now.
    await claimRowsForUser(userIdValue);
    const pushed = await push(userIdValue);
    const pulled = await pull(userIdValue);
    return { status: 'ok', pushed, pulled };
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : 'Sync failed' };
  }
}

async function push(userIdValue: string): Promise<number> {
  const batch = await unsyncedRows();
  let pushed = 0;

  if (batch.cigarettes.length > 0) {
    const { error } = await supabase.from('cigarette_logs').upsert(
      batch.cigarettes.map((row) => ({
        id: row.id,
        user_id: userIdValue,
        timestamp_ms: row.timestampMs,
        count: row.count,
        trigger: row.trigger,
        note: row.note,
        from_craving: row.fromCraving,
      }))
    );
    if (error) throw new Error(error.message);
    await markSynced('cigarette_logs', batch.cigarettes.map((row) => row.id));
    pushed += batch.cigarettes.length;
  }

  if (batch.cravings.length > 0) {
    const { error } = await supabase.from('craving_logs').upsert(
      batch.cravings.map((row) => ({
        id: row.id,
        user_id: userIdValue,
        timestamp_ms: row.timestampMs,
        trigger: row.trigger,
        intensity: row.intensity,
        asked_delay_minutes: row.askedDelayMinutes,
        actual_delay_minutes: row.actualDelayMinutes,
        intervention: row.intervention,
        outcome: row.outcome,
        note: row.note,
      }))
    );
    if (error) throw new Error(error.message);
    await markSynced('craving_logs', batch.cravings.map((row) => row.id));
    pushed += batch.cravings.length;
  }

  if (batch.prices.length > 0) {
    const { error } = await supabase.from('price_history').upsert(
      batch.prices.map((row) => ({
        id: row.id,
        user_id: userIdValue,
        price_per_cigarette: row.pricePerCigarette,
        currency: row.currency,
        effective_from_ms: row.effectiveFromMs,
      }))
    );
    if (error) throw new Error(error.message);
    await markSynced('price_history', batch.prices.map((row) => row.id));
    pushed += batch.prices.length;
  }

  if (batch.goals.length > 0) {
    const { error } = await supabase.from('goals').upsert(
      batch.goals.map((row) => ({
        id: row.id,
        user_id: userIdValue,
        target_per_day: row.targetPerDay,
        created_at_ms: row.createdAtMs,
        target_date_ms: row.targetDateMs,
        achieved_at_ms: row.achievedAtMs,
      }))
    );
    if (error) throw new Error(error.message);
    await markSynced('goals', batch.goals.map((row) => row.id));
    pushed += batch.goals.length;
  }

  return pushed;
}

async function pull(userIdValue: string): Promise<number> {
  const [cigarettes, cravings, prices, goals] = await Promise.all([
    supabase.from('cigarette_logs').select('*').eq('user_id', userIdValue),
    supabase.from('craving_logs').select('*').eq('user_id', userIdValue),
    supabase.from('price_history').select('*').eq('user_id', userIdValue),
    supabase.from('goals').select('*').eq('user_id', userIdValue),
  ]);

  const firstError = cigarettes.error ?? cravings.error ?? prices.error ?? goals.error;
  if (firstError) throw new Error(firstError.message);

  const batch: UnsyncedBatch = {
    cigarettes: (cigarettes.data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      timestampMs: Number(row.timestamp_ms),
      count: row.count,
      trigger: row.trigger,
      note: row.note,
      fromCraving: Boolean(row.from_craving),
      synced: true,
    })),
    cravings: (cravings.data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      timestampMs: Number(row.timestamp_ms),
      trigger: row.trigger,
      intensity: row.intensity,
      askedDelayMinutes: row.asked_delay_minutes,
      actualDelayMinutes: row.actual_delay_minutes,
      intervention: row.intervention,
      outcome: row.outcome,
      note: row.note,
      synced: true,
    })),
    prices: (prices.data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      pricePerCigarette: Number(row.price_per_cigarette),
      currency: row.currency,
      effectiveFromMs: Number(row.effective_from_ms),
      synced: true,
    })),
    goals: (goals.data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      targetPerDay: row.target_per_day,
      createdAtMs: Number(row.created_at_ms),
      targetDateMs: row.target_date_ms === null ? null : Number(row.target_date_ms),
      achievedAtMs: row.achieved_at_ms === null ? null : Number(row.achieved_at_ms),
      synced: true,
    })),
  };

  await replaceFromRemote(batch);
  return (
    batch.cigarettes.length + batch.cravings.length + batch.prices.length + batch.goals.length
  );
}

/** Deletes every remote row for the account. Used by the account-deletion flow. */
export async function deleteRemoteData(userIdValue: string): Promise<void> {
  if (!hasSupabaseConfig()) return;
  for (const table of ['cigarette_logs', 'craving_logs', 'price_history', 'goals', 'ai_memory', 'profiles']) {
    const { error } = await supabase.from(table).delete().eq('user_id', userIdValue);
    // `profiles` is keyed by `id`, not `user_id`; try that shape before giving up.
    if (error && table === 'profiles') {
      await supabase.from('profiles').delete().eq('id', userIdValue);
    } else if (error) {
      throw new Error(error.message);
    }
  }
}
