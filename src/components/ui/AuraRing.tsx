// src/components/ui/AuraRing.tsx
// The app's signature hero. A concentric aura that breathes softly and draws a
// gradient progress arc for the day's reduction — the emotional centrepiece the
// eye lands on first. SVG + Reanimated, no native gradient dependency.
import React, { useEffect, useId } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Gradients } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AuraRingProps {
  size?: number;
  /** 0..1 progress the arc fills to. */
  fraction: number;
  colors?: readonly string[];
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function AuraRing({ size = 260, fraction, colors = Gradients.aura, strokeWidth = 16, children }: AuraRingProps) {
  const gid = useId().replace(/:/g, '');
  const rid = `${gid}r`;
  const r = size / 2 - strokeWidth - 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;

  const progress = useSharedValue(0);
  const breath = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(Math.min(1, Math.max(0, fraction)), { damping: 18, stiffness: 90 });
  }, [fraction]);

  useEffect(() => {
    breath.value = withRepeat(withTiming(1, { duration: 3800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + breath.value * 0.12 }],
    opacity: 0.35 + breath.value * 0.28,
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {/* breathing core glow */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          { width: size * 0.66, height: size * 0.66, borderRadius: size, backgroundColor: colors[0] },
        ]}
      />

      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            {colors.map((col, i) => (
              <Stop key={i} offset={i / (colors.length - 1)} stopColor={col} />
            ))}
          </LinearGradient>
          <RadialGradient id={rid} cx="50%" cy="45%" rx="55%" ry="55%">
            <Stop offset="0" stopColor={colors[1] ?? colors[0]} stopOpacity={0.16} />
            <Stop offset="1" stopColor={colors[1] ?? colors[0]} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* inner depth wash */}
        <Circle cx={c} cy={c} r={r - strokeWidth / 2} fill={`url(#${rid})`} />
        {/* track */}
        <Circle cx={c} cy={c} r={r} stroke="rgba(148,169,184,0.14)" strokeWidth={strokeWidth} fill="none" />
        {/* progress arc */}
        <AnimatedCircle
          cx={c}
          cy={c}
          r={r}
          stroke={`url(#${gid})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={arcProps}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>

      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
