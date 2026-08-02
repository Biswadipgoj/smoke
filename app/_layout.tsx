// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import {
  useFonts,
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { subscribeToAuthChanges } from '../src/lib/auth';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useAppStore } from '../src/store/useAppStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadFromStorage = useAppStore((s) => s.loadFromStorage);
  const profile = useAppStore((s) => s.profile);

  // EAS Update — silently pull & apply the newest OTA bundle on cold start.
  useEffect(() => {
    async function syncUpdates() {
      if (__DEV__ || !Updates.isEnabled) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // Offline or no update available — the app keeps running as-is.
      }
    }
    syncUpdates();
  }, []);

  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
  });

  useEffect(() => {
    loadFromStorage();
    // Subscribe to Supabase auth events (no-op if no credentials configured)
    const unsubscribe = subscribeToAuthChanges();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (fontsLoaded && profile !== undefined) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, profile]);

  if (!fontsLoaded) return null;

  const isDark = !profile || profile.themeMode === 'dark' || profile.themeMode === 'system';

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="delay" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="log" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
