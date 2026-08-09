// src/store/useLogsStore.ts
//
// The read model over SQLite. Screens never query the database directly: they
// read this store and call its actions, which write locally first (§20), then
// recompute the behavioural summary and nudge the sync queue in the
// background.

import { create } from 'zustand';

import { analyseBehavior, emptyBehaviorSummary } from '../features/behavior/analysis';
import { deriveMemory } from '../services/ai';
import * as db from '../services/db/localDb';
import { syncNow } from '../services/sync';
import type {
  AiMemory,
  BehaviorSummary,
  CigaretteLog,
  CravingLog,
  CravingOutcome,
  Intensity,
  PricePoint,
  Trigger,
  UserProfile,
} from '../types';

interface LogsState {
  ready: boolean;
  cigarettes: CigaretteLog[];
  cravings: CravingLog[];
  prices: PricePoint[];
  behavior: BehaviorSummary;
  memory: AiMemory | null;
  /** Intervention ids offered in the last few cravings, most recent first. */
  recentlyOffered: string[];

  refresh: () => Promise<void>;
  logCigarette: (trigger?: Trigger | null, note?: string | null) => Promise<void>;
  startCraving: (input: {
    trigger: Trigger;
    intensity: Intensity;
    interventionId: string;
    delayAskedMinutes: number;
  }) => Promise<CravingLog>;
  resolveCraving: (
    id: string,
    outcome: CravingOutcome,
    achievedMinutes: number,
    profile: UserProfile
  ) => Promise<void>;
  savePrice: (input: {
    pricePerPack: number;
    cigarettesPerPack: number;
    currency: string;
  }) => Promise<void>;
  forgetMemory: () => Promise<void>;
  clearEverything: () => Promise<void>;
}

/** Recomputes derived state from whatever is currently in the database. */
async function reload(): Promise<
  Pick<LogsState, 'cigarettes' | 'cravings' | 'prices' | 'behavior' | 'memory' | 'recentlyOffered'>
> {
  const [cigarettes, cravings, prices, memory] = await Promise.all([
    db.listCigarettes(),
    db.listCravings(),
    db.listPrices(),
    db.readAiMemory(),
  ]);
  return {
    cigarettes,
    cravings,
    prices,
    memory,
    behavior: analyseBehavior(cigarettes, cravings),
    recentlyOffered: cravings.slice(0, 3).map((c) => c.interventionId),
  };
}

export const useLogsStore = create<LogsState>((set, get) => ({
  ready: false,
  cigarettes: [],
  cravings: [],
  prices: [],
  behavior: emptyBehaviorSummary(),
  memory: null,
  recentlyOffered: [],

  refresh: async () => {
    set({ ...(await reload()), ready: true });
  },

  logCigarette: async (trigger = null, note = null) => {
    await db.insertCigarette({ trigger, note });
    await get().refresh();
    void syncNow();
  },

  startCraving: async (input) => {
    const craving = await db.insertCraving(input);
    await get().refresh();
    return craving;
  },

  resolveCraving: async (id, outcome, achievedMinutes, profile) => {
    await db.resolveCraving(id, outcome, achievedMinutes);
    // §7 — a craving that ended in a cigarette also produces a cigarette log,
    // so the timeline and the money figures stay honest without the user
    // having to log the same event twice.
    if (outcome === 'smoked') {
      const craving = get().cravings.find((c) => c.id === id);
      await db.insertCigarette({ trigger: craving?.trigger ?? null });
    }
    await get().refresh();

    // §6 — memory is derived from aggregates after the fact, never written
    // from the conversation.
    const behavior = get().behavior;
    const next = deriveMemory({ behavior, profile, previous: get().memory });
    await db.writeAiMemory(next);
    set({ memory: next });

    void syncNow();
  },

  savePrice: async (input) => {
    await db.setPrice(input);
    await get().refresh();
    void syncNow();
  },

  forgetMemory: async () => {
    await db.clearAiMemory();
    set({ memory: null });
  },

  clearEverything: async () => {
    await db.clearAll();
    await get().refresh();
  },
}));
