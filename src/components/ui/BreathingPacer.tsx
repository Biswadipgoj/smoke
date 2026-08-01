// src/components/ui/BreathingPacer.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Easing } from 'react-native';
import { Colors, FontFamily, FontSize } from '../../constants/theme';
import { useTranslation } from '../../hooks/useTranslation';

type Phase = 'inhale' | 'hold' | 'exhale';

interface BreathingPacerProps {
  size?: number;
  running?: boolean;
}

export function BreathingPacer({ size = 220, running = true }: BreathingPacerProps) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;
  const phase = useRef<Phase>('inhale');
  const phaseLabel = useRef(new Animated.Value(0)).current;
  const [currentPhase, setCurrentPhase] = React.useState<Phase>('inhale');

  useEffect(() => {
    if (!running) return;

    const breathCycle = () => {
      // Inhale 4s
      phase.current = 'inhale';
      setCurrentPhase('inhale');
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ]).start(() => {
        // Hold 2s
        phase.current = 'hold';
        setCurrentPhase('hold');
        setTimeout(() => {
          // Exhale 4s
          phase.current = 'exhale';
          setCurrentPhase('exhale');
          Animated.parallel([
            Animated.timing(scale, { toValue: 0.6, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.5, duration: 4000, useNativeDriver: true }),
          ]).start(() => {
            breathCycle();
          });
        }, 2000);
      });
    };

    breathCycle();
    return () => {
      scale.stopAnimation();
      opacity.stopAnimation();
    };
  }, [running]);

  const labels: Record<Phase, string> = {
    inhale: t.delayInhale,
    hold: t.delayHold,
    exhale: t.delayExhale,
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: Animated.multiply(opacity, 0.3),
            transform: [{ scale }],
          },
        ]}
      />
      {/* Main circle */}
      <Animated.View
        style={[
          styles.circle,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: (size * 0.72) / 2,
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <Text style={styles.phaseText}>{labels[currentPhase]}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  circle: {
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 8,
  },
  phaseText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
