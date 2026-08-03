// src/components/motion/Breath.tsx
// BREATH — the app's pulse. Tells the user the app is present, calm, and
// with them. Doc 01 §4.1.
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation, runOnJS,
} from 'react-native-reanimated';
import { Colors, MotionDuration, FontFamily, FontSize } from '../../constants/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface BreathProps {
  mode?: 'ambient' | 'paced';
  color?: string;
  size?: number;
  /** Paced pattern in seconds: [in, out] for 4-in/6-out, or [in, hold, out, hold] for box breathing. */
  pattern?: number[];
}

export function Breath({ mode = 'ambient', color = Colors.bhor, size = 260, pattern = [4, 6] }: BreathProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.06);
  const [label, setLabel] = useState('');
  const runningRef = useRef(true);

  useEffect(() => {
    runningRef.current = true;

    if (reducedMotion) {
      scale.value = 1.02;
      opacity.value = 0.085; // static, mean opacity — doc 01 §10
      setLabel('');
      return;
    }

    if (mode === 'ambient') {
      scale.value = withRepeat(withTiming(1.04, { duration: MotionDuration.ambient / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
      opacity.value = withRepeat(withTiming(0.11, { duration: MotionDuration.ambient / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
      return () => {
        cancelAnimation(scale);
        cancelAnimation(opacity);
      };
    }

    // Paced mode: inhale then exhale (box breathing collapses hold phases into
    // the surrounding in/out durations for simplicity, matching the felt rhythm).
    const inSec = pattern[0];
    const outSec = pattern[pattern.length - 1];

    const exhale = () => {
      if (!runningRef.current) return;
      setLabel('out');
      scale.value = withTiming(0.85, { duration: outSec * 1000, easing: Easing.inOut(Easing.sin) });
      opacity.value = withTiming(0.5, { duration: outSec * 1000, easing: Easing.inOut(Easing.sin) }, (finished) => {
        if (finished) runOnJS(inhale)();
      });
    };

    const inhale = () => {
      if (!runningRef.current) return;
      setLabel('in');
      scale.value = withTiming(1.35, { duration: inSec * 1000, easing: Easing.inOut(Easing.sin) });
      opacity.value = withTiming(0.9, { duration: inSec * 1000, easing: Easing.inOut(Easing.sin) }, (finished) => {
        if (finished) runOnJS(exhale)();
      });
    };

    inhale();

    return () => {
      runningRef.current = false;
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [mode, reducedMotion]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[styles.ring, ringStyle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}
      />
      {mode === 'paced' && label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.bone,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
