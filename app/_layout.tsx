// app/_layout.tsx — the root. Fonts, providers, and the navigation shape.

import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  NotoSansBengali_400Regular,
  NotoSansBengali_500Medium,
  NotoSansBengali_600SemiBold,
} from '@expo-google-fonts/noto-sans-bengali';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
} from '@expo-google-fonts/noto-sans-devanagari';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLockGate } from '../src/components/AppLockGate';
import { ThemeProvider } from '../src/theme/ThemeProvider';

// The splash stays up until fonts and the local database are both ready, so
// the first frame is the real dashboard rather than a flash of unstyled text.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // §10 — Fraunces for milestones and emotional moments.
    Fraunces_600SemiBold,
    // Manrope for everything else.
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    // Neither display face covers Devanagari or Bengali (§17).
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_500Medium,
    NotoSansDevanagari_600SemiBold,
    NotoSansBengali_400Regular,
    NotoSansBengali_500Medium,
    NotoSansBengali_600SemiBold,
  });

  // Pull and apply the newest OTA bundle on cold start. Failure is silence:
  // everything except the AI coach works with no network at all.
  useEffect(() => {
    async function applyUpdates() {
      if (__DEV__ || !Updates.isEnabled) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // Offline. Carry on with the bundle we have.
      }
    }
    void applyUpdates();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <AppLockGate>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              {/* §7 — the craving flow is a full-screen takeover, enterable
                  from anywhere. Gestures are off: it should end in an outcome,
                  not in an accidental swipe. */}
              <Stack.Screen
                name="craving"
                options={{
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="timeline"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen name="calendar" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="goals" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="health" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="rewards" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="achievements" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="ai-memory" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="backup" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="help" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen
                name="delete-account"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
            </Stack>
          </AppLockGate>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
