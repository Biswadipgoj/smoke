// src/features/progress/achievements.ts
//
// §14 screen 15 — a milestone list tied to real behaviour (§13). These are
// recognition, not currency: nothing unlocks a feature, and there is no total.

import type { TranslationKey } from '../../i18n';
import type { CigaretteLog, CravingLog, UserProfile } from '../../types';
import { recentCigarettesPerDay } from '../behavior/analysis';
import { daysOfHistory, daysUnderBaseline } from './horizon';

export interface Achievement {
  id: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  earned: boolean;
  /** 0–1, for the ones that are a count you can be partway through. */
  progress: number;
}

export function computeAchievements(params: {
  cigarettes: CigaretteLog[];
  cravings: CravingLog[];
  profile: UserProfile;
  nowMs?: number;
}): Achievement[] {
  const { cigarettes, cravings, profile } = params;
  const nowMs = params.nowMs ?? Date.now();

  const delayed = cravings.filter((c) => c.outcome === 'delayed').length;
  const underBaseline = daysUnderBaseline(cigarettes, profile, nowMs);
  const days = daysOfHistory(cigarettes, cravings);
  const recentPerDay = recentCigarettesPerDay(cigarettes, nowMs);
  const halved =
    cigarettes.length > 0 && recentPerDay > 0
      ? recentPerDay <= profile.baselineCigarettesPerDay / 2
      : false;

  const ratio = (value: number, target: number) => Math.min(1, value / target);

  return [
    {
      id: 'first',
      titleKey: 'achievements.first.title',
      bodyKey: 'achievements.first.body',
      earned: cravings.length >= 1,
      progress: ratio(cravings.length, 1),
    },
    {
      id: 'delay5',
      titleKey: 'achievements.delay5.title',
      bodyKey: 'achievements.delay5.body',
      earned: delayed >= 5,
      progress: ratio(delayed, 5),
    },
    {
      id: 'day1',
      titleKey: 'achievements.day1.title',
      bodyKey: 'achievements.day1.body',
      earned: underBaseline >= 1,
      progress: ratio(underBaseline, 1),
    },
    {
      id: 'week1',
      titleKey: 'achievements.week1.title',
      bodyKey: 'achievements.week1.body',
      earned: days >= 7,
      progress: ratio(days, 7),
    },
    {
      id: 'delay25',
      titleKey: 'achievements.delay25.title',
      bodyKey: 'achievements.delay25.body',
      earned: delayed >= 25,
      progress: ratio(delayed, 25),
    },
    {
      id: 'halved',
      titleKey: 'achievements.halved.title',
      bodyKey: 'achievements.halved.body',
      earned: halved,
      // Deliberately binary: a half-cleared "halved" badge would be a score.
      progress: halved ? 1 : 0,
    },
  ];
}
