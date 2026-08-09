// app/ai-memory.tsx — §25 screen 19.
//
// §6 calls this screen critical for trust, and it is: the app claims not to
// keep conversations, and the only way that claim means anything is if the
// user can see exactly what *is* kept and delete it in one tap.
//
// Everything shown here is the same aggregate that goes into the system
// prompt. There is no second, hidden version.

import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { getIntervention } from '../src/features/cravings/interventionEngine';
import { useT, type TranslationKey } from '../src/i18n';
import * as haptics from '../src/services/haptics';
import { useLogsStore } from '../src/store/useLogsStore';
import { useTheme } from '../src/theme/ThemeProvider';

export default function AiMemoryScreen() {
  const theme = useTheme();
  const t = useT();
  const memory = useLogsStore((s) => s.memory);
  const forget = useLogsStore((s) => s.forgetMemory);
  const [cleared, setCleared] = useState(false);

  const empty =
    !memory ||
    (memory.dominantTriggers.length === 0 && memory.effectiveInterventions.length === 0);

  return (
    <Screen
      title={t('aiMemory.title')}
      footer={
        empty ? undefined : (
          <Button
            variant="secondary"
            label={t('aiMemory.clear')}
            onPress={() => {
              haptics.tap();
              void forget();
              setCleared(true);
            }}
          />
        )
      }
    >
      <Text variant="body" tone="muted">
        {t('aiMemory.body')}
      </Text>

      {empty ? (
        <Text variant="body" tone="muted">
          {cleared ? t('aiMemory.cleared') : t('aiMemory.empty')}
        </Text>
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          <Card>
            <Text variant="caption" tone="muted" weight="medium">
              {t('aiMemory.triggers')}
            </Text>
            <Text variant="body">
              {memory.dominantTriggers
                .map((trigger) => t(`trigger.${trigger}` as TranslationKey))
                .join(' · ') || '—'}
            </Text>
          </Card>

          <Card>
            <Text variant="caption" tone="muted" weight="medium">
              {t('aiMemory.interventions')}
            </Text>
            <Text variant="body">
              {memory.effectiveInterventions
                .map((id) => t(getIntervention(id).titleKey))
                .join(' · ') || '—'}
            </Text>
          </Card>

          <Card>
            <Text variant="caption" tone="muted" weight="medium">
              {t('aiMemory.style')}
            </Text>
            <Text variant="body">{t(`style.${memory.preferredStyle}` as TranslationKey)}</Text>
          </Card>
        </View>
      )}
    </Screen>
  );
}
