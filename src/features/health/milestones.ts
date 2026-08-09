// src/features/health/milestones.ts
// ─────────────────────────────────────────────────────────────────────────────
// Health journey (§16). Well-established, non-personalised milestones only —
// nothing here is tailored to the individual, because tailoring it would make
// it medical advice, which this app does not give.
//
// Every screen that renders these must show the disclaimer line alongside
// them (`healthDisclaimer`), which is why the disclaimer key lives in the same
// module as the data.
// ─────────────────────────────────────────────────────────────────────────────

import type { TranslationKey } from '../../i18n';

export interface HealthMilestone {
  id: string;
  /** Milliseconds since the last cigarette at which this is reached. */
  afterMs: number;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const HEALTH_MILESTONES: HealthMilestone[] = [
  { id: '20m', afterMs: 20 * 60_000, titleKey: 'hm20m', bodyKey: 'hm20mBody' },
  { id: '12h', afterMs: 12 * HOUR, titleKey: 'hm12h', bodyKey: 'hm12hBody' },
  { id: '2w', afterMs: 14 * DAY, titleKey: 'hm2w', bodyKey: 'hm2wBody' },
  { id: '1y', afterMs: 365 * DAY, titleKey: 'hm1y', bodyKey: 'hm1yBody' },
  { id: '5y', afterMs: 5 * 365 * DAY, titleKey: 'hm5y', bodyKey: 'hm5yBody' },
  { id: '10y', afterMs: 10 * 365 * DAY, titleKey: 'hm10y', bodyKey: 'hm10yBody' },
];

/** The disclaimer key, exported here so a screen cannot render milestones without it. */
export const HEALTH_DISCLAIMER_KEY: TranslationKey = 'healthDisclaimer';

export function milestoneProgress(
  lastCigaretteMs: number | null,
  now = Date.now()
): Array<HealthMilestone & { reached: boolean; remainingMs: number }> {
  const elapsed = lastCigaretteMs === null ? 0 : now - lastCigaretteMs;
  return HEALTH_MILESTONES.map((milestone) => ({
    ...milestone,
    reached: lastCigaretteMs !== null && elapsed >= milestone.afterMs,
    remainingMs: Math.max(0, milestone.afterMs - elapsed),
  }));
}
