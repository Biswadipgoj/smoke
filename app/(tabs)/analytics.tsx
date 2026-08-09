// app/(tabs)/analytics.tsx — §25 screen 11, and §14.
//
// Narrative first, then the charts. The sentences only ever describe genuine
// improvement (see insights.ts); the bars show the real shape of the week in
// both directions.

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { BarChart, RankedBars } from '../../src/components/BarChart';
import { Card } from '../../src/components/ui/Card';
import { Row } from '../../src/components/ui/Row';
import { Screen } from '../../src/components/ui/Screen';
import { Text } from '../../src/components/ui/Text';
import { buildInsights } from '../../src/features/analytics/insights';
import { DAY_MS } from '../../src/features/behavior/analysis';
import { useT, type TranslationKey } from '../../src/i18n';
import { useLogsStore } from '../../src/store/useLogsStore';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function Analytics() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const { cigarettes, cravings, behavior, refresh } = useLogsStore();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const insights = useMemo(
    () => buildInsights({ cigarettes, cravings, t }),
    [cigarettes, cravings, t]
  );

  const hourBars = useMemo(() => {
    const peak = Math.max(...behavior.hourHistogram);
    // Three-hour buckets: 24 bars on a phone is a picket fence.
    return Array.from({ length: 8 }, (_, i) => {
      const value = behavior.hourHistogram
        .slice(i * 3, i * 3 + 3)
        .reduce((a, b) => a + b, 0);
      return {
        key: `h${i}`,
        label: `${i * 3}`,
        value,
        emphasis: peak > 0 && behavior.hourHistogram.slice(i * 3, i * 3 + 3).includes(peak),
      };
    });
  }, [behavior.hourHistogram]);

  const triggerBars = useMemo(
    () =>
      behavior.triggerFrequency.slice(0, 6).map((entry) => ({
        key: entry.trigger,
        label: t(`trigger.${entry.trigger}` as TranslationKey),
        value: entry.count,
      })),
    [behavior.triggerFrequency, t]
  );

  const weekCount = cigarettes.filter((c) => c.timestampMs >= Date.now() - 7 * DAY_MS).length;
  const hasHistory = cigarettes.length > 0 || cravings.length > 0;

  return (
    <Screen title={t('analytics.title')} back={false}>
      {!hasHistory ? (
        <Text variant="body" tone="muted">
          {t('analytics.empty')}
        </Text>
      ) : (
        <>
          <Card>
            <Text variant="caption" tone="muted" weight="medium">
              {t('analytics.insights')}
            </Text>
            {insights.length === 0 ? (
              <Text variant="body" tone="muted">
                {t('analytics.noInsights')}
              </Text>
            ) : (
              <View style={{ gap: theme.spacing.sm }}>
                {insights.map((insight) => (
                  <Text key={insight.id} variant="body">
                    {insight.text}
                  </Text>
                ))}
              </View>
            )}
          </Card>

          <Card>
            <Text variant="caption" tone="muted" weight="medium">
              {t('analytics.byHour')}
            </Text>
            <BarChart bars={hourBars} />
          </Card>

          {triggerBars.length > 0 && (
            <Card>
              <Text variant="caption" tone="muted" weight="medium">
                {t('analytics.byTrigger')}
              </Text>
              <RankedBars bars={triggerBars} />
            </Card>
          )}

          <Card muted>
            <Text variant="caption" tone="muted" weight="medium">
              {t('analytics.lastWeek')}
            </Text>
            <Text variant="title" serif>
              {weekCount}
            </Text>
            <Text variant="caption" tone="muted">
              {t('analytics.perDay')}: {(weekCount / 7).toFixed(1)}
            </Text>
          </Card>
        </>
      )}

      <Card muted>
        <Row label={t('timeline.title')} onPress={() => router.push('/timeline')} />
        <Row label={t('calendar.title')} onPress={() => router.push('/calendar')} last />
      </Card>
    </Screen>
  );
}
