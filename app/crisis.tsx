// app/crisis.tsx — Get support now. Deterministic, offline, locale- and
// time-aware (master doc §15.6, doc 02 §6.3). Never gated behind the AI
// companion, which doesn't exist in V1 anyway.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { getCrisisResources, CrisisCountry } from '../src/lib/crisis';

export default function CrisisScreen() {
  const { t, locale } = useTranslation();
  // No reliable offline country signal — default by locale as a rough proxy,
  // and let the user switch explicitly rather than silently guessing wrong.
  const [country, setCountry] = useState<CrisisCountry>(locale === 'bn' ? 'BD' : 'IN');
  const resources = getCrisisResources(country);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>{t.crisisTitle}</Text>
        <Text style={styles.subtitle}>{t.crisisSubtitle}</Text>

        <View style={styles.countryRow}>
          {(['IN', 'BD'] as CrisisCountry[]).map((c) => (
            <TouchableOpacity key={c} style={[styles.countryChip, country === c && styles.countryChipActive]} onPress={() => setCountry(c)}>
              <Text style={[styles.countryChipText, country === c && styles.countryChipTextActive]}>{c === 'IN' ? 'India' : 'Bangladesh'}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.countryChip, country === 'unknown' && styles.countryChipActive]} onPress={() => setCountry('unknown')}>
            <Text style={[styles.countryChipText, country === 'unknown' && styles.countryChipTextActive]}>{t.crisisFindHelpline}</Text>
          </TouchableOpacity>
        </View>

        {resources.map((r, i) => (
          <View key={i} style={styles.resourceCard}>
            <Text style={styles.resourceName}>{r.name}</Text>
            {r.phone ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${r.phone.replace(/[^0-9+]/g, '')}`)}>
                <Text style={styles.resourcePhone}>{r.phone}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => Linking.openURL('https://findahelpline.com')}>
                <Text style={styles.resourcePhone}>findahelpline.com</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.resourceNote}>{r.note}</Text>
          </View>
        ))}

        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{t.back}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nishith },
  content: { padding: Spacing.lg, flex: 1 },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xl, color: Colors.bone, marginBottom: Spacing.xs },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.boneSecondary, marginBottom: Spacing.lg },
  countryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  countryChip: { borderWidth: 1, borderColor: Colors.nilElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
  countryChipActive: { borderColor: Colors.bhor, backgroundColor: Colors.bhorSoft },
  countryChipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.boneSecondary },
  countryChipTextActive: { color: Colors.bhor },
  resourceCard: { backgroundColor: Colors.nil, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  resourceName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.bone },
  resourcePhone: { fontFamily: FontFamily.mono, fontSize: FontSize.lg, color: Colors.jal, marginTop: Spacing.xs },
  resourceNote: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.boneMuted, marginTop: Spacing.xs },
  backBtn: { alignItems: 'center', marginTop: Spacing.md },
  backBtnText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.boneMuted },
});
