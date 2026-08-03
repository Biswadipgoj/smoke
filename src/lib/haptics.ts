// src/lib/haptics.ts
// Semantic haptic wrapper — doc 01 §7. Reference semantics in code, never
// raw primitives, so retuning the app's felt personality is one file.
// expo-haptics exposes iOS-style notification/impact/selection feedback,
// which we map onto Dhruv's semantic vocabulary; true Android composition
// primitives (VibrationEffect.Composition) aren't exposed by Expo's managed
// haptics API — this is a documented gap, see final summary.
import * as Haptics from 'expo-haptics';
import { useDhruvStore } from '../store/useDhruvStore';

export type HapticSemantic = 'tap' | 'select' | 'arrive' | 'land' | 'begin' | 'complete';

const ESSENTIAL_ONLY: HapticSemantic[] = ['land', 'begin']; // urge-mode and lapse haptics

function currentMode(): 'full' | 'essential' | 'off' {
  return useDhruvStore.getState().profile?.settings.hapticsMode ?? 'full';
}

export async function haptic(semantic: HapticSemantic): Promise<void> {
  const mode = currentMode();
  if (mode === 'off') return;
  if (mode === 'essential' && !ESSENTIAL_ONLY.includes(semantic)) return;

  try {
    switch (semantic) {
      case 'tap':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'select':
        await Haptics.selectionAsync();
        break;
      case 'arrive':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'land': // the lapse haptic — a hand on a shoulder, not a buzzer
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'begin':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'complete':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
    }
  } catch {
    // Silent — a crude vibration is worse than none, so we never fall back
    // to a substitute buzz. doc 01 §7.2.
  }
}
