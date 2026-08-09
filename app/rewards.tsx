// app/rewards.tsx — §25 screen 14, and §13.
//
// The horizon at full size, plus the two figures that are genuinely rewarding
// because they're real: money kept and cigarettes not smoked. No points, no
// coins, no separate meter — §13 is explicit that the horizon *is* the
// progression system, so this screen shows it rather than inventing a second
// one beside it.

import { useMemo } from 'react';
import { View } from 'react-native';

import { Horizon } from '../src/components/Horizon';
import { Card } from '../src/components/ui/Card';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import {
  cigarettesAvoided,
  DEFAULT_CURRENCY,
  formatMoney,
  moneySaved,
  priceAt,
} from '../src/features/money/cost';
import { computeHorizon, daysOfHistory } from '../src/features/progress/horizon';
import { useT, type TranslationKey } from '../src/i18n';
import { useLogsStore } from '../src/store/useLogsStore';
import { useProfileStore } from '../src/store/useProfileStore';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Rewards() {
  const theme = useTheme();
  const t = useT();
  const profile = useProfileStore((s) => s.profile);
  const { cigarettes, cravings, prices } = useLogsStore();

  const horizon = useMemo(
    () => computeHorizon({ cigarettes, cravings, profile }),
    [cigarettes, cravings, profile]
  );

  const days = daysOfHistory(cigarettes, cravings);
  const saved = moneySaved({
    cigarettes,
    prices,
    baselinePerDay: profile.baselineCigarettesPerDay,
    days,
  });
  const avoided = cigarettesAvoided({
    smoked: cigarettes.length,
    baselinePerDay: profile.baselineCigarettesPerDay,
    days,
  });
  const currency = priceAt(prices, Date.now())?.currency ?? DEFAULT_CURRENCY;

  return (
    <Screen title={t('rewards.title')}>
      <Horizon clarity={horizon.clarity} tree={horizon.tree} height={220} />

      <Text variant="title" serif center>
        {t(`rewards.stage.${horizon.stage}` as TranslationKey)}
      </Text>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Text variant="heading" serif tone="accent">
              {formatMoney(saved, currency)}
            </Text>
            <Text variant="caption" tone="muted">
              {t('rewards.money')}
            </Text>
          </View>
          <View style={{ gap: 2, alignItems: 'flex-end' }}>
            <Text variant="heading" serif tone="growth">
              {Math.round(avoided)}
            </Text>
            <Text variant="caption" tone="muted">
              {t('rewards.notSmoked')}
            </Text>
          </View>
        </View>
      </Card>

      <Card muted>
        <View style={{ flexDirection: 'row', gap: theme.spacing.xl }}>
          <View style={{ gap: 2 }}>
            <Text variant="heading" serif tone="growth">
              {horizon.cravingsDelayed}
            </Text>
            <Text variant="caption" tone="muted">
              {t('dashboard.delayed')}
            </Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text variant="heading" serif>
              {horizon.daysUnderBaseline}
            </Text>
            <Text variant="caption" tone="muted">
              {t('achievements.day1.title')}
            </Text>
          </View>
        </View>
      </Card>

      <Text variant="bodySmall" tone="muted">
        {t('rewards.body')}
      </Text>
    </Screen>
  );
}
