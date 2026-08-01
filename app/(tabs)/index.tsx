// app/(tabs)/index.tsx — Home / Today screen (v3: Reanimated, Robust Intervals)
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, Layout, SlideInUp, ZoomIn, FadeOut } from 'react-native-reanimated';
import { useAppStore, computeMoneySaved, computeCurrentStreak, computeLongestStreak, SmokingLog } from '../../src/store/useAppStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useTheme } from '../../src/hooks/useTheme';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';

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

// ── Encouragement messages (context-aware) ────────────────────────────
function getEncouragement(cigsToday: number, baseline: number, streak: number, minutesSinceLast: number): { emoji: string; message: string } {
  if (cigsToday === 0) return { emoji: '🌟', message: "Zero today — you're shining! Every smoke-free hour is healing your body." };
  if (minutesSinceLast > 180) return { emoji: '💪', message: `${Math.floor(minutesSinceLast / 60)} hours since your last one. Your lungs are thanking you right now.` };
  if (minutesSinceLast > 60) return { emoji: '🌿', message: `Over an hour smoke-free. That's real strength. Keep going.` };
  if (cigsToday < baseline / 2) return { emoji: '🎯', message: `Only ${cigsToday} today — that's less than half your baseline. Incredible progress!` };
  if (cigsToday < baseline) return { emoji: '📉', message: `${baseline - cigsToday} fewer than your baseline today. Every reduction counts.` };
  if (streak > 0) return { emoji: '🔥', message: `${streak}-day streak of reducing! You're building a powerful new pattern.` };
  return { emoji: '💙', message: "You're here, you're tracking, and that's brave. Small steps lead to big change." };
}

function formatInterval(min: number): string {
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getGreeting(t: any) {
  const h = new Date().getHours();
  if (h < 12) return t.homeGreetingMorning;
  if (h < 17) return t.homeGreetingAfternoon;
  if (h < 21) return t.homeGreetingEvening;
  return t.homeGreetingNight;
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const profile = useAppStore((s) => s.profile);
  const logs = useAppStore((s) => s.logs);
  const addLog = useAppStore((s) => s.addLog);

  const [showQuickLogConfirm, setShowQuickLogConfirm] = useState(false);

  if (!profile) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCigs = logs.filter(l => {
    if (l.type !== 'cigarette') return false;
    const d = new Date(l.timestamp); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const cigsToday = todayCigs.length;

  const lastCig = useMemo(() => {
    const cigs = logs.filter(l => l.type === 'cigarette').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return cigs[0] ? new Date(cigs[0].timestamp) : null;
  }, [logs]);

  const timer = useLiveTimer(lastCig);
  const money = computeMoneySaved(logs, profile);
  const currentStreak = computeCurrentStreak(logs);
  const longestStreak = computeLongestStreak(logs);
  const baseline = profile.dailyBaseline;
  const progressFraction = Math.min(1, Math.max(0, 1 - cigsToday / baseline));
  const encouragement = getEncouragement(cigsToday, baseline, currentStreak, timer.totalMinutes);

  // Today's per-cig intervals (robust calculation)
  const todayIntervals = useMemo(() => {
    const cigs = todayCigs
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return cigs.map((c, i) => ({
      id: c.id,
      time: new Date(c.timestamp),
      intervalMin: i === 0 ? null : (new Date(c.timestamp).getTime() - new Date(cigs[i - 1].timestamp).getTime()) / 60000,
    }));
  }, [todayCigs]);

  const avgInterval = useMemo(() => {
    const intervals = todayIntervals.filter(i => i.intervalMin !== null).map(i => i.intervalMin!);
    if (intervals.length === 0) return null;
    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }, [todayIntervals]);

  // ── Quick log (one-tap) ──
  const handleQuickLog = () => {
    addLog({
      id: `cig_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'cigarette',
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowQuickLogConfirm(true);
    setTimeout(() => setShowQuickLogConfirm(false), 2000);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <Animated.ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting(t)} 👋</Text>
          <Text style={[styles.appName, { color: colors.text }]}>{t.appName}</Text>
        </Animated.View>

        {/* ── ENCOURAGEMENT CARD ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <GlassCard style={[styles.encourageCard, { borderColor: `${Colors.primary}55` }]} elevated>
            <Text style={styles.encourageEmoji}>{encouragement.emoji}</Text>
            <Text style={[styles.encourageText, { color: colors.text }]}>{encouragement.message}</Text>
          </GlassCard>
        </Animated.View>

        {/* ── LIVE TIMER ── */}
        {lastCig && (
          <Animated.View entering={FadeInDown.duration(500).delay(200)}>
            <GlassCard style={styles.timerCard}>
              <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>Time since last cigarette</Text>
              <View style={styles.timerRow}>
                <View style={styles.timerUnit}>
                  <Text style={styles.timerDigit}>{String(timer.hours).padStart(2, '0')}</Text>
                  <Text style={[styles.timerUnitLabel, { color: colors.textMuted }]}>hrs</Text>
                </View>
                <Text style={styles.timerColon}>:</Text>
                <View style={styles.timerUnit}>
                  <Text style={styles.timerDigit}>{String(timer.minutes).padStart(2, '0')}</Text>
                  <Text style={[styles.timerUnitLabel, { color: colors.textMuted }]}>min</Text>
                </View>
                <Text style={styles.timerColon}>:</Text>
                <View style={styles.timerUnit}>
                  <Text style={styles.timerDigit}>{String(timer.seconds).padStart(2, '0')}</Text>
                  <Text style={[styles.timerUnitLabel, { color: colors.textMuted }]}>sec</Text>
                </View>
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

        {/* ── TODAY CARD ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <GlassCard style={styles.todayCard} elevated>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t.homeTodayCount}</Text>
            <View style={styles.todayRow}>
              <Text style={styles.bigNumber}>{cigsToday}</Text>
              <Text style={[styles.baselineText, { color: colors.textMuted }]}>/ {baseline} {t.homeBaselineCount}</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: isDark ? Colors.bgDarkElevated : '#E5F5F3' }]}>
              <Animated.View 
                style={[styles.progressFill, { width: `${Math.round(progressFraction * 100)}%` as any }]} 
                layout={Layout.springify().damping(15)}
              />
            </View>
            {progressFraction > 0 && (
              <Text style={styles.reductionText}>{Math.round(progressFraction * 100)}% below baseline ✨</Text>
            )}
          </GlassCard>
        </Animated.View>

        {/* ── QUICK ACTIONS ROW ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.quickRow}>
          {/* Quick Log */}
          <TouchableOpacity
            style={[styles.quickAction, { flex: 1, marginRight: Spacing.sm, backgroundColor: `${Colors.amber}18`, borderColor: `${Colors.amber}44` }]}
            onPress={handleQuickLog}
            activeOpacity={0.7}
          >
            <Text style={styles.quickActionEmoji}>🚬</Text>
            <Text style={[styles.quickActionLabel, { color: Colors.amber }]}>Quick Log</Text>
          </TouchableOpacity>
          {/* Detailed Log */}
          <TouchableOpacity
            style={[styles.quickAction, { flex: 1, marginHorizontal: Spacing.xs, borderColor: colors.glassBorder }]}
            onPress={() => router.push('/log')}
            activeOpacity={0.7}
          >
            <Text style={styles.quickActionEmoji}>📝</Text>
            <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>+ Details</Text>
          </TouchableOpacity>
          {/* Resisted */}
          <TouchableOpacity
            style={[styles.quickAction, { flex: 1, marginLeft: Spacing.sm, borderColor: `${Colors.primary}44` }]}
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

        {/* ── STATS ROW ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.statsRow}>
          <GlassCard style={[styles.statCard, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t.homeMoneySaved}</Text>
            <Text style={styles.moneyAmount}>{profile.currency}{money.total.toFixed(0)}</Text>
            <Text style={[styles.moneySubtext, { color: colors.textMuted }]}>{profile.currency}{money.today.toFixed(0)} {t.homeMoneyToday}</Text>
          </GlassCard>
          <GlassCard style={[styles.statCard, { flex: 1, marginLeft: Spacing.sm }]}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t.homeStreakCurrent}</Text>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={[styles.moneySubtext, { color: colors.textMuted }]}>{t.homeStreakDays} · Best: {longestStreak}</Text>
          </GlassCard>
        </Animated.View>

        {/* ── ROBUST PER-CIG INTERVALS (today's timeline) ── */}
        {todayIntervals.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(600)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Intervals</Text>
            <GlassCard style={styles.timelineCard}>
              {todayIntervals.map((entry, i) => (
                <Animated.View key={entry.id} entering={SlideInUp.springify().delay(i * 100)} layout={Layout.springify()} style={styles.timelineEntry}>
                  <View style={styles.timelineDotCol}>
                    <View style={[styles.tlDot, i === todayIntervals.length - 1 && styles.tlDotLatest]} />
                    {i < todayIntervals.length - 1 && <View style={styles.tlLine} />}
                  </View>
                  <View style={styles.timelineInfo}>
                    <Text style={[styles.tlTime, { color: colors.text }]}>
                      {entry.time.getHours()}:{String(entry.time.getMinutes()).padStart(2, '0')}
                    </Text>
                    {entry.intervalMin !== null ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.tlInterval, { color: entry.intervalMin > (avgInterval ?? 60) ? Colors.primary : colors.textMuted }]}>
                          {formatInterval(entry.intervalMin)} gap
                        </Text>
                        {entry.intervalMin > (avgInterval ?? 60) && (
                          <Text style={{ fontSize: 12 }}>📈</Text>
                        )}
                        {entry.intervalMin < (avgInterval ?? 60) && (
                          <Text style={{ fontSize: 12 }}>📉</Text>
                        )}
                      </View>
                    ) : (
                      <Text style={[styles.tlInterval, { color: colors.textMuted }]}>First today</Text>
                    )}
                  </View>
                </Animated.View>
              ))}
              {avgInterval !== null && (
                <View style={styles.avgRow}>
                  <Text style={[styles.avgLabel, { color: colors.textSecondary }]}>Average interval today: </Text>
                  <Text style={[styles.avgValue, { color: Colors.primary }]}>{formatInterval(avgInterval)}</Text>
                </View>
              )}
            </GlassCard>
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* FAB — I'm craving */}
      <Animated.View 
        entering={SlideInUp.springify().damping(12).delay(800)}
        style={styles.fabContainer}
      >
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/delay')} activeOpacity={0.85}>
          <Text style={styles.fabIcon}>🫁</Text>
          <Text style={styles.fabText}>{t.homeCravingBtn}</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  header: { marginBottom: Spacing.md },
  greeting: { fontFamily: FontFamily.regular, fontSize: FontSize.base, marginBottom: 4 },
  appName: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, letterSpacing: -0.5 },

  // Encouragement
  encourageCard: { marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5 },
  encourageEmoji: { fontSize: 28 },
  encourageText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, lineHeight: FontSize.base * 1.55, flex: 1 },

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

  // Quick actions
  quickRow: { flexDirection: 'row', marginBottom: Spacing.md },
  quickAction: {
    borderWidth: 1.5, borderRadius: Radius.lg, alignItems: 'center', paddingVertical: Spacing.md, gap: 4,
  },
  quickActionEmoji: { fontSize: 22 },
  quickActionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs },
  quickToast: {
    backgroundColor: `${Colors.primary}22`, borderRadius: Radius.md, padding: Spacing.sm,
    marginBottom: Spacing.md, alignItems: 'center',
  },
  quickToastText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },

  // Stats
  statsRow: { flexDirection: 'row', marginBottom: Spacing.md },
  statCard: {},
  moneyAmount: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.gold, marginTop: 4, marginBottom: 2 },
  moneySubtext: { fontFamily: FontFamily.regular, fontSize: FontSize.xs },
  streakNumber: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.primary, marginTop: 4, marginBottom: 2 },

  // Timeline
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, marginBottom: Spacing.sm },
  timelineCard: { marginBottom: Spacing.md },
  timelineEntry: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 2 },
  timelineDotCol: { alignItems: 'center', width: 16 },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.bgDarkElevated, marginTop: 4 },
  tlDotLatest: { backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  tlLine: { width: 2, flex: 1, backgroundColor: Colors.bgDarkElevated, marginVertical: 2 },
  timelineInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: Spacing.sm },
  tlTime: { fontFamily: FontFamily.medium, fontSize: FontSize.sm },
  tlInterval: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm },
  avgRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.bgDarkElevated },
  avgLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm },
  avgValue: { fontFamily: FontFamily.bold, fontSize: FontSize.sm },

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
