// src/features/money/cost.ts
//
// §15 — money tracking against a time-versioned price. A cigarette logged in
// March is costed at March's price even after the price goes up in April,
// which is the only way the "kept" figure stays true over a long run.

import type { CigaretteLog, PricePoint } from '../../types';

export const DEFAULT_CURRENCY = 'INR';

/**
 * The price in force at a given moment: the most recent point that had already
 * taken effect. Logs made before the first price point are costed at that
 * first price rather than at zero — a user who enters their price on day three
 * shouldn't see day one as free.
 */
export function priceAt(prices: PricePoint[], timestampMs: number): PricePoint | null {
  if (prices.length === 0) return null;
  const sorted = [...prices].sort((a, b) => a.effectiveFromMs - b.effectiveFromMs);
  let chosen = sorted[0];
  for (const point of sorted) {
    if (point.effectiveFromMs <= timestampMs) chosen = point;
    else break;
  }
  return chosen;
}

export function costPerCigarette(point: PricePoint | null): number {
  if (!point || point.cigarettesPerPack <= 0) return 0;
  return point.pricePerPack / point.cigarettesPerPack;
}

/** Total spent on a set of logs, each costed at its own effective price. */
export function totalCost(cigarettes: CigaretteLog[], prices: PricePoint[]): number {
  return cigarettes.reduce(
    (sum, log) => sum + costPerCigarette(priceAt(prices, log.timestampMs)),
    0
  );
}

/**
 * Money kept: what the baseline would have cost over the same stretch, minus
 * what was actually smoked. Never returns a negative — a heavier-than-usual
 * day shows as zero kept, not as a debt. Framing a bad day as owing money is
 * exactly the shame mechanic §1 rules out.
 */
export function moneySaved(params: {
  cigarettes: CigaretteLog[];
  prices: PricePoint[];
  baselinePerDay: number;
  days: number;
}): number {
  const { cigarettes, prices, baselinePerDay, days } = params;
  const rate = costPerCigarette(priceAt(prices, Date.now()));
  const expected = baselinePerDay * days * rate;
  return Math.max(0, expected - totalCost(cigarettes, prices));
}

/** Cigarettes not smoked versus baseline over the same stretch. */
export function cigarettesAvoided(params: {
  smoked: number;
  baselinePerDay: number;
  days: number;
}): number {
  return Math.max(0, params.baselinePerDay * params.days - params.smoked);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  BDT: '৳',
};

export function formatMoney(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  // Whole units past a hundred: nobody cares about the paise on ₹1,240.
  const rounded = amount >= 100 ? Math.round(amount) : Math.round(amount * 10) / 10;
  return `${symbol}${rounded.toLocaleString()}`;
}
