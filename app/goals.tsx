// app/goals.tsx — Screen 12: Goals
// Set and track a reduction target. The goal feeds the delay algorithm's
// reductionFactor, so this screen is not decorative — changing the target
// changes what the craving screen asks for.
//
// A missed goal is never announced. The screen states the two numbers next to
// each other and leaves the arithmetic to the reader (§1, §14).

import React, { useState } from 'react';
import { View } from 'react-native';
import { AppText, Card, Field, Notice, PrimaryButton, Screen, SectionHeading } from '../src/components/ui';
import { useTranslation } from '../src/i18n';
import { useAsyncData } from '../src/hooks/useAsyncData';
import { activeGoal, dailyCounts, insertGoal, listGoals } from '../src/services/db/localDb';
import { useAppStore } from '../src/store/useAppStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Goals() {
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const [target, setTarget] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, reload } = useAsyncData(async () => {
    const [current, all, counts] = await Promise.all([activeGoal(), listGoals(), dailyCounts(7)]);
    const week = counts.reduce((sum, day) => sum + day.count, 0) / 7;
    return { current, all, weeklyAverage: week };
  }, []);

  async function save() {
    const value = Math.max(0, Math.round(Number(target) || 0));
    setSaving(true);
    await insertGoal(value, session?.user.id ?? null);
    setTarget('');
    setSaving(false);
    reload();
  }

  const current = data?.current;

  return (
    <Screen>
      <AppText variant="title">{t('goalsTitle')}</AppText>

      <SectionHeading>{t('goalsCurrent')}</SectionHeading>
      {current ? (
        <Card>
          <AppText variant="heading" tone="ember">
            {current.targetPerDay === 0
              ? t('goalsQuitEntirely')
              : `${current.targetPerDay} ${t('perDay')}`}
          </AppText>
          <AppText variant="small" tone="secondary">
            {t('goalsProgress', {
              actual: (data?.weeklyAverage ?? 0).toFixed(1),
              target: current.targetPerDay,
            })}
          </AppText>
          <AppText variant="caption" tone="muted">
            {t('goalsSince', { date: new Date(current.createdAtMs).toLocaleDateString() })}
          </AppText>
          {current.achievedAtMs ? (
            <AppText variant="small" tone="growth">
              {t('goalsAchieved', { date: new Date(current.achievedAtMs).toLocaleDateString() })}
            </AppText>
          ) : null}
        </Card>
      ) : (
        <Notice>{t('goalsNone')}</Notice>
      )}

      <SectionHeading>{t('goalsSetTitle')}</SectionHeading>
      <Field
        label={t('goalsTargetPerDay')}
        hint={`${t('settingsBaseline')}: ${profile?.baselinePerDay ?? 0}`}
        value={target}
        onChangeText={setTarget}
        keyboardType="number-pad"
        maxLength={3}
      />
      <PrimaryButton
        label={t('goalsSave')}
        loading={saving}
        disabled={target.trim().length === 0}
        onPress={() => void save()}
      />

      {(data?.all.length ?? 0) > 1 ? (
        <>
          <SectionHeading>{t('goalsTitle')}</SectionHeading>
          <View>
            {(data?.all ?? []).slice(1).map((goal) => (
              <AppText key={goal.id} variant="small" tone="muted" style={{ paddingVertical: theme.spacing.xs }}>
                {new Date(goal.createdAtMs).toLocaleDateString()} · {goal.targetPerDay} {t('perDay')}
              </AppText>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
