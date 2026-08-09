// src/lib/dates.ts
//
// Formatting only. Every duration in the app is rendered through here so
// "2h 14m" doesn't become "2 hours 14 minutes" on one screen and "134m" on
// another.

import type { TranslateFn } from '../i18n';

/** "4h 12m", "12m", "3d 5h" — the dashboard hero and the timeline both use it. */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return '0m';
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = Math.floor(minutes % 60);
    return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
  }
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours === 0 ? `${days}d` : `${days}d ${restHours}h`;
}

export function formatClock(timestampMs: number): string {
  const d = new Date(timestampMs);
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

export function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const dbb = new Date(b);
  return (
    da.getFullYear() === dbb.getFullYear() &&
    da.getMonth() === dbb.getMonth() &&
    da.getDate() === dbb.getDate()
  );
}

/**
 * Day heading for the timeline. Today and yesterday get translated words;
 * everything older gets the device's own date format, which is already
 * correct for the user's locale without us reimplementing it.
 */
export function formatDayHeading(timestampMs: number, t: TranslateFn, nowMs = Date.now()): string {
  if (isSameDay(timestampMs, nowMs)) return t('timeline.today');
  if (isSameDay(timestampMs, nowMs - 24 * 60 * 60 * 1000)) return t('timeline.yesterday');
  return new Date(timestampMs).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatDate(timestampMs: number): string {
  return new Date(timestampMs).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
