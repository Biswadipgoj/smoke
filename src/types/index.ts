// src/types/index.ts
//
// Master build plan §24 — the single source of shape truth. The SQL schema
// (supabase/schema.sql) and the local SQLite schema (src/services/db/localDb.ts)
// mirror these definitions so all three layers agree.
//
// Convention: every timestamp is `...Ms` — epoch milliseconds, UTC. Nothing in
// this app stores a formatted date string; formatting is a render concern.

/**
 * §7 trigger list. "break" ("bathroom / break") is deliberately present — the
 * brief's own list dropped it, the plan puts it back. See the plan's
 * "How this was scoped", point 2.
 */
export const TRIGGERS = [
  'stress',
  'boredom',
  'after_food',
  'tea_coffee',
  'work',
  'social',
  'habit',
  'anxiety',
  'alcohol',
  'break',
  'other',
] as const;

export type Trigger = (typeof TRIGGERS)[number];

/** §6 — five tone instructions over one consistent persona, not five personas. */
export const COACH_STYLES = [
  'calm',
  'direct',
  'scientific',
  'encouraging',
  'minimal',
] as const;

export type CoachStyle = (typeof COACH_STYLES)[number];

/** §17 — en ships final, hi/bn ship as solid starting translations. */
export const LANGUAGES = ['en', 'hi', 'bn'] as const;
export type Language = (typeof LANGUAGES)[number];

/**
 * §7 — the outcome of a craving, logged neutrally either way. There is no
 * "failed" outcome in this type on purpose: `smoked` is a data point.
 */
export type CravingOutcome = 'delayed' | 'smoked' | 'abandoned';

/** Craving intensity, 1–5. */
export type Intensity = 1 | 2 | 3 | 4 | 5;

/** §13 — what the horizon advances on. Never "opened the app". */
export type ProgressEvent =
  | 'craving_delayed'
  | 'reduction_vs_baseline'
  | 'replacement_action'
  | 'reflection';

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export interface CigaretteLog {
  id: string;
  timestampMs: number;
  trigger: Trigger | null;
  /** Free text. Treated as sensitive — see the encryption TODO in schema.sql. */
  note: string | null;
  /** Sync-queue flag (§20). 0 = pending upload, 1 = confirmed remote. */
  synced: number;
}

export interface CravingLog {
  id: string;
  timestampMs: number;
  trigger: Trigger;
  intensity: Intensity;
  /** Which intervention the engine offered (§3-6). */
  interventionId: string;
  /** What the delay algorithm asked for, in minutes (§8). */
  delayAskedMinutes: number;
  /** How long the user actually held out. Null until the flow resolves. */
  delayAchievedMinutes: number | null;
  outcome: CravingOutcome | null;
  note: string | null;
  synced: number;
}

/**
 * §15 — price is time-versioned, never a constant. Cost for a given cigarette
 * joins against whichever point was effective at that cigarette's timestamp.
 */
export interface PricePoint {
  id: string;
  effectiveFromMs: number;
  pricePerPack: number;
  cigarettesPerPack: number;
  /** ISO 4217, e.g. "INR". */
  currency: string;
  synced: number;
}

export type GoalType = 'reduce' | 'quit';

export interface UserProfile {
  /** Supabase auth user id, or a local uuid while signed out. */
  id: string;
  language: Language;
  coachStyle: CoachStyle;
  /** Self-reported at onboarding; the baseline everything is measured against. */
  baselineCigarettesPerDay: number;
  goalType: GoalType;
  /** Only meaningful when goalType === 'reduce'. */
  targetCigarettesPerDay: number;
  /** Only meaningful when goalType === 'quit'. */
  quitDateMs: number | null;
  createdAtMs: number;
  /** §22 — biometric app lock. */
  appLockEnabled: boolean;
  /** §22 — daily check-in reminder, null when off. */
  reminderHour: number | null;
  onboardingCompleted: boolean;
}

/** Rendered on the dashboard (§9). All derived, never stored. */
export interface TodayStats {
  cigarettes: number;
  cravings: number;
  cravingsDelayed: number;
  /** Minutes since the most recent cigarette, null if there has never been one. */
  minutesSinceLast: number | null;
  moneySpent: number;
  /** Versus baseline consumption at today's effective price. */
  moneySaved: number;
  currency: string;
}

/**
 * §3-6 Behavior Analysis Engine output. Everything the rule-based engines and
 * the AI prompt need, computed from local rows with no network involved.
 */
export interface BehaviorSummary {
  /** 14-day rolling average gap between cigarettes, minutes. */
  baselineIntervalMinutes: number;
  /** True when the interval is a real measurement rather than the fallback. */
  hasIntervalHistory: boolean;
  /** Trigger → share of logged cravings, 0–1, descending. */
  triggerFrequency: { trigger: Trigger; share: number; count: number }[];
  /** 24 buckets, count of cigarettes per hour of day. */
  hourHistogram: number[];
  /** Rolling success rate over the last 5 resolved cravings, 0–1. */
  recentSuccessRate: number;
  resolvedCravingCount: number;
  /** Intervention id → how often it preceded a delayed outcome, 0–1. */
  interventionEffectiveness: { interventionId: string; rate: number; uses: number }[];
  cigarettesPerDayRecent: number;
}

/**
 * §6 — the only thing that persists between AI sessions. Aggregates, never
 * transcripts. Mirrored by the `ai_memory` jsonb column.
 */
export interface AiMemory {
  dominantTriggers: Trigger[];
  effectiveInterventions: string[];
  preferredStyle: CoachStyle;
  notableWins: string[];
  updatedAtMs: number;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  text: string;
  createdAtMs: number;
  /** True when produced by the offline rule-based layer rather than the model. */
  offline?: boolean;
  /**
   * §5 — the crisis handoff. Flagged rather than inferred from the text so the
   * UI can give it its own treatment instead of letting it scroll past as one
   * more bubble.
   */
  crisis?: boolean;
}
