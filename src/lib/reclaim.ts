// src/lib/reclaim.ts
// The reclaim engine — tracking doc 03 §4. Each track has a different natural
// currency. A day where the user consumed more than baseline yields zero
// reclaimed for that day, never a negative. The cumulative total never
// decreases. Nothing earned is ever removed (same principle as the Thread).
import { Track, ConsumptionEvent, TobaccoEvent, AlcoholEvent, PornEvent } from '../domain/types';

function daysSince(iso: string): number {
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function isSameDay(iso: string, day: Date): boolean {
  const d = new Date(iso);
  return d.toDateString() === day.toDateString();
}

export interface ReclaimResult {
  moneyToday: number;
  moneyTotal: number;
  hoursToday: number;
  hoursTotal: number;
  yearProjection: number; // in the track's primary currency unit (money or hours)
  primaryCurrency: 'money' | 'time';
}

export function computeReclaim(track: Track, events: ConsumptionEvent[]): ReclaimResult {
  const trackEvents = events.filter((e) => e.track === track.type);
  const daysActive = daysSince(track.startedAt);
  const today = new Date();

  if (track.baseline.track === 'tobacco') {
    const b = track.baseline;
    const baselineDailyCost = b.unitsPerDay * b.unitCost;
    const tobaccoEvents = trackEvents as TobaccoEvent[];
    const actualToday = tobaccoEvents.filter((e) => isSameDay(e.timestamp, today)).reduce((s, e) => s + e.quantity * e.unitCost, 0);
    const actualTotal = tobaccoEvents.reduce((s, e) => s + e.quantity * e.unitCost, 0);
    const moneyToday = Math.max(0, baselineDailyCost - actualToday);
    const baselineTotalCost = baselineDailyCost * daysActive;
    const moneyTotal = Math.max(0, baselineTotalCost - actualTotal);
    const dailyRate = moneyTotal / daysActive;
    return { moneyToday, moneyTotal, hoursToday: 0, hoursTotal: 0, yearProjection: dailyRate * 365, primaryCurrency: 'money' };
  }

  if (track.baseline.track === 'alcohol') {
    const b = track.baseline;
    const baselineDailyCost = (b.drinkingDaysPerWeek / 7) * b.typicalSpendPerOccasion;
    const alcoholEvents = trackEvents as AlcoholEvent[];
    const actualToday = alcoholEvents.filter((e) => isSameDay(e.timestamp, today)).reduce((s, e) => s + e.spend, 0);
    const actualTotal = alcoholEvents.reduce((s, e) => s + e.spend, 0);
    const moneyToday = Math.max(0, baselineDailyCost - actualToday);
    const baselineTotalCost = baselineDailyCost * daysActive;
    const moneyTotal = Math.max(0, baselineTotalCost - actualTotal);
    const dailyRate = moneyTotal / daysActive;
    return { moneyToday, moneyTotal, hoursToday: 0, hoursTotal: 0, yearProjection: dailyRate * 365, primaryCurrency: 'money' };
  }

  // Porn track — time is the headline number, not money (doc 03 §4.1).
  const b = track.baseline;
  const baselineDailyMinutes = (b.sessionsPerWeek / 7) * b.typicalSessionLengthMinutes;
  const pornEvents = trackEvents as PornEvent[];
  const bucketMinutes: Record<NonNullable<PornEvent['durationBucket']>, number> = {
    '<10': 5, '10-30': 20, '30-60': 45, '60+': 75,
  };
  const minutesOf = (e: PornEvent) => (e.durationBucket ? bucketMinutes[e.durationBucket] : b.typicalSessionLengthMinutes);
  const actualTodayMinutes = pornEvents.filter((e) => isSameDay(e.timestamp, today)).reduce((s, e) => s + minutesOf(e), 0);
  const actualTotalMinutes = pornEvents.reduce((s, e) => s + minutesOf(e), 0);
  const hoursToday = Math.max(0, (baselineDailyMinutes - actualTodayMinutes) / 60);
  const baselineTotalMinutes = baselineDailyMinutes * daysActive;
  const hoursTotal = Math.max(0, (baselineTotalMinutes - actualTotalMinutes) / 60);
  const dailyRateHours = hoursTotal / daysActive;
  return { moneyToday: 0, moneyTotal: 0, hoursToday, hoursTotal, yearProjection: dailyRateHours * 365, primaryCurrency: 'time' };
}

/** Sleep hours reclaimed — a secondary figure for alcohol and porn tracks (doc 03 §4.1). */
export function estimateSleepHoursReclaimed(track: Track, events: ConsumptionEvent[]): number {
  if (track.baseline.track === 'tobacco') return 0;
  const reclaim = computeReclaim(track, events);
  // Conservative heuristic: ~15% of reclaimed time/late-night consumption translates to better sleep.
  if (track.baseline.track === 'porn') return reclaim.hoursTotal * 0.4;
  return reclaim.moneyTotal > 0 ? daysSince(track.startedAt) * 0.25 : 0;
}

export function formatCurrency(amount: number, currency: '₹' | '৳' | '$'): string {
  const rounded = Math.round(amount);
  if (currency === '$') return `$${rounded.toLocaleString('en-US')}`;
  // Indian/Bangladeshi digit grouping (lakh/crore) — doc 03 §4.4
  return `${currency}${indianGroup(rounded)}`;
}

function indianGroup(n: number): string {
  const s = Math.abs(n).toString();
  if (s.length <= 3) return (n < 0 ? '-' : '') + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (n < 0 ? '-' : '') + grouped + ',' + last3;
}
