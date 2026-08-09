// app/(tabs)/dashboard.tsx — Screen 6: Dashboard
// The living home screen: the horizon with time-since-last over it, today's
// numbers, one line from the coach, and the craving CTA.
//
// Two deliberate absences:
//   · No AI call on load. The line in the coach card comes from the local
//     insight engine, so this screen costs nothing, works on a dead network,
//     and never makes the user wait to see their own data.
//   · No streak, anywhere. The hero is "time since your last cigarette",
//     which is a fact that keeps being true rather than a score that breaks.

import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Horizon } from '../../src/components/Horizon';
import { AppText, Card, GhostButton, PrimaryButton, Screen, Stat } from '../../src/components/ui';
import { generateInsights } from '../../src/features/analytics/insights';
import { horizonState } from '../../src/features/rewards/horizon';
import { summariseDays } from '../../src/features/achievements/achievements';
import { interventionCopy, triggerLabel } from '../../src/features/cravings/interventionEngine';
import { useTranslation } from '../../src/i18n';
import {
  dailyCounts,
  getBehaviorStats,
  getTodayStats,
  listCigaretteLogs,
  listCravingLogs,
  totalMoneySaved,
} from '../../src/services/db/localDb';
import { useAsyncData } from '../../src/hooks/useAsyncData';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { formatDuration, money, startOfDayMs } from '../../src/utils/format';

export default function Dashboard() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);

  const { data } = useAsyncData(async () => {
    const [today, stats, cigarettes, cravings, saved, counts] = await Promise.all([
      getTodayStats(profile),
      getBehaviorStats(),
      listCigaretteLogs(400),
      listCravingLogs(400),
      totalMoneySaved(profile),
      dailyCounts(30),
    ]);
    return { today, stats, cigarettes, cravings, saved, counts };
  }, [profile?.id, profile?.baselinePerDay]);

  const today = data?.today;
  const since = today?.lastCigaretteMs ? formatDuration(Date.now() - today.lastCigaretteMs) : null;

  const dayStats = data
    ? summariseDays(data.counts, profile?.baselinePerDay ?? 0, startOfDayMs(Date.now()))
    : null;
  const horizon = horizonState(
    data?.cravings.filter((c) => c.outcome === 'delayed').length ?? 0,
    dayStats?.daysUnderBaseline ?? 0
  );

  const insights = data
    ? generateInsights(
        {
          stats: data.stats,
          cigarettes: data.cigarettes,
          cravings: data.cravings,
          totalSaved: data.saved,
          currency: today?.currency ?? profile?.currency ?? '₹',
          interventionLabel: (id) => interventionCopy(id, t).title,
          triggerLabel: (trigger) => triggerLabel(trigger, t),
        },
        t
      )
    : [];

  return (
    <Screen>
      <View style={{ gap: theme.spacing.md }}>
        <Horizon clearness={horizon.clearness} stage={horizon.stage} height={190} />
        {since ? (
          <View>
            <AppText variant="hero">{since.value}</AppText>
            <AppText variant="body" tone="secondary">
              {since.unit ? `${since.unit} ${t('homeSinceLast')}` : t('homeSinceLast')}
            </AppText>
          </View>
        ) : (
          <View>
            <AppText variant="title">{t('homeNoneLogged')}</AppText>
            <AppText variant="body" tone="secondary">
              {t('homeNoneLoggedBody')}
            </AppText>
          </View>
        )}
      </View>

      <Card>
        <AppText variant="caption" tone="muted">
          {t('homeTodayTitle')}
        </AppText>
        <View style={{ flexDirection: 'row', gap: theme.spacing.lg, marginTop: theme.spacing.sm }}>
          <Stat label={t('homeStatSmoked')} value={String(today?.cigarettesToday ?? 0)} />
          <Stat label={t('homeStatCravings')} value={String(today?.cravingsToday ?? 0)} />
          <Stat
            label={t('homeStatDelayed')}
            value={String(today?.cravingsDelayedToday ?? 0)}
            tone="growth"
          />
          <Stat
            label={t('homeStatSaved')}
            value={money(today?.moneySavedToday ?? 0, today?.currency ?? '₹')}
          />
        </View>
      </Card>

      {insights.length > 0 ? (
        <Card onPress={() => router.push('/(tabs)/coach')} raised>
          <AppText variant="body">{insights[0].text}</AppText>
          <AppText variant="caption" tone="ember">
            {t('homeCoachHint')}
          </AppText>
        </Card>
      ) : null}

      <View style={{ flex: 1 }} />

      <PrimaryButton label={t('homeCravingCta')} onPress={() => router.push('/craving')} />
      <GhostButton label={t('homeLogCta')} onPress={() => router.push('/log')} />
    </Screen>
  );
}
