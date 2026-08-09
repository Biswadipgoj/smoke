// src/components/AppLockGate.tsx
//
// §22 — biometric app lock. Worth more here than in most apps: the note field
// on a craving log is, in aggregate, an addiction history, and the person most
// likely to pick up this phone is someone the user lives with.
//
// The gate covers the app rather than individual screens, and it re-arms when
// the app goes to the background.

import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';

import { useT } from '../i18n';
import { useProfileStore } from '../store/useProfileStore';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './ui/Button';
import { Text } from './ui/Text';

export function AppLockGate({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const t = useT();
  const enabled = useProfileStore((s) => s.profile.appLockEnabled);
  const [unlocked, setUnlocked] = useState(!enabled);
  const [prompting, setPrompting] = useState(false);
  const appState = useRef(AppState.currentState);

  const authenticate = useCallback(async () => {
    if (prompting) return;
    setPrompting(true);
    try {
      const supported =
        Platform.OS !== 'web' &&
        (await LocalAuthentication.hasHardwareAsync()) &&
        (await LocalAuthentication.isEnrolledAsync());
      if (!supported) {
        // Nothing to authenticate against. Locking the user out of their own
        // data because the hardware changed would be the worse failure.
        setUnlocked(true);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('settings.appLock'),
        disableDeviceFallback: false,
      });
      setUnlocked(result.success);
    } catch {
      setUnlocked(true);
    } finally {
      setPrompting(false);
    }
  }, [prompting, t]);

  useEffect(() => {
    if (!enabled) {
      setUnlocked(true);
      return;
    }
    setUnlocked(false);
    void authenticate();
    // authenticate is intentionally excluded: re-running on its identity would
    // re-prompt every render while the OS sheet is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/active/) && next.match(/inactive|background/)) {
        setUnlocked(false);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [enabled]);

  if (!enabled || unlocked) return <>{children}</>;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgStart, gap: theme.spacing.xl }]}>
      <Text variant="title" serif tone="onHaze" center>
        SmokeLess AI
      </Text>
      <Button label={t('settings.appLock')} onPress={authenticate} block={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
