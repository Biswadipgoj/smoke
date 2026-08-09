// src/services/notifications.ts
// Reminders (§22). One quiet daily check-in, opt-in, and nothing else.
//
// There is deliberately no "you haven't logged today", no streak warning and
// no craving-time nudge: a notification that arrives when you weren't thinking
// about smoking is a craving cue with the app's name on it. Fabulous's
// notification cadence is exactly the thing the plan says not to copy (§2).

import * as Notifications from 'expo-notifications';

const CHECK_IN_ID = 'daily-check-in';

export async function requestPermission(): Promise<boolean> {
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

export async function scheduleDailyCheckIn(
  hour: number,
  minute: number,
  body: string
): Promise<boolean> {
  const allowed = await requestPermission();
  if (!allowed) return false;
  try {
    await cancelDailyCheckIn();
    await Notifications.scheduleNotificationAsync({
      identifier: CHECK_IN_ID,
      content: { body, sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelDailyCheckIn(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(CHECK_IN_ID);
  } catch {
    // Nothing scheduled — the desired end state either way.
  }
}

export async function hasDailyCheckIn(): Promise<boolean> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some((item) => item.identifier === CHECK_IN_ID);
  } catch {
    return false;
  }
}
