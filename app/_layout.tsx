// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useFonts, NotoSans_400Regular, NotoSans_500Medium, NotoSans_600SemiBold, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';
import { NotoSansDevanagari_400Regular, NotoSansDevanagari_500Medium, NotoSansDevanagari_600SemiBold } from '@expo-google-fonts/noto-sans-devanagari';
import { NotoSansBengali_400Regular, NotoSansBengali_500Medium, NotoSansBengali_600SemiBold } from '@expo-google-fonts/noto-sans-bengali';
import { TiroDevanagariHindi_400Regular } from '@expo-google-fonts/tiro-devanagari-hindi';
import { TiroBangla_400Regular } from '@expo-google-fonts/tiro-bangla';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useDhruvStore } from '../src/store/useDhruvStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { AppLockGate } from '../src/components/AppLockGate';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadFromStorage = useDhruvStore((s) => s.loadFromStorage);
  const hydrated = useDhruvStore((s) => s.hydrated);
  const profile = useDhruvStore((s) => s.profile);
  const initAuth = useAuthStore((s) => s.init);
  const authChecked = useAuthStore((s) => s.checked);

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
        // Offline — the app keeps running as-is. Everything except the
        // (deferred) AI companion works fully offline. Master doc §14.
      }
    }
    syncUpdates();
  }, []);

  const [fontsLoaded] = useFonts({
    NotoSans_400Regular, NotoSans_500Medium, NotoSans_600SemiBold, NotoSans_700Bold,
    NotoSansDevanagari_400Regular, NotoSansDevanagari_500Medium, NotoSansDevanagari_600SemiBold,
    NotoSansBengali_400Regular, NotoSansBengali_500Medium, NotoSansBengali_600SemiBold,
    TiroDevanagariHindi_400Regular, TiroBangla_400Regular,
    IBMPlexMono_400Regular, IBMPlexMono_500Medium,
  });

  useEffect(() => {
    loadFromStorage();
    initAuth();
  }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated && authChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hydrated, authChecked]);

  if (!fontsLoaded || !hydrated || !authChecked) return null;

  const isDark = !profile || profile.settings.themeMode !== 'light';

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppLockGate>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          {/* Urge is enterable from anywhere, full-screen takeover — master doc §5.2 */}
          <Stack.Screen name="urge" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
          <Stack.Screen name="lapse" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="log" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="checkin" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="crisis" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="add-track" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </AppLockGate>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
