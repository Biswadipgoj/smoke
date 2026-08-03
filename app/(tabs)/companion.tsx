// app/(tabs)/companion.tsx — the Offline Coach (master doc §10, doc 02 §7).
// Scripted, decision-tree based, fully offline. Framed honestly: this is not
// the AI companion of doc 02 — that's deferred to Phase 2. No spinner, no
// dead screen, ever.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useDhruvStore } from '../../src/store/useDhruvStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useTheme } from '../../src/hooks/useTheme';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../../src/constants/theme';
import { CoachCategory, getPathsFor, CoachPath } from '../../src/lib/offlineCoach';
import { haptic } from '../../src/lib/haptics';

const CATEGORY_ORDER: { category: CoachCategory; labelKey: 'companionUrgeHelp' | 'companionHaltCheck' | 'companionAfterLapse' | 'companionDelayTechnique' }[] = [
  { category: 'urge', labelKey: 'companionUrgeHelp' },
  { category: 'halt', labelKey: 'companionHaltCheck' },
  { category: 'lapse', labelKey: 'companionAfterLapse' },
  { category: 'delay', labelKey: 'companionDelayTechnique' },
];

export default function Companion() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tracks = useDhruvStore((s) => s.tracks);
  const activeTrack = tracks.find((tr) => tr.active)?.type;
  const [category, setCategory] = useState<CoachCategory | null>(null);
  const [path, setPath] = useState<CoachPath | null>(null);

  const paths = category ? getPathsFor(category, activeTrack) : [];

  const reset = () => {
    setCategory(null);
    setPath(null);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.title, { color: colors.text }]}>{t.companionTitle}</Text>
          <Text style={[styles.notice, { color: colors.textMuted }]}>{t.companionOfflineNotice}</Text>

          {!category && (
            <View style={styles.categoryGrid}>
              <Text style={[styles.prompt, { color: colors.textSecondary }]}>{t.companionChoosePath}</Text>
              {CATEGORY_ORDER.map(({ category: c, labelKey }) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.categoryCard, { backgroundColor: colors.bgCard, borderColor: colors.hairline }]}
                  onPress={() => {
                    haptic('select');
                    setCategory(c);
                  }}
                >
                  <Text style={[styles.categoryText, { color: colors.text }]}>{t[labelKey]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {category && !path && (
            <View style={styles.categoryGrid}>
              {paths.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.categoryCard, { backgroundColor: colors.bgCard, borderColor: colors.hairline }]}
                  onPress={() => {
                    haptic('select');
                    setPath(p);
                  }}
                >
                  <Text style={[styles.categoryText, { color: colors.text }]}>{p.title}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={reset} style={styles.backLink}>
                <Text style={[styles.backLinkText, { color: colors.textMuted }]}>{t.back}</Text>
              </TouchableOpacity>
            </View>
          )}

          {path && (
            <View style={styles.pathSteps}>
              {path.steps.map((step, i) => (
                <View key={i} style={[styles.stepCard, { backgroundColor: colors.bgCard, borderColor: colors.hairline }]}>
                  <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                </View>
              ))}
              <TouchableOpacity onPress={reset} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>{t.done}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={() => router.push('/crisis')} style={styles.supportLink}>
            <Text style={[styles.supportLinkText, { color: colors.textMuted }]}>{t.todayGetSupport}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nishith },
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xl, marginBottom: Spacing.xs },
  notice: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginBottom: Spacing.lg, lineHeight: FontSize.xs * 1.5 },
  prompt: { fontFamily: FontFamily.regular, fontSize: FontSize.base, marginBottom: Spacing.md },
  categoryGrid: { gap: Spacing.sm },
  categoryCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  categoryText: { fontFamily: FontFamily.medium, fontSize: FontSize.base },
  backLink: { alignItems: 'center', paddingVertical: Spacing.md },
  backLinkText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm },
  pathSteps: { gap: Spacing.md },
  stepCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  stepText: { fontFamily: FontFamily.regular, fontSize: FontSize.base, lineHeight: FontSize.base * 1.5 },
  doneBtn: { backgroundColor: Colors.bhor, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  doneBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.nishith },
  supportLink: { alignItems: 'center', paddingVertical: Spacing.lg },
  supportLinkText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, textDecorationLine: 'underline' },
});
