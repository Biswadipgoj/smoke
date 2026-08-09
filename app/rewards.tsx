// app/rewards.tsx — Screen 14: Rewards
// The horizon at full size, plus the only explanation of it that exists in the
// app: what makes it move, and what pointedly does not (§13).
//
// There is no other reward surface. No points, no coins, no separate meter —
// this screen is the whole of it.

import React from 'react';
import { View } from 'react-native';
import { Horizon } from '../src/components/Horizon';
import { AppText, Card, Screen } from '../src/components/ui';
import { summariseDays } from '../src/features/achievements/achievements';
import { horizonState } from '../src/features/rewards/horizon';
import { useTranslation } from '../src/i18n';
import { useAsyncData } from '../src/hooks/useAsyncData';
import { dailyCounts, listCravingLogs } from '../src/services/db/localDb';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { startOfDayMs } from '../src/utils/format';

export default function Rewards() {
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);

  const { data } = useAsyncData(async () => {
    const [cravings, counts] = await Promise.all([listCravingLogs(600), dailyCounts(90)]);
    const delayed = cravings.filter((c) => c.outcome === 'delayed').length;
    const days = summariseDays(counts, profile?.baselinePerDay ?? 0, startOfDayMs(Date.now()));
    return { delayed, daysUnderBaseline: days.daysUnderBaseline };
  }, [profile?.baselinePerDay]);

  const state = horizonState(data?.delayed ?? 0, data?.daysUnderBaseline ?? 0);
  const stageLabel = (['rewardsStage1', 'rewardsStage2', 'rewardsStage3', 'rewardsStage4'] as const)[
    state.stage - 1
  ];

  return (
    <Screen>
      <AppText variant="title">{t('rewardsTitle')}</AppText>
      <Horizon clearness={state.clearness} stage={state.stage} height={230} />

      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="heading" tone="growth">
          {t(stageLabel)}
        </AppText>
        {state.toNextStage > 0 ? (
          <AppText variant="small" tone="secondary">
            {t('rewardsNext', { count: state.toNextStage })}
          </AppText>
        ) : null}
      </View>

      <Card>
        <AppText variant="small" tone="secondary">
          {t('rewardsCounts', {
            delayed: data?.delayed ?? 0,
            days: data?.daysUnderBaseline ?? 0,
          })}
        </AppText>
      </Card>

      <AppText variant="small" tone="muted">
        {t('rewardsSubtitle')}
      </AppText>
    </Screen>
  );
}
