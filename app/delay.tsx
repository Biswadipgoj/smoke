// app/delay.tsx — Craving Delay Session (full-screen modal)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore, DelaySession, ContextTag } from '../src/store/useAppStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { BreathingPacer } from '../src/components/ui/BreathingPacer';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';

type SessionPhase = 'setup' | 'breathing' | 'outcome';

const SESSION_DURATION = 180; // 3 minutes in seconds

const AI_MESSAGES = [
  'delayAiMessage1',
  'delayAiMessage2',
  'delayAiMessage3',
  'delayAiMessage4',
  'delayAiMessage5',
] as const;

export default function DelayScreen() {
  const { t } = useTranslation();
  const { addDelaySession } = useAppStore();

  const [phase, setPhase] = useState<SessionPhase>('setup');
  const [intensity, setIntensity] = useState(3);
  const [contextTag, setContextTag] = useState<ContextTag | undefined>();
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [outcome, setOutcome] = useState<'delayed' | 'smoked' | 'incomplete'>('incomplete');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const contextTags: ContextTag[] = ['stress', 'social', 'habit', 'boredom', 'alcohol', 'other'];
  const contextLabels: Record<ContextTag, string> = {
    stress: t.logContextStress,
    social: t.logContextSocial,
    habit: t.logContextHabit,
    boredom: t.logContextBoredom,
    alcohol: t.logContextAlcohol,
    other: t.logContextOther,
  };

  const startSession = () => {
    setSessionStart(new Date());
    setPhase('breathing');
    setTimeLeft(SESSION_DURATION);

    // Show AI message after 30 seconds
    const messageKey = AI_MESSAGES[Math.floor(Math.random() * AI_MESSAGES.length)];
    setTimeout(() => {
      setAiMessage(t[messageKey]);
      Animated.timing(messageOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, 30000);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setOutcome('delayed');
          setPhase('outcome');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endEarly = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('outcome');
  };

  const handleOutcome = (result: 'delayed' | 'smoked') => {
    const session: DelaySession = {
      id: `delay_${Date.now()}`,
      startedAt: sessionStart?.toISOString() ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds: SESSION_DURATION - timeLeft,
      intensity,
      contextTag,
      outcome: result,
    };
    addDelaySession(session);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOutcome(result);
    router.back();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.root}>
      <Animated.View style={[{ flex: 1 }, { opacity: fadeIn }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t.delayTitle}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* SETUP PHASE */}
          {phase === 'setup' && (
            <View style={styles.setupContainer}>
              <Text style={styles.subtitle}>{t.delaySubtitle}</Text>

              {/* Intensity */}
              <Text style={styles.sectionLabel}>{t.delayIntensityLabel}</Text>
              <View style={styles.intensityRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.intensityBtn, intensity === i && styles.intensityBtnActive]}
                    onPress={() => setIntensity(i)}
                  >
                    <Text style={[styles.intensityText, intensity === i && styles.intensityTextActive]}>
                      {i}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Context */}
              <Text style={styles.sectionLabel}>{t.delayContextLabel}</Text>
              <View style={styles.tagRow}>
                {contextTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, contextTag === tag && styles.tagActive]}
                    onPress={() => setContextTag(contextTag === tag ? undefined : tag)}
                  >
                    <Text style={[styles.tagText, contextTag === tag && styles.tagTextActive]}>
                      {contextLabels[tag]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <PrimaryButton
                label={t.delayStartBtn}
                onPress={startSession}
                style={styles.startBtn}
                size="lg"
              />
            </View>
          )}

          {/* BREATHING PHASE */}
          {phase === 'breathing' && (
            <View style={styles.breathingContainer}>
              <View style={styles.timerRow}>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                <Text style={styles.timerLabel}>{t.delayTimeLeft}</Text>
              </View>

              <View style={styles.pacerContainer}>
                <BreathingPacer size={240} running />
              </View>

              {/* AI Message */}
              {aiMessage ? (
                <Animated.View style={[styles.aiMessageCard, { opacity: messageOpacity }]}>
                  <Text style={styles.aiMessageText}>"{aiMessage}"</Text>
                </Animated.View>
              ) : null}

              <TouchableOpacity onPress={endEarly} style={styles.endEarlyBtn}>
                <Text style={styles.endEarlyText}>{t.delayEndEarly}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* OUTCOME PHASE */}
          {phase === 'outcome' && (
            <View style={styles.outcomeContainer}>
              <Text style={styles.bigEmoji}>🌿</Text>
              <Text style={styles.outcomeTitle}>{t.delayOutcomeTitle}</Text>
              <Text style={styles.outcomeSubtitle}>
                {`${t.delayMinutes}: ${Math.floor((SESSION_DURATION - timeLeft) / 60)}m ${(SESSION_DURATION - timeLeft) % 60}s`}
              </Text>

              <TouchableOpacity
                style={styles.outcomeSuccess}
                onPress={() => handleOutcome('delayed')}
              >
                <Text style={styles.outcomeSuccessText}>{t.delayOutcomeSuccess}</Text>
                <Text style={styles.outcomeSuccessMsg}>{t.delayOutcomeSuccessMsg}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outcomeSmoked}
                onPress={() => handleOutcome('smoked')}
              >
                <Text style={styles.outcomeSmokedText}>{t.delayOutcomeSmoked}</Text>
                <Text style={styles.outcomeSmokedMsg}>{t.delayOutcomeSmokedMsg}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: Colors.textDarkSecondary, fontSize: FontSize.md },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textDark },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textDarkSecondary,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.6,
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },

  // Setup
  setupContainer: {},
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  intensityRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  intensityBtn: {
    flex: 1, height: 52, borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.bgDarkElevated, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgDarkCard,
  },
  intensityBtnActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}22` },
  intensityText: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textDarkSecondary },
  intensityTextActive: { color: Colors.primary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  tag: {
    borderWidth: 1.5, borderColor: Colors.bgDarkElevated, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.bgDarkCard,
  },
  tagActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}22` },
  tagText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textDarkSecondary },
  tagTextActive: { color: Colors.primary },
  startBtn: { width: '100%' },

  // Breathing
  breathingContainer: { alignItems: 'center', paddingTop: Spacing.lg },
  timerRow: { alignItems: 'center', marginBottom: Spacing.xl },
  timerText: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.textDark, letterSpacing: 2 },
  timerLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textDarkSecondary, marginTop: 4 },
  pacerContainer: { marginBottom: Spacing.xl },
  aiMessageCard: {
    backgroundColor: Colors.bgDarkCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: Spacing.xl,
  },
  aiMessageText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textDark,
    lineHeight: FontSize.base * 1.7,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  endEarlyBtn: { paddingVertical: Spacing.sm },
  endEarlyText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textDarkMuted, textDecorationLine: 'underline' },

  // Outcome
  outcomeContainer: { alignItems: 'center', paddingTop: Spacing.lg },
  bigEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  outcomeTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textDark, marginBottom: Spacing.xs },
  outcomeSubtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textDarkSecondary, marginBottom: Spacing.xl },
  outcomeSuccess: {
    width: '100%', backgroundColor: `${Colors.primary}22`, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.primary, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  outcomeSuccessText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.primary, marginBottom: Spacing.xs },
  outcomeSuccessMsg: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textDarkSecondary, lineHeight: FontSize.sm * 1.6 },
  outcomeSmoked: {
    width: '100%', backgroundColor: Colors.bgDarkCard, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.bgDarkElevated, padding: Spacing.lg,
  },
  outcomeSmokedText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textDark, marginBottom: Spacing.xs },
  outcomeSmokedMsg: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textDarkSecondary, lineHeight: FontSize.sm * 1.6 },
});
