// src/components/motion/Thread.tsx
// THREAD — progress that only grows. Doc 01 §4.3, master doc §2.2. Beads
// accumulate along a vertical strand, newest at the top. The ash bead
// arrives identically to every other bead: same fall, same spring, same
// ripple. The thread does not break, thin, fray, or change colour above it.
// No count or number is rendered here — that's a deliberate omission
// (master doc §2.3): numbers live in You, not on Today.
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withRepeat, Easing,
} from 'react-native-reanimated';
import { Colors, MotionSpring, MotionDuration } from '../../constants/theme';
import { ThreadBead } from '../../domain/types';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const MAX_RENDERED = 100; // display cap for performance — all history is preserved in the store regardless

const BEAD_VISUAL: Record<ThreadBead['type'], { size: number; color: string; glow: boolean; shape: 'circle' | 'diamond' }> = {
  day: { size: 22, color: Colors.bhor, glow: true, shape: 'circle' },
  surf: { size: 14, color: Colors.jal, glow: false, shape: 'diamond' },
  ash: { size: 18, color: Colors.chhai, glow: false, shape: 'circle' },
};

function Bead({ bead, isNew }: { bead: ThreadBead; isNew: boolean }) {
  const reducedMotion = useReducedMotion();
  const visual = BEAD_VISUAL[bead.type];
  const translateY = useSharedValue(isNew && !reducedMotion ? -18 : 0);
  const scale = useSharedValue(isNew && !reducedMotion ? 0.6 : 1);
  const opacity = useSharedValue(isNew ? 0 : 1);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = withTiming(1, { duration: 200 });
      return;
    }
    opacity.value = withTiming(1, { duration: MotionDuration.brisk });
    translateY.value = withSpring(0, MotionSpring.bead);
    scale.value = withSequence(
      withSpring(1.08, { ...MotionSpring.bead, damping: 8 }),
      withSpring(1, MotionSpring.gentle)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.beadRow, style]}>
      <View
        style={[
          visual.shape === 'diamond' ? styles.diamond : styles.circle,
          {
            width: visual.size,
            height: visual.size,
            backgroundColor: visual.color,
            borderRadius: visual.shape === 'circle' ? visual.size / 2 : 3,
          },
          visual.glow && styles.glow,
        ]}
      />
    </Animated.View>
  );
}

export function Thread({ beads }: { beads: ThreadBead[] }) {
  const reducedMotion = useReducedMotion();
  const prevCountRef = useRef(beads.length);
  const [lastNewId, setLastNewId] = useState<string | null>(null);
  const driftX = useSharedValue(0);

  useEffect(() => {
    if (beads.length > prevCountRef.current) {
      setLastNewId(beads[beads.length - 1]?.id ?? null);
    }
    prevCountRef.current = beads.length;
  }, [beads.length]);

  useEffect(() => {
    if (reducedMotion) return;
    // Idle lateral drift — ±2px over 6s, "like a strand hanging in still air."
    driftX.value = withRepeat(withSequence(
      withTiming(2, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      withTiming(-2, { duration: 3000, easing: Easing.inOut(Easing.sin) })
    ), -1, true);
  }, [reducedMotion]);

  const lineStyle = useAnimatedStyle(() => ({ transform: [{ translateX: driftX.value }] }));

  const newestFirst = [...beads].reverse().slice(0, MAX_RENDERED);

  if (beads.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Animated.View style={[styles.line, lineStyle, { height: 60 }]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.threadColumn}>
        <Animated.View style={[styles.line, lineStyle]} />
        <View style={styles.beadsColumn}>
          {newestFirst.map((bead) => (
            <Bead key={bead.id} bead={bead} isNew={bead.id === lastNewId} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingVertical: 16, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 24 },
  threadColumn: { alignItems: 'center', position: 'relative' },
  line: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: Colors.hairline },
  beadsColumn: { alignItems: 'center', gap: 14 },
  beadRow: { alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  circle: {},
  diamond: { transform: [{ rotate: '45deg' }] },
  glow: {
    shadowColor: Colors.bhor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
});
