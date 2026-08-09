// app/notifications.tsx — Screen 16: Notifications
// One optional daily check-in and nothing else (§22).
//
// Everything this screen does not offer is the design: no streak warnings, no
// "you haven't logged today", no craving-time nudges. A notification that
// arrives when the user wasn't thinking about smoking is a craving cue with
// the app's name on it, and the naggy-notification pattern is explicitly the
// thing not to copy (§2).

import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { AppText, Chip, ChipRow, Notice, Row, Screen } from '../src/components/ui';
import { useTranslation } from '../src/i18n';
import { useAsyncData } from '../src/hooks/useAsyncData';
import {
  cancelDailyCheckIn,
  hasDailyCheckIn,
  scheduleDailyCheckIn,
} from '../src/services/notifications';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';

const HOURS = [8, 12, 18, 21];

export default function NotificationSettings() {
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [hour, setHour] = useState(21);
  const [denied, setDenied] = useState(false);
  const { data: scheduled, reload } = useAsyncData(() => hasDailyCheckIn(), []);

  const enabled = profile?.notificationsEnabled ?? false;

  async function toggle(next: boolean) {
    if (!next) {
      await cancelDailyCheckIn();
      await updateProfile({ notificationsEnabled: false });
      reload();
      return;
    }
    const ok = await scheduleDailyCheckIn(hour, 0, t('notifEnable'));
    setDenied(!ok);
    await updateProfile({ notificationsEnabled: ok });
    reload();
  }

  async function pickHour(next: number) {
    setHour(next);
    if (enabled) {
      const ok = await scheduleDailyCheckIn(next, 0, t('notifEnable'));
      setDenied(!ok);
      reload();
    }
  }

  return (
    <Screen>
      <AppText variant="title">{t('notifTitle')}</AppText>
      <AppText variant="body" tone="secondary">
        {t('notifSubtitle')}
      </AppText>

      <Row
        label={t('notifEnable')}
        right={
          <Switch
            value={enabled}
            onValueChange={(next) => void toggle(next)}
            trackColor={{ true: theme.colors.ember, false: theme.colors.border }}
          />
        }
      />

      <AppText variant="small" tone="secondary">
        {t('notifTime')}
      </AppText>
      <ChipRow>
        {HOURS.map((value) => (
          <Chip
            key={value}
            label={`${String(value).padStart(2, '0')}:00`}
            selected={hour === value}
            onPress={() => void pickHour(value)}
          />
        ))}
      </ChipRow>

      <View style={{ gap: theme.spacing.sm }}>
        {denied ? <Notice tone="alert">{t('notifDenied')}</Notice> : null}
        <Notice>
          {enabled && scheduled
            ? t('notifScheduled', { time: `${String(hour).padStart(2, '0')}:00` })
            : t('notifNone')}
        </Notice>
      </View>
    </Screen>
  );
}
