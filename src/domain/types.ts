// src/domain/types.ts
// Domain model — master doc §5.1, tracking doc 03. Multi-track, no streaks,
// nothing is ever deleted from a user's history except on their own request.

export type TrackType = 'tobacco' | 'alcohol' | 'porn';

export type Locale = 'en' | 'hi' | 'bn';
export type ThemeMode = 'dark' | 'light' | 'system' | 'oled';

// ── Baseline — captured once at track setup, editable forever (doc 03 §1) ───

export interface TobaccoBaseline {
  track: 'tobacco';
  form: 'cigarette' | 'bidi' | 'gutkha' | 'paan_masala' | 'khaini' | 'vape';
  unitsPerDay: number;
  unitCost: number; // price per single unit, not per pack
  yearsOfUse?: number;
}

export interface AlcoholBaseline {
  track: 'alcohol';
  drinkingDaysPerWeek: number;
  typicalSpendPerOccasion: number;
  typicalDrinksPerOccasion: number;
  usualContext?: string;
  // Medical gate signals (master doc §15.6)
  heavyDailyDrinking: boolean;
  withdrawalSymptoms: boolean; // tremor, sweating, nausea on waking, prior seizure
  medicalGateAcknowledged: boolean;
}

export interface PornBaseline {
  track: 'porn';
  sessionsPerWeek: number;
  typicalSessionLengthMinutes: number;
  typicalTimeOfDay?: string;
  minimalLoggingMode: boolean; // doc 03 §5.2 — opt-out of detailed logging
}

export type Baseline = TobaccoBaseline | AlcoholBaseline | PornBaseline;

export interface Track {
  id: string;
  type: TrackType;
  startedAt: string; // ISO — when the track was added
  quitDate: string | null; // optional; "I haven't stopped yet" is first-class
  baseline: Baseline;
  active: boolean; // reversible: user can pause/remove a track without losing history
}

// ── Shared location context — the toilet insight, doc 03 §3.2 ───────────────

export type LocationContext =
  | 'toilet'
  | 'bed'
  | 'balcony_outside'
  | 'home_alone'
  | 'work'
  | 'commute'
  | 'social_setting';

// ── Trigger chips — doc 03 §3.1 ──────────────────────────────────────────────

export const TRIGGER_CHIPS: Record<TrackType, string[]> = {
  tobacco: [
    'after_meal', 'first_of_day', 'toilet', 'with_chai_coffee', 'with_alcohol',
    'work_break', 'commute', 'stress', 'boredom', 'on_phone', 'offered', 'after_argument',
    'before_bed', 'after_sex',
  ],
  alcohol: [
    'stress', 'social_pressure', 'celebration', 'loneliness', 'boredom', 'with_food',
    'habit_time', 'to_sleep', 'anger', 'work_event', 'others_drinking',
  ],
  porn: [
    'bed_at_night', 'toilet', 'alone_at_home', 'boredom', 'stress', 'phone_scrolling',
    'cant_sleep', 'woke_early', 'procrastinating', 'after_argument', 'after_drinking',
  ],
};

// ── Consumption events (doc 03 §2) ───────────────────────────────────────────

interface EventBase {
  id: string;
  timestamp: string; // when it happened
  loggedAt: string; // when it was logged — distinguishes real-time from retrospective
  track: TrackType;
  trigger: string[];
  locationContext?: LocationContext;
  mood?: string;
  note?: string;
}

export interface TobaccoEvent extends EventBase {
  track: 'tobacco';
  quantity: number;
  unitCost: number;
  smokedFully?: boolean;
  intent?: 'craving' | 'habit' | 'social' | 'offered' | 'stress';
}

export interface AlcoholEvent extends EventBase {
  track: 'alcohol';
  spend: number;
  standardDrinks?: number;
  type?: 'beer' | 'spirits' | 'wine' | 'country_liquor' | 'other';
  setting?: 'home_alone' | 'home_with_others' | 'bar' | 'party' | 'work';
  intendedToStopAt?: number;
}

export interface PornEvent extends EventBase {
  track: 'porn';
  durationBucket?: '<10' | '10-30' | '30-60' | '60+';
  masturbation?: 'yes' | 'no' | 'prefer_not_to_say';
  deviceContext?: 'phone' | 'laptop' | 'tv';
}

export type ConsumptionEvent = TobaccoEvent | AlcoholEvent | PornEvent;

// ── Urge / Lapse / Win — master doc §5.1 ─────────────────────────────────────

export type UrgeOutcome = 'surfed' | 'alternative' | 'lapsed';

export interface UrgeIntensityPoint {
  atSeconds: number;
  intensity: number; // 1-10
}

export interface UrgeEvent {
  id: string;
  track: TrackType;
  startedAt: string;
  endedAt: string | null;
  initialIntensity: number;
  intensityCurve: UrgeIntensityPoint[];
  trigger: string[];
  locationContext?: LocationContext;
  outcome: UrgeOutcome | null;
  usedBreathing: boolean;
}

export interface LapseEvent {
  id: string;
  track: TrackType;
  timestamp: string;
  trigger: string[]; // up to 3 chips, optional
  note?: string;
  linkedUrgeId?: string;
}

export interface CheckIn {
  id: string;
  date: string; // yyyy-MM-dd
  mood?: 'good' | 'okay' | 'low' | 'rough';
  sleepQuality?: 'good' | 'okay' | 'poor';
  halt: { hungry: boolean; angry: boolean; lonely: boolean; tired: boolean };
}

// ── Thread beads — master doc §2.2, doc 01 §4.3. Never removed. ─────────────

export type BeadType = 'day' | 'surf' | 'ash';

export interface ThreadBead {
  id: string;
  type: BeadType;
  track: TrackType | null; // null for cross-track day beads
  createdAt: string;
}

// ── Implementation intentions — master doc §7.4 ──────────────────────────────

export interface ImplementationIntention {
  id: string;
  track: TrackType;
  cueType: 'time' | 'place' | 'emotion' | 'social';
  cue: string;
  response: string;
  createdAt: string;
}

// ── Settings ──────────────────────────────────────────────────────────────

export interface Settings {
  locale: Locale;
  themeMode: ThemeMode;
  reducedMotion: boolean; // in-app override in addition to system setting
  hapticsMode: 'full' | 'essential' | 'off';
  appLockEnabled: boolean;
  stealthModeEnabled: boolean;
  notificationsEnabled: boolean;
  currency: '₹' | '৳' | '$';
}

export interface Profile {
  id: string;
  createdAt: string;
  onboardingComplete: boolean;
  settings: Settings;
}
