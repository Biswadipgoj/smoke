// src/services/db/localDb.ts
// ─────────────────────────────────────────────────────────────────────────────
// Local SQLite — the app's source of truth (§20, offline-first).
//
// Every write lands here first and is immediately readable; the `synced` flag
// per row is what the sync queue (src/services/sync/syncQueue.ts) drains to
// Supabase when there's a session and a network. Nothing in the UI waits on
// the network, because a craving is happening *right now*.
//
// This file is also the Behavior Analysis Engine (§3): the rolling stats that
// feed the delay algorithm, the intervention engine and the insight generator
// are all SQL over these tables, so they cost nothing to keep current.
//
// Schema mirrors supabase/schema.sql and src/types/index.ts — change all three.
// ─────────────────────────────────────────────────────────────────────────────

import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type {
  BehaviorStats,
  CigaretteLog,
  CravingLog,
  Goal,
  InterventionId,
  Intensity,
  PricePoint,
  TodayStats,
  Trigger,
  UserProfile,
} from '../../types';
import { DAY_MS, dayKey, startOfDayMs } from '../../utils/format';
import { uid } from '../../utils/uid';

const DB_NAME = 'smokeless.db';

/** With no history at all, assume a 90-minute gap between cigarettes (§8). */
export const FALLBACK_INTERVAL_MINUTES = 90;

let dbPromise: Promise<SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) dbPromise = openAndMigrate();
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrate(db);
  return db;
}

async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;

  if (version < 1) {
    // Indexes on timestamp_ms exist from the first migration rather than being
    // bolted on once the timeline screen gets slow (§27).
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cigarette_logs (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        timestamp_ms INTEGER NOT NULL,
        count INTEGER NOT NULL DEFAULT 1,
        trigger TEXT,
        note TEXT,
        from_craving INTEGER NOT NULL DEFAULT 0,
        synced INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_cigarette_logs_ts ON cigarette_logs (timestamp_ms DESC);
      CREATE INDEX IF NOT EXISTS idx_cigarette_logs_synced ON cigarette_logs (synced);

      CREATE TABLE IF NOT EXISTS craving_logs (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        timestamp_ms INTEGER NOT NULL,
        trigger TEXT NOT NULL,
        intensity INTEGER NOT NULL,
        asked_delay_minutes INTEGER NOT NULL,
        actual_delay_minutes INTEGER NOT NULL DEFAULT 0,
        intervention TEXT,
        outcome TEXT NOT NULL,
        note TEXT,
        synced INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_craving_logs_ts ON craving_logs (timestamp_ms DESC);
      CREATE INDEX IF NOT EXISTS idx_craving_logs_synced ON craving_logs (synced);

      CREATE TABLE IF NOT EXISTS price_history (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        price_per_cigarette REAL NOT NULL,
        currency TEXT NOT NULL,
        effective_from_ms INTEGER NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_price_history_from ON price_history (effective_from_ms DESC);

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        target_per_day INTEGER NOT NULL,
        created_at_ms INTEGER NOT NULL,
        target_date_ms INTEGER,
        achieved_at_ms INTEGER,
        synced INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_goals_created ON goals (created_at_ms DESC);
    `);
    await db.execAsync('PRAGMA user_version = 1');
  }
}

// ── Row mapping ──────────────────────────────────────────────────────────────

interface CigaretteRow {
  id: string;
  user_id: string | null;
  timestamp_ms: number;
  count: number;
  trigger: string | null;
  note: string | null;
  from_craving: number;
  synced: number;
}

interface CravingRow {
  id: string;
  user_id: string | null;
  timestamp_ms: number;
  trigger: string;
  intensity: number;
  asked_delay_minutes: number;
  actual_delay_minutes: number;
  intervention: string | null;
  outcome: string;
  note: string | null;
  synced: number;
}

interface PriceRow {
  id: string;
  user_id: string | null;
  price_per_cigarette: number;
  currency: string;
  effective_from_ms: number;
  synced: number;
}

interface GoalRow {
  id: string;
  user_id: string | null;
  target_per_day: number;
  created_at_ms: number;
  target_date_ms: number | null;
  achieved_at_ms: number | null;
  synced: number;
}

const toCigarette = (r: CigaretteRow): CigaretteLog => ({
  id: r.id,
  userId: r.user_id,
  timestampMs: r.timestamp_ms,
  count: r.count,
  trigger: (r.trigger as Trigger | null) ?? null,
  note: r.note,
  fromCraving: r.from_craving === 1,
  synced: r.synced === 1,
});

const toCraving = (r: CravingRow): CravingLog => ({
  id: r.id,
  userId: r.user_id,
  timestampMs: r.timestamp_ms,
  trigger: r.trigger as Trigger,
  intensity: r.intensity as Intensity,
  askedDelayMinutes: r.asked_delay_minutes,
  actualDelayMinutes: r.actual_delay_minutes,
  intervention: (r.intervention as InterventionId | null) ?? null,
  outcome: r.outcome as CravingLog['outcome'],
  note: r.note,
  synced: r.synced === 1,
});

const toPrice = (r: PriceRow): PricePoint => ({
  id: r.id,
  userId: r.user_id,
  pricePerCigarette: r.price_per_cigarette,
  currency: r.currency,
  effectiveFromMs: r.effective_from_ms,
  synced: r.synced === 1,
});

const toGoal = (r: GoalRow): Goal => ({
  id: r.id,
  userId: r.user_id,
  targetPerDay: r.target_per_day,
  createdAtMs: r.created_at_ms,
  targetDateMs: r.target_date_ms,
  achievedAtMs: r.achieved_at_ms,
  synced: r.synced === 1,
});

// ── Writes ───────────────────────────────────────────────────────────────────

export async function insertCigaretteLog(
  input: Partial<CigaretteLog> & { userId: string | null }
): Promise<CigaretteLog> {
  const db = await getDb();
  const log: CigaretteLog = {
    id: input.id ?? uid(),
    userId: input.userId,
    timestampMs: input.timestampMs ?? Date.now(),
    count: input.count ?? 1,
    trigger: input.trigger ?? null,
    note: input.note ?? null,
    fromCraving: input.fromCraving ?? false,
    synced: false,
  };
  await db.runAsync(
    `INSERT INTO cigarette_logs (id, user_id, timestamp_ms, count, trigger, note, from_craving, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [log.id, log.userId, log.timestampMs, log.count, log.trigger, log.note, log.fromCraving ? 1 : 0]
  );
  return log;
}

export async function insertCravingLog(
  input: Omit<CravingLog, 'id' | 'synced'> & { id?: string }
): Promise<CravingLog> {
  const db = await getDb();
  const log: CravingLog = { ...input, id: input.id ?? uid(), synced: false };
  await db.runAsync(
    `INSERT INTO craving_logs
       (id, user_id, timestamp_ms, trigger, intensity, asked_delay_minutes,
        actual_delay_minutes, intervention, outcome, note, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      log.id,
      log.userId,
      log.timestampMs,
      log.trigger,
      log.intensity,
      log.askedDelayMinutes,
      log.actualDelayMinutes,
      log.intervention,
      log.outcome,
      log.note,
    ]
  );
  return log;
}

export async function insertPricePoint(
  pricePerCigarette: number,
  currency: string,
  userId: string | null,
  effectiveFromMs = Date.now()
): Promise<PricePoint> {
  const db = await getDb();
  const point: PricePoint = {
    id: uid(),
    userId,
    pricePerCigarette,
    currency,
    effectiveFromMs,
    synced: false,
  };
  await db.runAsync(
    `INSERT INTO price_history (id, user_id, price_per_cigarette, currency, effective_from_ms, synced)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [point.id, point.userId, point.pricePerCigarette, point.currency, point.effectiveFromMs]
  );
  return point;
}

export async function insertGoal(
  targetPerDay: number,
  userId: string | null,
  targetDateMs: number | null = null
): Promise<Goal> {
  const db = await getDb();
  const goal: Goal = {
    id: uid(),
    userId,
    targetPerDay,
    createdAtMs: Date.now(),
    targetDateMs,
    achievedAtMs: null,
    synced: false,
  };
  await db.runAsync(
    `INSERT INTO goals (id, user_id, target_per_day, created_at_ms, target_date_ms, achieved_at_ms, synced)
     VALUES (?, ?, ?, ?, ?, NULL, 0)`,
    [goal.id, goal.userId, goal.targetPerDay, goal.createdAtMs, goal.targetDateMs]
  );
  return goal;
}

/**
 * The craving row is written the moment the outcome is known, so the record
 * exists even if the user closes the app on the next screen. The note is
 * optional and arrives afterwards, if at all.
 */
export async function setCravingNote(id: string, note: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE craving_logs SET note = ?, synced = 0 WHERE id = ?', [note, id]);
}

export async function markGoalAchieved(id: string, achievedAtMs = Date.now()): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE goals SET achieved_at_ms = ?, synced = 0 WHERE id = ?', [
    achievedAtMs,
    id,
  ]);
}

export async function deleteCigaretteLog(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cigarette_logs WHERE id = ?', [id]);
}

/** Wipes every local table. Used by account deletion and by sign-out on a shared device. */
export async function clearLocalData(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM cigarette_logs;
    DELETE FROM craving_logs;
    DELETE FROM price_history;
    DELETE FROM goals;
  `);
}

/** Stamps rows written before sign-in with the now-known user id. */
export async function claimRowsForUser(userId: string): Promise<void> {
  const db = await getDb();
  await db.execAsync('BEGIN');
  try {
    for (const table of ['cigarette_logs', 'craving_logs', 'price_history', 'goals']) {
      await db.runAsync(`UPDATE ${table} SET user_id = ?, synced = 0 WHERE user_id IS NULL`, [
        userId,
      ]);
    }
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function listCigaretteLogs(limit = 200, sinceMs?: number): Promise<CigaretteLog[]> {
  const db = await getDb();
  const rows = sinceMs
    ? await db.getAllAsync<CigaretteRow>(
        'SELECT * FROM cigarette_logs WHERE timestamp_ms >= ? ORDER BY timestamp_ms DESC LIMIT ?',
        [sinceMs, limit]
      )
    : await db.getAllAsync<CigaretteRow>(
        'SELECT * FROM cigarette_logs ORDER BY timestamp_ms DESC LIMIT ?',
        [limit]
      );
  return rows.map(toCigarette);
}

export async function listCravingLogs(limit = 200, sinceMs?: number): Promise<CravingLog[]> {
  const db = await getDb();
  const rows = sinceMs
    ? await db.getAllAsync<CravingRow>(
        'SELECT * FROM craving_logs WHERE timestamp_ms >= ? ORDER BY timestamp_ms DESC LIMIT ?',
        [sinceMs, limit]
      )
    : await db.getAllAsync<CravingRow>(
        'SELECT * FROM craving_logs ORDER BY timestamp_ms DESC LIMIT ?',
        [limit]
      );
  return rows.map(toCraving);
}

export async function listPriceHistory(): Promise<PricePoint[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<PriceRow>(
    'SELECT * FROM price_history ORDER BY effective_from_ms DESC'
  );
  return rows.map(toPrice);
}

/**
 * The price in force at a given instant (§15). Falls back to the earliest
 * price ever recorded so cigarettes logged *before* the first price entry
 * still cost something rather than silently costing zero.
 */
export async function priceAt(timestampMs: number): Promise<PricePoint | null> {
  const db = await getDb();
  const row =
    (await db.getFirstAsync<PriceRow>(
      `SELECT * FROM price_history WHERE effective_from_ms <= ?
       ORDER BY effective_from_ms DESC LIMIT 1`,
      [timestampMs]
    )) ??
    (await db.getFirstAsync<PriceRow>(
      'SELECT * FROM price_history ORDER BY effective_from_ms ASC LIMIT 1'
    ));
  return row ? toPrice(row) : null;
}

export async function currentPrice(): Promise<PricePoint | null> {
  return priceAt(Date.now());
}

export async function activeGoal(): Promise<Goal | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<GoalRow>(
    'SELECT * FROM goals ORDER BY created_at_ms DESC LIMIT 1'
  );
  return row ? toGoal(row) : null;
}

export async function listGoals(): Promise<Goal[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<GoalRow>('SELECT * FROM goals ORDER BY created_at_ms DESC');
  return rows.map(toGoal);
}

export async function lastCigaretteMs(): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ ts: number | null }>(
    'SELECT MAX(timestamp_ms) AS ts FROM cigarette_logs'
  );
  return row?.ts ?? null;
}

export async function totalCigarettes(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(count) AS total FROM cigarette_logs'
  );
  return row?.total ?? 0;
}

/** Cigarettes per calendar day for the last `days` days, oldest first. */
export async function dailyCounts(days: number): Promise<Array<{ dayMs: number; count: number }>> {
  const db = await getDb();
  const start = startOfDayMs(Date.now()) - (days - 1) * DAY_MS;
  const rows = await db.getAllAsync<CigaretteRow>(
    'SELECT * FROM cigarette_logs WHERE timestamp_ms >= ? ORDER BY timestamp_ms ASC',
    [start]
  );
  const buckets = new Map<number, number>();
  for (let i = 0; i < days; i += 1) buckets.set(start + i * DAY_MS, 0);
  for (const row of rows) {
    const day = startOfDayMs(row.timestamp_ms);
    buckets.set(day, (buckets.get(day) ?? 0) + row.count);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([dayMs, count]) => ({ dayMs, count }));
}

/** Cigarettes and cravings keyed by YYYY-MM-DD, for the calendar month view. */
export async function countsByDay(
  fromMs: number,
  toMs: number
): Promise<Record<string, { cigarettes: number; cravings: number; delayed: number }>> {
  const db = await getDb();
  const [cigarettes, cravings] = await Promise.all([
    db.getAllAsync<CigaretteRow>(
      'SELECT * FROM cigarette_logs WHERE timestamp_ms >= ? AND timestamp_ms < ?',
      [fromMs, toMs]
    ),
    db.getAllAsync<CravingRow>(
      'SELECT * FROM craving_logs WHERE timestamp_ms >= ? AND timestamp_ms < ?',
      [fromMs, toMs]
    ),
  ]);
  const out: Record<string, { cigarettes: number; cravings: number; delayed: number }> = {};
  const bucket = (key: string) => (out[key] ??= { cigarettes: 0, cravings: 0, delayed: 0 });
  for (const row of cigarettes) bucket(dayKey(row.timestamp_ms)).cigarettes += row.count;
  for (const row of cravings) {
    const day = bucket(dayKey(row.timestamp_ms));
    day.cravings += 1;
    if (row.outcome === 'delayed') day.delayed += 1;
  }
  return out;
}

// ── Today ────────────────────────────────────────────────────────────────────

export async function getTodayStats(profile: UserProfile | null): Promise<TodayStats> {
  const db = await getDb();
  const dayStart = startOfDayMs(Date.now());

  const [cigarettes, cravings, last, price] = await Promise.all([
    db.getFirstAsync<{ total: number | null }>(
      'SELECT SUM(count) AS total FROM cigarette_logs WHERE timestamp_ms >= ?',
      [dayStart]
    ),
    db.getAllAsync<{ outcome: string }>(
      'SELECT outcome FROM craving_logs WHERE timestamp_ms >= ?',
      [dayStart]
    ),
    lastCigaretteMs(),
    currentPrice(),
  ]);

  const smoked = cigarettes?.total ?? 0;
  const baseline = profile?.baselinePerDay ?? 0;
  const avoided = Math.max(0, baseline - smoked);
  const perCigarette = price?.pricePerCigarette ?? 0;

  return {
    cigarettesToday: smoked,
    cravingsToday: cravings.length,
    cravingsDelayedToday: cravings.filter((c) => c.outcome === 'delayed').length,
    lastCigaretteMs: last,
    moneySavedToday: avoided * perCigarette,
    avoidedToday: avoided,
    currency: price?.currency ?? profile?.currency ?? '₹',
  };
}

/**
 * Total money not spent since the user started, measured against their
 * baseline and priced with whatever the price was on each day (§15).
 */
export async function totalMoneySaved(profile: UserProfile | null): Promise<number> {
  if (!profile) return 0;
  const days = Math.max(
    1,
    Math.floor((startOfDayMs(Date.now()) - startOfDayMs(profile.startedAtMs)) / DAY_MS) + 1
  );
  const counts = await dailyCounts(days);
  const prices = await listPriceHistory();
  if (prices.length === 0) return 0;

  const priceOn = (dayMs: number): number => {
    const match = prices.find((p) => p.effectiveFromMs <= dayMs + DAY_MS - 1);
    return (match ?? prices[prices.length - 1]).pricePerCigarette;
  };

  return counts.reduce((total, day) => {
    const avoided = Math.max(0, profile.baselinePerDay - day.count);
    return total + avoided * priceOn(day.dayMs);
  }, 0);
}

// ── Behavior Analysis Engine (§3) ────────────────────────────────────────────

export async function getBehaviorStats(): Promise<BehaviorStats> {
  const db = await getDb();
  const now = Date.now();
  const fourteenDays = now - 14 * DAY_MS;
  const thirtyDays = now - 30 * DAY_MS;

  const [recent14, cravings30, recentCravings, allCravings] = await Promise.all([
    db.getAllAsync<{ timestamp_ms: number }>(
      'SELECT timestamp_ms FROM cigarette_logs WHERE timestamp_ms >= ? ORDER BY timestamp_ms ASC',
      [fourteenDays]
    ),
    db.getAllAsync<CravingRow>(
      'SELECT * FROM craving_logs WHERE timestamp_ms >= ? ORDER BY timestamp_ms DESC',
      [thirtyDays]
    ),
    db.getAllAsync<{ outcome: string }>(
      'SELECT outcome FROM craving_logs ORDER BY timestamp_ms DESC LIMIT 5'
    ),
    db.getFirstAsync<{ total: number; delayed: number }>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN outcome = 'delayed' THEN 1 ELSE 0 END) AS delayed
       FROM craving_logs`
    ),
  ]);

  // Baseline interval: mean gap between consecutive cigarettes over 14 days.
  // Gaps longer than 12 hours are dropped — those are sleep, not restraint,
  // and including them inflates the interval enough to make the first ask
  // absurd.
  const gaps: number[] = [];
  for (let i = 1; i < recent14.length; i += 1) {
    const gap = recent14[i].timestamp_ms - recent14[i - 1].timestamp_ms;
    if (gap > 0 && gap <= 12 * 3600_000) gaps.push(gap);
  }
  const baselineIntervalMinutes =
    gaps.length >= 3
      ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length / 60_000)
      : FALLBACK_INTERVAL_MINUTES;

  // Two 7-day windows for the insight generator.
  const sevenDays = now - 7 * DAY_MS;
  const recentWindow = recent14.filter((r) => r.timestamp_ms >= sevenDays).length;
  const priorWindow = recent14.filter((r) => r.timestamp_ms < sevenDays).length;

  // Trigger frequency across both cigarettes and cravings — a trigger that
  // shows up in cravings the user survived still tells us what sets them off.
  const triggerCounts = new Map<Trigger, number>();
  const cigTriggers = await db.getAllAsync<{ trigger: string | null }>(
    'SELECT trigger FROM cigarette_logs WHERE timestamp_ms >= ? AND trigger IS NOT NULL',
    [thirtyDays]
  );
  for (const row of cigTriggers) {
    const trigger = row.trigger as Trigger;
    triggerCounts.set(trigger, (triggerCounts.get(trigger) ?? 0) + 1);
  }
  for (const row of cravings30) {
    const trigger = row.trigger as Trigger;
    triggerCounts.set(trigger, (triggerCounts.get(trigger) ?? 0) + 1);
  }

  const hourRows = await db.getAllAsync<{ timestamp_ms: number }>(
    'SELECT timestamp_ms FROM cigarette_logs WHERE timestamp_ms >= ?',
    [thirtyDays]
  );
  const hourHistogram = new Array(24).fill(0) as number[];
  for (const row of hourRows) hourHistogram[new Date(row.timestamp_ms).getHours()] += 1;

  const interventionStats = new Map<InterventionId, { uses: number; wins: number }>();
  for (const row of cravings30) {
    if (!row.intervention) continue;
    const key = row.intervention as InterventionId;
    const entry = interventionStats.get(key) ?? { uses: 0, wins: 0 };
    entry.uses += 1;
    if (row.outcome === 'delayed') entry.wins += 1;
    interventionStats.set(key, entry);
  }

  const delayedRecent = recentCravings.filter((c) => c.outcome === 'delayed').length;

  return {
    baselineIntervalMinutes,
    recentDailyAverage: recentWindow / 7,
    priorDailyAverage: priorWindow / 7,
    triggerFrequency: [...triggerCounts.entries()]
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count),
    hourHistogram,
    // With no history we assume neither momentum nor a bad week: 0.5 leaves
    // momentumMultiplier neutral rather than punishing a brand-new user.
    recentSuccessRate: recentCravings.length === 0 ? 0.5 : delayedRecent / recentCravings.length,
    effectiveInterventions: [...interventionStats.entries()]
      .map(([intervention, s]) => ({
        intervention,
        successRate: s.wins / s.uses,
        uses: s.uses,
      }))
      .sort((a, b) => b.successRate - a.successRate || b.uses - a.uses),
    totalCravings: allCravings?.total ?? 0,
    totalDelayed: allCravings?.delayed ?? 0,
  };
}

// ── Sync queue support ───────────────────────────────────────────────────────

export interface UnsyncedBatch {
  cigarettes: CigaretteLog[];
  cravings: CravingLog[];
  prices: PricePoint[];
  goals: Goal[];
}

export async function unsyncedRows(limit = 200): Promise<UnsyncedBatch> {
  const db = await getDb();
  const [cigarettes, cravings, prices, goals] = await Promise.all([
    db.getAllAsync<CigaretteRow>(
      'SELECT * FROM cigarette_logs WHERE synced = 0 ORDER BY timestamp_ms ASC LIMIT ?',
      [limit]
    ),
    db.getAllAsync<CravingRow>(
      'SELECT * FROM craving_logs WHERE synced = 0 ORDER BY timestamp_ms ASC LIMIT ?',
      [limit]
    ),
    db.getAllAsync<PriceRow>('SELECT * FROM price_history WHERE synced = 0 LIMIT ?', [limit]),
    db.getAllAsync<GoalRow>('SELECT * FROM goals WHERE synced = 0 LIMIT ?', [limit]),
  ]);
  return {
    cigarettes: cigarettes.map(toCigarette),
    cravings: cravings.map(toCraving),
    prices: prices.map(toPrice),
    goals: goals.map(toGoal),
  };
}

export async function countUnsynced(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT
       (SELECT COUNT(*) FROM cigarette_logs WHERE synced = 0) +
       (SELECT COUNT(*) FROM craving_logs WHERE synced = 0) +
       (SELECT COUNT(*) FROM price_history WHERE synced = 0) +
       (SELECT COUNT(*) FROM goals WHERE synced = 0) AS total`
  );
  return row?.total ?? 0;
}

export async function markSynced(
  table: 'cigarette_logs' | 'craving_logs' | 'price_history' | 'goals',
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(', ');
  await db.runAsync(`UPDATE ${table} SET synced = 1 WHERE id IN (${placeholders})`, ids);
}

/** Replaces local rows with rows pulled from the server (server wins on a fresh device). */
export async function replaceFromRemote(batch: UnsyncedBatch): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const row of batch.cigarettes) {
      await db.runAsync(
        `INSERT OR REPLACE INTO cigarette_logs
           (id, user_id, timestamp_ms, count, trigger, note, from_craving, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [row.id, row.userId, row.timestampMs, row.count, row.trigger, row.note, row.fromCraving ? 1 : 0]
      );
    }
    for (const row of batch.cravings) {
      await db.runAsync(
        `INSERT OR REPLACE INTO craving_logs
           (id, user_id, timestamp_ms, trigger, intensity, asked_delay_minutes,
            actual_delay_minutes, intervention, outcome, note, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          row.id,
          row.userId,
          row.timestampMs,
          row.trigger,
          row.intensity,
          row.askedDelayMinutes,
          row.actualDelayMinutes,
          row.intervention,
          row.outcome,
          row.note,
        ]
      );
    }
    for (const row of batch.prices) {
      await db.runAsync(
        `INSERT OR REPLACE INTO price_history
           (id, user_id, price_per_cigarette, currency, effective_from_ms, synced)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [row.id, row.userId, row.pricePerCigarette, row.currency, row.effectiveFromMs]
      );
    }
    for (const row of batch.goals) {
      await db.runAsync(
        `INSERT OR REPLACE INTO goals
           (id, user_id, target_per_day, created_at_ms, target_date_ms, achieved_at_ms, synced)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [row.id, row.userId, row.targetPerDay, row.createdAtMs, row.targetDateMs, row.achievedAtMs]
      );
    }
  });
}

/** Everything on this device, for the Backup screen's export file. */
export async function exportAll(): Promise<{
  cigarettes: CigaretteLog[];
  cravings: CravingLog[];
  prices: PricePoint[];
  goals: Goal[];
}> {
  const db = await getDb();
  const [cigarettes, cravings, prices, goals] = await Promise.all([
    db.getAllAsync<CigaretteRow>('SELECT * FROM cigarette_logs ORDER BY timestamp_ms ASC'),
    db.getAllAsync<CravingRow>('SELECT * FROM craving_logs ORDER BY timestamp_ms ASC'),
    db.getAllAsync<PriceRow>('SELECT * FROM price_history ORDER BY effective_from_ms ASC'),
    db.getAllAsync<GoalRow>('SELECT * FROM goals ORDER BY created_at_ms ASC'),
  ]);
  return {
    cigarettes: cigarettes.map(toCigarette),
    cravings: cravings.map(toCraving),
    prices: prices.map(toPrice),
    goals: goals.map(toGoal),
  };
}
