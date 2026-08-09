// app/_layout.tsx
// Root layout: fonts, providers, the app lock, and the navigator.
//
// Everything the first frame depends on is awaited here rather than in each
// screen, so no screen ever renders against a half-hydrated store — cold start
// budget is under two seconds (§27), and the splash holds until we can show
// the real thing.

import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Fraunces_400Regular, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
} from '@expo-google-fonts/noto-sans-devanagari';
import {
  NotoSansBengali_400Regular,
  NotoSansBengali_500Medium,
  NotoSansBengali_600SemiBold,
} from '@expo-google-fonts/noto-sans-bengali';

import { AppLockGate } from '../src/components/AppLockGate';
import { getDb } from '../src/services/db/localDb';
import { loadMemory } from '../src/services/ai/memory';
import { syncNow } from '../src/services/sync/syncQueue';
import { useAppStore } from '../src/store/useAppStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);
  const setAiMemory = useAppStore((s) => s.setAiMemory);
  const initAuth = useAuthStore((s) => s.init);
  const authChecked = useAuthStore((s) => s.checked);
  const session = useAuthStore((s) => s.session);
  const [dbReady, setDbReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_500Medium,
    NotoSansDevanagari_600SemiBold,
    NotoSansBengali_400Regular,
    NotoSansBengali_500Medium,
    NotoSansBengali_600SemiBold,
  });

  useEffect(() => {
    void hydrate();
    void initAuth();
    void getDb()
      .then(() => setDbReady(true))
      // A database that won't open is fatal to the point of the app, but
      // blocking on the splash forever is worse than letting the user in to a
      // screen that can say so.
      .catch(() => setDbReady(true));
    void loadMemory().then(setAiMemory);
  }, [hydrate, initAuth, setAiMemory]);

  // Drain the sync queue whenever a session appears. Nothing awaits it.
  useEffect(() => {
    if (session?.user.id) void syncNow(session.user.id);
  }, [session?.user.id]);

  const ready = fontsLoaded && hydrated && authChecked && dbReady;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppLockGate>
            <Navigator />
          </AppLockGate>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Navigator() {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: theme.reduceMotion ? 'none' : 'default',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        {/* The craving flow is a full-screen takeover: it is the one moment
            where the rest of the app should stop existing. */}
        <Stack.Screen
          name="craving"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen name="log" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
