// app/(tabs)/progress.tsx — Health Recovery Timeline + Intervals + Patterns (v3: Reanimated)
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Animated, { FadeInDown, SlideInRight, Layout, FadeIn } from 'react-native-reanimated';
import { useAppStore, getHealthMilestones, computeMoneySaved } from '../../src/store/useAppStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useTheme } from '../../src/hooks/useTheme';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { LivingBackground } from '../../src/components/ui/LivingBackground';
import { TranslationKeys } from '../../src/constants/translations';
import { cigsAvoided, cleanBreathingMinutes, lifeMinutesRegained, humanizeMinutes } from '../../src/lib/narrative';

type MilestoneId = keyof Pick<TranslationKeys,
  'milestone20min' | 'milestone12hr' | 'milestone24hr' | 'milestone48hr' |
  'milestone1week' | 'milestone1month' | 'milestone3months' | 'milestone6months' |
  'milestone1year' | 'milestone5years' | 'milestone10years'>;

type MilestoneDescId = keyof Pick<TranslationKeys,
  'milestone20minDesc' | 'milestone12hrDesc' | 'milestone24hrDesc' | 'milestone48hrDesc' |
  'milestone1weekDesc' | 'milestone1monthDesc' | 'milestone3monthsDesc' | 'milestone6monthsDesc' |
  'milestone1yearDesc' | 'milestone5yearsDesc' | 'milestone10yearsDesc'>;

const MILESTONE_MAP: Array<{ id: string; titleKey: MilestoneId; descKey: MilestoneDescId; icon: string }> = [
  { id: 'milestone20min', titleKey: 'milestone20min', descKey: 'milestone20minDesc', icon: '❤️' },
  { id: 'milestone12hr', titleKey: 'milestone12hr', descKey: 'milestone12hrDesc', icon: '💨' },
  { id: 'milestone24hr', titleKey: 'milestone24hr', descKey: 'milestone24hrDesc', icon: '🫀' },
  { id: 'milestone48hr', titleKey: 'milestone48hr', descKey: 'milestone48hrDesc', icon: '👃' },
  { id: 'milestone1week', titleKey: 'milestone1week', descKey: 'milestone1weekDesc', icon: '🫁' },
  { id: 'milestone1month', titleKey: 'milestone1month', descKey: 'milestone1monthDesc', icon: '🌱' },
  { id: 'milestone3months', titleKey: 'milestone3months', descKey: 'milestone3monthsDesc', icon: '🌿' },
  { id: 'milestone6months', titleKey: 'milestone6months', descKey: 'milestone6monthsDesc', icon: '⚡' },
  { id: 'milestone1year', titleKey: 'milestone1year', descKey: 'milestone1yearDesc', icon: '🏆' },
  { id: 'milestone5years', titleKey: 'milestone5years', descKey: 'milestone5yearsDesc', icon: '🌳' },
  { id: 'milestone10years', titleKey: 'milestone10years', descKey: 'milestone10yearsDesc', icon: '✨' },
];

function formatTimeRemaining(minutes: number): string {
  if (minutes < 60) return `${Math.ceil(minutes)}m`;
  if (minutes < 60 * 24) return `${Math.ceil(minutes / 60)}h`;
  if (minutes < 60 * 24 * 30) return `${Math.ceil(minutes / (60 * 24))}d`;
  return `${Math.ceil(minutes / (60 * 24 * 30))}mo`;
}

function formatIntervalStr(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}h ${m}m` : `${h} hr`;
}

export default function ProgressScreen() {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const profile = useAppStore((s) => s.profile);
  const logs = useAppStore((s) => s.logs);
  const delaySessions = useAppStore((s) => s.delaySessions);

  const lastCig = useMemo(() => {
    const cigs = logs.filter((l) => l.type === 'cigarette').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return cigs[0] ? new Date(cigs[0].timestamp) : null;
  }, [logs]);

  const milestones = useMemo(() => getHealthMilestones(lastCig), [lastCig]);

  const money = useMemo(() => (profile ? computeMoneySaved(logs, profile) : { today: 0, total: 0, projected: 0 }), [logs, profile]);
  const daysSinceStart = profile ? Math.max(1, Math.floor((Date.now() - new Date(profile.startDate).getTime()) / 86400000)) : 1;
  const cigsTotal = logs.filter((l) => l.type === 'cigarette').length;
  const avgPerDay = daysSinceStart > 0 ? (cigsTotal / daysSinceStart).toFixed(1) : '0';

  // Overall Interval Trend Calculation
  const intervalStats = useMemo(() => {
    const cigs = logs.filter((l) => l.type === 'cigarette').sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (cigs.length < 2) return null;
    
    let totalMin = 0;
    let longestMin = 0;
    for (let i = 1; i < cigs.length; i++) {
      const diff = (new Date(cigs[i].timestamp).getTime() - new Date(cigs[i - 1].timestamp).getTime()) / 60000;
      totalMin += diff;
      if (diff > longestMin) longestMin = diff;
    }
    const avgMin = totalMin / (cigs.length - 1);
    return { avgMin, longestMin };
  }, [logs]);

  // Context tag breakdown
  const tagCounts: Record<string, number> = {};
  logs.forEach((l) => { if (l.contextTag) tagCounts[l.contextTag] = (tagCounts[l.contextTag] ?? 0) + 1; });
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Narrative figures
  const avoided = profile ? cigsAvoided(profile.dailyBaseline, profile.startDate, cigsTotal) : 0;
  const cleanMin = cleanBreathingMinutes(avoided);
  const lifeMin = lifeMinutesRegained(avoided);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      {isDark && <LivingBackground subdued />}
      <Animated.ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeIn.duration(300)} style={[styles.pageTitle, { color: colors.text }]}>
          {t.progressTitle}
        </Animated.Text>

        {/* Narrative hero — data as story */}
        <Animated.View entering={FadeInDown.duration(500).delay(50)}>
          <GlassCard style={styles.narrativeCard} elevated>
            <View style={styles.narrativeRow}>
              <View style={styles.narrativeItem}>
                <Text style={[styles.narrativeValue, { color: Colors.primary }]}>{avoided}</Text>
                <Text style={[styles.narrativeLabel, { color: colors.textSecondary }]}>{t.homeAvoidedCaption}</Text>
              </View>
              <View style={[styles.narrativeDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.narrativeItem}>
                <Text style={[styles.narrativeValue, { color: Colors.sky }]}>{humanizeMinutes(cleanMin)}{cleanMin < 60 ? ` ${t.unitMin}` : ''}</Text>
                <Text style={[styles.narrativeLabel, { color: colors.textSecondary }]}>{t.homeCleanAirCaption}</Text>
              </View>
              <View style={[styles.narrativeDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.narrativeItem}>
                <Text style={[styles.narrativeValue, { color: Colors.rose }]}>{humanizeMinutes(lifeMin)}{lifeMin < 60 ? ` ${t.unitMin}` : ''}</Text>
                <Text style={[styles.narrativeLabel, { color: colors.textSecondary }]}>{t.homeLifeCaption}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Money Saved */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.progressMoneyTitle}</Text>
          <GlassCard style={styles.moneyCard} elevated>
            <View style={styles.moneyRow}>
              <View style={styles.moneyItem}>
                <Text style={styles.moneyAmount}>{profile?.currency ?? '₹'}{money.total.toFixed(0)}</Text>
                <Text style={[styles.moneyLabel, { color: colors.textSecondary }]}>{t.progressMoneySaved}</Text>
              </View>
              <View style={styles.moneySeparator} />
              <View style={styles.moneyItem}>
                <Text style={[styles.moneyProjected, { color: colors.textSecondary }]}>
                  {profile?.currency ?? '₹'}{money.projected.toFixed(0)}
                </Text>
                <Text style={[styles.moneyLabel, { color: colors.textMuted }]}>{t.progressMoneyProjected}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.statsRow}>
          <GlassCard style={[styles.statCard, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.statNumber}>{avgPerDay}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.progressCigsPerDay}</Text>
          </GlassCard>
          <GlassCard style={[styles.statCard, { flex: 1, marginHorizontal: Spacing.xs }]}>
            <Text style={styles.statNumber}>{daysSinceStart}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.progressDaysTracked}</Text>
          </GlassCard>
          <GlassCard style={[styles.statCard, { flex: 1, marginLeft: Spacing.sm }]}>
            <Text style={styles.statNumber}>{delaySessions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.progressFreeTime}</Text>
          </GlassCard>
        </Animated.View>

        {/* Interval Trends */}
        {intervalStats && (
          <Animated.View entering={FadeInDown.duration(500).delay(300)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interval Trends</Text>
            <GlassCard elevated>
              <View style={styles.intervalTrendRow}>
                <View style={styles.intervalTrendItem}>
                  <Text style={[styles.intervalTrendVal, { color: Colors.primary }]}>{formatIntervalStr(intervalStats.avgMin)}</Text>
                  <Text style={[styles.intervalTrendLabel, { color: colors.textSecondary }]}>Average Gap</Text>
                </View>
                <View style={styles.intervalTrendItem}>
                  <Text style={[styles.intervalTrendVal, { color: Colors.gold }]}>{formatIntervalStr(intervalStats.longestMin)}</Text>
                  <Text style={[styles.intervalTrendLabel, { color: colors.textSecondary }]}>Longest Gap</Text>
                </View>
              </View>
              <Text style={[styles.intervalTrendHint, { color: colors.textMuted }]}>
                Stretching your average gap is the most effective way to organically reduce your baseline.
              </Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* Top triggers */}
        {topTags.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(400)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.progressPatternsTitle}</Text>
            <GlassCard>
              {topTags.map(([tag, count], i) => (
                <View key={tag} style={[styles.tagRow, i < topTags.length - 1 && styles.tagRowBorder]}>
                  <Text style={[styles.tagName, { color: colors.text }]}>{tag}</Text>
                  <View style={styles.tagBar}>
                    <Animated.View
                      entering={SlideInRight.springify().damping(15).delay(500 + i * 100)}
                      layout={Layout.springify()}
                      style={[styles.tagBarFill, { width: `${Math.round((count / cigsTotal) * 100)}%` as any }]}
                    />
                  </View>
                  <Text style={[styles.tagCount, { color: colors.textSecondary }]}>{count}</Text>
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        )}

        {/* Health Timeline */}
        <Animated.Text entering={FadeInDown.duration(500).delay(500)} style={[styles.sectionTitle, { color: colors.text }]}>
          {t.progressHealthTitle}
        </Animated.Text>
        
        {milestones.map((ms, i) => {
          const info = MILESTONE_MAP[i];
          if (!info) return null;
          return (
            <Animated.View 
              key={ms.id} 
              entering={FadeInDown.duration(500).delay(600 + i * 50)}
              style={[styles.milestoneRow, { opacity: ms.achieved ? 1 : 0.6 }]}
            >
              <View style={styles.timelineCol}>
                <View style={[styles.timelineDot, ms.achieved && styles.timelineDotActive]} />
                {i < milestones.length - 1 && <View style={[styles.timelineLine, ms.achieved && styles.timelineLineActive]} />}
              </View>
              <GlassCard style={[styles.milestoneCard, ms.achieved && styles.milestoneCardAchieved]}>
                <View style={styles.milestoneHeader}>
                  <Text style={styles.milestoneIcon}>{info.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.milestoneTitle, { color: colors.text }]}>{t[info.titleKey]}</Text>
                    {ms.achieved ? (
                      <Text style={styles.achievedBadge}>{t.progressAchieved} ✓</Text>
                    ) : (
                      <Text style={[styles.upcomingText, { color: colors.textMuted }]}>{t.progressUpcoming} · {formatTimeRemaining(ms.minutesRemaining)}</Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.milestoneDesc, { color: colors.textSecondary }]}>{t[info.descKey]}</Text>
              </GlassCard>
            </Animated.View>
          );
        })}

        <View style={{ height: Spacing.xxl }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  pageTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, marginBottom: Spacing.lg },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, marginBottom: Spacing.md, marginTop: Spacing.lg },

  narrativeCard: { marginBottom: Spacing.xs },
  narrativeRow: { flexDirection: 'row', alignItems: 'center' },
  narrativeItem: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  narrativeValue: { fontFamily: FontFamily.bold, fontSize: FontSize.lg },
  narrativeLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, textAlign: 'center', marginTop: 4, lineHeight: FontSize.xs * 1.35 },
  narrativeDivider: { width: 1, height: 44, marginHorizontal: Spacing.xs },

  moneyCard: { marginBottom: Spacing.md },
  moneyRow: { flexDirection: 'row', alignItems: 'center' },
  moneyItem: { flex: 1, alignItems: 'center' },
  moneySeparator: { width: 1, height: 40, backgroundColor: Colors.bgDarkElevated },
  moneyAmount: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.gold },
  moneyProjected: { fontFamily: FontFamily.bold, fontSize: FontSize.xl },
  moneyLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 4 },

  statsRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  statCard: { alignItems: 'center', paddingVertical: Spacing.md },
  statNumber: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.primary },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 4, textAlign: 'center' },

  intervalTrendRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  intervalTrendItem: { alignItems: 'center' },
  intervalTrendVal: { fontFamily: FontFamily.bold, fontSize: FontSize.xl },
  intervalTrendLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, marginTop: 2 },
  intervalTrendHint: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing.sm, fontStyle: 'italic' },

  tagRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  tagRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.bgDarkElevated },
  tagName: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, width: 70, textTransform: 'capitalize' },
  tagBar: { flex: 1, height: 6, backgroundColor: Colors.bgDarkElevated, borderRadius: 3, overflow: 'hidden' },
  tagBarFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  tagCount: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, width: 24, textAlign: 'right' },

  milestoneRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  timelineCol: { alignItems: 'center', width: 20 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.bgDarkElevated, backgroundColor: Colors.bgDark, marginTop: Spacing.md, zIndex: 2 },
  timelineDotActive: { borderColor: Colors.primary, backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 6 },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.bgDarkElevated, marginVertical: -4, zIndex: 1 },
  timelineLineActive: { backgroundColor: Colors.primary },
  milestoneCard: { flex: 1 },
  milestoneCardAchieved: { borderColor: `${Colors.primary}44`, backgroundColor: `${Colors.primary}08` },
  milestoneHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.xs },
  milestoneIcon: { fontSize: 20, marginTop: 2 },
  milestoneTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base },
  achievedBadge: { fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.primary, marginTop: 2 },
  upcomingText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 2 },
  milestoneDesc: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, lineHeight: FontSize.sm * 1.55 },
});
