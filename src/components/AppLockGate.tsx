// src/components/AppLockGate.tsx
// BiometricPrompt with device-credential fallback, master doc §15.3. Fails
// open (no gate shown) if the device has no enrolled credential at all —
// we never want to lock a real user out of a crisis-adjacent app because of
// a hardware limitation.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useDhruvStore } from '../store/useDhruvStore';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../constants/theme';
import { useTranslation } from '../hooks/useTranslation';

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const enabled = useDhruvStore((s) => s.profile?.settings.appLockEnabled ?? false);
  const { t } = useTranslation();
  const [locked, setLocked] = useState(enabled);
  const [canUseLock, setCanUseLock] = useState(false);
  // The hardware/enrolment check is async. Until it resolves we must not
  // render children: the threat model here is someone holding the unlocked
  // phone (master doc §15.1), and even a one-frame flash of the Thread or a
  // lapse entry defeats the lock entirely.
  const [capabilityChecked, setCapabilityChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (mounted) setCanUseLock(hasHardware && enrolled);
      } catch {
        // Treat an unavailable module as "cannot lock" — never trap the user
        // out of a crisis-adjacent app because of a hardware quirk.
        if (mounted) setCanUseLock(false);
      } finally {
        if (mounted) setCapabilityChecked(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!capabilityChecked) return;
    setLocked(enabled && canUseLock);
  }, [enabled, canUseLock, capabilityChecked]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && enabled && canUseLock) setLocked(true);
    });
    return () => sub.remove();
  }, [enabled, canUseLock]);

  const unlock = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({ disableDeviceFallback: false });
      if (result.success) setLocked(false);
    } catch {
      // Silent — user can retry the button.
    }
  };

  // Blank (not children) while we don't yet know whether to lock.
  if (enabled && !capabilityChecked) return <View style={styles.root} />;
  if (!locked) return <>{children}</>;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{t.appName}</Text>
      <TouchableOpacity style={styles.unlockBtn} onPress={unlock}>
        <Text style={styles.unlockBtnText}>{t.settingsAppLock}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nishith, alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  title: { fontFamily: FontFamily.regular, fontSize: FontSize.xxxl, color: Colors.bhor },
  unlockBtn: { backgroundColor: Colors.nil, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  unlockBtnText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.bone },
});
