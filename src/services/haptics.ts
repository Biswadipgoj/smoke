// src/services/haptics.ts
//
// §12 — the haptic table, in code, so no screen picks its own feedback.
//
// The list of things that deliberately produce nothing is as important as the
// list that does: never on tab navigation, never on scroll, never on app open.
// Haptics mark meaningful moments, and a buzz on every interaction means none
// of them are meaningful.

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Web has no haptics API; calling through would throw on every button press.
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

function safely(run: () => Promise<void>): void {
  if (!enabled) return;
  // Fire and forget: a failed haptic must never surface as an error.
  run().catch(() => {});
}

/** Any primary button. */
export function tap(): void {
  safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** §12 — a resisted craving. The only success notification in the app. */
export function cravingResisted(): void {
  safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/**
 * §11-12 — logging a cigarette. Light impact, the same as any button: neutral,
 * not punitive. There is deliberately no visual event to go with it.
 */
export function cigaretteLogged(): void {
  safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** §12 — a real milestone, not an app-open. */
export function milestone(): void {
  safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function error(): void {
  safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
