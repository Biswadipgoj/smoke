// src/features/analytics/today.ts
//
// §9 — the today row on the dashboard. Derived on every render from rows the
// store already holds; nothing here is stored.

import type {
  CigaretteLog,
  CravingLog,
  PricePoint,
  TodayStats,
  UserProfile,
} from '../../types';
import { DEFAULT_CURRENCY, moneySaved, priceAt, totalCost } from '../money/cost';

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function computeTodayStats(params: {
  cigarettes: CigaretteLog[];
  cravings: CravingLog[];
  prices: PricePoint[];
  profile: UserProfile;
  nowMs?: number;
}): TodayStats {
  const { cigarettes, cravings, prices, profile } = params;
  const nowMs = params.nowMs ?? Date.now();
  const dayStart = startOfDay(nowMs);

  const todayCigs = cigarettes.filter((c) => c.timestampMs >= dayStart);
  const todayCravings = cravings.filter((c) => c.timestampMs >= dayStart);
  const lastCigarette = cigarettes.reduce<number | null>(
    (latest, c) => (latest === null || c.timestampMs > latest ? c.timestampMs : latest),
    null
  );

  return {
    cigarettes: todayCigs.length,
    cravings: todayCravings.length,
    cravingsDelayed: todayCravings.filter((c) => c.outcome === 'delayed').length,
    minutesSinceLast: lastCigarette === null ? null : Math.floor((nowMs - lastCigarette) / 60000),
    moneySpent: totalCost(todayCigs, prices),
    moneySaved: moneySaved({
      cigarettes: todayCigs,
      prices,
      baselinePerDay: profile.baselineCigarettesPerDay,
      days: 1,
    }),
    currency: priceAt(prices, nowMs)?.currency ?? DEFAULT_CURRENCY,
  };
}
