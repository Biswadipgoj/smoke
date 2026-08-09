// app/(onboarding)/language.tsx — Screen 3: Language selection
// Comes before anything else that has copy in it, so the locale is set before
// the rest of onboarding renders a word.

import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, GhostButton, PrimaryButton, Row, Screen } from '../../src/components/ui';
import { LOCALES, localeLabels, useTranslation } from '../../src/i18n';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function LanguageSelection() {
  const router = useRouter();
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const setLocale = useAppStore((s) => s.setLocale);

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="title">{t('languageTitle')}</AppText>
        <AppText variant="body" tone="secondary">
          {t('languageSubtitle')}
        </AppText>
      </View>

      <View>
        {LOCALES.map((code) => (
          <Row
            key={code}
            label={localeLabels[code]}
            onPress={() => void setLocale(code)}
            tone={code === locale ? 'ember' : 'default'}
            right={
              code === locale ? (
                <AppText variant="body" tone="ember">
                  ✓
                </AppText>
              ) : null
            }
          />
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <PrimaryButton label={t('continue')} onPress={() => router.push('/(onboarding)/setup')} />
      <GhostButton label={t('back')} onPress={() => router.back()} />
    </Screen>
  );
}
