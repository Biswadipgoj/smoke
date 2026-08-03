// src/components/ui/Surface.tsx
// A refined card surface: translucent fill over the living background, a crisp
// hairline border, and soft depth. The everyday container across the app.
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Spacing, Surfaces, Elevation } from '../../constants/theme';

interface SurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  radius?: number;
  raised?: boolean;
  /** Tint the border with an accent for emphasis cards. */
  accent?: string;
  floating?: boolean;
}

export function Surface({ children, style, padding = Spacing.lg, radius = Radius.xl, raised = false, accent, floating = false }: SurfaceProps) {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: isDark ? (raised ? Surfaces.raised : Surfaces.card) : Surfaces.cardLight,
          borderColor: accent ? `${accent}55` : isDark ? Surfaces.hairline : Surfaces.hairlineLight,
          borderWidth: StyleSheet.hairlineWidth * (accent ? 3 : 2),
          borderRadius: radius,
          padding,
        },
        floating ? Elevation.float : Elevation.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}
