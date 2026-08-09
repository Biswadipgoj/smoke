// app/(tabs)/analytics.tsx — Screen 11: Analytics
// Narrative insights first, charts second (§14).
//
// The order matters. A chart of a bad fortnight is a chart of a bad fortnight;
// a sentence about a bad fortnight is a verdict. So the sentences are
// generated only for genuine improvements and stay silent otherwise, while the
// charts show everything, neutrally, for anyone who wants to look.
//
// The bars are plain Views rather than a charting library: four bar charts do
// not justify a dependency, and these render at 60fps on a mid-range phone
// without a bridge crossing (§27).

import React from 'react';
import { View } from 'react-native';
import { AppText, Card, Notice, Screen, SectionHeading } from '../../src/components/ui';
import { generateInsights } from '../../src/features/analytics/insights';
import { interventionCopy, triggerLabel } from '../../src/features/cravings/interventionEngine';
import { useTranslation } from '../../src/i18n';
import { useAsyncData } from '../../src/hooks/useAsyncData';
import {
  dailyCounts,
  getBehaviorStats,
  listCigaretteLogs,
  listCravingLogs,
  totalMoneySaved,
} from '../../src/services/db/localDb';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function Analytics() {
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);

  const { data } = useAsyncData(async () => {
    const [stats, cigarettes, cravings, saved, counts] = await Promise.all([
      getBehaviorStats(),
      listCigaretteLogs(600),
      listCravingLogs(600),
      totalMoneySaved(profile),
      dailyCounts(14),
    ]);
    return { stats, cigarettes, cravings, saved, counts };
  }, [profile?.id, profile?.baselinePerDay]);

  const insights = data
    ? generateInsights(
        {
          stats: data.stats,
          cigarettes: data.cigarettes,
          cravings: data.cravings,
          totalSaved: data.saved,
          currency: profile?.currency ?? '₹',
          interventionLabel: (id) => interventionCopy(id, t).title,
          triggerLabel: (trigger) => triggerLabel(trigger, t),
        },
        t
      )
    : [];

  const dailyMax = Math.max(1, ...(data?.counts ?? []).map((d) => d.count));
  const hourMax = Math.max(1, ...(data?.stats.hourHistogram ?? []));
  const triggerMax = Math.max(1, ...(data?.stats.triggerFrequency ?? []).map((entry) => entry.count));

  return (
    <Screen>
      <AppText variant="title">{t('analyticsTitle')}</AppText>

      {insights.length === 0 ? (
        <Notice>{t('analyticsNoInsights')}</Notice>
      ) : (
        insights.map((insight) => (
          <Card key={insight.id}>
            <AppText variant="body" tone={insight.tone === 'growth' ? 'growth' : 'default'}>
              {insight.text}
            </AppText>
          </Card>
        ))
      )}

      <SectionHeading>{t('analyticsDailyTitle')}</SectionHeading>
      <Card>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 4,
            height: 110,
          }}
        >
          {(data?.counts ?? []).map((day) => (
            <View
              key={day.dayMs}
              style={{
                flex: 1,
                height: Math.max(3, (day.count / dailyMax) * 100),
                backgroundColor:
                  day.count <= (profile?.baselinePerDay ?? 0) ? theme.colors.growth : theme.colors.ember,
                borderRadius: theme.radius.sm,
                opacity: 0.85,
              }}
            />
          ))}
        </View>
        <AppText variant="caption" tone="muted">
          {t('analyticsAverage')}:{' '}
          {(data?.stats.recentDailyAverage ?? 0).toFixed(1)} · {t('analyticsPrevious')}:{' '}
          {(data?.stats.priorDailyAverage ?? 0).toFixed(1)}
        </AppText>
      </Card>

      <SectionHeading>{t('analyticsTriggerTitle')}</SectionHeading>
      <Card>
        {(data?.stats.triggerFrequency ?? []).slice(0, 6).map((entry) => (
          <View key={entry.trigger} style={{ gap: 4, marginBottom: theme.spacing.sm }}>
            <AppText variant="small" tone="secondary">
              {triggerLabel(entry.trigger, t)} · {entry.count}
            </AppText>
            <View
              style={{
                height: 8,
                width: `${(entry.count / triggerMax) * 100}%`,
                backgroundColor: theme.colors.ember,
                borderRadius: theme.radius.sm,
              }}
            />
          </View>
        ))}
        {(data?.stats.triggerFrequency.length ?? 0) === 0 ? (
          <AppText variant="small" tone="muted">
            {t('analyticsNoInsights')}
          </AppText>
        ) : null}
      </Card>

      <SectionHeading>{t('analyticsHourTitle')}</SectionHeading>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 }}>
          {(data?.stats.hourHistogram ?? []).map((count, hour) => (
            <View
              key={hour}
              style={{
                flex: 1,
                height: Math.max(2, (count / hourMax) * 74),
                backgroundColor: theme.colors.ember,
                opacity: 0.8,
                borderRadius: 2,
              }}
            />
          ))}
        </View>
        <AppText variant="caption" tone="muted">
          00 · 06 · 12 · 18 · 23
        </AppText>
      </Card>

      <SectionHeading>{t('analyticsInterventionTitle')}</SectionHeading>
      <Card>
        {(data?.stats.effectiveInterventions ?? []).slice(0, 5).map((entry) => (
          <View
            key={entry.intervention}
            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}
          >
            <AppText variant="small">{interventionCopy(entry.intervention, t).title}</AppText>
            <AppText variant="small" tone="growth">
              {t('analyticsSuccess', { percent: Math.round(entry.successRate * 100) })} ·{' '}
              {t('analyticsUses', { count: entry.uses })}
            </AppText>
          </View>
        ))}
        {(data?.stats.effectiveInterventions.length ?? 0) === 0 ? (
          <AppText variant="small" tone="muted">
            {t('analyticsNoInsights')}
          </AppText>
        ) : null}
      </Card>
    </Screen>
  );
}
