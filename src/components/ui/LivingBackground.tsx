// src/components/ui/LivingBackground.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The Living Home. A full-bleed gradient canvas that quietly changes with the
// time of day — fresh at dawn, clear at midday, warm in the evening, deep at
// night. A soft aurora glow drifts behind the hero content so the app always
// feels alive rather than static. Pure SVG, no native gradient dependency.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop, Ellipse } from 'react-native-svg';
import { Atmosphere, getAtmosphere } from '../../constants/theme';

interface LivingBackgroundProps {
  atmosphere?: Atmosphere;
  /** Fade the glow when the user prefers a calmer, flatter surface. */
  subdued?: boolean;
}

export function LivingBackground({ atmosphere, subdued = false }: LivingBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const atmo = atmosphere ?? getAtmosphere();
  const [top, mid, bottom] = atmo.gradient;

  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      width={width}
      height={height}
    >
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="0.55" stopColor={mid} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
        <RadialGradient id="glow" cx="50%" cy="22%" rx="75%" ry="45%">
          <Stop offset="0" stopColor={atmo.glow} stopOpacity={subdued ? 0.25 : 1} />
          <Stop offset="1" stopColor={atmo.glow} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Rect x="0" y="0" width={width} height={height} fill="url(#sky)" />
      <Ellipse cx={width * 0.5} cy={height * 0.2} rx={width * 0.85} ry={height * 0.35} fill="url(#glow)" />
    </Svg>
  );
}
