// app/health.tsx — Screen 13: Health journey
// Well-established, non-personalised milestones only (§16), measured from the
// last logged cigarette.
//
// The disclaimer is not fine print at the bottom — it is at the top, before
// the first milestone, because everything below it is general information and
// the app must never be read as telling this person about their own body.

import React from 'react';
import { View } from 'react-native';
import { AppText, Card, Notice, Screen } from '../src/components/ui';
import { HEALTH_DISCLAIMER_KEY, milestoneProgress } from '../src/features/health/milestones';
import { useTranslation } from '../src/i18n';
import { useAsyncData } from '../src/hooks/useAsyncData';
import { lastCigaretteMs } from '../src/services/db/localDb';
import { useTheme } from '../src/theme/ThemeProvider';
import { compactDuration } from '../src/utils/format';

export default function Health() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: last } = useAsyncData(() => lastCigaretteMs(), []);

  const milestones = milestoneProgress(last ?? null);

  return (
    <Screen>
      <AppText variant="title">{t('healthTitle')}</AppText>
      <AppText variant="body" tone="secondary">
        {t('healthSubtitle')}
      </AppText>

      <Notice>{t(HEALTH_DISCLAIMER_KEY)}</Notice>

      {last ? (
        <AppText variant="small" tone="muted">
          {t('healthFrom')} · {compactDuration(Date.now() - last)}
        </AppText>
      ) : (
        <AppText variant="small" tone="muted">
          {t('healthNoStart')}
        </AppText>
      )}

      {milestones.map((milestone) => (
        <Card key={milestone.id} raised={milestone.reached}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="subheading" tone={milestone.reached ? 'growth' : 'default'}>
              {t(milestone.titleKey)}
            </AppText>
            {milestone.reached ? (
              <AppText variant="caption" tone="growth">
                {t('healthReached')}
              </AppText>
            ) : (
              <AppText variant="caption" tone="muted">
                {compactDuration(milestone.remainingMs)}
              </AppText>
            )}
          </View>
          <AppText variant="small" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
            {t(milestone.bodyKey)}
          </AppText>
        </Card>
      ))}
    </Screen>
  );
}
