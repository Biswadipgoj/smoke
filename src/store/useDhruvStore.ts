// src/store/useDhruvStore.ts
// The local store — an offline read cache in front of a Supabase backend
// that is the source of truth (see src/lib/sync.ts, src/lib/auth.ts). Every
// mutation writes to AsyncStorage immediately (so the app stays usable
// offline) and pushes to the server in the background, best-effort. On
// sign-in, hydrateFromRemote() (src/lib/auth.ts) overwrites this state with
// the server's copy — local never wins a conflict.
// No streak field exists anywhere in this file. Nothing is ever deleted except
// on explicit user request (settings → data → delete an item).
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Track, TrackType, Baseline, ConsumptionEvent, UrgeEvent, UrgeOutcome, UrgeIntensityPoint,
  LapseEvent, CheckIn, ThreadBead, ImplementationIntention, Profile, Settings, Locale,
} from '../domain/types';
import {
  pushProfile, pushTrack, pushEvent, pushUrge, pushLapse, pushCheckIn, pushBead,
  pushIntention, deleteIntentionRemote, deleteAllRemote,
} from '../lib/sync';
import { localDateKey, startOfLocalDay } from '../lib/dates';

const STORAGE_KEY = 'dhruv_store_v1';

function uid(): string {
  // Lightweight unique id — no crypto dependency required at runtime.
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const defaultSettings: Settings = {
  locale: 'en',
  themeMode: 'dark',
  reducedMotion: false,
  hapticsMode: 'full',
  appLockEnabled: false,
  stealthModeEnabled: false,
  notificationsEnabled: true,
  currency: '₹',
};

interface DhruvState {
  hydrated: boolean;
  profile: Profile | null;
  tracks: Track[];
  events: ConsumptionEvent[];
  urges: UrgeEvent[];
  lapses: LapseEvent[];
  checkIns: CheckIn[];
  beads: ThreadBead[];
  intentions: ImplementationIntention[];

  // Lifecycle
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  /** Accrues (and backfills) day beads. Call on app open and after hydrating. */
  ensureDayBeads: () => void;

  // Profile / settings
  completeOnboarding: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setLocale: (locale: Locale) => void;

  // Tracks
  addTrack: (type: TrackType, baseline: Baseline, quitDate: string | null) => void;
  updateTrackBaseline: (trackId: string, baseline: Baseline) => void;
  setTrackActive: (trackId: string, active: boolean) => void;
  acknowledgeAlcoholGate: (trackId: string) => void;

  // Consumption events (doc 03)
  logEvent: (event: ConsumptionEvent) => void;

  // Urge flow (master doc §7.3)
  startUrge: (track: TrackType, initialIntensity: number, trigger: string[], locationContext?: string) => UrgeEvent;
  reRateUrge: (urgeId: string, intensity: number) => void;
  closeUrge: (urgeId: string, outcome: UrgeOutcome, usedBreathing: boolean) => void;

  // Lapse protocol (master doc §7.6) — always adds an ash bead, never removes anything
  recordLapse: (track: TrackType, trigger: string[], note: string | undefined, linkedUrgeId?: string) => void;

  // Daily check-in
  recordCheckIn: (checkIn: Omit<CheckIn, 'id'>) => void;

  // Implementation intentions (master doc §7.4)
  addIntention: (intention: Omit<ImplementationIntention, 'id' | 'createdAt'>) => void;
  removeIntention: (id: string) => void;

  // Data control — DPDP erasure rights. Explicit, never silent.
  deleteEverything: () => Promise<void>;
}

const MAX_BACKFILL_DAYS = 400;

/**
 * Day beads accrue per calendar day the user has had at least one track, and
 * are backfilled for days the app wasn't opened — otherwise the Thread and
 * "total days free" would only ever grow on days the user happened to log an
 * urge, which is precisely the metric the Recovery Capital model is built on
 * (master doc §7.2). Backfill is capped so a long absence can't produce an
 * unbounded write.
 */
function buildMissingDayBeads(beads: ThreadBead[], tracks: Track[]): ThreadBead[] {
  if (tracks.length === 0) return [];

  // Keys are compared in LOCAL time on both sides — see src/lib/dates.ts for
  // why a UTC key would re-create every bead on each open at UTC+5:30/+6.
  const dayKeys = new Set(
    beads.filter((b) => b.type === 'day').map((b) => localDateKey(new Date(b.createdAt)))
  );
  const earliestTrack = tracks.reduce(
    (min, t) => (t.startedAt < min ? t.startedAt : min),
    tracks[0].startedAt
  );

  const today = startOfLocalDay();
  const backfillFloor = startOfLocalDay();
  backfillFloor.setDate(backfillFloor.getDate() - MAX_BACKFILL_DAYS);

  const trackStart = startOfLocalDay(new Date(earliestTrack));
  // Step a real Date rather than adding 86_400_000ms, so a DST transition
  // can't shift the cursor off midnight and skip or duplicate a day.
  const cursor = trackStart > backfillFloor ? trackStart : backfillFloor;

  const created: ThreadBead[] = [];
  while (cursor <= today) {
    const key = localDateKey(cursor);
    if (!dayKeys.has(key)) {
      dayKeys.add(key);
      // Local midday: far enough from either midnight that the bead's own
      // local date key round-trips to the same day it was created for.
      const at = new Date(cursor.getTime());
      at.setHours(12, 0, 0, 0);
      created.push({ id: uid(), type: 'day', track: null, createdAt: at.toISOString() });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return created;
}

export const useDhruvStore = create<DhruvState>((set, get) => ({
  hydrated: false,
  profile: null,
  tracks: [],
  events: [],
  urges: [],
  lapses: [],
  checkIns: [],
  beads: [],
  intentions: [],

  loadFromStorage: async () => {
    // Warm-start from the local cache only. A null profile means "no cached
    // session yet" — the root layout decides whether to pull from Supabase
    // or route to /auth, never this store.
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ ...JSON.parse(raw), hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  ensureDayBeads: () => {
    const { beads, tracks } = get();
    const created = buildMissingDayBeads(beads, tracks);
    if (created.length === 0) return;
    set({ beads: [...beads, ...created] });
    get().saveToStorage();
    created.forEach(pushBead);
  },

  saveToStorage: async () => {
    try {
      const { profile, tracks, events, urges, lapses, checkIns, beads, intentions } = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ profile, tracks, events, urges, lapses, checkIns, beads, intentions })
      );
    } catch {
      // Local write failed silently — next mutation retries. No data has been lost
      // because nothing was ever removed from in-memory state.
    }
  },

  completeOnboarding: () => {
    const { profile } = get();
    if (!profile) return;
    set({ profile: { ...profile, onboardingComplete: true } });
    get().saveToStorage();
    pushProfile(profile.settings, true);
  },

  updateSettings: (patch) => {
    const { profile } = get();
    if (!profile) return;
    const settings = { ...profile.settings, ...patch };
    set({ profile: { ...profile, settings } });
    get().saveToStorage();
    pushProfile(settings, profile.onboardingComplete);
  },

  setLocale: (locale) => get().updateSettings({ locale }),

  addTrack: (type, baseline, quitDate) => {
    const track: Track = { id: uid(), type, startedAt: new Date().toISOString(), quitDate, baseline, active: true };
    set((s) => ({ tracks: [...s.tracks, track] }));
    get().saveToStorage();
    pushTrack(track);
  },

  updateTrackBaseline: (trackId, baseline) => {
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, baseline } : t)) }));
    get().saveToStorage();
    const track = get().tracks.find((t) => t.id === trackId);
    if (track) pushTrack(track);
  },

  setTrackActive: (trackId, active) => {
    // Pausing a track never deletes its history — reversible per master doc §3.3.
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, active } : t)) }));
    get().saveToStorage();
    const track = get().tracks.find((t) => t.id === trackId);
    if (track) pushTrack(track);
  },

  acknowledgeAlcoholGate: (trackId) => {
    set((s) => ({
      tracks: s.tracks.map((t) => {
        if (t.id !== trackId || t.baseline.track !== 'alcohol') return t;
        return { ...t, baseline: { ...t.baseline, medicalGateAcknowledged: true } };
      }),
    }));
    get().saveToStorage();
    const track = get().tracks.find((t) => t.id === trackId);
    if (track) pushTrack(track);
  },

  logEvent: (event) => {
    set((s) => ({ events: [...s.events, event] }));
    get().saveToStorage();
    pushEvent(event);
  },

  startUrge: (track, initialIntensity, trigger, locationContext) => {
    const urge: UrgeEvent = {
      id: uid(),
      track,
      startedAt: new Date().toISOString(),
      endedAt: null,
      initialIntensity,
      intensityCurve: [{ atSeconds: 0, intensity: initialIntensity }],
      trigger,
      locationContext: locationContext as any,
      outcome: null,
      usedBreathing: false,
    };
    set((s) => ({ urges: [...s.urges, urge] }));
    get().saveToStorage();
    pushUrge(urge);
    return urge;
  },

  reRateUrge: (urgeId, intensity) => {
    set((s) => ({
      urges: s.urges.map((u) => {
        if (u.id !== urgeId) return u;
        const atSeconds = Math.round((Date.now() - new Date(u.startedAt).getTime()) / 1000);
        const point: UrgeIntensityPoint = { atSeconds, intensity };
        return { ...u, intensityCurve: [...u.intensityCurve, point] };
      }),
    }));
    get().saveToStorage();
    const urge = get().urges.find((u) => u.id === urgeId);
    if (urge) pushUrge(urge);
  },

  closeUrge: (urgeId, outcome, usedBreathing) => {
    let newBead: ThreadBead | null = null;
    set((s) => {
      const urges = s.urges.map((u) =>
        u.id === urgeId ? { ...u, endedAt: new Date().toISOString(), outcome, usedBreathing } : u
      );
      let beads = s.beads;
      if (outcome === 'surfed' || outcome === 'alternative') {
        const urge = urges.find((u) => u.id === urgeId);
        newBead = { id: uid(), type: 'surf', track: urge?.track ?? null, createdAt: new Date().toISOString() };
        beads = [...beads, newBead];
      }
      return { urges, beads };
    });
    get().saveToStorage();
    const urge = get().urges.find((u) => u.id === urgeId);
    if (urge) pushUrge(urge);
    if (newBead) pushBead(newBead);
    get().ensureDayBeads();
  },

  recordLapse: (track, trigger, note, linkedUrgeId) => {
    const lapse: LapseEvent = { id: uid(), track, timestamp: new Date().toISOString(), trigger, note, linkedUrgeId };
    // The ash bead arrives identically to every other bead. The thread does
    // not break, thin, fray, or change colour above it. Doc 01 §4.3.
    const ashBead: ThreadBead = { id: uid(), type: 'ash', track, createdAt: new Date().toISOString() };
    set((s) => ({ lapses: [...s.lapses, lapse], beads: [...s.beads, ashBead] }));
    get().saveToStorage();
    pushLapse(lapse);
    pushBead(ashBead);
  },

  recordCheckIn: (checkIn) => {
    // One check-in per day (the server enforces unique(user_id, date) too) —
    // re-checking in replaces the day's entry rather than stacking duplicates
    // that would diverge from the server on the next pull.
    const existing = get().checkIns.find((c) => c.date === checkIn.date);
    const withId = { id: existing?.id ?? uid(), ...checkIn };
    set((s) => ({ checkIns: [...s.checkIns.filter((c) => c.date !== checkIn.date), withId] }));
    get().saveToStorage();
    pushCheckIn(withId);
  },

  addIntention: (intention) => {
    const withId: ImplementationIntention = { id: uid(), createdAt: new Date().toISOString(), ...intention };
    set((s) => ({ intentions: [...s.intentions, withId] }));
    get().saveToStorage();
    pushIntention(withId);
  },

  removeIntention: (id) => {
    set((s) => ({ intentions: s.intentions.filter((i) => i.id !== id) }));
    get().saveToStorage();
    deleteIntentionRemote(id);
  },

  deleteEverything: async () => {
    const { profile } = get();
    set({
      profile: profile ? { ...profile, onboardingComplete: false, settings: defaultSettings } : null,
      tracks: [], events: [], urges: [], lapses: [], checkIns: [], beads: [], intentions: [],
    });
    await AsyncStorage.removeItem(STORAGE_KEY);
    await deleteAllRemote();
  },
}));

// ── Derived selectors ────────────────────────────────────────────────────────

/** Recovery Capital total — master doc §7.2. Never resets. */
export function selectRecoveryCapital(s: Pick<DhruvState, 'beads' | 'urges' | 'lapses'>) {
  const dayBeads = s.beads.filter((b) => b.type === 'day').length;
  const surfBeads = s.beads.filter((b) => b.type === 'surf').length;
  const returnsAfterLapse = countReturnsAfterLapse(s.lapses, s.urges);
  return { totalDaysFree: dayBeads, urgesSurfed: surfBeads, returnsAfterLapse };
}

function countReturnsAfterLapse(lapses: { timestamp: string }[], urges: { startedAt: string }[]): number {
  // A "return" is any logged activity (urge surfed) occurring after a lapse.
  if (lapses.length === 0) return 0;
  let count = 0;
  const sortedLapses = [...lapses].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  for (const lapse of sortedLapses) {
    const returned = urges.some((u) => u.startedAt > lapse.timestamp);
    if (returned) count++;
  }
  return count;
}

/** Days since a track's last lapse (or since quit date if never lapsed). "Current," small and grey. */
export function selectCurrentStreakDays(track: Track, lapses: { track: TrackType; timestamp: string }[]): number {
  const trackLapses = lapses.filter((l) => l.track === track.type).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const since = trackLapses[0]?.timestamp ?? track.quitDate ?? track.startedAt;
  const ms = Date.now() - new Date(since).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
