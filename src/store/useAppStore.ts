// src/store/useAppStore.ts
// ─────────────────────────────────────────────────────────────────────────────
// Profile + session-scoped UI state. Behavioural *records* (cigarettes,
// cravings, prices, goals) live in SQLite, not here — this store holds the
// small amount of state every screen needs synchronously on first paint.
//
// Chat history is deliberately in memory only: raw transcripts are never
// persisted, on device or on the server (§6). Killing the app clears them.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { AiMemory, ChatMessage, Locale, UserProfile } from '../types';
import { uid } from '../utils/uid';

const PROFILE_KEY = 'smokeless.profile.v1';

/** How many turns of conversational continuity we keep in memory. */
const CHAT_WINDOW = 12;

export function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: overrides.id ?? uid(),
    locale: overrides.locale ?? 'en',
    coachStyle: overrides.coachStyle ?? 'calm',
    baselinePerDay: overrides.baselinePerDay ?? 10,
    startedAtMs: overrides.startedAtMs ?? Date.now(),
    quitDateMs: overrides.quitDateMs ?? null,
    onboardingComplete: overrides.onboardingComplete ?? false,
    notificationsEnabled: overrides.notificationsEnabled ?? false,
    appLockEnabled: overrides.appLockEnabled ?? false,
    themePreference: overrides.themePreference ?? 'system',
    currency: overrides.currency ?? '₹',
  };
}

interface AppState {
  hydrated: boolean;
  profile: UserProfile | null;
  aiMemory: AiMemory | null;
  chat: ChatMessage[];

  hydrate: () => Promise<void>;
  setProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
  clearProfile: () => Promise<void>;

  setAiMemory: (memory: AiMemory | null) => void;
  appendChat: (message: ChatMessage) => void;
  clearChat: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  profile: null,
  aiMemory: null,
  chat: [],

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      const profile = raw ? (JSON.parse(raw) as UserProfile) : null;
      // Merge through makeProfile so a profile written by an older build
      // gains any field added since, instead of arriving as undefined.
      set({ profile: profile ? makeProfile(profile) : null, hydrated: true });
    } catch {
      set({ profile: null, hydrated: true });
    }
  },

  setProfile: async (profile) => {
    set({ profile });
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },

  updateProfile: async (patch) => {
    const current = get().profile;
    if (!current) return;
    const next = { ...current, ...patch };
    set({ profile: next });
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  },

  setLocale: async (locale) => {
    await get().updateProfile({ locale });
  },

  clearProfile: async () => {
    set({ profile: null, aiMemory: null, chat: [] });
    await AsyncStorage.removeItem(PROFILE_KEY);
  },

  setAiMemory: (memory) => set({ aiMemory: memory }),

  appendChat: (message) => set({ chat: [...get().chat, message].slice(-CHAT_WINDOW) }),

  clearChat: () => set({ chat: [] }),
}));
