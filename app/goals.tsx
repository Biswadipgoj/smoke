// app/goals.tsx — §25 screen 12.
//
// Set and track the reduction target. Progress is measured from the starting
// point towards the target and floored at zero: a week that goes backwards
// shows as "not yet moved", never as negative progress.

import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Chip } from '../src/components/ui/Chip';
import { Stepper } from '../src/components/ui/Field';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { recentCigarettesPerDay } from '../src/features/behavior/analysis';
import { useT } from '../src/i18n';
import { formatDate } from '../src/lib/dates';
import { useLogsStore } from '../src/store/useLogsStore';
import { useProfileStore } from '../src/store/useProfileStore';
import { useTheme } from '../src/theme/ThemeProvider';
import type { GoalType } from '../src/types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Same relative choices the onboarding step offers, so they stay in step. */
const QUIT_DATE_OPTIONS = [
  { key: 'quitDate.today' as const, offsetDays: 0 },
  { key: 'quitDate.week' as const, offsetDays: 7 },
  { key: 'quitDate.month' as const, offsetDays: 30 },
  { key: 'quitDate.later' as const, offsetDays: null },
];

export default function Goals() {
  const theme = useTheme();
  const t = useT();
  const profile = useProfileStore((s) => s.profile);
  const update = useProfileStore((s) => s.update);
  const cigarettes = useLogsStore((s) => s.cigarettes);

  const [editing, setEditing] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>(profile.goalType);
  const [baseline, setBaseline] = useState(profile.baselineCigarettesPerDay);
  const [target, setTarget] = useState(profile.targetCigarettesPerDay);
  const [quitDateMs, setQuitDateMs] = useState<number | null>(profile.quitDateMs);

  const current = useMemo(() => recentCigarettesPerDay(cigarettes), [cigarettes]);

  const progress = useMemo(() => {
    const span = profile.baselineCigarettesPerDay - profile.targetCigarettesPerDay;
    if (span <= 0) return 0;
    const moved = profile.baselineCigarettesPerDay - current;
    return Math.round(Math.min(1, Math.max(0, moved / span)) * 100);
  }, [profile, current]);

  async function save() {
    await update({
      goalType,
      baselineCigarettesPerDay: baseline,
      targetCigarettesPerDay: goalType === 'quit' ? 0 : Math.min(target, baseline),
      // §12 — the date is meant to be movable. Someone who pushes it back is
      // still working on it, and the app should not treat that as a defeat.
      quitDateMs: goalType === 'quit' ? quitDateMs : null,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <Screen
        title={t('goals.edit')}
        footer={
          <View style={{ gap: theme.spacing.sm }}>
            <Button label={t('common.save')} onPress={() => void save()} />
            <Button variant="quiet" label={t('common.cancel')} onPress={() => setEditing(false)} />
          </View>
        }
      >
        <Chip
          block
          label={t('onboarding.goal.reduce')}
          description={t('onboarding.goal.reduceBody')}
          selected={goalType === 'reduce'}
          onPress={() => setGoalType('reduce')}
        />
        <Chip
          block
          label={t('onboarding.goal.quit')}
          description={t('onboarding.goal.quitBody')}
          selected={goalType === 'quit'}
          onPress={() => setGoalType('quit')}
        />
        <Stepper label={t('goals.baseline')} value={baseline} onChange={setBaseline} min={1} max={80} />
        {goalType === 'reduce' ? (
          <Stepper
            label={t('goals.target')}
            value={Math.min(target, baseline)}
            onChange={setTarget}
            min={0}
            max={baseline}
          />
        ) : (
          <>
            <Text variant="caption" tone="muted" weight="medium">
              {t('goals.quitDate')}
            </Text>
            {QUIT_DATE_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                block
                label={t(option.key)}
                selected={
                  option.offsetDays === null
                    ? quitDateMs === null
                    : quitDateMs !== null &&
                      Math.abs(quitDateMs - (Date.now() + option.offsetDays * DAY_MS)) < DAY_MS / 2
                }
                onPress={() =>
                  setQuitDateMs(
                    option.offsetDays === null ? null : Date.now() + option.offsetDays * DAY_MS
                  )
                }
              />
            ))}
          </>
        )}
      </Screen>
    );
  }

  return (
    <Screen
      title={t('goals.title')}
      footer={<Button variant="secondary" label={t('goals.edit')} onPress={() => setEditing(true)} />}
    >
      <Card>
        <Text variant="caption" tone="muted" weight="medium">
          {t('goals.current')}
        </Text>
        <Text variant="display" serif>
          {current.toFixed(1)}
        </Text>
        <Text variant="caption" tone="muted">
          {t('analytics.perDay')}
        </Text>
      </Card>

      <Card muted>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Text variant="caption" tone="muted">
              {t('goals.baseline')}
            </Text>
            <Text variant="heading" serif>
              {profile.baselineCigarettesPerDay}
            </Text>
          </View>
          <View style={{ gap: 2, alignItems: 'flex-end' }}>
            <Text variant="caption" tone="muted">
              {profile.goalType === 'quit' ? t('goals.quitDate') : t('goals.target')}
            </Text>
            <Text variant="heading" serif tone="growth">
              {profile.goalType === 'quit'
                ? profile.quitDateMs
                  ? formatDate(profile.quitDateMs)
                  : '—'
                : profile.targetCigarettesPerDay}
            </Text>
          </View>
        </View>

        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.border,
            overflow: 'hidden',
            marginTop: theme.spacing.sm,
          }}
        >
          <View
            style={{ width: `${progress}%`, height: '100%', backgroundColor: theme.colors.growth }}
          />
        </View>
        <Text variant="bodySmall" tone="muted">
          {t('goals.progress', { n: progress })}
        </Text>
      </Card>
    </Screen>
  );
}
