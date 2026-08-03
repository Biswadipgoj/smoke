// src/lib/urgeDecay.ts
// The killer feature — master doc §7.3. By urge five, the app can show the
// user their own historical urge-decay curve: personal, empirical proof that
// urges end.
import { UrgeEvent } from '../domain/types';

export const URGE_DECAY_MIN_EPISODES = 5;

function durationSeconds(u: UrgeEvent): number | null {
  if (!u.endedAt) return null;
  return Math.round((new Date(u.endedAt).getTime() - new Date(u.startedAt).getTime()) / 1000);
}

export function averageUrgeDurationSeconds(pastUrges: UrgeEvent[]): number | null {
  const durations = pastUrges.map(durationSeconds).filter((d): d is number => d !== null && d > 0);
  if (durations.length < URGE_DECAY_MIN_EPISODES) return null;
  return Math.round(durations.reduce((s, d) => s + d, 0) / durations.length);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins} min`;
  return `${mins}m ${secs}s`;
}
