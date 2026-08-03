// src/hooks/useReducedMotion.ts
// Respects both the system setting and an in-app override — doc 01 §10.
// Every signature motion has a designed *equivalent*, not a disable.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useDhruvStore } from '../store/useDhruvStore';

export function useReducedMotion(): boolean {
  const inAppOverride = useDhruvStore((s) => s.profile?.settings.reducedMotion ?? false);
  const [systemReduced, setSystemReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => mounted && setSystemReduced(!!v));
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => setSystemReduced(!!v));
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  return inAppOverride || systemReduced;
}
