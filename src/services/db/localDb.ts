// src/services/db/localDb.ts
//
// §20-21 — offline-first. Every write lands here first and is immediately
// readable; `synced` marks what still owes the server an upload. The AI
// features degrade to the rule-based engines when there's no network, not to
// an error state, and nothing on this layer ever touches it.
//
// The column set mirrors supabase/schema.sql exactly (minus `user_id`, which
// is meaningless on a single-user device and is attached at upload time).
// Indexes on timestamp_ms exist from the first migration rather than being
// added once the timeline screen gets slow (§27).

import * as SQLite from 'expo-sqlite';

import type {
  AiMemory,
  CigaretteLog,
  CravingLog,
  CravingOutcome,
  Intensity,
  PricePoint,
  Trigger,
} from '../../types';

const DB_NAME = 'smokeless.db';

/** Bumped whenever the statements in `migrate` grow a new step. */
const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Row ids are RFC-4122-shaped so the Postgres mirror can keep a `uuid` column.
 * These identify rows, they don't authorise anything, so `Math.random` is an
 * appropriate source here.
 */
export function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  if (current < 1) {
    // `trigger` is a reserved word in SQL, hence `trigger_key` in both this
    // schema and the Postgres one — same name in both places beats a quoted
    // identifier that only one of them needs.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cigarette_logs (
        id                  TEXT PRIMARY KEY NOT NULL,
        timestamp_ms        INTEGER NOT NULL,
        trigger_key         TEXT,
        note                TEXT,
        synced              INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_cigarette_logs_ts
        ON cigarette_logs (timestamp_ms DESC);
      CREATE INDEX IF NOT EXISTS idx_cigarette_logs_unsynced
        ON cigarette_logs (synced) WHERE synced = 0;

      CREATE TABLE IF NOT EXISTS craving_logs (
        id                     TEXT PRIMARY KEY NOT NULL,
        timestamp_ms           INTEGER NOT NULL,
        trigger_key            TEXT NOT NULL,
        intensity              INTEGER NOT NULL,
        intervention_id        TEXT NOT NULL,
        delay_asked_minutes    REAL NOT NULL,
        delay_achieved_minutes REAL,
        outcome                TEXT,
        note                   TEXT,
        synced                 INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_craving_logs_ts
        ON craving_logs (timestamp_ms DESC);
      CREATE INDEX IF NOT EXISTS idx_craving_logs_unsynced
        ON craving_logs (synced) WHERE synced = 0;

      CREATE TABLE IF NOT EXISTS price_history (
        id                  TEXT PRIMARY KEY NOT NULL,
        effective_from_ms   INTEGER NOT NULL,
        price_per_pack      REAL NOT NULL,
        cigarettes_per_pack INTEGER NOT NULL,
        currency            TEXT NOT NULL,
        synced              INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_price_history_from
        ON price_history (effective_from_ms DESC);

      CREATE TABLE IF NOT EXISTS ai_memory (
        id            INTEGER PRIMARY KEY CHECK (id = 1),
        payload       TEXT NOT NULL,
        updated_at_ms INTEGER NOT NULL
      );
    `);
  }

  // PRAGMA can't be parameterised.
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      // WAL keeps a craving write from blocking the dashboard's reads.
      await db.execAsync('PRAGMA journal_mode = WAL');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

/** Called once from the splash gate so the first screen never waits on I/O. */
export async function initLocalDb(): Promise<void> {
  await getDb();
}

// ---------------------------------------------------------------------------
// Row shapes — snake_case as stored, mapped at the boundary so nothing above
// this file has to know the column names.
// ---------------------------------------------------------------------------

interface CigaretteRow {
  id: string;
  timestamp_ms: number;
  trigger_key: string | null;
  note: string | null;
  synced: number;
}

interface CravingRow {
  id: string;
  timestamp_ms: number;
  trigger_key: string;
  intensity: number;
  intervention_id: string;
  delay_asked_minutes: number;
  delay_achieved_minutes: number | null;
  outcome: string | null;
  note: string | null;
  synced: number;
}

interface PriceRow {
  id: string;
  effective_from_ms: number;
  price_per_pack: number;
  cigarettes_per_pack: number;
  currency: string;
  synced: number;
}

const toCigarette = (r: CigaretteRow): CigaretteLog => ({
  id: r.id,
  timestampMs: r.timestamp_ms,
  trigger: (r.trigger_key as Trigger | null) ?? null,
  note: r.note,
  synced: r.synced,
});

const toCraving = (r: CravingRow): CravingLog => ({
  id: r.id,
  timestampMs: r.timestamp_ms,
  trigger: r.trigger_key as Trigger,
  intensity: r.intensity as Intensity,
  interventionId: r.intervention_id,
  delayAskedMinutes: r.delay_asked_minutes,
  delayAchievedMinutes: r.delay_achieved_minutes,
  outcome: (r.outcome as CravingOutcome | null) ?? null,
  note: r.note,
  synced: r.synced,
});

const toPrice = (r: PriceRow): PricePoint => ({
  id: r.id,
  effectiveFromMs: r.effective_from_ms,
  pricePerPack: r.price_per_pack,
  cigarettesPerPack: r.cigarettes_per_pack,
  currency: r.currency,
  synced: r.synced,
});

// ---------------------------------------------------------------------------
// Cigarettes
// ---------------------------------------------------------------------------

export async function insertCigarette(input: {
  timestampMs?: number;
  trigger?: Trigger | null;
  note?: string | null;
}): Promise<CigaretteLog> {
  const db = await getDb();
  const log: CigaretteLog = {
    id: newId(),
    timestampMs: input.timestampMs ?? Date.now(),
    trigger: input.trigger ?? null,
    note: input.note ?? null,
    synced: 0,
  };
  await db.runAsync(
    `INSERT INTO cigarette_logs (id, timestamp_ms, trigger_key, note, synced)
     VALUES (?, ?, ?, ?, 0)`,
    [log.id, log.timestampMs, log.trigger, log.note]
  );
  return log;
}

export async function listCigarettes(sinceMs = 0, untilMs = Number.MAX_SAFE_INTEGER) {
  const db = await getDb();
  const rows = await db.getAllAsync<CigaretteRow>(
    `SELECT * FROM cigarette_logs
      WHERE timestamp_ms >= ? AND timestamp_ms < ?
      ORDER BY timestamp_ms DESC`,
    [sinceMs, untilMs]
  );
  return rows.map(toCigarette);
}

export async function lastCigaretteAt(): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ ts: number | null }>(
    'SELECT MAX(timestamp_ms) AS ts FROM cigarette_logs'
  );
  return row?.ts ?? null;
}

export async function deleteCigarette(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cigarette_logs WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// Cravings
// ---------------------------------------------------------------------------

export async function insertCraving(input: {
  trigger: Trigger;
  intensity: Intensity;
  interventionId: string;
  delayAskedMinutes: number;
  timestampMs?: number;
}): Promise<CravingLog> {
  const db = await getDb();
  const log: CravingLog = {
    id: newId(),
    timestampMs: input.timestampMs ?? Date.now(),
    trigger: input.trigger,
    intensity: input.intensity,
    interventionId: input.interventionId,
    delayAskedMinutes: input.delayAskedMinutes,
    delayAchievedMinutes: null,
    outcome: null,
    note: null,
    synced: 0,
  };
  await db.runAsync(
    `INSERT INTO craving_logs
       (id, timestamp_ms, trigger_key, intensity, intervention_id,
        delay_asked_minutes, delay_achieved_minutes, outcome, note, synced)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, 0)`,
    [
      log.id,
      log.timestampMs,
      log.trigger,
      log.intensity,
      log.interventionId,
      log.delayAskedMinutes,
    ]
  );
  return log;
}

export async function resolveCraving(
  id: string,
  outcome: CravingOutcome,
  delayAchievedMinutes: number
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE craving_logs
        SET outcome = ?, delay_achieved_minutes = ?, synced = 0
      WHERE id = ?`,
    [outcome, delayAchievedMinutes, id]
  );
}

export async function listCravings(sinceMs = 0, untilMs = Number.MAX_SAFE_INTEGER) {
  const db = await getDb();
  const rows = await db.getAllAsync<CravingRow>(
    `SELECT * FROM craving_logs
      WHERE timestamp_ms >= ? AND timestamp_ms < ?
      ORDER BY timestamp_ms DESC`,
    [sinceMs, untilMs]
  );
  return rows.map(toCraving);
}

/** Most recent first, resolved only — what the momentum multiplier reads. */
export async function listResolvedCravings(limit: number): Promise<CravingLog[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CravingRow>(
    `SELECT * FROM craving_logs
      WHERE outcome IS NOT NULL
      ORDER BY timestamp_ms DESC
      LIMIT ?`,
    [limit]
  );
  return rows.map(toCraving);
}

// ---------------------------------------------------------------------------
// Prices (§15 — time-versioned, never a constant)
// ---------------------------------------------------------------------------

export async function setPrice(input: {
  pricePerPack: number;
  cigarettesPerPack: number;
  currency: string;
  effectiveFromMs?: number;
}): Promise<PricePoint> {
  const db = await getDb();
  const point: PricePoint = {
    id: newId(),
    effectiveFromMs: input.effectiveFromMs ?? Date.now(),
    pricePerPack: input.pricePerPack,
    cigarettesPerPack: input.cigarettesPerPack,
    currency: input.currency,
    synced: 0,
  };
  await db.runAsync(
    `INSERT INTO price_history
       (id, effective_from_ms, price_per_pack, cigarettes_per_pack, currency, synced)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [
      point.id,
      point.effectiveFromMs,
      point.pricePerPack,
      point.cigarettesPerPack,
      point.currency,
    ]
  );
  return point;
}

export async function listPrices(): Promise<PricePoint[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<PriceRow>(
    'SELECT * FROM price_history ORDER BY effective_from_ms ASC'
  );
  return rows.map(toPrice);
}

// ---------------------------------------------------------------------------
// AI memory (§6 — aggregates only, never transcripts)
// ---------------------------------------------------------------------------

export async function readAiMemory(): Promise<AiMemory | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM ai_memory WHERE id = 1'
  );
  if (!row) return null;
  try {
    return JSON.parse(row.payload) as AiMemory;
  } catch {
    return null;
  }
}

export async function writeAiMemory(memory: AiMemory): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO ai_memory (id, payload, updated_at_ms) VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET payload = excluded.payload,
                                     updated_at_ms = excluded.updated_at_ms`,
    [JSON.stringify(memory), memory.updatedAtMs]
  );
}

export async function clearAiMemory(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM ai_memory');
}

// ---------------------------------------------------------------------------
// Sync queue support (§20) and account deletion (§23)
// ---------------------------------------------------------------------------

export async function pendingUploads(): Promise<{
  cigarettes: CigaretteLog[];
  cravings: CravingLog[];
  prices: PricePoint[];
}> {
  const db = await getDb();
  const [cig, crav, price] = await Promise.all([
    db.getAllAsync<CigaretteRow>('SELECT * FROM cigarette_logs WHERE synced = 0'),
    db.getAllAsync<CravingRow>('SELECT * FROM craving_logs WHERE synced = 0'),
    db.getAllAsync<PriceRow>('SELECT * FROM price_history WHERE synced = 0'),
  ]);
  return {
    cigarettes: cig.map(toCigarette),
    cravings: crav.map(toCraving),
    prices: price.map(toPrice),
  };
}

const SYNCABLE_TABLES = ['cigarette_logs', 'craving_logs', 'price_history'] as const;
export type SyncableTable = (typeof SYNCABLE_TABLES)[number];

export async function markSynced(table: SyncableTable, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  // The table name is constrained to the union above, and the ids go through
  // bound parameters — no string-built values reach SQLite.
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE ${table} SET synced = 1 WHERE id IN (${placeholders})`,
    ids
  );
}

export async function countAllRecords(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT (SELECT COUNT(*) FROM cigarette_logs)
          + (SELECT COUNT(*) FROM craving_logs)
          + (SELECT COUNT(*) FROM price_history) AS n`
  );
  return row?.n ?? 0;
}

/** Everything, in one object — §23 export. */
export async function exportEverything() {
  const [cigarettes, cravings, prices, memory] = await Promise.all([
    listCigarettes(),
    listCravings(),
    listPrices(),
    readAiMemory(),
  ]);
  return {
    exportedAtMs: Date.now(),
    schemaVersion: SCHEMA_VERSION,
    cigarettes,
    cravings,
    prices,
    aiMemory: memory,
  };
}

/** §23 — the local half of account deletion. */
export async function clearAll(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM cigarette_logs;
    DELETE FROM craving_logs;
    DELETE FROM price_history;
    DELETE FROM ai_memory;
  `);
}
