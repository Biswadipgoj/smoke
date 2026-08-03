// app/(tabs)/you.tsx — Recovery Capital, Reclaimed, tracks, triggers,
// milestones, settings. Numbers live here, one tap from Today, deliberately
// never on Today itself (master doc §2.3, §5.2).
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useDhruvStore, selectRecoveryCapital, selectCurrentStreakDays } from '../../src/store/useDhruvStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useTheme } from '../../src/hooks/useTheme';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { computeReclaim, estimateSleepHoursReclaimed, formatCurrency } from '../../src/lib/reclaim';
import { computeMilestones } from '../../src/lib/milestones';
import { TrackType } from '../../src/domain/types';

function trackLabel(t: any, track: TrackType): string {
  return track === 'tobacco' ? t.trackTobacco : track === 'alcohol' ? t.trackAlcohol : t.trackPorn;
}

export default function You() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tracks = useDhruvStore((s) => s.tracks);
  const events = useDhruvStore((s) => s.events);
  const urges = useDhruvStore((s) => s.urges);
  const lapses = useDhruvStore((s) => s.lapses);
  const beads = useDhruvStore((s) => s.beads);
  const currency = useDhruvStore((s) => s.profile?.settings.currency ?? '₹');

  const capital = selectRecoveryCapital({ beads, urges, lapses });
  const activeTracks = tracks.filter((tr) => tr.active);

  const reclaimTotals = useMemo(() => {
    let money = 0, hours = 0, sleep = 0;
    for (const track of activeTracks) {
      const r = computeReclaim(track, events);
      money += r.moneyTotal;
      hours += r.hoursTotal;
      sleep += estimateSleepHoursReclaimed(track, events);
    }
    return { money, hours, sleep };
  }, [activeTracks, events]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.youRecoveryCapital}</Text>
            <Text style={[styles.bigNumber, { color: colors.text }]}>{capital.totalDaysFree}</Text>
            <Text style={[styles.bigNumberLabel, { color: colors.textMuted }]}>{t.youTotalDaysFree}</Text>
            <View style={styles.capitalRow}>
              <View style={styles.capitalItem}>
                <Text style={[styles.smallNumber, { color: colors.textSecondary }]}>{capital.urgesSurfed}</Text>
                <Text style={[styles.smallNumberLabel, { color: colors.textMuted }]}>{t.youUrgesSurfed}</Text>
              </View>
              <View style={styles.capitalItem}>
                <Text style={[styles.smallNumber, { color: colors.textSecondary }]}>{capital.returnsAfterLapse}</Text>
                <Text style={[styles.smallNumberLabel, { color: colors.textMuted }]}>{t.youReturnsAfterLapse}</Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.youReclaimedTitle}</Text>
            <View style={styles.reclaimRow}>
              <ReclaimStat label={t.youReclaimedMoney} value={formatCurrency(reclaimTotals.money, currency)} color={colors.text} mutedColor={colors.textMuted} />
              <ReclaimStat label={t.youReclaimedHours} value={Math.round(reclaimTotals.hours).toString()} color={colors.text} mutedColor={colors.textMuted} />
              <ReclaimStat label={t.youReclaimedSleep} value={Math.round(reclaimTotals.sleep).toString()} color={colors.text} mutedColor={colors.textMuted} />
            </View>
          </GlassCard>

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>{t.youTracksTitle}</Text>
            <TouchableOpacity onPress={() => router.push('/add-track')}>
              <Text style={styles.addTrackLink}>{t.youAddTrack}</Text>
            </TouchableOpacity>
          </View>

          {activeTracks.map((track) => {
            const reclaim = computeReclaim(track, events);
            const currentDays = selectCurrentStreakDays(track, lapses);
            const milestones = computeMilestones(track, lapses);
            const achievedCount = milestones.filter((m) => m.achieved).length;
            return (
              <GlassCard key={track.id} style={styles.trackCard}>
                <Text style={[styles.trackName, { color: colors.text }]}>{trackLabel(t, track.type)}</Text>
                <Text style={[styles.trackCurrent, { color: colors.textMuted }]}>{currentDays} {t.youCurrent}</Text>
                <Text style={[styles.trackReclaim, { color: colors.textSecondary }]}>
                  {reclaim.primaryCurrency === 'money'
                    ? formatCurrency(reclaim.moneyTotal, currency)
                    : `${Math.round(reclaim.hoursTotal)} ${t.youReclaimedHours.toLowerCase()}`}
                  {'  ·  '}
                  {t.youYearProjection}: {reclaim.primaryCurrency === 'money' ? formatCurrency(reclaim.yearProjection, currency) : `${Math.round(reclaim.yearProjection)} ${t.youReclaimedHours.toLowerCase()}`}
                </Text>
                <Text style={[styles.trackMilestones, { color: colors.textMuted }]}>{t.youMilestonesTitle}: {achievedCount}/{milestones.length}</Text>
              </GlassCard>
            );
          })}

          <TouchableOpacity style={[styles.settingsRow, { borderColor: colors.hairline }]} onPress={() => router.push('/settings')}>
            <Text style={[styles.settingsText, { color: colors.text }]}>{t.youSettingsTitle}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsRow, { borderColor: colors.hairline }]} onPress={() => router.push('/crisis')}>
            <Text style={[styles.settingsText, { color: colors.text }]}>{t.settingsCrisisResources}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ReclaimStat({ label, value, color, mutedColor }: { label: string; value: string; color: string; mutedColor: string }) {
  return (
    <View style={styles.reclaimStat}>
      <Text style={[styles.reclaimValue, { color }]}>{value}</Text>
      <Text style={[styles.reclaimLabel, { color: mutedColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nishith },
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  section: { marginBottom: Spacing.md, alignItems: 'center' },
  sectionTitle: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  bigNumber: { fontFamily: FontFamily.mono, fontSize: FontSize.display, lineHeight: FontSize.display * 1.1 },
  bigNumberLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, marginBottom: Spacing.md },
  capitalRow: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.sm },
  capitalItem: { alignItems: 'center' },
  smallNumber: { fontFamily: FontFamily.mono, fontSize: FontSize.lg },
  smallNumberLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs },
  reclaimRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  reclaimStat: { alignItems: 'center' },
  reclaimValue: { fontFamily: FontFamily.mono, fontSize: FontSize.lg },
  reclaimLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  sectionHeading: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md },
  addTrackLink: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.bhor },
  trackCard: { gap: 4 },
  trackName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base },
  trackCurrent: { fontFamily: FontFamily.regular, fontSize: FontSize.xs },
  trackReclaim: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, marginTop: 4 },
  trackMilestones: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 2 },
  settingsRow: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.xs },
  settingsText: { fontFamily: FontFamily.medium, fontSize: FontSize.base },
});
