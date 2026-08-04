// src/components/motion/Tide.tsx
// TIDE — the urge, made visible. Doc 01 §4.2. Never shifts toward red/amber
// at high intensity: a 9/10 and a 3/10 urge are the same colour, only the
// height differs. Simplified two-wave Canvas-equivalent using SVG paths
// driven by Reanimated on the UI thread — holds 60fps on mid-range devices
// because both waves are cheap sine approximations over a handful of points.
import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withRepeat, withTiming, withSpring, Easing, cancelAnimation,
} from 'react-native-reanimated';
import { Colors, MotionDuration, MotionSpring } from '../../constants/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface TideProps {
  /** Current intensity, 1-10. Parent owns drift/re-rate logic and updates this. */
  intensity: number;
  height?: number;
  simplified?: boolean; // low-end device tier — one wave, 2-stop gradient
}

function wavePath(width: number, baseY: number, amplitude: number, phase: number, frequency: number): string {
  // Runs inside useAnimatedProps, i.e. on the UI thread — without this
  // directive Reanimated throws "tried to call a non-worklet function on the
  // UI thread" the moment the urge screen mounts.
  'worklet';
  const points = 24;
  let d = `M0,${baseY}`;
  for (let i = 0; i <= points; i++) {
    const x = (width * i) / points;
    const y = baseY + Math.sin((i / points) * Math.PI * 2 * frequency + phase) * amplitude;
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  d += ` L${width},${baseY + 400} L0,${baseY + 400} Z`;
  return d;
}

export function Tide({ intensity, height = 420, simplified = false }: TideProps) {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const levelPct = useSharedValue(intensity / 10);
  const phase1 = useSharedValue(0);
  const phase2 = useSharedValue(0);

  useEffect(() => {
    // Rising uses `deliberate`, falling uses `ceremonial` — slow enough to be
    // watched, which is the therapeutic point (doc 01 §4.2).
    const target = Math.max(0, Math.min(1, intensity / 10));
    const rising = target > levelPct.value;
    levelPct.value = withTiming(target, {
      duration: rising ? MotionDuration.deliberate : MotionDuration.ceremonial,
      easing: Easing.out(Easing.cubic),
    });
  }, [intensity]);

  useEffect(() => {
    if (reducedMotion) return;
    phase1.value = withRepeat(withTiming(Math.PI * 2, { duration: 6000, easing: Easing.linear }), -1, false);
    if (!simplified) {
      phase2.value = withRepeat(withTiming(Math.PI * 2, { duration: 9000, easing: Easing.linear }), -1, false);
    }
    return () => {
      cancelAnimation(phase1);
      cancelAnimation(phase2);
    };
  }, [reducedMotion, simplified]);

  const wave1Props = useAnimatedProps(() => {
    const baseY = height * (1 - levelPct.value);
    return { d: wavePath(width, baseY, reducedMotion ? 0 : 6, phase1.value, 1.3) };
  });

  const wave2Props = useAnimatedProps(() => {
    const baseY = height * (1 - levelPct.value);
    return { d: wavePath(width, baseY, reducedMotion ? 0 : 4, phase2.value + 1.2, 0.8) };
  });

  const rectProps = useAnimatedProps(() => ({
    y: height * (1 - levelPct.value),
    height: height * levelPct.value,
  }));

  const fillColor = Colors.jal; // never shifts with intensity — no red/amber at high intensity

  return (
    <View style={[styles.container, { height }]} accessibilityRole="adjustable" accessibilityLabel={`Urge intensity ${intensity} of 10`}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={fillColor} stopOpacity={0.55} />
            <Stop offset="1" stopColor={fillColor} stopOpacity={0.85} />
          </LinearGradient>
        </Defs>
        {simplified || reducedMotion ? (
          <AnimatedRect x={0} width={width} fill="url(#tideFill)" animatedProps={rectProps} />
        ) : (
          <>
            <AnimatedPath animatedProps={wave1Props} fill="url(#tideFill)" opacity={0.9} />
            <AnimatedPath animatedProps={wave2Props} fill="url(#tideFill)" opacity={0.6} />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden' },
});
