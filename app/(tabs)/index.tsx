// app/(tabs)/index.tsx — The Living Home
// A screen that breathes with the time of day, speaks in your companion's voice,
// and tells your progress back to you as a story rather than a spreadsheet.
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, Layout, SlideInUp, ZoomIn, FadeOut } from 'react-native-reanimated';
import {
  useAppStore,
  computeMoneySaved,
  computeCurrentStreak,
  computeLongestStreak,
} from '../../src/store/useAppStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useTheme } from '../../src/hooks/useTheme';
import { Colors, FontFamily, FontSize, Spacing, Radius, getAtmosphere, getDayPhase } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { LivingBackground } from '../../src/components/ui/LivingBackground';
import { getPersona } from '../../src/constants/personas';
import {
  cigsAvoided,
  cleanBreathingMinutes,
  lifeMinutesRegained,
  moneyStory,
  humanizeMinutes,
} from '../../src/lib/narrative';

// ── Live timer helper ─────────────────────────────────────────────────
function useLiveTimer(lastCigTime: Date | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!lastCigTime) return { hours: 0, minutes: 0, seconds: 0, totalMinutes: 0 };
  const diff = Math.max(0, now - lastCigTime.getTime());
  const totalMinutes = diff / 60000;
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    totalMinutes,
  };
}

// ── Companion voice: a warm, context-aware nudge ───────────────────────
function getCompanionNudge(cigsToday: number, baseline: number, streak: number, minutesSinceLast: number): { emoji: string; message: string } {
  if (cigsToday === 0) return { emoji: '🌟', message: "Zero today — you're shining. Every smoke-free hour is your body quietly healing." };
  if (minutesSinceLast > 180) return { emoji: '💪', message: `${Math.floor(minutesSinceLast / 60)} hours since your last one. Your lungs are thanking you right now.` };
  if (minutesSinceLast > 60) return { emoji: '🌿', message: `Over an hour smoke-free. That's real strength — let's stretch it a little further.` };
  if (cigsToday < baseline / 2) return { emoji: '🎯', message: `Only ${cigsToday} today — less than half your baseline. That's genuinely remarkable progress.` };
  if (cigsToday < baseline) return { emoji: '📉', message: `${baseline - cigsToday} fewer than your baseline today. Every one you skip counts.` };
  if (streak > 0) return { emoji: '🔥', message: `${streak}-day streak of reducing. You're building a whole new pattern, one choice at a time.` };
  return { emoji: '💙', message: "You're here, you're honest, and that's brave. Small steps, gently, lead somewhere real." };
}

function greetingForPhase(t: any): string {
  const phase = getDayPhase();
  if (phase === 'dawn' || phase === 'morning') return t.homeGreetingMorning;
  if (phase === 'afternoon') return t.homeGreetingAfternoon;
  if (phase === 'evening') return t.homeGreetingEvening;
  return t.homeGreetingNight;
}

// A compact narrative stat tile.
function StoryTile({ value, unit, title, caption, accent }: {
  value: string; unit?: string; title: string; caption: string; accent: string;
}) {
  const { colors } = useTheme();
  return (
    <GlassCard style={styles.storyTile}>
      <Text style={styles.storyTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.storyValueRow}>
        <Text style={[styles.storyValue, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {unit ? <Text style={[styles.storyUnit, { color: accent }]}>{unit}</Text> : null}
      </View>
      <Text style={[styles.storyCaption, { color: colors.textMuted }]}>{caption}</Text>
    </GlassCard>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const profile = useAppStore((s) => s.profile);
  const logs = useAppStore((s) => s.logs);
  const addLog = useAppStore((s) => s.addLog);

  const [showQuickLogConfirm, setShowQuickLogConfirm] = useState(false);

  const atmosphere = getAtmosphere();
  const persona = getPersona(profile?.companionPersona);

  if (!profile) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCigs = logs.filter((l) => {
    if (l.type !== 'cigarette') return false;
    const d = new Date(l.timestamp); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const cigsToday = todayCigs.length;

  const lastCig = useMemo(() => {
    const cigs = logs.filter((l) => l.type === 'cigarette').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return cigs[0] ? new Date(cigs[0].timestamp) : null;
  }, [logs]);

  const timer = useLiveTimer(lastCig);
  const money = computeMoneySaved(logs, profile);
  const currentStreak = computeCurrentStreak(logs);
  const longestStreak = computeLongestStreak(logs);
  const baseline = profile.dailyBaseline;
  const progressFraction = Math.min(1, Math.max(0, 1 - cigsToday / baseline));
  const nudge = getCompanionNudge(cigsToday, baseline, currentStreak, timer.totalMinutes);

  // Narrative figures
  const cigsTotal = logs.filter((l) => l.type === 'cigarette').length;
  const avoided = cigsAvoided(baseline, profile.startDate, cigsTotal);
  const cleanMin = cleanBreathingMinutes(avoided);
  const lifeMin = lifeMinutesRegained(avoided);
  const story = moneyStory(money.total, profile.costPerPack, t);

  const handleQuickLog = () => {
    addLog({ id: `cig_${Date.now()}`, timestamp: new Date().toISOString(), type: 'cigarette' });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowQuickLogConfirm(true);
    setTimeout(() => setShowQuickLogConfirm(false), 2000);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      {isDark && <LivingBackground atmosphere={atmosphere} />}
      <Animated.ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greetingForPhase(t)}</Text>
          <View style={styles.companionLine}>
            <Text style={styles.companionEmoji}>{persona.emoji}</Text>
            <Text style={[styles.companionText, { color: colors.textMuted }]}>
              {t.companionWord} · {persona.name}
            </Text>
          </View>
        </Animated.View>

        {/* Companion nudge */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <GlassCard style={[styles.nudgeCard, { borderColor: `${persona.accent}55` }]} elevated>
            <View style={[styles.nudgeAvatar, { backgroundColor: `${persona.accent}22` }]}>
              <Text style={styles.nudgeEmoji}>{nudge.emoji}</Text>
            </View>
            <Text style={[styles.nudgeText, { color: colors.text }]}>{nudge.message}</Text>
          </GlassCard>
        </Animated.View>

        {/* Live timer */}
        {lastCig && (
          <Animated.View entering={FadeInDown.duration(500).delay(200)}>
            <GlassCard style={styles.timerCard}>
              <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>Time since last cigarette</Text>
              <View style={styles.timerRow}>
                <TimerUnit value={timer.hours} label="hrs" muted={colors.textMuted} />
                <Text style={styles.timerColon}>:</Text>
                <TimerUnit value={timer.minutes} label="min" muted={colors.textMuted} />
                <Text style={styles.timerColon}>:</Text>
                <TimerUnit value={timer.seconds} label="sec" muted={colors.textMuted} />
              </View>
              {timer.totalMinutes > 20 && (
                <Text style={styles.timerMilestone}>
                  {timer.totalMinutes > 720 ? '❤️ Heart rate normalizing' :
                   timer.totalMinutes > 60 ? '🫁 Carbon monoxide dropping' :
                   '❤️ Blood pressure improving'}
                </Text>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {/* Today */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <GlassCard style={styles.todayCard} elevated>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t.homeTodayCount}</Text>
            <View style={styles.todayRow}>
              <Text style={styles.bigNumber}>{cigsToday}</Text>
              <Text style={[styles.baselineText, { color: colors.textMuted }]}>/ {baseline} {t.homeBaselineCount}</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: isDark ? Colors.bgDarkElevated : '#E5F5F3' }]}>
              <Animated.View style={[styles.progressFill, { width: `${Math.round(progressFraction * 100)}%` as any }]} layout={Layout.springify().damping(15)} />
            </View>
            {progressFraction > 0 && (
              <Text style={styles.reductionText}>{Math.round(progressFraction * 100)}% below baseline ✨</Text>
            )}
          </GlassCard>
        </Animated.View>

        {/* ── YOUR STORY SO FAR ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.homeStorySectionTitle}</Text>
          <View style={styles.storyRow}>
            <StoryTile
              value={humanizeMinutes(cleanMin)}
              unit={cleanMin < 60 ? t.unitMin : undefined}
              title={t.homeCleanAirTitle}
              caption={t.homeCleanAirCaption}
              accent={Colors.sky}
            />
            <View style={{ width: Spacing.sm }} />
            <StoryTile
              value={String(avoided)}
              title={t.homeAvoidedTitle}
              caption={t.homeAvoidedCaption}
              accent={Colors.primary}
            />
          </View>
          <View style={[styles.storyRow, { marginTop: Spacing.sm }]}>
            <StoryTile
              value={humanizeMinutes(lifeMin)}
              unit={lifeMin < 60 ? t.unitMin : undefined}
              title={t.homeLifeTitle}
              caption={t.homeLifeCaption}
              accent={Colors.rose}
            />
            <View style={{ width: Spacing.sm }} />
            <StoryTile
              value={`${profile.currency}${money.total.toFixed(0)}`}
              title={t.homeMoneySaved}
              caption={`${t.homeMoneyPrefix} ${story}`}
              accent={Colors.gold}
            />
          </View>
        </Animated.View>

        {/* Streak strip */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)}>
          <GlassCard style={styles.streakStrip}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={[styles.streakText, { color: colors.text }]}>
              <Text style={{ color: Colors.primary, fontFamily: FontFamily.bold }}>{currentStreak}</Text>
              {` ${t.homeStreakDays} · `}
              <Text style={{ color: colors.textSecondary }}>{t.homeStreakBest} {longestStreak}</Text>
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickAction, { marginRight: Spacing.sm, backgroundColor: `${Colors.amber}18`, borderColor: `${Colors.amber}44` }]}
            onPress={handleQuickLog}
            activeOpacity={0.7}
          >
            <Text style={styles.quickActionEmoji}>🚬</Text>
            <Text style={[styles.quickActionLabel, { color: Colors.amber }]}>Quick Log</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { marginHorizontal: Spacing.xs, borderColor: colors.glassBorder }]}
            onPress={() => router.push('/log')}
            activeOpacity={0.7}
          >
            <Text style={styles.quickActionEmoji}>📝</Text>
            <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>+ Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { marginLeft: Spacing.sm, borderColor: `${Colors.primary}44` }]}
            onPress={() => {
              addLog({ id: `crv_${Date.now()}`, timestamp: new Date().toISOString(), type: 'craving' });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.quickActionEmoji}>✋</Text>
            <Text style={[styles.quickActionLabel, { color: Colors.primary }]}>Resisted!</Text>
          </TouchableOpacity>
        </Animated.View>

        {showQuickLogConfirm && (
          <Animated.View entering={ZoomIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.quickToast}>
            <Text style={styles.quickToastText}>Logged ✓ — No judgment, just tracking 💙</Text>
          </Animated.View>
        )}

        <View style={{ height: 130 }} />
      </Animated.ScrollView>

      {/* FAB — Ride the wave (intervention hub) */}
      <Animated.View entering={SlideInUp.springify().damping(12).delay(800)} style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/delay')} activeOpacity={0.85}>
          <Text style={styles.fabIcon}>🌊</Text>
          <Text style={styles.fabText}>{t.homeCravingBtn}</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

function TimerUnit({ value, label, muted }: { value: number; label: string; muted: string }) {
  return (
    <View style={styles.timerUnit}>
      <Text style={styles.timerDigit}>{String(value).padStart(2, '0')}</Text>
      <Text style={[styles.timerUnitLabel, { color: muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  header: { marginBottom: Spacing.md },
  greeting: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, letterSpacing: -0.5, marginBottom: 4 },
  companionLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  companionEmoji: { fontSize: 14 },
  companionText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, textTransform: 'capitalize' },

  // Companion nudge
  nudgeCard: { marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5 },
  nudgeAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  nudgeEmoji: { fontSize: 24 },
  nudgeText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, lineHeight: FontSize.base * 1.5, flex: 1 },

  // Timer
  timerCard: { marginBottom: Spacing.md, alignItems: 'center' },
  timerLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, marginBottom: Spacing.sm },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  timerUnit: { alignItems: 'center' },
  timerDigit: { fontFamily: FontFamily.bold, fontSize: 36, color: Colors.primary, letterSpacing: 1, minWidth: 52, textAlign: 'center' },
  timerColon: { fontFamily: FontFamily.bold, fontSize: 28, color: Colors.primary, marginBottom: 14 },
  timerUnitLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: -2 },
  timerMilestone: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primaryLight, marginTop: Spacing.sm },

  // Today
  todayCard: { marginBottom: Spacing.md },
  cardLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  todayRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: Spacing.md },
  bigNumber: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.primary },
  baselineText: { fontFamily: FontFamily.regular, fontSize: FontSize.base },
  progressTrack: { height: 6, borderRadius: 3, marginBottom: Spacing.sm },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  reductionText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primaryLight },

  // Story
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  storyRow: { flexDirection: 'row' },
  storyTile: { flex: 1 },
  storyTitle: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textDarkSecondary },
  storyValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6, marginBottom: 4 },
  storyValue: { fontFamily: FontFamily.bold, fontSize: FontSize.xl },
  storyUnit: { fontFamily: FontFamily.medium, fontSize: FontSize.sm },
  storyCaption: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, lineHeight: FontSize.xs * 1.4 },

  // Streak
  streakStrip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.md },
  streakFire: { fontSize: 20 },
  streakText: { fontFamily: FontFamily.medium, fontSize: FontSize.base },

  // Quick actions
  quickRow: { flexDirection: 'row' },
  quickAction: { flex: 1, borderWidth: 1.5, borderRadius: Radius.lg, alignItems: 'center', paddingVertical: Spacing.md, gap: 4 },
  quickActionEmoji: { fontSize: 22 },
  quickActionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs },
  quickToast: { backgroundColor: `${Colors.primary}22`, borderRadius: Radius.md, padding: Spacing.sm, marginTop: Spacing.md, alignItems: 'center' },
  quickToastText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },

  // FAB
  fabContainer: { position: 'absolute', bottom: 90, left: Spacing.lg, right: Spacing.lg, alignItems: 'center' },
  fab: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  fabIcon: { fontSize: 22 },
  fabText: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.bgDark, letterSpacing: 0.3 },
});
