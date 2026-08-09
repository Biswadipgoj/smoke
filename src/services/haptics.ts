// src/services/haptics.ts
// Haptics (§12). Semantic names, never raw primitives, so the app's felt
// personality is one file to retune.
//
// Never fires on: navigation between tabs, scrolling, or opening the app.
// Haptics mark meaningful moments only — a phone that buzzes on every tab is
// a phone people silence.

import * as Haptics from 'expo-haptics';

export type HapticEvent =
  | 'tap'
  | 'craving-resisted'
  | 'cigarette-logged'
  | 'milestone'
  | 'error';

export function haptic(event: HapticEvent): void {
  // Fire and forget: a haptic is never worth an await in a tap handler, and a
  // device without a motor should be silently fine rather than throwing.
  void run(event).catch(() => {});
}

async function run(event: HapticEvent): Promise<void> {
  switch (event) {
    case 'tap':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case 'craving-resisted':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Deliberately the same weight as a button tap: neutral, not punitive.
    // Logging a cigarette is a data point, and the hand should not learn
    // otherwise (§11, §12).
    case 'cigarette-logged':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case 'milestone':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'error':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}
