// app/index.tsx — Entry point / splash router
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { Colors } from '../src/constants/theme';

export default function Index() {
  const profile = useAppStore((s) => s.profile);

  useEffect(() => {
    if (profile === null) return; // still loading
    if (!profile.onboardingComplete) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [profile]);

  return <View style={styles.root} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
});
