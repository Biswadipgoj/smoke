// app/log.tsx — Log a cigarette (v3: Robust Reanimated)
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, SlideInDown, ZoomIn, FadeOut } from 'react-native-reanimated';
import { useAppStore, ContextTag, SmokingLog } from '../src/store/useAppStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { useTheme } from '../src/hooks/useTheme';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';

function formatInterval(min: number): string {
  if (min < 60) return `${Math.round(min)} minutes`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}h ${m}m` : `${h} hours`;
}

export default function LogScreen() {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const { addLog, logs } = useAppStore();

  const [selectedTag, setSelectedTag] = useState<ContextTag | undefined>();
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Time since last cigarette
  const lastCigInfo = useMemo(() => {
    const cigs = logs.filter(l => l.type === 'cigarette')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (cigs.length === 0) return null;
    const diff = (Date.now() - new Date(cigs[0].timestamp).getTime()) / 60000;
    return { minutes: diff };
  }, [logs]);

  const contextTags: ContextTag[] = ['stress', 'social', 'habit', 'boredom', 'alcohol', 'other'];
  const contextEmojis: Record<ContextTag, string> = {
    stress: '😰', social: '👥', habit: '🔄', boredom: '😐', alcohol: '🍺', other: '❓',
  };
  const contextLabels: Record<ContextTag, string> = {
    stress: t.logContextStress,
    social: t.logContextSocial,
    habit: t.logContextHabit,
    boredom: t.logContextBoredom,
    alcohol: t.logContextAlcohol,
    other: t.logContextOther,
  };

  function getLogEncouragement(tag?: ContextTag): string {
    if (!tag) return "Logging helps you understand your patterns. No judgment here 💙";
    const msgs: Record<ContextTag, string> = {
      stress: "Stress is the #1 trigger. Next time, try 3 deep breaths before reaching for one.",
      social: "Social pressure is tough. One trick: hold a drink in your smoking hand.",
      habit: "Habit smoking is often unconscious. Noticing it is the first step to changing it.",
      boredom: "Boredom smoking? Try keeping your hands busy — a stress ball or doodling works.",
      alcohol: "Alcohol lowers willpower. Try setting a drink limit before you go out next time.",
      other: "Understanding your triggers takes time. Keep logging — the patterns will emerge.",
    };
    return msgs[tag];
  }

  const handleLog = () => {
    const log: SmokingLog = {
      id: `cig_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'cigarette',
      contextTag: selectedTag,
      note: note.trim().slice(0, 200) || undefined,
    };
    addLog(log);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitted(true);
    setTimeout(() => router.back(), 2500);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: isDark ? Colors.bgDark : Colors.bgLight }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t.logTitle}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {submitted ? (
          <Animated.View 
            entering={ZoomIn.springify().damping(12)} 
            exiting={FadeOut}
            style={styles.successContainer}
          >
            <Text style={styles.successEmoji}>✓</Text>
            <Text style={[styles.successTitle, { color: colors.text }]}>{t.loggedSuccess}</Text>
            <Text style={[styles.successMsg, { color: colors.textSecondary }]}>
              {getLogEncouragement(selectedTag)}
            </Text>
            {lastCigInfo && lastCigInfo.minutes < 30 && (
              <Animated.View entering={SlideInDown.delay(300)} style={styles.intervalHint}>
                <Text style={styles.intervalHintText}>
                  💡 Only {Math.round(lastCigInfo.minutes)} min since your last — try to stretch the gap next time
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        ) : (
          <Animated.View 
            entering={SlideInDown.springify().damping(15)} 
            exiting={FadeOut.duration(200)}
            style={styles.form}
          >
            {lastCigInfo && (
              <Animated.View entering={FadeInDown.delay(100)} style={[styles.intervalCard, { backgroundColor: `${Colors.primary}15` }]}>
                <Text style={styles.intervalEmoji}>⏱️</Text>
                <Text style={[styles.intervalText, { color: Colors.primary }]}>
                  {formatInterval(lastCigInfo.minutes)} since last cigarette
                </Text>
              </Animated.View>
            )}

            <Animated.Text entering={FadeInDown.delay(150)} style={[styles.sectionLabel, { color: colors.text }]}>
              {t.logContextQuestion}
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.tagRow}>
              {contextTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    { borderColor: isDark ? Colors.bgDarkElevated : '#E5E7EB' },
                    selectedTag === tag && styles.tagActive,
                  ]}
                  onPress={() => {
                    setSelectedTag(selectedTag === tag ? undefined : tag);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tagEmoji}>{contextEmojis[tag]}</Text>
                  <Text style={[styles.tagText, { color: colors.textSecondary }, selectedTag === tag && styles.tagTextActive]}>
                    {contextLabels[tag]}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>

            {selectedTag && (
              <Animated.View entering={ZoomIn.duration(200)} exiting={FadeOut.duration(200)} style={[styles.tipCard, { backgroundColor: `${Colors.primary}10` }]}>
                <Text style={[styles.tipText, { color: Colors.primary }]}>
                  💡 {getLogEncouragement(selectedTag)}
                </Text>
              </Animated.View>
            )}

            <Animated.Text entering={FadeInDown.delay(250)} style={[styles.sectionLabel, { color: colors.text }]}>
              {t.logNote}
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(300)}>
              <TextInput
                style={[styles.noteInput, { color: colors.text, borderColor: isDark ? Colors.bgDarkElevated : '#E5E7EB', backgroundColor: colors.bgCard }]}
                value={note}
                onChangeText={setNote}
                placeholder={t.logNotePlaceholder}
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={200}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(350)}>
              <PrimaryButton label={t.logSubmit} onPress={handleLog} style={styles.submitBtn} size="lg" />
            </Animated.View>

            <Animated.Text entering={FadeIn.delay(500)} style={[styles.noJudgment, { color: colors.textMuted }]}>
              Logging is learning, not failing 💙
            </Animated.Text>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.bgDarkElevated, alignSelf: 'center', marginTop: Spacing.sm, marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xl },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: FontSize.md },
  form: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },

  intervalCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.xs },
  intervalEmoji: { fontSize: 18 },
  intervalText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm },

  sectionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, marginTop: Spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xs },
  tag: { borderWidth: 1.5, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagActive: { borderColor: Colors.amber, backgroundColor: `${Colors.amber}22` },
  tagEmoji: { fontSize: 14 },
  tagText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm },
  tagTextActive: { color: Colors.amber },

  tipCard: { borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.xs },
  tipText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, lineHeight: FontSize.sm * 1.5 },

  noteInput: { borderWidth: 1.5, borderRadius: Radius.md, padding: Spacing.md, fontFamily: FontFamily.regular, fontSize: FontSize.base, minHeight: 70, textAlignVertical: 'top', marginBottom: Spacing.md },
  submitBtn: { width: '100%' },
  noJudgment: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing.sm },

  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  successEmoji: { fontSize: 56, color: Colors.success, marginBottom: Spacing.md },
  successTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, marginBottom: Spacing.sm },
  successMsg: { fontFamily: FontFamily.regular, fontSize: FontSize.base, textAlign: 'center', lineHeight: FontSize.base * 1.6, marginBottom: Spacing.lg },
  intervalHint: { backgroundColor: `${Colors.amber}15`, borderRadius: Radius.md, padding: Spacing.md },
  intervalHintText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.amber, textAlign: 'center' },
});
