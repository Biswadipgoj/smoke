// src/store/useAppStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Locale } from '../constants/translations';
import { PersonaId } from '../constants/personas';
import { syncProfileToSupabase, syncLogToSupabase, syncSessionToSupabase, syncAchievementToSupabase } from '../lib/sync';

export type GoalType = 'quit' | 'reduce' | 'track';
export type ThemeMode = 'dark' | 'light' | 'system';
export type ContextTag = 'stress' | 'social' | 'habit' | 'boredom' | 'alcohol' | 'other';
export type Motivation = 'family' | 'health' | 'money' | 'feel' | 'other';

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  locale: Locale;
  dailyBaseline: number;
  costPerPack: number;
  cigsPerPack: number;
  currency: string;
  goalType: GoalType;
  motivations: Motivation[];
  companionPersona: PersonaId;
  startDate: string; // ISO string
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  onboardingComplete: boolean;
  isGuest: boolean;
}

export interface SmokingLog {
  id: string;
  timestamp: string;
  contextTag?: ContextTag;
  note?: string;
  type: 'cigarette' | 'craving';
}

export interface DelaySession {
  id: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  intensity?: number;
  contextTag?: ContextTag;
  outcome: 'delayed' | 'smoked' | 'incomplete';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: string;
  isError?: boolean;
}

export interface Achievement {
  id: string;
  earnedAt?: string;
}

const STORAGE_KEY = 'smokeless_store_v1';

interface AppState {
  profile: UserProfile | null;
  logs: SmokingLog[];
  delaySessions: DelaySession[];
  chatHistory: ChatMessage[];
  earnedAchievements: Achievement[];

  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addLog: (log: SmokingLog) => void;
  addDelaySession: (session: DelaySession) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChatHistory: () => void;
  unlockAchievement: (id: string) => void;
  checkAchievements: () => void;
  resetAll: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  id: `guest_${Date.now()}`,
  locale: 'en',
  dailyBaseline: 10,
  costPerPack: 250,
  cigsPerPack: 20,
  currency: '₹',
  goalType: 'reduce',
  motivations: [],
  companionPersona: 'guide',
  startDate: new Date().toISOString(),
  themeMode: 'dark',
  notificationsEnabled: true,
  onboardingComplete: false,
  isGuest: true,
};

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  logs: [],
  delaySessions: [],
  chatHistory: [],
  earnedAchievements: [],

  setProfile: (profile) => {
    set({ profile });
    get().saveToStorage();
    syncProfileToSupabase(profile);
  },

  updateProfile: (updates) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...updates };
    set({ profile: updated });
    get().saveToStorage();
    syncProfileToSupabase(updated);
  },

  addLog: (log) => {
    set((state) => ({ logs: [...state.logs, log] }));
    get().saveToStorage();
    syncLogToSupabase(log);
    get().checkAchievements();
  },

  addDelaySession: (session) => {
    set((state) => ({ delaySessions: [...state.delaySessions, session] }));
    get().saveToStorage();
    syncSessionToSupabase(session);
    get().checkAchievements();
  },

  addChatMessage: (msg) => {
    set((state) => {
      // Keep last 40 messages max
      const history = [...state.chatHistory, msg];
      return { chatHistory: history.slice(-40) };
    });
    get().saveToStorage();
  },

  clearChatHistory: () => {
    set({ chatHistory: [] });
    get().saveToStorage();
  },

  unlockAchievement: (id) => {
    const already = get().earnedAchievements.find((a) => a.id === id);
    if (already) return;
    const achievement: Achievement = { id, earnedAt: new Date().toISOString() };
    set((state) => ({
      earnedAchievements: [...state.earnedAchievements, achievement],
    }));
    get().saveToStorage();
    syncAchievementToSupabase(achievement);
  },

  checkAchievements: () => {
    const { logs, delaySessions, profile, unlockAchievement, earnedAchievements } = get();
    const earned = earnedAchievements.map((a) => a.id);

    // First log
    if (logs.length >= 1 && !earned.includes('first_log')) {
      unlockAchievement('first_log');
    }

    // First delay session
    if (delaySessions.length >= 1 && !earned.includes('first_delay')) {
      unlockAchievement('first_delay');
    }

    // 5 delay sessions
    if (delaySessions.length >= 5 && !earned.includes('5_delays')) {
      unlockAchievement('5_delays');
    }

    // Money saved ≥ 100
    if (profile) {
      const cigsSaved = logs.filter((l) => l.type === 'cigarette').length;
      const saved = (cigsSaved / profile.cigsPerPack) * profile.costPerPack;
      // Actually we need to compute savings differently - baseline-based
      const daysSinceStart = Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(profile.startDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      const totalBaselineCost =
        (profile.dailyBaseline * daysSinceStart / profile.cigsPerPack) * profile.costPerPack;
      const totalActualCost =
        (logs.filter((l) => l.type === 'cigarette').length / profile.cigsPerPack) * profile.costPerPack;
      const moneySaved = totalBaselineCost - totalActualCost;
      if (moneySaved >= 100 && !earned.includes('100_saved')) {
        unlockAchievement('100_saved');
      }
    }

    // 7-day streak
    const streak = computeCurrentStreak(logs);
    if (streak >= 7 && !earned.includes('7_day_streak')) {
      unlockAchievement('7_day_streak');
    }
    if (streak >= 30 && !earned.includes('30_day_streak')) {
      unlockAchievement('30_day_streak');
    }
    if (streak >= 7 && !earned.includes('one_week_free')) {
      unlockAchievement('one_week_free');
    }
  },

  resetAll: () => {
    set({
      profile: null,
      logs: [],
      delaySessions: [],
      chatHistory: [],
      earnedAchievements: [],
    });
    AsyncStorage.removeItem(STORAGE_KEY);
  },

  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set(parsed);
      } else {
        // First run — set default guest profile
        set({ profile: defaultProfile });
      }
    } catch {
      set({ profile: defaultProfile });
    }
  },

  saveToStorage: async () => {
    try {
      const { profile, logs, delaySessions, chatHistory, earnedAchievements } = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ profile, logs, delaySessions, chatHistory, earnedAchievements })
      );
    } catch {
      // Silent fail — will retry
    }
  },
}));

// Helper exported for use anywhere
export function computeCurrentStreak(logs: SmokingLog[]): number {
  const cigLogs = logs
    .filter((l) => l.type === 'cigarette')
    .map((l) => new Date(l.timestamp))
    .sort((a, b) => b.getTime() - a.getTime());

  if (cigLogs.length === 0) {
    return 0;
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let day = new Date(today);
  for (let i = 0; i < 365; i++) {
    const hasCig = cigLogs.some((d) => {
      const ld = new Date(d);
      ld.setHours(0, 0, 0, 0);
      return ld.getTime() === day.getTime();
    });
    if (hasCig) break;
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

export function computeLongestStreak(logs: SmokingLog[]): number {
  const cigLogs = logs
    .filter((l) => l.type === 'cigarette')
    .map((l) => {
      const d = new Date(l.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

  if (cigLogs.length === 0) return 0;

  const uniqueDays = Array.from(new Set(cigLogs)).sort();
  let longest = 0;
  let current = 0;
  let prev = -Infinity;

  for (let i = 0; i < 365; i++) {
    const day = Date.now() - i * 86400000;
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    const hasCig = uniqueDays.includes(d.getTime());
    if (!hasCig) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

export function computeMoneySaved(
  logs: SmokingLog[],
  profile: UserProfile
): { today: number; total: number; projected: number } {
  const { dailyBaseline, costPerPack, cigsPerPack, startDate } = profile;
  const costPerCig = costPerPack / cigsPerPack;

  const startMs = new Date(startDate).getTime();
  const daysSinceStart = Math.max(
    1,
    Math.floor((Date.now() - startMs) / (1000 * 60 * 60 * 24))
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const cigsToday = logs.filter((l) => {
    if (l.type !== 'cigarette') return false;
    const ld = new Date(l.timestamp);
    ld.setHours(0, 0, 0, 0);
    return ld.getTime() === todayStart.getTime();
  }).length;

  const cigsTotal = logs.filter((l) => l.type === 'cigarette').length;

  const baselineTotal = dailyBaseline * daysSinceStart;
  const baselineToday = dailyBaseline;

  const savedToday = Math.max(0, (baselineToday - cigsToday) * costPerCig);
  const savedTotal = Math.max(0, (baselineTotal - cigsTotal) * costPerCig);

  // Simple projection: daily saving rate × 365
  const dailySavingRate = daysSinceStart > 0 ? savedTotal / daysSinceStart : 0;
  const projected = dailySavingRate * 365;

  return { today: savedToday, total: savedTotal, projected };
}

export function getHealthMilestones(lastCigaretteDate: Date | null): Array<{
  id: string;
  minutesRequired: number;
  achieved: boolean;
  minutesRemaining: number;
}> {
  const milestones = [
    { id: 'milestone20min', minutesRequired: 20 },
    { id: 'milestone12hr', minutesRequired: 60 * 12 },
    { id: 'milestone24hr', minutesRequired: 60 * 24 },
    { id: 'milestone48hr', minutesRequired: 60 * 48 },
    { id: 'milestone1week', minutesRequired: 60 * 24 * 7 },
    { id: 'milestone1month', minutesRequired: 60 * 24 * 30 },
    { id: 'milestone3months', minutesRequired: 60 * 24 * 90 },
    { id: 'milestone6months', minutesRequired: 60 * 24 * 180 },
    { id: 'milestone1year', minutesRequired: 60 * 24 * 365 },
    { id: 'milestone5years', minutesRequired: 60 * 24 * 365 * 5 },
    { id: 'milestone10years', minutesRequired: 60 * 24 * 365 * 10 },
  ];

  const minutesFree = lastCigaretteDate
    ? (Date.now() - lastCigaretteDate.getTime()) / 60000
    : 0;

  return milestones.map((m) => ({
    ...m,
    achieved: minutesFree >= m.minutesRequired,
    minutesRemaining: Math.max(0, m.minutesRequired - minutesFree),
  }));
}
