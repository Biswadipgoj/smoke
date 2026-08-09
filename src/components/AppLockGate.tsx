// src/components/AppLockGate.tsx
// Optional biometric lock (§22). Off by default: this is a phone people open
// mid-craving, and a lock screen between the user and the delay timer is real
// friction. When they do turn it on, the reason is usually that someone else
// picks up the phone — so it has to be a genuine gate, not a dismissible one.

import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/ThemeProvider';
import { AppText, PrimaryButton } from './ui';

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const enabled = useAppStore((s) => s.profile?.appLockEnabled ?? false);
  const [unlocked, setUnlocked] = useState(!enabled);
  const theme = useTheme();

  const authenticate = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SmokeLess AI',
        disableDeviceFallback: false,
      });
      setUnlocked(result.success);
    } catch {
      // A device with no enrolled biometric must not become a locked-out
      // device: fail open rather than trapping the user out of their data.
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setUnlocked(true);
      return;
    }
    void authenticate();
  }, [enabled, authenticate]);

  if (unlocked) return <>{children}</>;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xxl,
        gap: theme.spacing.xl,
      }}
    >
      <AppText variant="title" center>
        SmokeLess AI
      </AppText>
      <PrimaryButton label="Unlock" onPress={() => void authenticate()} />
    </View>
  );
}
