// app/index.tsx — Screen 1: Splash
// The loading gate. app/_layout.tsx has already awaited the database, the
// stored profile and the session by the time this renders, so this is a pure
// routing decision with nothing left to wait for.

import { Redirect } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';

export default function Splash() {
  const profile = useAppStore((s) => s.profile);

  if (!profile || !profile.onboardingComplete) {
    return <Redirect href="/(onboarding)/welcome" />;
  }
  return <Redirect href="/(tabs)/dashboard" />;
}
