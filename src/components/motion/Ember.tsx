// src/components/motion/Ember.tsx
// EMBER — the lapse acknowledgement. Doc 01 §4.4. No shatter, no crack, no
// red, no downward slam, no deflation. The screen warms slightly, existing
// content dims, one line fades in, held for a beat. Grief needs more time
// than celebration — this runs slower than any success animation in the app.
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { Colors, MotionDuration, FontFamily, FontSize } from '../../constants/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface EmberProps {
  line: string;
  onSettled?: () => void;
}

export function Ember({ line, onSettled }: EmberProps) {
  const reducedMotion = useReducedMotion();
  const glowOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const contentDim = useSharedValue(1);

  useEffect(() => {
    const riseDuration = reducedMotion ? 200 : MotionDuration.deliberate;
    glowOpacity.value = withTiming(1, { duration: riseDuration, easing: Easing.out(Easing.cubic) });
    contentDim.value = withTiming(0.4, { duration: riseDuration });
    textOpacity.value = withDelay(riseDuration * 0.6, withTiming(1, { duration: 400 }, (finished) => {
      if (finished && onSettled) {
        // Held for a beat before the caller proceeds — Ember runs to ~1,400ms
        // total across its sequence; grief needs more time than celebration.
        setTimeout(onSettled, reducedMotion ? 400 : 900);
      }
    }));
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="emberRise" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor={Colors.bhor} stopOpacity={0.28} />
              <Stop offset="0.45" stopColor={Colors.chhai} stopOpacity={0.14} />
              <Stop offset="1" stopColor={Colors.nishith} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#emberRise)" />
        </Svg>
      </Animated.View>
      <View style={styles.center}>
        <Animated.Text style={[styles.line, textStyle]}>{line}</Animated.Text>
      </View>
    </View>
  );
}

export function useEmberContentDim() {
  // Exposed so the hosting screen can dim its own existing content to 40%,
  // matching Ember's glow timing, per doc 01 §4.4.
  const dim = useSharedValue(1);
  useEffect(() => {
    dim.value = withTiming(0.4, { duration: MotionDuration.deliberate });
  }, []);
  return useAnimatedStyle(() => ({ opacity: dim.value }));
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  line: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xxl,
    color: Colors.bone,
    textAlign: 'center',
  },
});
