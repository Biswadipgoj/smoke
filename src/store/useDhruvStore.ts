// src/store/useDhruvStore.ts
// The local-first store. Local is always the source of truth (master doc §14).
// No streak field exists anywhere in this file. Nothing is ever deleted except
// on explicit user request (settings → data → delete an item).
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Track, TrackType, Baseline, ConsumptionEvent, UrgeEvent, UrgeOutcome, UrgeIntensityPoint,
  LapseEvent, CheckIn, ThreadBead, ImplementationIntention, Profile, Settings, Locale,
} from '../domain/types';

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

function defaultProfile(): Profile {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    onboardingComplete: false,
    settings: defaultSettings,
  };
}

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

function addDayBeadIfNeeded(beads: ThreadBead[]): ThreadBead[] {
  const today = new Date().toISOString().slice(0, 10);
  const hasTodayBead = beads.some((b) => b.type === 'day' && b.createdAt.slice(0, 10) === today);
  if (hasTodayBead) return beads;
  return [...beads, { id: uid(), type: 'day', track: null, createdAt: new Date().toISOString() }];
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
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ ...parsed, hydrated: true });
      } else {
        set({ profile: defaultProfile(), hydrated: true });
      }
    } catch {
      set({ profile: defaultProfile(), hydrated: true });
    }
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
  },

  updateSettings: (patch) => {
    const { profile } = get();
    if (!profile) return;
    set({ profile: { ...profile, settings: { ...profile.settings, ...patch } } });
    get().saveToStorage();
  },

  setLocale: (locale) => get().updateSettings({ locale }),

  addTrack: (type, baseline, quitDate) => {
    const track: Track = { id: uid(), type, startedAt: new Date().toISOString(), quitDate, baseline, active: true };
    set((s) => ({ tracks: [...s.tracks, track] }));
    get().saveToStorage();
  },

  updateTrackBaseline: (trackId, baseline) => {
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, baseline } : t)) }));
    get().saveToStorage();
  },

  setTrackActive: (trackId, active) => {
    // Pausing a track never deletes its history — reversible per master doc §3.3.
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, active } : t)) }));
    get().saveToStorage();
  },

  acknowledgeAlcoholGate: (trackId) => {
    set((s) => ({
      tracks: s.tracks.map((t) => {
        if (t.id !== trackId || t.baseline.track !== 'alcohol') return t;
        return { ...t, baseline: { ...t.baseline, medicalGateAcknowledged: true } };
      }),
    }));
    get().saveToStorage();
  },

  logEvent: (event) => {
    set((s) => ({ events: [...s.events, event] }));
    get().saveToStorage();
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
  },

  closeUrge: (urgeId, outcome, usedBreathing) => {
    set((s) => {
      const urges = s.urges.map((u) =>
        u.id === urgeId ? { ...u, endedAt: new Date().toISOString(), outcome, usedBreathing } : u
      );
      let beads = s.beads;
      if (outcome === 'surfed' || outcome === 'alternative') {
        const urge = urges.find((u) => u.id === urgeId);
        beads = [...beads, { id: uid(), type: 'surf', track: urge?.track ?? null, createdAt: new Date().toISOString() }];
      }
      beads = addDayBeadIfNeeded(beads);
      return { urges, beads };
    });
    get().saveToStorage();
  },

  recordLapse: (track, trigger, note, linkedUrgeId) => {
    const lapse: LapseEvent = { id: uid(), track, timestamp: new Date().toISOString(), trigger, note, linkedUrgeId };
    set((s) => ({
      lapses: [...s.lapses, lapse],
      // The ash bead arrives identically to every other bead. The thread does
      // not break, thin, fray, or change colour above it. Doc 01 §4.3.
      beads: [...s.beads, { id: uid(), type: 'ash', track, createdAt: new Date().toISOString() }],
    }));
    get().saveToStorage();
  },

  recordCheckIn: (checkIn) => {
    set((s) => ({ checkIns: [...s.checkIns, { id: uid(), ...checkIn }] }));
    get().saveToStorage();
  },

  addIntention: (intention) => {
    set((s) => ({ intentions: [...s.intentions, { id: uid(), createdAt: new Date().toISOString(), ...intention }] }));
    get().saveToStorage();
  },

  removeIntention: (id) => {
    set((s) => ({ intentions: s.intentions.filter((i) => i.id !== id) }));
    get().saveToStorage();
  },

  deleteEverything: async () => {
    set({
      profile: defaultProfile(),
      tracks: [], events: [], urges: [], lapses: [], checkIns: [], beads: [], intentions: [],
    });
    await AsyncStorage.removeItem(STORAGE_KEY);
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
