// app/privacy.tsx — Screen 20: Privacy
// A plain explanation of what is stored, what the AI sees, where the API key
// lives, and the one commitment that has to be a real line in a real privacy
// policy before launch, not just an internal principle: this data is never
// sold (§23).

import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Card, GhostButton, Screen } from '../src/components/ui';
import { useTranslation } from '../src/i18n';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Privacy() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const sections = [
    { title: 'privacyStoredTitle', body: 'privacyStoredBody' },
    { title: 'privacyAiTitle', body: 'privacyAiBody' },
    { title: 'privacyKeyTitle', body: 'privacyKeyBody' },
    { title: 'privacySellTitle', body: 'privacySellBody' },
  ] as const;

  return (
    <Screen>
      <AppText variant="title">{t('privacyTitle')}</AppText>

      {sections.map((section) => (
        <Card key={section.title}>
          <AppText variant="subheading">{t(section.title)}</AppText>
          <AppText variant="small" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
            {t(section.body)}
          </AppText>
        </Card>
      ))}

      <View style={{ flex: 1 }} />
      <GhostButton label={t('privacyExport')} onPress={() => router.push('/backup')} />
      <GhostButton
        label={t('privacyDelete')}
        tone="alert"
        onPress={() => router.push('/delete-account')}
      />
    </Screen>
  );
}
