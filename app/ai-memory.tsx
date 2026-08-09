// app/ai-memory.tsx — Screen 19: AI Memory
// Everything the coach remembers, in plain words, with a delete button.
//
// This screen is what makes the §6 memory policy checkable rather than a
// claim in a privacy page: if the summary shown here is the only thing that
// persists, the user can read it, and if it ever contained something they
// typed, they would see it.

import React, { useState } from 'react';
import { View } from 'react-native';
import {
  AppText,
  Card,
  GhostButton,
  Notice,
  Screen,
  SectionHeading,
} from '../src/components/ui';
import { interventionCopy, triggerLabel } from '../src/features/cravings/interventionEngine';
import { useTranslation } from '../src/i18n';
import { deleteMemory } from '../src/services/ai/memory';
import { useAppStore } from '../src/store/useAppStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTheme } from '../src/theme/ThemeProvider';

export default function AiMemoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const memory = useAppStore((s) => s.aiMemory);
  const setAiMemory = useAppStore((s) => s.setAiMemory);
  const session = useAuthStore((s) => s.session);
  const [message, setMessage] = useState<string | null>(null);

  async function remove() {
    try {
      await deleteMemory(session?.user.id ?? null);
      setAiMemory(null);
      setMessage(t('memoryDeleted'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('authGeneric'));
    }
  }

  return (
    <Screen>
      <AppText variant="title">{t('memoryTitle')}</AppText>
      <AppText variant="body" tone="secondary">
        {t('memoryBody')}
      </AppText>

      {!memory ? (
        <Notice>{t('memoryNone')}</Notice>
      ) : (
        <>
          <Card>
            <AppText variant="body">{memory.summary}</AppText>
          </Card>

          <SectionHeading>{t('memoryTriggers')}</SectionHeading>
          <View style={{ gap: theme.spacing.xs }}>
            {memory.topTriggers.length === 0 ? (
              <AppText variant="small" tone="muted">
                {t('memoryNone')}
              </AppText>
            ) : (
              memory.topTriggers.map((trigger) => (
                <AppText key={trigger} variant="small" tone="secondary">
                  · {triggerLabel(trigger, t)}
                </AppText>
              ))
            )}
          </View>

          <SectionHeading>{t('memoryWorks')}</SectionHeading>
          <View style={{ gap: theme.spacing.xs }}>
            {memory.effectiveInterventions.length === 0 ? (
              <AppText variant="small" tone="muted">
                {t('memoryNone')}
              </AppText>
            ) : (
              memory.effectiveInterventions.map((id) => (
                <AppText key={id} variant="small" tone="secondary">
                  · {interventionCopy(id, t).title}
                </AppText>
              ))
            )}
          </View>

          <SectionHeading>{t('memoryStyle')}</SectionHeading>
          <AppText variant="small" tone="secondary">
            {memory.coachStyle}
          </AppText>
        </>
      )}

      {message ? <Notice tone="secondary">{message}</Notice> : null}

      <View style={{ flex: 1 }} />
      <GhostButton label={t('memoryDelete')} tone="alert" onPress={() => void remove()} />
    </Screen>
  );
}
