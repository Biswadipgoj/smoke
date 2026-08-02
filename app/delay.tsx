// app/delay.tsx — The Dynamic Intervention Engine
// ─────────────────────────────────────────────────────────────────────────────
// A craving is a wave. Instead of merely logging a cigarette, the companion
// opens an immersive intervention chosen for the moment: calming breath,
// cognitive future-self reflection, an incentive/savings visualization, a
// physical reset, or a grounding distraction. Every path ends kindly — progress
// over perfection, never shame.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useAppStore, DelaySession, ContextTag, computeMoneySaved } from '../src/store/useAppStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { BreathingPacer } from '../src/components/ui/BreathingPacer';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';
import { LivingBackground } from '../src/components/ui/LivingBackground';
import { getPersona } from '../src/constants/personas';
import { cigsAvoided, cleanBreathingMinutes, moneyStory, humanizeMinutes } from '../src/lib/narrative';

type InterventionType = 'calming' | 'cognitive' | 'incentive' | 'physical' | 'distraction';
type Phase = 'menu' | 'active' | 'outcome';

const SESSION_DURATION = 180; // 3 minutes for the calming path

export default function InterventionScreen() {
  const { t } = useTranslation();
  const { addDelaySession, profile, logs } = useAppStore();
  const persona = getPersona(profile?.companionPersona);

  const [phase, setPhase] = useState<Phase>('menu');
  const [type, setType] = useState<InterventionType | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [contextTag, setContextTag] = useState<ContextTag | undefined>();
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [promptIndex] = useState(() => Math.floor(Math.random() * 3));
  const [taskIndex] = useState(() => Math.floor(Math.random() * 3));

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStart = useRef<Date | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const contextTags: ContextTag[] = ['stress', 'social', 'habit', 'boredom', 'alcohol', 'other'];
  const contextLabels: Record<ContextTag, string> = {
    stress: t.logContextStress, social: t.logContextSocial, habit: t.logContextHabit,
    boredom: t.logContextBoredom, alcohol: t.logContextAlcohol, other: t.logContextOther,
  };

  const interventions: { type: InterventionType; emoji: string; label: string; desc: string; accent: string }[] = [
    { type: 'calming', emoji: '🫁', label: t.interveneCalming, desc: t.interveneCalmingDesc, accent: Colors.sky },
    { type: 'cognitive', emoji: '🧭', label: t.interveneCognitive, desc: t.interveneCognitiveDesc, accent: Colors.aurora },
    { type: 'incentive', emoji: '💰', label: t.interveneIncentive, desc: t.interveneIncentiveDesc, accent: Colors.gold },
    { type: 'physical', emoji: '💧', label: t.intervenePhysical, desc: t.intervenePhysicalDesc, accent: Colors.primary },
    { type: 'distraction', emoji: '🎯', label: t.interveneDistraction, desc: t.interveneDistractionDesc, accent: Colors.rose },
  ];

  const startIntervention = (it: InterventionType) => {
    sessionStart.current = new Date();
    setType(it);
    setPhase('active');
    Haptics.selectionAsync();

    if (it === 'calming') {
      setTimeLeft(SESSION_DURATION);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPhase('outcome');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const backToMenu = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('menu');
    setType(null);
  };

  const goToOutcome = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('outcome');
  };

  const recordOutcome = (result: 'delayed' | 'smoked') => {
    const elapsed = sessionStart.current
      ? Math.round((Date.now() - sessionStart.current.getTime()) / 1000)
      : SESSION_DURATION - timeLeft;
    const session: DelaySession = {
      id: `delay_${Date.now()}`,
      startedAt: sessionStart.current?.toISOString() ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds: elapsed,
      intensity,
      contextTag,
      outcome: result,
    };
    addDelaySession(session);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.root}>
      <LivingBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (phase === 'menu' ? router.back() : backToMenu())} style={styles.closeBtn}>
          <Text style={styles.closeText}>{phase === 'menu' ? '✕' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.interveneTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* MENU */}
        {phase === 'menu' && (
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={styles.subtitle}>{t.interveneSubtitle}</Text>

            <Text style={styles.sectionLabel}>{t.delayIntensityLabel}</Text>
            <View style={styles.intensityRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.intensityBtn, intensity === i && styles.intensityBtnActive]}
                  onPress={() => setIntensity(i)}
                >
                  <Text style={[styles.intensityText, intensity === i && styles.intensityTextActive]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>{t.delayContextLabel}</Text>
            <View style={styles.tagRow}>
              {contextTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, contextTag === tag && styles.tagActive]}
                  onPress={() => setContextTag(contextTag === tag ? undefined : tag)}
                >
                  <Text style={[styles.tagText, contextTag === tag && styles.tagTextActive]}>{contextLabels[tag]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>{t.interveneTitle}</Text>
            {interventions.map((it, i) => (
              <Animated.View key={it.type} entering={FadeInDown.duration(400).delay(i * 60)}>
                <TouchableOpacity
                  style={[styles.interventionCard, { borderColor: `${it.accent}44` }]}
                  onPress={() => startIntervention(it.type)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.interventionIcon, { backgroundColor: `${it.accent}22` }]}>
                    <Text style={styles.interventionEmoji}>{it.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.interventionLabel, { color: it.accent }]}>{it.label}</Text>
                    <Text style={styles.interventionDesc}>{it.desc}</Text>
                  </View>
                  <Text style={[styles.interventionChevron, { color: it.accent }]}>›</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* ACTIVE */}
        {phase === 'active' && type === 'calming' && (
          <View style={styles.centered}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <Text style={styles.timerSub}>{t.delayTimeLeft}</Text>
            <View style={{ marginVertical: Spacing.xl }}>
              <BreathingPacer size={240} running />
            </View>
            <Text style={styles.personaQuote}>"{t[`delayAiMessage${(promptIndex % 5) + 1}` as 'delayAiMessage1']}"</Text>
            <TouchableOpacity onPress={goToOutcome} style={styles.steadyBtn}>
              <Text style={styles.steadyText}>{t.interveneReflectDone}</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'active' && type === 'cognitive' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.contentBlock}>
            <Text style={styles.contentEmoji}>{persona.emoji}</Text>
            <Text style={styles.contentIntro}>{t.cognitiveIntro}</Text>
            <View style={styles.reflectCard}>
              <Text style={styles.reflectText}>
                {t[`cognitivePrompt${promptIndex + 1}` as 'cognitivePrompt1']}
              </Text>
            </View>
            <PrimaryButton label={t.interveneReflectDone} onPress={goToOutcome} size="lg" style={styles.fullBtn} />
            <ChooseAnother onPress={backToMenu} label={t.interveneChooseAnother} />
          </Animated.View>
        )}

        {phase === 'active' && type === 'incentive' && (
          <IncentiveView onDone={goToOutcome} onBack={backToMenu} />
        )}

        {phase === 'active' && type === 'physical' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.contentBlock}>
            <Text style={styles.contentEmoji}>💧</Text>
            <Text style={styles.contentIntro}>{t.physicalIntro}</Text>
            {[t.physicalStep1, t.physicalStep2, t.physicalStep3].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            <PrimaryButton label={t.interveneReflectDone} onPress={goToOutcome} size="lg" style={styles.fullBtn} />
            <ChooseAnother onPress={backToMenu} label={t.interveneChooseAnother} />
          </Animated.View>
        )}

        {phase === 'active' && type === 'distraction' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.contentBlock}>
            <Text style={styles.contentEmoji}>🎯</Text>
            <Text style={styles.contentIntro}>{t.distractionIntro}</Text>
            <View style={styles.reflectCard}>
              <Text style={styles.reflectText}>
                {t[`distractionTask${taskIndex + 1}` as 'distractionTask1']}
              </Text>
            </View>
            <PrimaryButton label={t.interveneReflectDone} onPress={goToOutcome} size="lg" style={styles.fullBtn} />
            <ChooseAnother onPress={backToMenu} label={t.interveneChooseAnother} />
          </Animated.View>
        )}

        {/* OUTCOME */}
        {phase === 'outcome' && (
          <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.centered}>
            <Text style={styles.bigEmoji}>🌿</Text>
            <Text style={styles.outcomeTitle}>{t.delayOutcomeTitle}</Text>

            <TouchableOpacity style={styles.outcomeSuccess} onPress={() => recordOutcome('delayed')}>
              <Text style={styles.outcomeSuccessText}>{t.delayOutcomeSuccess}</Text>
              <Text style={styles.outcomeSuccessMsg}>{t.delayOutcomeSuccessMsg}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.outcomeSmoked} onPress={() => recordOutcome('smoked')}>
              <Text style={styles.outcomeSmokedText}>{t.delayOutcomeSmoked}</Text>
              <Text style={styles.outcomeSmokedMsg}>{t.delayOutcomeSmokedMsg}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChooseAnother({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.chooseAnother}>
      <Text style={styles.chooseAnotherText}>{label}</Text>
    </TouchableOpacity>
  );
}

function IncentiveView({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const { t } = useTranslation();
  const { profile, logs } = useAppStore();
  if (!profile) return null;
  const money = computeMoneySaved(logs, profile);
  const cigsTotal = logs.filter((l) => l.type === 'cigarette').length;
  const avoided = cigsAvoided(profile.dailyBaseline, profile.startDate, cigsTotal);
  const cleanMin = cleanBreathingMinutes(avoided);
  const story = moneyStory(money.total, profile.costPerPack, t);

  const rows = [
    { emoji: '💰', value: `${profile.currency}${money.total.toFixed(0)}`, label: `${t.homeMoneyPrefix} ${story}` },
    { emoji: '🚭', value: String(avoided), label: t.homeAvoidedCaption },
    { emoji: '🫁', value: `${humanizeMinutes(cleanMin)}${cleanMin < 60 ? ' ' + t.unitMin : ''}`, label: t.homeCleanAirCaption },
  ];

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.contentBlock}>
      <Text style={styles.contentEmoji}>✨</Text>
      <Text style={styles.contentIntro}>{t.incentiveIntro}</Text>
      {rows.map((r, i) => (
        <Animated.View key={i} entering={FadeInDown.duration(400).delay(i * 120)} style={styles.incentiveRow}>
          <Text style={styles.incentiveEmoji}>{r.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.incentiveValue}>{r.value}</Text>
            <Text style={styles.incentiveLabel}>{r.label}</Text>
          </View>
        </Animated.View>
      ))}
      <PrimaryButton label={t.interveneReflectDone} onPress={onDone} size="lg" style={styles.fullBtn} />
      <ChooseAnother onPress={onBack} label={t.interveneChooseAnother} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: Colors.textDarkSecondary, fontSize: 26 },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textDark },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textDarkSecondary, textAlign: 'center', lineHeight: FontSize.base * 1.6, marginBottom: Spacing.xl, marginTop: Spacing.sm },

  sectionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textDark, marginBottom: Spacing.md },
  intensityRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  intensityBtn: { flex: 1, height: 48, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.bgDarkElevated, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgDarkCard },
  intensityBtnActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}22` },
  intensityText: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textDarkSecondary },
  intensityTextActive: { color: Colors.primary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  tag: { borderWidth: 1.5, borderColor: Colors.bgDarkElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, backgroundColor: Colors.bgDarkCard },
  tagActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}22` },
  tagText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textDarkSecondary },
  tagTextActive: { color: Colors.primary },

  interventionCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, backgroundColor: Colors.bgDarkCard },
  interventionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  interventionEmoji: { fontSize: 24 },
  interventionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, marginBottom: 2 },
  interventionDesc: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textDarkSecondary, lineHeight: FontSize.sm * 1.45 },
  interventionChevron: { fontSize: 26, fontFamily: FontFamily.regular },

  centered: { alignItems: 'center', paddingTop: Spacing.lg },
  timerText: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.textDark, letterSpacing: 2 },
  timerSub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textDarkSecondary, marginTop: 4 },
  personaQuote: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textDark, fontStyle: 'italic', textAlign: 'center', lineHeight: FontSize.base * 1.7, marginBottom: Spacing.xl, paddingHorizontal: Spacing.sm },
  steadyBtn: { paddingVertical: Spacing.sm },
  steadyText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.primary, textDecorationLine: 'underline' },

  contentBlock: { paddingTop: Spacing.md },
  contentEmoji: { fontSize: 48, textAlign: 'center', marginBottom: Spacing.md },
  contentIntro: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textDarkSecondary, textAlign: 'center', lineHeight: FontSize.base * 1.6, marginBottom: Spacing.lg },
  reflectCard: { backgroundColor: Colors.bgDarkCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.glassBorder, padding: Spacing.lg, marginBottom: Spacing.lg },
  reflectText: { fontFamily: FontFamily.medium, fontSize: FontSize.md, color: Colors.textDark, lineHeight: FontSize.md * 1.6, textAlign: 'center' },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.bgDarkCard, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.glassBorder },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: `${Colors.primary}22`, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.primary },
  stepText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textDark, lineHeight: FontSize.base * 1.45 },

  incentiveRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.bgDarkCard, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.glassBorder },
  incentiveEmoji: { fontSize: 28 },
  incentiveValue: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.gold },
  incentiveLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textDarkSecondary, lineHeight: FontSize.sm * 1.4 },

  fullBtn: { width: '100%', marginTop: Spacing.sm },
  chooseAnother: { alignSelf: 'center', paddingVertical: Spacing.md },
  chooseAnotherText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textDarkMuted, textDecorationLine: 'underline' },

  bigEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  outcomeTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textDark, marginBottom: Spacing.lg },
  outcomeSuccess: { width: '100%', backgroundColor: `${Colors.primary}22`, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.primary, padding: Spacing.lg, marginBottom: Spacing.md },
  outcomeSuccessText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.primary, marginBottom: Spacing.xs },
  outcomeSuccessMsg: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textDarkSecondary, lineHeight: FontSize.sm * 1.6 },
  outcomeSmoked: { width: '100%', backgroundColor: Colors.bgDarkCard, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.bgDarkElevated, padding: Spacing.lg },
  outcomeSmokedText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textDark, marginBottom: Spacing.xs },
  outcomeSmokedMsg: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textDarkSecondary, lineHeight: FontSize.sm * 1.6 },
});
