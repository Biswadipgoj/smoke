// app/index.tsx — entry router. Full account-based backend: no session
// means /auth, not the app. useAuthStore.init() (called in _layout.tsx) has
// already resolved by the time this mounts, and hydrateFromRemote() has
// already run for an existing session, so `profile` reflects server state.
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useDhruvStore } from '../src/store/useDhruvStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { Colors } from '../src/constants/theme';

export default function Index() {
  const profile = useDhruvStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (!session) {
      router.replace('/auth');
      return;
    }
    if (!profile || !profile.onboardingComplete) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [session, profile]);

  return <View style={styles.root} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nishith },
});
