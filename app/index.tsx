// app/index.tsx — §25 screen 1, Splash.
//
// A loading gate, not a brand moment: it opens the local database, hydrates
// the profile, checks for a session, and then gets out of the way. Everything
// it waits on is local, so on a warm start it is invisible.

import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '../src/components/ui/Text';
import { useT } from '../src/i18n';
import { initLocalDb } from '../src/services/db/localDb';
import { useAuthStore } from '../src/store/useAuthStore';
import { useLogsStore } from '../src/store/useLogsStore';
import { useProfileStore } from '../src/store/useProfileStore';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Splash() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  const loadProfile = useProfileStore((s) => s.load);
  const refreshLogs = useLogsStore((s) => s.refresh);
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        await initLocalDb();
        await Promise.all([loadProfile(), refreshLogs(), initAuth()]);
      } catch {
        // A database that won't open is the one failure this screen can't
        // route around; say so rather than sitting on a spinner forever.
        if (!cancelled) setFailed(true);
        return;
      }
      if (cancelled) return;

      const { profile } = useProfileStore.getState();
      await SplashScreen.hideAsync().catch(() => {});
      router.replace(profile.onboardingCompleted ? '/(tabs)/dashboard' : '/(onboarding)/welcome');
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [loadProfile, refreshLogs, initAuth, router]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgStart, gap: theme.spacing.md }]}>
      <Text variant="title" serif tone="onHaze" center>
        SmokeLess AI
      </Text>
      <Text variant="bodySmall" tone="onHazeMuted" center>
        {failed ? t('error.generic') : t('common.loading')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
