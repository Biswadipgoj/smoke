// src/components/ui/SectionHeader.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { FontFamily, FontSize, Spacing } from '../../constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export function SectionHeader({ title, icon, accent }: { title: string; icon?: IconName; accent?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {icon ? <Ionicons name={icon} size={16} color={accent ?? colors.textSecondary} /> : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, letterSpacing: 0.2 },
});
