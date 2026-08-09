// src/utils/format.ts
// Shared formatting. Durations are phrased, never rendered as raw clock
// arithmetic ("4h 12m", not "04:12:33") — the dashboard hero is an emotional
// statement, not a stopwatch (§9).

export function formatDuration(ms: number): { value: string; unit: string } {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 60) return { value: String(minutes), unit: minutes === 1 ? 'minute' : 'minutes' };
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    const rem = minutes % 60;
    return { value: rem === 0 ? String(hours) : `${hours}h ${rem}m`, unit: rem === 0 ? (hours === 1 ? 'hour' : 'hours') : '' };
  }
  const days = Math.floor(hours / 24);
  return { value: String(days), unit: days === 1 ? 'day' : 'days' };
}

/** "2h 14m" style compact duration for timers and list rows. */
export function compactDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** mm:ss for the craving countdown — the one place a live clock belongs. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function money(amount: number, currency: string): string {
  const rounded = Math.round(amount * 100) / 100;
  const shown = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `${currency}${shown}`;
}

export function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayKey(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export const DAY_MS = 86_400_000;
