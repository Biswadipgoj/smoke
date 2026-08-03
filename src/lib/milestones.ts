// src/lib/milestones.ts
// Track-specific health milestones (doc 03 §8) computed from time-since-last
// lapse (or quit date if never lapsed). Financial milestones are simply the
// reclaim engine's totals, shown in the Reclaimed card — not duplicated here.
import { Track, LapseEvent } from '../domain/types';

export interface Milestone {
  id: string;
  minutesRequired: number;
  achieved: boolean;
}

const TOBACCO_MILESTONES = [
  { id: '20min', minutesRequired: 20 },
  { id: '12hr', minutesRequired: 60 * 12 },
  { id: '24hr', minutesRequired: 60 * 24 },
  { id: '48hr', minutesRequired: 60 * 48 },
  { id: '1week', minutesRequired: 60 * 24 * 7 },
  { id: '1month', minutesRequired: 60 * 24 * 30 },
  { id: '3months', minutesRequired: 60 * 24 * 90 },
  { id: '1year', minutesRequired: 60 * 24 * 365 },
];

const GENERIC_MILESTONES = [
  { id: '1day', minutesRequired: 60 * 24 },
  { id: '1week', minutesRequired: 60 * 24 * 7 },
  { id: '1month', minutesRequired: 60 * 24 * 30 },
  { id: '3months', minutesRequired: 60 * 24 * 90 },
  { id: '1year', minutesRequired: 60 * 24 * 365 },
];

export function computeMilestones(track: Track, lapses: LapseEvent[]): Milestone[] {
  const trackLapses = lapses.filter((l) => l.track === track.type).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const since = trackLapses[0]?.timestamp ?? track.quitDate ?? track.startedAt;
  const minutesFree = (Date.now() - new Date(since).getTime()) / 60000;
  const list = track.type === 'tobacco' ? TOBACCO_MILESTONES : GENERIC_MILESTONES;
  return list.map((m) => ({ ...m, achieved: minutesFree >= m.minutesRequired }));
}
