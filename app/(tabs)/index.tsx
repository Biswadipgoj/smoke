// app/(tabs)/index.tsx — Today
// Tonight's state, the Thread, the urge action, today's check-in, one
// companion prompt. No number on this screen (master doc §2.3).
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useDhruvStore } from '../../src/store/useDhruvStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useTheme } from '../../src/hooks/useTheme';
import { Colors, FontFamily, FontSize, Spacing, Radius, getDayPhase } from '../../src/constants/theme';
import { Backdrop } from '../../src/components/ui/Backdrop';
import { Thread } from '../../src/components/motion/Thread';
import { haptic } from '../../src/lib/haptics';
import { registerUrgeQuickAction } from '../../src/lib/quickActions';

export default function Today() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const beads = useDhruvStore((s) => s.beads);
  const tracks = useDhruvStore((s) => s.tracks);
  const checkIns = useDhruvStore((s) => s.checkIns);

  const greeting = useMemo(() => {
    const phase = getDayPhase();
    if (phase === 'dawn' || phase === 'morning') return t.todayGreetingMorning;
    if (phase === 'afternoon') return t.todayGreetingAfternoon;
    if (phase === 'evening') return t.todayGreetingEvening;
    return t.todayGreetingNight;
  }, [t]);

  const hasCheckedInToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return checkIns.some((c) => c.date === today);
  }, [checkIns]);

  const activeTracks = tracks.filter((tr) => tr.active);

  React.useEffect(() => {
    registerUrgeQuickAction(t.todayUrgeButton);
  }, [t.todayUrgeButton]);

  const openUrge = async () => {
    await haptic('begin');
    router.push({ pathname: '/urge', params: activeTracks.length === 1 ? { track: activeTracks[0].type } : undefined });
  };

  return (
    <View style={styles.root}>
      <Backdrop />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text>

          <View style={styles.threadContainer}>
            {beads.length === 0 ? (
              <Text style={[styles.emptyLabel, { color: colors.textMuted }]}>{t.todayThreadEmpty}</Text>
            ) : null}
            <Thread beads={beads} />
          </View>

          <TouchableOpacity onPress={openUrge} activeOpacity={0.85} style={[styles.urgeButton, { backgroundColor: Colors.jal }]}>
            <Text style={styles.urgeButtonText}>{t.todayUrgeButton}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/checkin')}
            style={[styles.checkinCard, { backgroundColor: colors.bgCard, borderColor: colors.hairline }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.checkinText, { color: colors.text }]}>
              {hasCheckedInToday ? t.todayNoUrgesToday : t.todayCheckinPrompt}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(tabs)/companion')} style={styles.coachTeaser}>
            <Text style={[styles.coachTeaserText, { color: colors.textSecondary }]}>{t.todayCoachTeaser}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/crisis')} style={styles.supportLink}>
            <Text style={[styles.supportLinkText, { color: colors.textMuted }]}>{t.todayGetSupport}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  greeting: { fontFamily: FontFamily.regular, fontSize: FontSize.base, textAlign: 'center', marginBottom: Spacing.md },
  threadContainer: { flex: 1, minHeight: 280, marginBottom: Spacing.lg },
  emptyLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, textAlign: 'center', marginTop: Spacing.xl },
  urgeButton: { borderRadius: Radius.full, paddingVertical: Spacing.md + 2, alignItems: 'center', marginBottom: Spacing.md },
  urgeButtonText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.nishith },
  checkinCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
  checkinText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, textAlign: 'center' },
  coachTeaser: { alignItems: 'center', paddingVertical: Spacing.xs },
  coachTeaserText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm },
  supportLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  supportLinkText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, textDecorationLine: 'underline' },
});
