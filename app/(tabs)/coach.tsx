// app/(tabs)/coach.tsx — §25 screen 8.
//
// Chat, backed by the edge function, safety-filtered, and fully answerable
// offline. §6 — the transcript lives in this component's state and nowhere
// else: it is not persisted, not synced, and gone when the app closes. What
// survives a session is the aggregate memory, which the user can read and
// delete on the AI Memory screen.

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../../src/components/ui/Text';
import { useT } from '../../src/i18n';
import { askCoach } from '../../src/services/ai';
import { newId } from '../../src/services/db/localDb';
import * as haptics from '../../src/services/haptics';
import { useLogsStore } from '../../src/store/useLogsStore';
import { useProfileStore } from '../../src/store/useProfileStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import type { CoachMessage } from '../../src/types';

export default function Coach() {
  const theme = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();

  const profile = useProfileStore((s) => s.profile);
  const behavior = useLogsStore((s) => s.behavior);
  const memory = useLogsStore((s) => s.memory);

  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);

  async function send() {
    const text = draft.trim();
    if (!text || thinking) return;

    const mine: CoachMessage = {
      id: newId(),
      role: 'user',
      text,
      createdAtMs: Date.now(),
    };
    const history = [...messages, mine];
    setMessages(history);
    setDraft('');
    setThinking(true);
    haptics.tap();

    const reply = await askCoach({
      input: text,
      profile,
      behavior,
      memory,
      history,
      t,
    });

    setMessages((current) => [...current, reply]);
    setThinking(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}
    >
      <View style={[styles.header, { padding: theme.spacing.lg, gap: 2 }]}>
        <Text variant="heading" weight="semiBold">
          {t('coach.title')}
        </Text>
        <Text variant="caption" tone="muted">
          {t('coach.disclaimer')}
        </Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <Text variant="body" tone="muted">
            {t('coach.empty')}
          </Text>
        ) : (
          messages.map((message) => <Bubble key={message.id} message={message} />)
        )}
        {thinking && (
          <Text variant="bodySmall" tone="muted">
            {t('coach.thinking')}…
          </Text>
        )}
      </ScrollView>

      <View
        style={[
          styles.composer,
          {
            padding: theme.spacing.md,
            paddingBottom: Math.max(insets.bottom, theme.spacing.md),
            gap: theme.spacing.sm,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <TextInput
          accessibilityLabel={t('coach.placeholder')}
          value={draft}
          onChangeText={setDraft}
          placeholder={t('coach.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          multiline
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              color: theme.colors.text,
              fontFamily: theme.font.body,
              fontSize: theme.type.body.fontSize,
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('coach.send')}
          disabled={draft.trim().length === 0 || thinking}
          onPress={() => void send()}
          style={[
            styles.send,
            {
              backgroundColor: theme.colors.ember,
              borderRadius: theme.radius.pill,
              opacity: draft.trim().length === 0 || thinking ? 0.4 : 1,
            },
          ]}
        >
          <Ionicons name="arrow-up" size={20} color={theme.colors.onAccent} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message }: { message: CoachMessage }) {
  const theme = useTheme();
  const t = useT();
  const mine = message.role === 'user';

  // §5 — the crisis handoff gets its own shape: full width, its own heading,
  // the gentle-alert colour. It is the one message in this app that must not
  // be skimmed past as one more bubble in a thread.
  if (message.crisis) {
    return (
      <View
        style={[
          styles.crisis,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.gentleAlert,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
          },
        ]}
      >
        <Text variant="body" weight="semiBold" tone="alert">
          {t('crisis.title')}
        </Text>
        <Text variant="body">{message.text}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bubble,
        {
          alignSelf: mine ? 'flex-end' : 'flex-start',
          backgroundColor: mine ? theme.colors.ember : theme.colors.surface,
          borderColor: mine ? theme.colors.ember : theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          gap: 4,
        },
      ]}
    >
      <Text variant="body" tone={mine ? 'onAccent' : 'default'}>
        {message.text}
      </Text>
      {/* Saying so plainly beats a silent downgrade: the answer really is
          coming from a different place, and the user should know that. */}
      {message.offline ? (
        <Text variant="caption" tone="muted">
          {t('coach.offline')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {},
  composer: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderWidth: 1, maxHeight: 120 },
  send: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '88%', borderWidth: 1 },
  crisis: { alignSelf: 'stretch', borderWidth: 1.5 },
});
