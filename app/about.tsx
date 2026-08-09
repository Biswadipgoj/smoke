// app/about.tsx — Screen 23: About
// Attribution, version, and the crisis line — which lives here as well as in
// the coach, so it is reachable from a calm screen and not only from the
// moment someone types something alarming.

import React from 'react';
import { View } from 'react-native';
import Constants from 'expo-constants';
import { AppText, Card, Screen } from '../src/components/ui';
import { useTranslation } from '../src/i18n';
import { useTheme } from '../src/theme/ThemeProvider';

export default function About() {
  const theme = useTheme();
  const { t } = useTranslation();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <AppText variant="title">{t('aboutTitle')}</AppText>
      <AppText variant="body" tone="secondary">
        {t('aboutBody')}
      </AppText>

      <Card>
        <AppText variant="subheading">{t('crisisTitle')}</AppText>
        <AppText variant="small" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          {t('crisisHelpline')}
        </AppText>
        <AppText variant="small" tone="secondary">
          {t('crisisEmergency')}
        </AppText>
      </Card>

      <View style={{ flex: 1 }} />
      <AppText variant="small" tone="muted">
        {t('aboutCredit')}
      </AppText>
      <AppText variant="caption" tone="muted">
        {t('aboutVersion', { version })}
      </AppText>
    </Screen>
  );
}
