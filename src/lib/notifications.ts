// src/lib/notifications.ts
// Notifications are requested contextually, never upfront (master doc §3.3).
// The only notification this app sends is the single warm 24h follow-up
// after a lapse (§7.6.5) — no streak nags, no "you missed your check-in,"
// nothing that could function as a shame surface or a craving cue.
import * as Notifications from 'expo-notifications';
import { useDhruvStore } from '../store/useDhruvStore';

/**
 * Asks for permission at the moment we have something worth sending, and
 * only if the user hasn't turned notifications off in Settings. Returns
 * false rather than throwing so callers can silently skip scheduling.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!useDhruvStore.getState().profile?.settings.notificationsEnabled) return false;
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    if (!existing.canAskAgain) return false;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

/** The one warm message, 24h after a lapse. Not a check-in demand. */
export async function scheduleLapseFollowUp(body: string): Promise<void> {
  const allowed = await ensureNotificationPermission();
  if (!allowed) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { body, sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 24 * 60 * 60,
        repeats: false,
      },
    });
  } catch {
    // The in-app experience never depends on this firing.
  }
}
