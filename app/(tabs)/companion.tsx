// app/(tabs)/companion.tsx — the companion. Open conversation (doc 02 §4)
// backed by Gemini when a network and API key are available; the scripted
// Offline Coach (master doc §14) is always there underneath as a fallback
// and as a fast, no-typing option. Two things never reach the model: the
// attribution answer and any crisis/withdrawal signal — both are matched
// and answered deterministically, offline, before any network call.
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDhruvStore } from '../../src/store/useDhruvStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useTheme } from '../../src/hooks/useTheme';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../../src/constants/theme';
import { CoachCategory, getPathsFor, CoachPath } from '../../src/lib/offlineCoach';
import { haptic } from '../../src/lib/haptics';
import {
  ChatTurn, hasGeminiConfig, sendToCompanion, isAttributionQuestion, ATTRIBUTION_REPLY,
  isCrisisSignal, isWithdrawalSignal, WITHDRAWAL_REPLY,
} from '../../src/lib/geminiCompanion';

const CATEGORY_ORDER: { category: CoachCategory; labelKey: 'companionUrgeHelp' | 'companionHaltCheck' | 'companionAfterLapse' | 'companionDelayTechnique' }[] = [
  { category: 'urge', labelKey: 'companionUrgeHelp' },
  { category: 'halt', labelKey: 'companionHaltCheck' },
  { category: 'lapse', labelKey: 'companionAfterLapse' },
  { category: 'delay', labelKey: 'companionDelayTechnique' },
];

export default function Companion() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tracks = useDhruvStore((s) => s.tracks);
  const activeTrack = tracks.find((tr) => tr.active)?.type;
  const activeTrackTypes = tracks.filter((tr) => tr.active).map((tr) => tr.type);

  const [category, setCategory] = useState<CoachCategory | null>(null);
  const [path, setPath] = useState<CoachPath | null>(null);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const paths = category ? getPathsFor(category, activeTrack) : [];

  const reset = () => {
    setCategory(null);
    setPath(null);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');

    if (isCrisisSignal(text)) {
      // No delay before showing resources — generation stops entirely. Doc 02 §6.2/§6.4.
      router.push('/crisis');
      return;
    }

    const userTurn: ChatTurn = { role: 'user', text };
    if (isAttributionQuestion(text)) {
      setMessages((m) => [...m, userTurn, { role: 'model', text: ATTRIBUTION_REPLY }]);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      return;
    }
    if (isWithdrawalSignal(text)) {
      setMessages((m) => [...m, userTurn, { role: 'model', text: WITHDRAWAL_REPLY }]);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      return;
    }

    setMessages((m) => [...m, userTurn]);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    if (!hasGeminiConfig()) {
      setMessages((m) => [...m, { role: 'model', text: t.companionNetworkFallback }]);
      return;
    }

    setSending(true);
    try {
      const reply = await sendToCompanion([...messages, userTurn], activeTrackTypes);
      setMessages((m) => [...m, { role: 'model', text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'model', text: t.companionNetworkFallback }]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
          <Text style={[styles.title, { color: colors.text }]}>{t.companionTitle}</Text>

          <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
            {messages.length === 0 && (
              <Text style={[styles.notice, { color: colors.textMuted }]}>{t.companionOfflineNotice}</Text>
            )}

            {messages.map((m, i) => (
              <View key={i} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleModel]}>
                <Text style={[styles.bubbleText, { color: m.role === 'user' ? Colors.nishith : Colors.bone }]}>{m.text}</Text>
              </View>
            ))}
            {sending && (
              <View style={[styles.bubble, styles.bubbleModel]}>
                <ActivityIndicator size="small" color={Colors.boneMuted} />
              </View>
            )}

            {/* The guided paths stay available for the whole session, never
                hidden behind the chat. The network-failure reply tells the
                user "I can still walk you through this below" — that has to
                remain true at the exact moment the network is down. */}
            {
              <>
                {!category && (
                  <Text style={[styles.prompt, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
                    {t.companionGuidedPathsBelow}
                  </Text>
                )}

                {!category && (
                  <View style={styles.categoryGrid}>
                    {CATEGORY_ORDER.map(({ category: c, labelKey }) => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.categoryCard, { backgroundColor: colors.bgCard, borderColor: colors.hairline }]}
                        onPress={() => {
                          haptic('select');
                          setCategory(c);
                        }}
                      >
                        <Text style={[styles.categoryText, { color: colors.text }]}>{t[labelKey]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {category && !path && (
                  <View style={styles.categoryGrid}>
                    {paths.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.categoryCard, { backgroundColor: colors.bgCard, borderColor: colors.hairline }]}
                        onPress={() => {
                          haptic('select');
                          setPath(p);
                        }}
                      >
                        <Text style={[styles.categoryText, { color: colors.text }]}>{p.title}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={reset} style={styles.backLink}>
                      <Text style={[styles.backLinkText, { color: colors.textMuted }]}>{t.back}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {path && (
                  <View style={styles.pathSteps}>
                    {path.steps.map((step, i) => (
                      <View key={i} style={[styles.stepCard, { backgroundColor: colors.bgCard, borderColor: colors.hairline }]}>
                        <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                      </View>
                    ))}
                    <TouchableOpacity onPress={reset} style={styles.doneBtn}>
                      <Text style={styles.doneBtnText}>{t.done}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity onPress={() => router.push('/crisis')} style={styles.supportLink}>
                  <Text style={[styles.supportLinkText, { color: colors.textMuted }]}>{t.todayGetSupport}</Text>
                </TouchableOpacity>
              </>
            }
          </ScrollView>

          <View style={[styles.inputRow, { borderTopColor: colors.hairline }]}>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.bgCard }]}
              value={input}
              onChangeText={setInput}
              placeholder={t.companionInputPlaceholder}
              placeholderTextColor={Colors.boneMuted}
              multiline
              onSubmitEditing={send}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={sending || !input.trim()}>
              <Text style={styles.sendBtnText}>{t.companionSend}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nishith },
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  notice: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginBottom: Spacing.lg, lineHeight: FontSize.xs * 1.5 },
  prompt: { fontFamily: FontFamily.regular, fontSize: FontSize.base, marginBottom: Spacing.md },

  bubble: { maxWidth: '85%', borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
  bubbleUser: { backgroundColor: Colors.bhor, alignSelf: 'flex-end' },
  bubbleModel: { backgroundColor: Colors.nil, alignSelf: 'flex-start' },
  bubbleText: { fontFamily: FontFamily.regular, fontSize: FontSize.base, lineHeight: FontSize.base * 1.4 },

  categoryGrid: { gap: Spacing.sm },
  categoryCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  categoryText: { fontFamily: FontFamily.medium, fontSize: FontSize.base },
  backLink: { alignItems: 'center', paddingVertical: Spacing.md },
  backLinkText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm },
  pathSteps: { gap: Spacing.md },
  stepCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  stepText: { fontFamily: FontFamily.regular, fontSize: FontSize.base, lineHeight: FontSize.base * 1.5 },
  doneBtn: { backgroundColor: Colors.bhor, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  doneBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.nishith },
  supportLink: { alignItems: 'center', paddingVertical: Spacing.lg },
  supportLinkText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, textDecorationLine: 'underline' },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.md, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontFamily: FontFamily.regular, fontSize: FontSize.base, maxHeight: 100 },
  sendBtn: { backgroundColor: Colors.bhor, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
  sendBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.nishith },
});
