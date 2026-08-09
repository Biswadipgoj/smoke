// app/(tabs)/coach.tsx — Screen 8: AI Coach
// Chat, backed by the Edge Function, safety-filtered on the way out, and
// degrading to the rule-based coach rather than to an error when the network
// is gone (§3-6, §20).
//
// The beta label on Hindi and Bengali is deliberate and stays until native
// speakers have reviewed real conversations: the interface is fully
// translated, but AI-generated behavioural coaching in those languages is the
// highest-risk unknown in the whole spec, and a grammatically correct reply
// that lands as cold is worse than no reply.

import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { AppText, Card, Field, GhostButton, Notice, PrimaryButton } from '../../src/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/i18n';
import { askCoach } from '../../src/services/ai/client';
import { buildMemory, saveMemory, situationLine } from '../../src/services/ai/memory';
import { getBehaviorStats, getTodayStats } from '../../src/services/db/localDb';
import { useAppStore } from '../../src/store/useAppStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import type { BehaviorStats, TodayStats, Trigger } from '../../src/types';
import { uid } from '../../src/utils/uid';

export default function Coach() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const chat = useAppStore((s) => s.chat);
  const appendChat = useAppStore((s) => s.appendChat);
  const clearChat = useAppStore((s) => s.clearChat);
  const memory = useAppStore((s) => s.aiMemory);
  const setAiMemory = useAppStore((s) => s.setAiMemory);
  const session = useAuthStore((s) => s.session);

  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<BehaviorStats | null>(null);
  const [today, setToday] = useState<TodayStats | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    void getBehaviorStats().then(setStats);
    void getTodayStats(profile).then(setToday);
  }, [profile]);

  async function send() {
    const message = draft.trim();
    if (!message || !stats || busy) return;

    setDraft('');
    setBusy(true);
    appendChat({ id: uid(), role: 'user', text: message, createdAtMs: Date.now() });

    const likelyTrigger: Trigger = stats.triggerFrequency[0]?.trigger ?? 'stress';
    const reply = await askCoach(
      {
        message,
        style: profile?.coachStyle ?? 'calm',
        locale,
        history: chat,
        memorySummary: memory?.summary ?? null,
        situation: today ? situationLine(today, profile, stats) : null,
        stats,
        baselinePerDay: profile?.baselinePerDay ?? 10,
        targetPerDay: null,
        likelyTrigger,
      },
      t
    );

    appendChat({
      id: uid(),
      role: 'coach',
      text: reply.text,
      createdAtMs: Date.now(),
      offline: reply.offline,
    });
    setBusy(false);

    // Refresh the aggregated summary after the exchange, not the transcript:
    // this is the only thing that persists between conversations (§6).
    const userId = session?.user.id ?? profile?.id;
    if (userId) {
      const next = buildMemory(userId, stats, profile?.coachStyle ?? 'calm', t);
      setAiMemory(next);
      void saveMemory(next);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: !theme.reduceMotion })}
          keyboardShouldPersistTaps="handled"
        >
          <AppText variant="title">{t('coachTitle')}</AppText>

          {locale !== 'en' ? <Notice tone="ember">{t('coachBetaNotice')}</Notice> : null}

          {chat.length === 0 ? (
            <AppText variant="body" tone="secondary">
              {t('coachEmpty')}
            </AppText>
          ) : null}

          {chat.map((message) => (
            <Card
              key={message.id}
              raised={message.role === 'user'}
              style={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
              }}
            >
              <AppText variant="body" tone={message.role === 'user' ? 'secondary' : 'default'}>
                {message.text}
              </AppText>
              {message.offline ? (
                <AppText variant="caption" tone="muted">
                  {t('offline')}
                </AppText>
              ) : null}
            </Card>
          ))}

          {busy ? (
            <AppText variant="caption" tone="muted">
              {t('coachThinking')}…
            </AppText>
          ) : null}

          <AppText variant="caption" tone="muted">
            {t('coachDisclaimer')}
          </AppText>

          {chat.length > 0 ? <GhostButton label={t('coachClear')} onPress={clearChat} /> : null}
        </ScrollView>

        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}>
          <Field
            placeholder={t('coachPlaceholder')}
            value={draft}
            onChangeText={setDraft}
            multiline
            onSubmitEditing={() => void send()}
          />
          <PrimaryButton
            label={t('coachSend')}
            loading={busy}
            disabled={draft.trim().length === 0}
            onPress={() => void send()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
