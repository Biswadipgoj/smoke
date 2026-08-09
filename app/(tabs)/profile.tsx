// app/(tabs)/profile.tsx — §25 screen 17.
//
// The hub. §25 notes the original was a stub that only linked to Settings;
// this one carries the stats summary it asked for and then routes onward.

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { Card } from '../../src/components/ui/Card';
import { Row } from '../../src/components/ui/Row';
import { Screen } from '../../src/components/ui/Screen';
import { Text } from '../../src/components/ui/Text';
import { cigarettesAvoided, formatMoney, moneySaved, priceAt, DEFAULT_CURRENCY } from '../../src/features/money/cost';
import { computeHorizon, daysOfHistory } from '../../src/features/progress/horizon';
import { useT } from '../../src/i18n';
import { formatDate } from '../../src/lib/dates';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useLogsStore } from '../../src/store/useLogsStore';
import { useProfileStore } from '../../src/store/useProfileStore';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function Profile() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();

  const profile = useProfileStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const { cigarettes, cravings, prices, refresh } = useLogsStore();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const summary = useMemo(() => {
    const days = daysOfHistory(cigarettes, cravings);
    return {
      days,
      entries: cigarettes.length + cravings.length,
      horizon: computeHorizon({ cigarettes, cravings, profile }),
      saved: moneySaved({
        cigarettes,
        prices,
        baselinePerDay: profile.baselineCigarettesPerDay,
        days,
      }),
      avoided: cigarettesAvoided({
        smoked: cigarettes.length,
        baselinePerDay: profile.baselineCigarettesPerDay,
        days,
      }),
      currency: priceAt(prices, Date.now())?.currency ?? DEFAULT_CURRENCY,
    };
  }, [cigarettes, cravings, prices, profile]);

  return (
    <Screen title={t('profile.title')} back={false}>
      <Card>
        <Text variant="body" weight="semiBold">
          {session?.user.email ?? t('profile.guest')}
        </Text>
        <Text variant="caption" tone="muted">
          {t('profile.entries', { n: summary.entries })} · {t('profile.since', {
            date: formatDate(profile.createdAtMs),
          })}
        </Text>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', gap: theme.spacing.xl }}>
          <View style={{ gap: 2 }}>
            <Text variant="heading" serif tone="growth">
              {summary.horizon.cravingsDelayed}
            </Text>
            <Text variant="caption" tone="muted">
              {t('dashboard.delayed')}
            </Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text variant="heading" serif>
              {Math.round(summary.avoided)}
            </Text>
            <Text variant="caption" tone="muted">
              {t('rewards.notSmoked')}
            </Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text variant="heading" serif tone="accent">
              {formatMoney(summary.saved, summary.currency)}
            </Text>
            <Text variant="caption" tone="muted">
              {t('rewards.money')}
            </Text>
          </View>
        </View>
      </Card>

      <Card muted>
        <Row label={t('rewards.title')} onPress={() => router.push('/rewards')} />
        <Row label={t('achievements.title')} onPress={() => router.push('/achievements')} />
        <Row label={t('settings.goals')} onPress={() => router.push('/goals')} />
        <Row label={t('settings.health')} onPress={() => router.push('/health')} />
        <Row label={t('timeline.title')} onPress={() => router.push('/timeline')} last />
      </Card>

      <Card muted>
        <Row label={t('settings.title')} onPress={() => router.push('/settings')} />
        <Row label={t('settings.privacy')} onPress={() => router.push('/privacy')} />
        <Row label={t('settings.help')} onPress={() => router.push('/help')} />
        <Row label={t('settings.about')} onPress={() => router.push('/about')} last />
      </Card>
    </Screen>
  );
}
