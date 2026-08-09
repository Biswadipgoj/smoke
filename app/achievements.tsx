// app/achievements.tsx — Screen 15: Achievements
// Milestones tied to real behaviour (§13). Unearned ones are shown, not
// hidden, and they are labelled "not yet" rather than "locked" — there is no
// gate here, only a thing that has not happened yet.

import React from 'react';
import { View } from 'react-native';
import { AppText, Card, Screen } from '../src/components/ui';
import { evaluateAchievements, summariseDays } from '../src/features/achievements/achievements';
import { useTranslation } from '../src/i18n';
import { useAsyncData } from '../src/hooks/useAsyncData';
import {
  dailyCounts,
  getBehaviorStats,
  totalCigarettes,
  totalMoneySaved,
} from '../src/services/db/localDb';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { startOfDayMs } from '../src/utils/format';

export default function Achievements() {
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);

  const { data } = useAsyncData(async () => {
    const [logged, stats, counts, saved] = await Promise.all([
      totalCigarettes(),
      getBehaviorStats(),
      dailyCounts(120),
      totalMoneySaved(profile),
    ]);
    const days = summariseDays(counts, profile?.baselinePerDay ?? 0, startOfDayMs(Date.now()));
    return evaluateAchievements({
      totalLogged: logged,
      totalDelayed: stats.totalDelayed,
      daysUnderBaseline: days.daysUnderBaseline,
      longestUnderBaselineRun: days.longestUnderBaselineRun,
      zeroDays: days.zeroDays,
      moneySaved: saved,
      currency: profile?.currency ?? '₹',
    });
  }, [profile?.baselinePerDay, profile?.currency]);

  return (
    <Screen>
      <AppText variant="title">{t('achievementsTitle')}</AppText>
      <AppText variant="small" tone="secondary">
        {t('achievementsSubtitle')}
      </AppText>

      {(data ?? []).map((achievement) => (
        <Card key={achievement.id} raised={achievement.earned}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="subheading" tone={achievement.earned ? 'growth' : 'muted'}>
              {t(achievement.titleKey, achievement.vars)}
            </AppText>
            {achievement.earned ? null : (
              <AppText variant="caption" tone="muted">
                {t('achLocked')}
              </AppText>
            )}
          </View>
          <AppText variant="small" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
            {t(achievement.bodyKey)}
          </AppText>
        </Card>
      ))}
    </Screen>
  );
}
