// app/(tabs)/index.tsx — The Living Home
// A single, authored composition: a breathing aura hero that shows the day at a
// glance, your companion's voice, and progress told as a story. Vector icons,
// gradient actions, real depth.
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeIn, FadeInDown, ZoomIn, FadeOut } from 'react-native-reanimated';
import {
  useAppStore,
  computeMoneySaved,
  computeCurrentStreak,
  computeLongestStreak,
} from '../../src/store/useAppStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useTheme } from '../../src/hooks/useTheme';
import { Colors, FontFamily, FontSize, Spacing, Radius, getAtmosphere, getDayPhase, Surfaces } from '../../src/constants/theme';
import { LivingBackground } from '../../src/components/ui/LivingBackground';
import { Surface } from '../../src/components/ui/Surface';
import { StatTile } from '../../src/components/ui/StatTile';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { AuraRing } from '../../src/components/ui/AuraRing';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { getPersona } from '../../src/constants/personas';
import { cigsAvoided, cleanBreathingMinutes, lifeMinutesRegained, moneyStory, humanizeMinutes } from '../../src/lib/narrative';

function useLiveTimer(lastCigTime: Date | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!lastCigTime) return { hours: 0, minutes: 0, totalMinutes: 0 };
  const diff = Math.max(0, now - lastCigTime.getTime());
  return { hours: Math.floor(diff / 3600000), minutes: Math.floor((diff % 3600000) / 60000), totalMinutes: diff / 60000 };
}

function getCompanionNudge(cigsToday: number, baseline: number, streak: number, minutesSinceLast: number): string {
  if (cigsToday === 0) return "Zero so far today — you're shining. Every smoke-free hour is your body quietly healing.";
  if (minutesSinceLast > 180) return `${Math.floor(minutesSinceLast / 60)} hours since your last one. Your lungs are thanking you right now.`;
  if (minutesSinceLast > 60) return "Over an hour smoke-free. That's real strength — let's stretch it a little further.";
  if (cigsToday < baseline / 2) return `Only ${cigsToday} today — less than half your baseline. Genuinely remarkable.`;
  if (cigsToday < baseline) return `${baseline - cigsToday} fewer than your baseline today. Every one you skip counts.`;
  if (streak > 0) return `${streak}-day reducing streak. You're building a whole new pattern, one choice at a time.`;
  return "You're here, you're honest, and that's brave. Small steps, gently, lead somewhere real.";
}

function greetingForPhase(t: any): string {
  const phase = getDayPhase();
  if (phase === 'dawn' || phase === 'morning') return t.homeGreetingMorning;
  if (phase === 'afternoon') return t.homeGreetingAfternoon;
  if (phase === 'evening') return t.homeGreetingEvening;
  return t.homeGreetingNight;
}

type IconName = keyof typeof Ionicons.glyphMap;

function QuickAction({ icon, label, color, onPress }: { icon: IconName; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickAction, { borderColor: `${color}44`, opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
      onPress={onPress}
    >
      <View style={[styles.quickIcon, { backgroundColor: `${color}1F` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const profile = useAppStore((s) => s.profile);
  const logs = useAppStore((s) => s.logs);
  const addLog = useAppStore((s) => s.addLog);

  const [toast, setToast] = useState(false);
  const atmosphere = getAtmosphere();
  const persona = getPersona(profile?.companionPersona);

  if (!profile) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cigsToday = logs.filter((l) => {
    if (l.type !== 'cigarette') return false;
    const d = new Date(l.timestamp); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  const lastCig = useMemo(() => {
    const cigs = logs.filter((l) => l.type === 'cigarette').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return cigs[0] ? new Date(cigs[0].timestamp) : null;
  }, [logs]);

  const timer = useLiveTimer(lastCig);
  const money = computeMoneySaved(logs, profile);
  const currentStreak = computeCurrentStreak(logs);
  const longestStreak = computeLongestStreak(logs);
  const baseline = profile.dailyBaseline;
  const pct = Math.round(Math.min(1, Math.max(0, 1 - cigsToday / baseline)) * 100);
  const fraction = cigsToday === 0 ? 1 : Math.min(1, Math.max(0, 1 - cigsToday / baseline));
  const nudge = getCompanionNudge(cigsToday, baseline, currentStreak, timer.totalMinutes);

  const cigsTotal = logs.filter((l) => l.type === 'cigarette').length;
  const avoided = cigsAvoided(baseline, profile.startDate, cigsTotal);
  const cleanMin = cleanBreathingMinutes(avoided);
  const lifeMin = lifeMinutesRegained(avoided);
  const story = moneyStory(money.total, profile.costPerPack, t);

  const statusLabel = cigsToday === 0 ? 'Smoke-free today' : pct > 0 ? `${pct}% below baseline` : "Today's your day";
  const ringColors = atmosphere.phase === 'evening' || atmosphere.phase === 'night'
    ? (['#8B7BFF', '#2DD4BF', '#38BDF8'] as const)
    : (['#5EEAD4', '#2DD4BF', '#38BDF8'] as const);

  const handleQuickLog = () => {
    addLog({ id: `cig_${Date.now()}`, timestamp: new Date().toISOString(), type: 'cigarette' });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      {isDark && <LivingBackground atmosphere={atmosphere} />}
      <Animated.ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.text }]}>{greetingForPhase(t)}</Text>
            <View style={styles.companionChip}>
              <Text style={styles.companionEmoji}>{persona.emoji}</Text>
              <Text style={[styles.companionText, { color: colors.textSecondary }]}>{persona.name}</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/settings')} hitSlop={10} style={[styles.avatarBtn, { borderColor: Surfaces.hairlineStrong }]}>
            <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
          </Pressable>
        </Animated.View>

        {/* Hero aura */}
        <Animated.View entering={FadeIn.duration(700).delay(150)} style={styles.hero}>
          <AuraRing fraction={fraction} colors={ringColors} size={264}>
            <Text style={[styles.ringNumber, { color: colors.text }]}>{cigsToday}</Text>
            <Text style={[styles.ringOf, { color: colors.textMuted }]}>of {baseline} today</Text>
            <View style={[styles.statusPill, { backgroundColor: `${Colors.primary}1A`, borderColor: `${Colors.primary}40` }]}>
              <Ionicons name={cigsToday === 0 ? 'sparkles' : 'trending-down'} size={12} color={Colors.primaryLight} />
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </AuraRing>

          <View style={styles.cleanRow}>
            <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
            <Text style={[styles.cleanText, { color: colors.textSecondary }]}>
              {lastCig ? `Clean for ${timer.hours > 0 ? `${timer.hours}h ` : ''}${timer.minutes}m` : 'Your first clean stretch starts now'}
            </Text>
          </View>
        </Animated.View>

        {/* Companion nudge */}
        <Animated.View entering={FadeInDown.duration(500).delay(250)}>
          <Surface accent={persona.accent} style={styles.nudgeCard} padding={Spacing.md}>
            <View style={[styles.nudgeAvatar, { backgroundColor: `${persona.accent}22` }]}>
              <Text style={styles.nudgeEmoji}>{persona.emoji}</Text>
            </View>
            <Text style={[styles.nudgeText, { color: colors.text }]}>{nudge}</Text>
          </Surface>
        </Animated.View>

        {/* Story grid */}
        <Animated.View entering={FadeInDown.duration(500).delay(350)}>
          <SectionHeader title={t.homeStorySectionTitle} icon="book-outline" accent={Colors.primaryLight} />
          <View style={styles.grid}>
            <StatTile icon="pulse" value={humanizeMinutes(cleanMin)} unit={cleanMin < 60 ? t.unitMin : undefined} title={t.homeCleanAirTitle} caption={t.homeCleanAirCaption} accent={Colors.sky} style={{ marginRight: Spacing.sm }} />
            <StatTile icon="ban" value={String(avoided)} title={t.homeAvoidedTitle} caption={t.homeAvoidedCaption} accent={Colors.primary} />
          </View>
          <View style={[styles.grid, { marginTop: Spacing.sm }]}>
            <StatTile icon="heart" value={humanizeMinutes(lifeMin)} unit={lifeMin < 60 ? t.unitMin : undefined} title={t.homeLifeTitle} caption={t.homeLifeCaption} accent={Colors.rose} style={{ marginRight: Spacing.sm }} />
            <StatTile icon="wallet" value={`${profile.currency}${money.total.toFixed(0)}`} title={t.homeMoneySaved} caption={`${t.homeMoneyPrefix} ${story}`} accent={Colors.gold} />
          </View>
        </Animated.View>

        {/* Streak */}
        <Animated.View entering={FadeInDown.duration(500).delay(450)}>
          <Surface style={styles.streakStrip} padding={Spacing.md}>
            <View style={[styles.streakIcon, { backgroundColor: `${Colors.amber}1F` }]}>
              <Ionicons name="flame" size={20} color={Colors.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.streakValue, { color: colors.text }]}>
                {currentStreak} <Text style={[styles.streakUnit, { color: colors.textSecondary }]}>{t.homeStreakDays}</Text>
              </Text>
              <Text style={[styles.streakSub, { color: colors.textMuted }]}>{t.homeStreakBest} · {longestStreak} {t.homeStreakDays}</Text>
            </View>
          </Surface>
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.duration(500).delay(550)} style={styles.quickRow}>
          <QuickAction icon="add" label="Quick log" color={Colors.amber} onPress={handleQuickLog} />
          <View style={{ width: Spacing.sm }} />
          <QuickAction icon="create-outline" label="Details" color={colors.textSecondary} onPress={() => router.push('/log')} />
          <View style={{ width: Spacing.sm }} />
          <QuickAction icon="shield-checkmark" label="Resisted" color={Colors.primary} onPress={() => {
            addLog({ id: `crv_${Date.now()}`, timestamp: new Date().toISOString(), type: 'craving' });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }} />
        </Animated.View>

        {toast && (
          <Animated.View entering={ZoomIn.duration(280)} exiting={FadeOut.duration(280)} style={[styles.toast, { backgroundColor: `${Colors.primary}22` }]}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
            <Text style={styles.toastText}>Logged — no judgment, just tracking</Text>
          </Animated.View>
        )}

        <View style={{ height: 140 }} />
      </Animated.ScrollView>

      {/* Craving CTA */}
      <Animated.View entering={FadeInDown.springify().damping(15).delay(700)} style={styles.fab}>
        <GradientButton label={t.homeCravingBtn} icon="water-outline" gradient="aura" onPress={() => router.push('/delay')} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  greeting: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, letterSpacing: -0.6 },
  companionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  companionEmoji: { fontSize: 14 },
  companionText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', marginVertical: Spacing.md },
  ringNumber: { fontFamily: FontFamily.bold, fontSize: 68, letterSpacing: -2, lineHeight: 74 },
  ringOf: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, marginTop: -2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm, paddingHorizontal: Spacing.sm + 2, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1 },
  statusText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primaryLight },
  cleanRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md },
  cleanText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm },

  nudgeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xs },
  nudgeAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  nudgeEmoji: { fontSize: 24 },
  nudgeText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, lineHeight: FontSize.base * 1.5, flex: 1 },

  grid: { flexDirection: 'row' },

  streakStrip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg },
  streakIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  streakValue: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, letterSpacing: -0.5 },
  streakUnit: { fontFamily: FontFamily.medium, fontSize: FontSize.base },
  streakSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 2 },

  quickRow: { flexDirection: 'row', marginTop: Spacing.md },
  quickAction: { flex: 1, borderWidth: 1.5, borderRadius: Radius.lg, alignItems: 'center', paddingVertical: Spacing.md, gap: 8, backgroundColor: Surfaces.card },
  quickIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs },

  toast: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: Radius.md, padding: Spacing.sm, marginTop: Spacing.md },
  toastText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },

  fab: { position: 'absolute', bottom: 96, left: Spacing.lg, right: Spacing.lg },
});
