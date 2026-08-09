// app/(tabs)/profile.tsx — Screen 17: Profile
// The hub. A short factual summary, then every secondary screen in the app,
// grouped by what the user would be looking for rather than by which module
// happens to own it.

import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Card, Divider, Row, Screen, SectionHeading, Stat } from '../../src/components/ui';
import { useTranslation } from '../../src/i18n';
import { useAsyncData } from '../../src/hooks/useAsyncData';
import {
  getBehaviorStats,
  totalCigarettes,
  totalMoneySaved,
} from '../../src/services/db/localDb';
import { useAppStore } from '../../src/store/useAppStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { money } from '../../src/utils/format';

export default function Profile() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);

  const { data } = useAsyncData(async () => {
    const [logged, stats, saved] = await Promise.all([
      totalCigarettes(),
      getBehaviorStats(),
      totalMoneySaved(profile),
    ]);
    return { logged, stats, saved };
  }, [profile?.id, profile?.baselinePerDay]);

  const since = profile ? new Date(profile.startedAtMs).toLocaleDateString() : '';

  return (
    <Screen>
      <AppText variant="title">{t('profileTitle')}</AppText>
      <AppText variant="small" tone="muted">
        {t('profileSince', { date: since })}
      </AppText>

      <Card>
        <View style={{ flexDirection: 'row', gap: theme.spacing.lg }}>
          <Stat label={t('profileTotalLogged')} value={String(data?.logged ?? 0)} />
          <Stat
            label={t('profileTotalDelayed')}
            value={String(data?.stats.totalDelayed ?? 0)}
            tone="growth"
          />
          <Stat
            label={t('profileTotalSaved')}
            value={money(data?.saved ?? 0, profile?.currency ?? '₹')}
          />
        </View>
      </Card>

      <Card raised>
        <AppText variant="small" tone="secondary">
          {session?.user.email
            ? t('profileSignedInAs', { email: session.user.email })
            : t('profileNotSignedIn')}
        </AppText>
      </Card>

      <SectionHeading>{t('tabAnalytics')}</SectionHeading>
      <View>
        <Row label={t('timelineTitle')} onPress={() => router.push('/timeline')} />
        <Divider />
        <Row label={t('calendarTitle')} onPress={() => router.push('/calendar')} />
        <Divider />
        <Row label={t('goalsTitle')} onPress={() => router.push('/goals')} />
        <Divider />
        <Row label={t('healthTitle')} onPress={() => router.push('/health')} />
        <Divider />
        <Row label={t('rewardsTitle')} onPress={() => router.push('/rewards')} />
        <Divider />
        <Row label={t('achievementsTitle')} onPress={() => router.push('/achievements')} />
      </View>

      <SectionHeading>{t('settingsTitle')}</SectionHeading>
      <View>
        <Row label={t('settingsTitle')} onPress={() => router.push('/settings')} />
        <Divider />
        <Row label={t('notifTitle')} onPress={() => router.push('/notifications')} />
        <Divider />
        <Row label={t('memoryTitle')} onPress={() => router.push('/ai-memory')} />
        <Divider />
        <Row label={t('privacyTitle')} onPress={() => router.push('/privacy')} />
        <Divider />
        <Row label={t('backupTitle')} onPress={() => router.push('/backup')} />
      </View>

      <SectionHeading>{t('helpTitle')}</SectionHeading>
      <View>
        <Row label={t('helpTitle')} onPress={() => router.push('/help')} />
        <Divider />
        <Row label={t('aboutTitle')} onPress={() => router.push('/about')} />
        <Divider />
        <Row
          label={t('deleteTitle')}
          tone="alert"
          onPress={() => router.push('/delete-account')}
        />
      </View>
    </Screen>
  );
}
