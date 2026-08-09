// src/store/useProfileStore.ts
//
// The profile is small, read on every screen, and needed before the first
// frame — so it lives in AsyncStorage rather than SQLite. Logs (which are
// many, and queried by range) live in SQLite instead.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';

import type { Language, UserProfile } from '../types';
import { LANGUAGES } from '../types';

const STORAGE_KEY = 'smokeless.profile.v1';

/** Best guess from the OS, so the language screen opens on the likely answer. */
function deviceLanguage(): Language {
  try {
    for (const locale of getLocales()) {
      const code = locale.languageCode as Language | null;
      if (code && (LANGUAGES as readonly string[]).includes(code)) return code;
    }
  } catch {
    // getLocales throws on some web targets; English is a safe floor.
  }
  return 'en';
}

export function makeDefaultProfile(): UserProfile {
  return {
    id: `local-${Date.now().toString(36)}`,
    language: deviceLanguage(),
    coachStyle: 'calm',
    baselineCigarettesPerDay: 10,
    goalType: 'reduce',
    targetCigarettesPerDay: 5,
    quitDateMs: null,
    createdAtMs: Date.now(),
    appLockEnabled: false,
    reminderHour: null,
    onboardingCompleted: false,
  };
}

interface ProfileState {
  hydrated: boolean;
  profile: UserProfile;
  load: () => Promise<void>;
  update: (patch: Partial<UserProfile>) => Promise<void>;
  /** Back to a fresh install, minus the logs (see localDb.clearAll). */
  reset: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  hydrated: false,
  profile: makeDefaultProfile(),

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        // Spread over defaults so a profile written by an older build gains
        // any newly added field instead of leaving it undefined.
        const stored = JSON.parse(raw) as Partial<UserProfile>;
        set({ profile: { ...makeDefaultProfile(), ...stored } });
      }
    } catch {
      // Unreadable storage shouldn't block launch — defaults are usable.
    }
    set({ hydrated: true });
  },

  update: async (patch) => {
    const next = { ...get().profile, ...patch };
    set({ profile: next });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },

  reset: async () => {
    const fresh = makeDefaultProfile();
    set({ profile: fresh });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
