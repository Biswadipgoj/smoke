// app/health.tsx — §25 screen 13, and §16.
//
// Well-established, non-personalised milestones only, with the disclaimer §16
// requires visible on the screen rather than buried in an about page.

import { useMemo } from 'react';
import { View } from 'react-native';

import { Card } from '../src/components/ui/Card';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { milestoneProgress } from '../src/features/health/milestones';
import { useT } from '../src/i18n';
import { formatDuration } from '../src/lib/dates';
import { useLogsStore } from '../src/store/useLogsStore';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Health() {
  const theme = useTheme();
  const t = useT();
  const cigarettes = useLogsStore((s) => s.cigarettes);

  const lastCigaretteMs = useMemo(
    () =>
      cigarettes.reduce<number | null>(
        (latest, c) => (latest === null || c.timestampMs > latest ? c.timestampMs : latest),
        null
      ),
    [cigarettes]
  );

  const rows = useMemo(() => milestoneProgress(lastCigaretteMs), [lastCigaretteMs]);

  return (
    <Screen title={t('health.title')}>
      {lastCigaretteMs !== null && (
        <Card>
          <Text variant="caption" tone="muted" weight="medium">
            {t('dashboard.sinceLast')}
          </Text>
          <Text variant="display" serif tone="growth">
            {formatDuration((Date.now() - lastCigaretteMs) / 60000)}
          </Text>
        </Card>
      )}

      {rows.map(({ milestone, reached, progress }) => (
        <Card key={milestone.id} muted={!reached}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="heading" serif tone={reached ? 'growth' : 'default'}>
              {t(milestone.titleKey)}
            </Text>
            {reached ? (
              <Text variant="caption" tone="growth" weight="medium">
                {t('health.reached')}
              </Text>
            ) : null}
          </View>
          <Text variant="body" tone="muted">
            {t(milestone.bodyKey)}
          </Text>
          {!reached && (
            <View
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.colors.border,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  height: '100%',
                  backgroundColor: theme.colors.growth,
                }}
              />
            </View>
          )}
        </Card>
      ))}

      {/* §16 — this line is not optional on any screen showing the milestones. */}
      <Text variant="caption" tone="muted">
        {t('health.disclaimer')}
      </Text>
    </Screen>
  );
}
