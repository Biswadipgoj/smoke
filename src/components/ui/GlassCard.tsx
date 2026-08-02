// src/components/ui/GlassCard.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Radius, Spacing } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  elevated?: boolean;
}

export function GlassCard({ children, style, padding = Spacing.md, elevated = false }: GlassCardProps) {
  const { isDark, colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated
            ? isDark ? Colors.bgDarkElevated : Colors.bgLightElevated
            : colors.bgCard,
          borderColor: colors.glassBorder,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
