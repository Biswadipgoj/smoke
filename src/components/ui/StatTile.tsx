// src/components/ui/StatTile.tsx
// A compact metric tile with a vector icon in an accent chip, a large value,
// and a caption. Reads as one confident unit — the backbone of the "story" grids.
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { FontFamily, FontSize, Spacing } from '../../constants/theme';
import { Surface } from './Surface';

type IconName = keyof typeof Ionicons.glyphMap;

interface StatTileProps {
  icon: IconName;
  value: string;
  unit?: string;
  title: string;
  caption?: string;
  accent: string;
  style?: StyleProp<ViewStyle>;
}

export function StatTile({ icon, value, unit, title, caption, accent, style }: StatTileProps) {
  const { colors } = useTheme();
  return (
    <Surface style={[styles.tile, style]} padding={Spacing.md}>
      <View style={[styles.iconChip, { backgroundColor: `${accent}20` }]}>
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1}>{title}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {unit ? <Text style={[styles.unit, { color: accent }]}>{unit}</Text> : null}
      </View>
      {caption ? <Text style={[styles.caption, { color: colors.textMuted }]} numberOfLines={2}>{caption}</Text> : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1 },
  iconChip: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  title: { fontFamily: FontFamily.medium, fontSize: FontSize.xs },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 4, marginBottom: 3 },
  value: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, letterSpacing: -0.5 },
  unit: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm },
  caption: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, lineHeight: FontSize.xs * 1.4 },
});
