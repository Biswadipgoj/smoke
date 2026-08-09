// src/services/notifications.ts
//
// §22 — one daily check-in, and nothing else. The plan's design research is
// explicit about what to leave from Fabulous: its notification cadence, which
// trends naggy. So there is exactly one schedulable reminder in this app, it
// is off by default, and there is no "we miss you" path anywhere.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { translate } from '../i18n';
import type { Language } from '../types';

const DAILY_ID_KEY = 'smokeless-daily-checkin';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function cancelDaily(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === DAILY_ID_KEY)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/**
 * Schedule (or reschedule) the single daily reminder. Pass `null` to turn it
 * off. Returns false when the OS refused permission, so the settings screen
 * can say so plainly rather than showing a toggle that silently does nothing.
 */
export async function setDailyReminder(hour: number | null, language: Language): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await cancelDaily();
  if (hour === null) return true;

  const granted = await ensurePermission();
  if (!granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('checkin', {
      name: 'Daily check-in',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: undefined,
      vibrationPattern: [0, 120],
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: translate(language, 'notifications.daily'),
      body: translate(language, 'notifications.body'),
      data: { kind: DAILY_ID_KEY },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: 'checkin',
    },
  });
  return true;
}
