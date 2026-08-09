// app/notifications.tsx — §25 screen 16.
//
// One reminder, off by default. §2's design research says explicitly what to
// leave from Fabulous: its notification cadence, which trends naggy. So this
// screen offers a daily check-in and an hour, and nothing else.

import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Card } from '../src/components/ui/Card';
import { Chip } from '../src/components/ui/Chip';
import { Row } from '../src/components/ui/Row';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { useT } from '../src/i18n';
import * as haptics from '../src/services/haptics';
import { setDailyReminder } from '../src/services/notifications';
import { useProfileStore } from '../src/store/useProfileStore';
import { useTheme } from '../src/theme/ThemeProvider';

const HOURS = [7, 9, 12, 15, 18, 20, 21, 22];

export default function NotificationSettings() {
  const theme = useTheme();
  const t = useT();
  const profile = useProfileStore((s) => s.profile);
  const update = useProfileStore((s) => s.update);
  const [denied, setDenied] = useState(false);

  async function apply(hour: number | null) {
    const ok = await setDailyReminder(hour, profile.language);
    if (!ok && hour !== null) {
      // The OS refused. Say so instead of leaving a switch that looks on and
      // silently does nothing.
      haptics.error();
      setDenied(true);
      return;
    }
    setDenied(false);
    await update({ reminderHour: hour });
  }

  const enabled = profile.reminderHour !== null;

  return (
    <Screen title={t('notifications.title')}>
      <Card>
        <Row
          label={t('notifications.daily')}
          description={t('notifications.dailyBody')}
          toggle={{
            value: enabled,
            onValueChange: (next) => void apply(next ? 20 : null),
          }}
          last
        />
      </Card>

      {enabled && (
        <Card muted>
          <Text variant="caption" tone="muted" weight="medium">
            {t('notifications.time')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              {HOURS.map((hour) => (
                <Chip
                  key={hour}
                  label={`${hour.toString().padStart(2, '0')}:00`}
                  selected={profile.reminderHour === hour}
                  onPress={() => void apply(hour)}
                />
              ))}
            </View>
          </ScrollView>
        </Card>
      )}

      {denied && (
        <Text variant="bodySmall" tone="alert">
          {t('notifications.denied')}
        </Text>
      )}
    </Screen>
  );
}
