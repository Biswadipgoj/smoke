// scripts/testEngines.ts
// ─────────────────────────────────────────────────────────────────────────────
// Engine tests (§28). Run with: npm run test:engines
//
// The delay algorithm first, because it is a pure function, it is the single
// most load-bearing piece of behaviour in the product, and every property
// below is a design commitment that is easy to silently invert during a
// refactor — "harder cravings get a harder ask" would look perfectly
// reasonable in a diff.
// ─────────────────────────────────────────────────────────────────────────────

import {
  INTENSITY_MULTIPLIERS,
  MAX_MINUTES,
  MIN_MINUTES,
  momentumMultiplier,
  recommendDelay,
  reductionFactor,
  START_FRACTION,
} from '../src/features/cravings/delayAlgorithm';
import { chooseIntervention } from '../src/features/cravings/interventionEngine';
import { horizonState } from '../src/features/rewards/horizon';
import { summariseDays } from '../src/features/achievements/achievements';
import type { BehaviorStats } from '../src/types';

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  pass  ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function stats(overrides: Partial<BehaviorStats> = {}): BehaviorStats {
  return {
    baselineIntervalMinutes: 90,
    recentDailyAverage: 10,
    priorDailyAverage: 12,
    triggerFrequency: [],
    hourHistogram: new Array(24).fill(0),
    recentSuccessRate: 0.5,
    effectiveInterventions: [],
    totalCravings: 0,
    totalDelayed: 0,
    ...overrides,
  };
}

console.log('\ndelayAlgorithm:');

const base = recommendDelay({
  stats: stats(),
  trigger: 'work',
  intensity: 3,
  baselinePerDay: 12,
  targetPerDay: null,
});
check('a first ask is minutes, not hours', base.minutes >= MIN_MINUTES && base.minutes <= 30, `${base.minutes}m`);
check('the ask is a fraction of the target gap', START_FRACTION < 0.5);

// The hardest contexts get the easiest ask.
const social = recommendDelay({ stats: stats(), trigger: 'social', intensity: 3, baselinePerDay: 12, targetPerDay: null });
const boredom = recommendDelay({ stats: stats(), trigger: 'boredom', intensity: 3, baselinePerDay: 12, targetPerDay: null });
check('social is asked for less than boredom', social.minutes < boredom.minutes, `${social.minutes} vs ${boredom.minutes}`);

// A stronger craving is asked for less, not more.
const mild = recommendDelay({ stats: stats(), trigger: 'work', intensity: 1, baselinePerDay: 12, targetPerDay: null });
const severe = recommendDelay({ stats: stats(), trigger: 'work', intensity: 5, baselinePerDay: 12, targetPerDay: null });
check('a 5/5 craving is asked for less than a 1/5', severe.minutes < mild.minutes, `${severe.minutes} vs ${mild.minutes}`);
check('intensity multipliers decrease monotonically',
  INTENSITY_MULTIPLIERS[1] > INTENSITY_MULTIPLIERS[2] &&
  INTENSITY_MULTIPLIERS[2] > INTENSITY_MULTIPLIERS[3] &&
  INTENSITY_MULTIPLIERS[3] > INTENSITY_MULTIPLIERS[4] &&
  INTENSITY_MULTIPLIERS[4] > INTENSITY_MULTIPLIERS[5]);

// A bad week makes the next ask easier.
const goodRun = recommendDelay({ stats: stats({ recentSuccessRate: 1 }), trigger: 'work', intensity: 3, baselinePerDay: 12, targetPerDay: null });
const badRun = recommendDelay({ stats: stats({ recentSuccessRate: 0 }), trigger: 'work', intensity: 3, baselinePerDay: 12, targetPerDay: null });
check('a bad week shrinks the ask', badRun.minutes < goodRun.minutes, `${badRun.minutes} vs ${goodRun.minutes}`);
check('momentum is neutral in the middle', momentumMultiplier(0.5) === 1);
check('momentum stretches only at 80%+', momentumMultiplier(0.8) > 1 && momentumMultiplier(0.79) === 1);

// Heavy smokers are not asked for the same thing as light smokers.
const heavy = recommendDelay({ stats: stats({ baselineIntervalMinutes: 30 }), trigger: 'work', intensity: 3, baselinePerDay: 40, targetPerDay: null });
check('a very heavy smoker gets a short, winnable first ask', heavy.minutes <= 10, `${heavy.minutes}m`);

// Bounds hold under absurd input.
const absurd = recommendDelay({ stats: stats({ baselineIntervalMinutes: 100000 }), trigger: 'boredom', intensity: 1, baselinePerDay: 1, targetPerDay: 0 });
check('the ask is capped', absurd.minutes <= MAX_MINUTES, `${absurd.minutes}m`);
const tiny = recommendDelay({ stats: stats({ baselineIntervalMinutes: 1 }), trigger: 'social', intensity: 5, baselinePerDay: 60, targetPerDay: null });
check('the ask has a floor', tiny.minutes >= MIN_MINUTES, `${tiny.minutes}m`);

check('quitting entirely does not produce an infinite gap', Number.isFinite(reductionFactor(20, 0)) && reductionFactor(20, 0) <= 2);

console.log('\ninterventionEngine:');
const plain = chooseIntervention('stress', 3, stats());
check('stress leads with the breath', plain.intervention === 'breathe', plain.intervention);
check('alternatives are offered', plain.alternatives.length > 0);
check('an unproven engine is not "personalised"', plain.personalised === false);

const personalised = chooseIntervention(
  'stress',
  3,
  stats({ effectiveInterventions: [{ intervention: 'walk', successRate: 0.9, uses: 6 }] })
);
check('a proven intervention wins', personalised.intervention === 'walk' && personalised.personalised);

const thin = chooseIntervention(
  'stress',
  3,
  stats({ effectiveInterventions: [{ intervention: 'walk', successRate: 1, uses: 2 }] })
);
check('two lucky uses do not count as evidence', thin.intervention === 'breathe');

console.log('\nhorizon:');
check('a new user starts at stage 1', horizonState(0, 0).stage === 1);
check('progress needs real behaviour', horizonState(0, 0).clearness === 0);
check('cravings let pass advance it', horizonState(10, 0).points === 10);
check('a day under baseline is worth more than one craving', horizonState(0, 1).points > horizonState(1, 0).points);
check('clearness is capped at 1', horizonState(1000, 1000).clearness === 1);
check('full canopy is reachable', horizonState(40, 0).stage === 4);

console.log('\nachievements:');
const days = [
  { dayMs: 1, count: 3 },
  { dayMs: 2, count: 0 },
  { dayMs: 3, count: 12 },
  { dayMs: 4, count: 2 },
  { dayMs: 5, count: 99 }, // "today" — must be excluded
];
const summary = summariseDays(days, 10, 5);
check('days under baseline are counted', summary.daysUnderBaseline === 3, String(summary.daysUnderBaseline));
check('zero days are counted', summary.zeroDays === 1);
check('the current day is excluded', summary.longestUnderBaselineRun === 2, String(summary.longestUnderBaselineRun));

console.log(failures === 0 ? '\nAll engine checks passed\n' : `\n${failures} failed\n`);
if (failures > 0) process.exit(1);
