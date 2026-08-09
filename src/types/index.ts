// src/types/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// The single shape definition for the whole app (Master Build Plan §24).
// Three layers have to agree on these shapes: this file, the local SQLite
// schema (src/services/db/localDb.ts), and the remote schema
// (supabase/schema.sql). If you change a field here, change it in both of
// those too — there is a matching comment in each.
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = 'en' | 'hi' | 'bn';

/**
 * The trigger list from the brief, plus `bathroom` — which the brief's own
 * list dropped and which is one of the most commonly reported cues. See the
 * plan's "How this was scoped" note.
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
  'bathroom',
  'other',
] as const;

export type Trigger = (typeof TRIGGERS)[number];

/** Craving strength, 1 (barely there) to 5 (overwhelming). */
export type Intensity = 1 | 2 | 3 | 4 | 5;

/**
 * How a craving ended. `delayed` means the user made it through the delay
 * without smoking; `smoked` means they didn't. Both are neutral records —
 * no copy anywhere may render `smoked` as a failure (§1).
 */
export type CravingOutcome = 'delayed' | 'smoked' | 'abandoned';

/** The five coaching tones (§6). One prompt, five tone instructions. */
export const COACH_STYLES = ['calm', 'direct', 'scientific', 'encouraging', 'minimal'] as const;
export type CoachStyle = (typeof COACH_STYLES)[number];

/** Interventions the rule-based engine can recommend with zero network (§3-6). */
export const INTERVENTIONS = [
  'breathe',
  'water',
  'walk',
  'hands',
  'delay_timer',
  'call_someone',
  'brush_teeth',
  'step_outside',
  'write_it_down',
] as const;
export type InterventionId = (typeof INTERVENTIONS)[number];

// ── Records ──────────────────────────────────────────────────────────────────

export interface CigaretteLog {
  id: string;
  userId: string | null;
  /** Epoch milliseconds. Indexed in both SQLite and Postgres. */
  timestampMs: number;
  /** Almost always 1; batch entry exists for catching up after a gap. */
  count: number;
  trigger: Trigger | null;
  /** Free text. Treat as sensitive — see the encryption TODO in schema.sql. */
  note: string | null;
  /** True when this log was created by a craving that ended in smoking. */
  fromCraving: boolean;
  synced: boolean;
}

export interface CravingLog {
  id: string;
  userId: string | null;
  timestampMs: number;
  trigger: Trigger;
  intensity: Intensity;
  /** Minutes the delay algorithm asked for at the moment of the craving. */
  askedDelayMinutes: number;
  /** Minutes actually waited before the flow resolved. */
  actualDelayMinutes: number;
  intervention: InterventionId | null;
  outcome: CravingOutcome;
  note: string | null;
  synced: boolean;
}

/**
 * Price is time-versioned rather than a single constant (§15) so a price
 * change halfway through a quit doesn't silently rewrite the history of what
 * every earlier cigarette cost.
 */
export interface PricePoint {
  id: string;
  userId: string | null;
  /** Cost of a single cigarette in minor-unit-free currency (e.g. ₹12.50). */
  pricePerCigarette: number;
  currency: string;
  /** This price applies to every log at or after this instant. */
  effectiveFromMs: number;
  synced: boolean;
}

export interface Goal {
  id: string;
  userId: string | null;
  /** Cigarettes per day the user is aiming for. 0 = quit entirely. */
  targetPerDay: number;
  /** Epoch ms the goal was set — progress is measured from here. */
  createdAtMs: number;
  /** Optional deadline; null means open-ended. */
  targetDateMs: number | null;
  achievedAtMs: number | null;
  synced: boolean;
}

export interface UserProfile {
  id: string;
  locale: Locale;
  coachStyle: CoachStyle;
  /** Self-reported cigarettes per day at signup. Seeds the delay algorithm. */
  baselinePerDay: number;
  /** Epoch ms the user started using the app. */
  startedAtMs: number;
  /** Epoch ms of the quit date, if they've set one. */
  quitDateMs: number | null;
  onboardingComplete: boolean;
  notificationsEnabled: boolean;
  appLockEnabled: boolean;
  /** OS-level dark mode is respected by default; this forces one. */
  themePreference: 'system' | 'light' | 'dark';
  currency: string;
}

/** Everything the dashboard hero needs, computed locally in one query pass. */
export interface TodayStats {
  cigarettesToday: number;
  cravingsToday: number;
  cravingsDelayedToday: number;
  /** Epoch ms of the most recent cigarette, or null if none ever. */
  lastCigaretteMs: number | null;
  /** Money not spent today vs. the baseline daily count. */
  moneySavedToday: number;
  /** Cigarettes not smoked today vs. baseline. Negative is shown as 0. */
  avoidedToday: number;
  currency: string;
}

/** Rolling behavioural stats — the Behavior Analysis Engine's output (§3). */
export interface BehaviorStats {
  /** Mean minutes between cigarettes over the last 14 days. */
  baselineIntervalMinutes: number;
  /** Cigarettes/day over the last 7 days vs. the 7 before that. */
  recentDailyAverage: number;
  priorDailyAverage: number;
  /** Trigger → count over the last 30 days, most frequent first. */
  triggerFrequency: Array<{ trigger: Trigger; count: number }>;
  /** Hour of day (0-23) → count over the last 30 days. */
  hourHistogram: number[];
  /** Success rate of the last 5 cravings, 0-1. */
  recentSuccessRate: number;
  /** Interventions ranked by how often they preceded a delayed outcome. */
  effectiveInterventions: Array<{ intervention: InterventionId; successRate: number; uses: number }>;
  totalCravings: number;
  totalDelayed: number;
}

/** One row per user, jsonb in Postgres — aggregated, never raw transcripts (§6). */
export interface AiMemory {
  userId: string;
  topTriggers: Trigger[];
  effectiveInterventions: InterventionId[];
  coachStyle: CoachStyle;
  /** A short, user-readable summary the AI Memory screen can display. */
  summary: string;
  updatedAtMs: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'coach';
  text: string;
  createdAtMs: number;
  /** True when produced by the offline rule-based fallback, not the model. */
  offline?: boolean;
}
