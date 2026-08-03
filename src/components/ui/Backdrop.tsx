// src/components/ui/Backdrop.tsx
// A quiet, dark-first canvas. Restraint is the signature (doc 01 §1.1.5) —
// no time-of-day mood engine, just the base surface and a faint presence glow.
import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, Ellipse } from 'react-native-svg';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export function Backdrop({ glow = true }: { glow?: boolean }) {
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useTheme();

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        <RadialGradient id="presence" cx="50%" cy="18%" rx="70%" ry="40%">
          <Stop offset="0" stopColor={Colors.bhor} stopOpacity={isDark ? 0.07 : 0.05} />
          <Stop offset="1" stopColor={Colors.bhor} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={colors.bg} />
      {glow && <Ellipse cx={width * 0.5} cy={height * 0.16} rx={width * 0.8} ry={height * 0.3} fill="url(#presence)" />}
    </Svg>
  );
}
