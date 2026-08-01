// app/(tabs)/achievements.tsx — Milestones + Streak display
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useAppStore, computeCurrentStreak, computeLongestStreak } from '../../src/store/useAppStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useTheme } from '../../src/hooks/useTheme';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';

interface AchievementDef {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_log', icon: '📝', titleKey: 'achievementFirstLog', descKey: 'achievementFirstLogDesc' },
  { id: 'first_delay', icon: '⏱️', titleKey: 'achievementFirstDelay', descKey: 'achievementFirstDelayDesc' },
  { id: '5_delays', icon: '🎯', titleKey: 'achievement5Delays', descKey: 'achievement5DelaysDesc' },
  { id: 'one_week_free', icon: '🌱', titleKey: 'achievementOneWeekFree', descKey: 'achievementOneWeekFreeDesc' },
  { id: '7_day_streak', icon: '🔥', titleKey: 'achievement7DayStreak', descKey: 'achievement7DayStreakDesc' },
  { id: '100_saved', icon: '💰', titleKey: 'achievement100Saved', descKey: 'achievement100SavedDesc' },
  { id: '30_day_streak', icon: '🏆', titleKey: 'achievement30DayStreak', descKey: 'achievement30DayStreakDesc' },
];

function AchievementCard({
  def,
  earned,
  earnedAt,
}: {
  def: AchievementDef;
  earned: boolean;
  earnedAt?: string;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (earned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [earned]);

  const title = (t as any)[def.titleKey] as string;
  const desc = (t as any)[def.descKey] as string;

  return (
    <Animated.View
      style={[
        styles.achieveCard,
        {
          backgroundColor: earned ? `${Colors.primary}15` : colors.bgCard,
          borderColor: earned ? Colors.primary : colors.glassBorder,
          opacity: earned ? glowAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.9, 1] }) : 0.5,
        },
      ]}
    >
      <View style={[styles.achieveIconBox, { backgroundColor: earned ? `${Colors.primary}25` : colors.bgElevated }]}>
        <Text style={styles.achieveIcon}>{def.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.achieveTitle, { color: earned ? Colors.primary : colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.achieveDesc, { color: colors.textSecondary }]}>{desc}</Text>
        {earned && earnedAt && (
          <Text style={styles.earnedDate}>
            {t.achievementEarned} · {new Date(earnedAt).toLocaleDateString()}
          </Text>
        )}
        {!earned && (
          <Text style={[styles.upcomingLabel, { color: colors.textMuted }]}>{t.achievementUpcoming}</Text>
        )}
      </View>
      {earned && <Text style={styles.checkIcon}>✓</Text>}
    </Animated.View>
  );
}

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const logs = useAppStore((s) => s.logs);
  const earnedAchievements = useAppStore((s) => s.earnedAchievements);
  const delaySessions = useAppStore((s) => s.delaySessions);
  const profile = useAppStore((s) => s.profile);

  const currentStreak = computeCurrentStreak(logs);
  const longestStreak = computeLongestStreak(logs);

  const daysSinceStart = profile
    ? Math.max(0, Math.floor((Date.now() - new Date(profile.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const totalSmokeFreeThisMonth = (() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    let freeCount = 0;
    for (let i = 0; i < startOfMonth.getDate(); i++) {
      const day = new Date(startOfMonth);
      day.setDate(day.getDate() + i);
      const hasCig = logs.some((l) => {
        if (l.type !== 'cigarette') return false;
        const ld = new Date(l.timestamp);
        ld.setHours(0, 0, 0, 0);
        return ld.getTime() === day.getTime();
      });
      if (!hasCig) freeCount++;
    }
    return freeCount;
  })();

  const earnedMap = new Map(earnedAchievements.map((a) => [a.id, a.earnedAt]));

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t.achievementsTitle}</Text>

        {/* Streak Display */}
        <GlassCard style={styles.streakCard} elevated>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
                {t.homeStreakCurrent}
              </Text>
              <Text style={[styles.streakUnit, { color: colors.textMuted }]}>{t.homeStreakDays}</Text>
            </View>
            <View style={[styles.streakDivider, { backgroundColor: colors.glassBorder }]} />
            <View style={styles.streakItem}>
              <Text style={[styles.streakNumber, { color: Colors.gold }]}>{longestStreak}</Text>
              <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
                {t.homeStreakBest}
              </Text>
              <Text style={[styles.streakUnit, { color: colors.textMuted }]}>{t.homeStreakDays}</Text>
            </View>
            <View style={[styles.streakDivider, { backgroundColor: colors.glassBorder }]} />
            <View style={styles.streakItem}>
              <Text style={styles.streakNumber}>{totalSmokeFreeThisMonth}</Text>
              <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
                Free this month
              </Text>
              <Text style={[styles.streakUnit, { color: colors.textMuted }]}>{t.homeStreakDays}</Text>
            </View>
          </View>
          <Text style={[styles.streakNote, { color: colors.textMuted }]}>
            Your best streak and monthly total never reset. 💙
          </Text>
        </GlassCard>

        {/* Achievement list */}
        <View style={styles.achieveList}>
          {ACHIEVEMENTS.map((def) => {
            const earned = earnedMap.has(def.id);
            return (
              <AchievementCard
                key={def.id}
                def={def}
                earned={earned}
                earnedAt={earned ? earnedMap.get(def.id) : undefined}
              />
            );
          })}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  pageTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, marginBottom: Spacing.lg },

  streakCard: { marginBottom: Spacing.xl },
  streakRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
  streakItem: { alignItems: 'center', flex: 1 },
  streakNumber: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.primary },
  streakLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, marginTop: 4, textAlign: 'center' },
  streakUnit: { fontFamily: FontFamily.regular, fontSize: FontSize.xs },
  streakDivider: { width: 1, marginHorizontal: Spacing.sm },
  streakNote: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, textAlign: 'center', lineHeight: FontSize.xs * 1.6 },

  achieveList: { gap: Spacing.sm },
  achieveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
  },
  achieveIconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  achieveIcon: { fontSize: 24 },
  achieveTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, marginBottom: 2 },
  achieveDesc: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, lineHeight: FontSize.sm * 1.55 },
  earnedDate: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primary, marginTop: 4 },
  upcomingLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 4 },
  checkIcon: { color: Colors.primary, fontFamily: FontFamily.bold, fontSize: FontSize.lg },
});
