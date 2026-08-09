// src/services/sync/index.ts
//
// §20 — the sync queue over the `synced` flag. Local is always the source of
// truth for a write; this pushes what the server hasn't got yet and pulls
// anything the account has that this device doesn't.
//
// Push is an upsert keyed on the row id, which the device generated, so a
// retry after a half-failed upload is idempotent rather than duplicating rows.
// Nothing here ever blocks the UI: every entry point is fire-and-forget and
// failure is silent by design — a user mid-craving must not see a sync error.

import {
  getDb,
  listCigarettes,
  listCravings,
  listPrices,
  markSynced,
  pendingUploads,
} from '../db/localDb';
import { hasSupabaseConfig, supabase } from '../supabase/client';

export interface SyncResult {
  pushed: number;
  pulled: number;
  ok: boolean;
}

const IDLE: SyncResult = { pushed: 0, pulled: 0, ok: false };

async function currentUserId(): Promise<string | null> {
  if (!hasSupabaseConfig()) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Local rows the server hasn't acknowledged, uploaded and then flagged. */
async function push(userId: string): Promise<number> {
  const pending = await pendingUploads();
  let pushed = 0;

  if (pending.cigarettes.length) {
    const { error } = await supabase.from('cigarette_logs').upsert(
      pending.cigarettes.map((c) => ({
        id: c.id,
        user_id: userId,
        timestamp_ms: c.timestampMs,
        trigger_key: c.trigger,
        note: c.note,
      }))
    );
    if (!error) {
      await markSynced('cigarette_logs', pending.cigarettes.map((c) => c.id));
      pushed += pending.cigarettes.length;
    }
  }

  if (pending.cravings.length) {
    const { error } = await supabase.from('craving_logs').upsert(
      pending.cravings.map((c) => ({
        id: c.id,
        user_id: userId,
        timestamp_ms: c.timestampMs,
        trigger_key: c.trigger,
        intensity: c.intensity,
        intervention_id: c.interventionId,
        delay_asked_minutes: c.delayAskedMinutes,
        delay_achieved_minutes: c.delayAchievedMinutes,
        outcome: c.outcome,
        note: c.note,
      }))
    );
    if (!error) {
      await markSynced('craving_logs', pending.cravings.map((c) => c.id));
      pushed += pending.cravings.length;
    }
  }

  if (pending.prices.length) {
    const { error } = await supabase.from('price_history').upsert(
      pending.prices.map((p) => ({
        id: p.id,
        user_id: userId,
        effective_from_ms: p.effectiveFromMs,
        price_per_pack: p.pricePerPack,
        cigarettes_per_pack: p.cigarettesPerPack,
        currency: p.currency,
      }))
    );
    if (!error) {
      await markSynced('price_history', pending.prices.map((p) => p.id));
      pushed += pending.prices.length;
    }
  }

  return pushed;
}

/**
 * Rows the account has that this device doesn't — the new-phone case. Inserted
 * with synced = 1, since by definition the server already has them.
 *
 * `INSERT OR IGNORE` on the primary key is what makes this safe to run
 * repeatedly: a row already held locally is left exactly as it is, including
 * its own unsynced edits.
 */
async function pull(): Promise<number> {
  const db = await getDb();
  const [localCigs, localCravings, localPrices] = await Promise.all([
    listCigarettes(),
    listCravings(),
    listPrices(),
  ]);
  const known = new Set([
    ...localCigs.map((r) => r.id),
    ...localCravings.map((r) => r.id),
    ...localPrices.map((r) => r.id),
  ]);

  let pulled = 0;

  const { data: cigs } = await supabase.from('cigarette_logs').select('*');
  for (const row of cigs ?? []) {
    if (known.has(row.id)) continue;
    await db.runAsync(
      `INSERT OR IGNORE INTO cigarette_logs (id, timestamp_ms, trigger_key, note, synced)
       VALUES (?, ?, ?, ?, 1)`,
      [row.id, row.timestamp_ms, row.trigger_key, row.note]
    );
    pulled += 1;
  }

  const { data: cravings } = await supabase.from('craving_logs').select('*');
  for (const row of cravings ?? []) {
    if (known.has(row.id)) continue;
    await db.runAsync(
      `INSERT OR IGNORE INTO craving_logs
         (id, timestamp_ms, trigger_key, intensity, intervention_id,
          delay_asked_minutes, delay_achieved_minutes, outcome, note, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        row.id,
        row.timestamp_ms,
        row.trigger_key,
        row.intensity,
        row.intervention_id,
        row.delay_asked_minutes,
        row.delay_achieved_minutes,
        row.outcome,
        row.note,
      ]
    );
    pulled += 1;
  }

  const { data: prices } = await supabase.from('price_history').select('*');
  for (const row of prices ?? []) {
    if (known.has(row.id)) continue;
    await db.runAsync(
      `INSERT OR IGNORE INTO price_history
         (id, effective_from_ms, price_per_pack, cigarettes_per_pack, currency, synced)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        row.id,
        row.effective_from_ms,
        row.price_per_pack,
        row.cigarettes_per_pack,
        row.currency,
      ]
    );
    pulled += 1;
  }

  return pulled;
}

let inFlight: Promise<SyncResult> | null = null;

/**
 * Safe to call from anywhere, as often as you like — overlapping calls share
 * one run rather than racing each other's upserts.
 */
export function syncNow(): Promise<SyncResult> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const userId = await currentUserId();
      if (!userId) return IDLE;
      const pushed = await push(userId);
      const pulled = await pull();
      return { pushed, pulled, ok: true };
    } catch {
      // Offline or the backend is unhappy. The `synced` flags are untouched,
      // so the next run picks up exactly where this one stopped.
      return IDLE;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** §23 — the remote half of account deletion. */
export async function deleteRemoteAccount(): Promise<boolean> {
  if (!hasSupabaseConfig()) return false;
  const { error } = await supabase.rpc('delete_my_account');
  return !error;
}
