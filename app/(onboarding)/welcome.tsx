// app/(onboarding)/welcome.tsx — Screen 2: Welcome
// One screen, one value proposition, one CTA. The horizon does the arguing:
// it is the first thing the user sees and the thing every later screen refers
// back to.

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Horizon } from '../../src/components/Horizon';
import { AppText, PrimaryButton, Screen } from '../../src/components/ui';
import { detectLocale, useTranslation } from '../../src/i18n';
import { makeProfile, useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function Welcome() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);

  // Seed a profile from the device language before the first frame of copy is
  // read, so a Hindi phone never shows an English welcome and then switches.
  useEffect(() => {
    if (!profile) void setProfile(makeProfile({ locale: detectLocale() }));
  }, [profile, setProfile]);

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.xl }}>
        <Horizon clearness={0.55} stage={2} height={200} />
        <View style={{ gap: theme.spacing.md }}>
          <AppText variant="hero">{t('welcomeTitle')}</AppText>
          <AppText variant="body" tone="secondary">
            {t('welcomeBody')}
          </AppText>
        </View>
      </View>
      <PrimaryButton label={t('welcomeCta')} onPress={() => router.push('/(onboarding)/language')} />
    </Screen>
  );
}
