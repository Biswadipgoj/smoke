// app/(tabs)/dashboard.tsx — §25 screen 6, and §9.
//
// The living home screen: hero over the horizon, today's row, the coach's
// message, and the craving CTA. §9's order is deliberate — the number that
// matters most is the one that's growing right now, and the only large button
// on the screen is the one you press mid-craving.

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Horizon } from '../../src/components/Horizon';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Text } from '../../src/components/ui/Text';
import { computeTodayStats } from '../../src/features/analytics/today';
import { formatMoney } from '../../src/features/money/cost';
import { computeHorizon } from '../../src/features/progress/horizon';
import { useT } from '../../src/i18n';
import { formatDuration } from '../../src/lib/dates';
import { dashboardMessage } from '../../src/services/ai/offlineCoach';
import * as haptics from '../../src/services/haptics';
import { useLogsStore } from '../../src/store/useLogsStore';
import { useProfileStore } from '../../src/store/useProfileStore';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function Dashboard() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const profile = useProfileStore((s) => s.profile);
  const { cigarettes, cravings, prices, behavior, refresh, logCigarette } = useLogsStore();

  // The hero counts up, so it needs a tick. Once a minute is the resolution
  // the hero actually shows — a per-second timer would just cost battery.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Coming back from the craving flow must not show stale numbers.
  useFocusEffect(
    useCallback(() => {
      void refresh();
      setNowMs(Date.now());
    }, [refresh])
  );

  const today = useMemo(
    () => computeTodayStats({ cigarettes, cravings, prices, profile, nowMs }),
    [cigarettes, cravings, prices, profile, nowMs]
  );

  const horizon = useMemo(
    () => computeHorizon({ cigarettes, cravings, profile, nowMs }),
    [cigarettes, cravings, profile, nowMs]
  );

  const message = useMemo(
    () =>
      dashboardMessage({
        behavior,
        profile,
        todayCigarettes: today.cigarettes,
        minutesSinceLast: today.minutesSinceLast,
        t,
      }),
    [behavior, profile, today.cigarettes, today.minutesSinceLast, t]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => void refresh()} tintColor={theme.colors.ember} />
        }
      >
        {/* Hero — the horizon, with the elapsed time sitting on it. */}
        <View style={styles.hero}>
          <Horizon clarity={horizon.clarity} tree={horizon.tree} height={280} />
          <View
            style={[
              styles.heroText,
              { paddingTop: insets.top + theme.spacing.lg, paddingHorizontal: theme.spacing.lg },
            ]}
          >
            <Text variant="caption" tone="onHazeMuted" weight="medium">
              {today.minutesSinceLast === null ? t('dashboard.never') : t('dashboard.sinceLast')}
            </Text>
            {today.minutesSinceLast !== null && (
              <Text variant="hero" serif tone="onHaze">
                {formatDuration(today.minutesSinceLast)}
              </Text>
            )}
          </View>
        </View>

        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg, marginTop: -theme.spacing.xl }}>
          <Card>
            <Text variant="caption" tone="muted" weight="medium">
              {t('dashboard.today')}
            </Text>
            <View style={[styles.stats, { gap: theme.spacing.md }]}>
              <Stat label={t('dashboard.cigarettes')} value={String(today.cigarettes)} />
              <Stat label={t('dashboard.cravings')} value={String(today.cravings)} />
              <Stat
                label={t('dashboard.delayed')}
                value={String(today.cravingsDelayed)}
                tone="growth"
              />
              <Stat
                label={t('dashboard.saved')}
                value={formatMoney(today.moneySaved, today.currency)}
              />
            </View>
          </Card>

          <Card muted onPress={() => router.push('/(tabs)/coach')}>
            <Text variant="caption" tone="muted" weight="medium">
              {t('dashboard.coachTitle')}
            </Text>
            <Text variant="body">{message}</Text>
          </Card>

          <Button label={t('dashboard.cravingCta')} onPress={() => router.push('/craving')} />

          {/* §11 — logging a cigarette is subtle but not zero: a light haptic,
              and the number above changes. There is deliberately no animation
              and no colour change, so it can't read as punishment. */}
          <Button
            variant="secondary"
            label={t('dashboard.logCta')}
            silent
            onPress={() => {
              haptics.cigaretteLogged();
              void logCigarette();
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'growth';
}) {
  return (
    <View style={styles.stat}>
      <Text variant="heading" serif tone={tone === 'growth' ? 'growth' : 'default'}>
        {value}
      </Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { position: 'relative' },
  heroText: { position: 'absolute', top: 0, left: 0, right: 0, gap: 2 },
  stats: { flexDirection: 'row', flexWrap: 'wrap' },
  stat: { minWidth: 72, gap: 2 },
});
