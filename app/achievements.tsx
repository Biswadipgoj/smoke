// app/achievements.tsx — §25 screen 15.
//
// Milestones tied to real behaviour (§13). An unearned one shows what it takes
// and how far along it is, rather than a locked padlock — the point is to name
// something reachable, not to withhold it.

import { useMemo } from 'react';
import { View } from 'react-native';

import { Card } from '../src/components/ui/Card';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { computeAchievements } from '../src/features/progress/achievements';
import { useT } from '../src/i18n';
import { useLogsStore } from '../src/store/useLogsStore';
import { useProfileStore } from '../src/store/useProfileStore';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Achievements() {
  const theme = useTheme();
  const t = useT();
  const profile = useProfileStore((s) => s.profile);
  const { cigarettes, cravings } = useLogsStore();

  const achievements = useMemo(
    () => computeAchievements({ cigarettes, cravings, profile }),
    [cigarettes, cravings, profile]
  );

  return (
    <Screen title={t('achievements.title')}>
      {achievements.map((achievement) => (
        <Card key={achievement.id} muted={!achievement.earned}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              variant="heading"
              serif
              tone={achievement.earned ? 'growth' : 'muted'}
              style={{ flex: 1 }}
            >
              {t(achievement.titleKey)}
            </Text>
            {!achievement.earned && (
              <Text variant="caption" tone="muted">
                {t('achievements.locked')}
              </Text>
            )}
          </View>
          <Text variant="bodySmall" tone="muted">
            {t(achievement.bodyKey)}
          </Text>
          {!achievement.earned && achievement.progress > 0 && (
            <View
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.colors.border,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${Math.round(achievement.progress * 100)}%`,
                  height: '100%',
                  backgroundColor: theme.colors.growth,
                }}
              />
            </View>
          )}
        </Card>
      ))}
    </Screen>
  );
}
