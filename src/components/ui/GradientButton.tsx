// src/components/ui/GradientButton.tsx
// The primary call-to-action: a gradient pill with a springy press response,
// optional leading icon, and a colored glow. Used for every hero action.
import React from 'react';
import { Text, StyleSheet, StyleProp, ViewStyle, ActivityIndicator, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Gradients, GradientName, FontFamily, FontSize, Radius, Spacing, Colors, Elevation } from '../../constants/theme';
import { GradientView } from './GradientView';

type IconName = keyof typeof Ionicons.glyphMap;

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  gradient?: GradientName;
  icon?: IconName;
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
  haptic?: boolean;
}

export function GradientButton({
  label,
  onPress,
  gradient = 'cta',
  icon,
  size = 'lg',
  loading = false,
  disabled = false,
  style,
  glow = true,
  haptic = true,
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const height = size === 'lg' ? 58 : 48;
  const stops = Gradients[gradient];
  const glowColor = stops[0];

  return (
    <Animated.View
      style={[
        animatedStyle,
        glow && !disabled ? Elevation.glow(glowColor) : Elevation.card,
        style,
      ]}
    >
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 18 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 14 }); }}
        onPress={() => {
          if (disabled || loading) return;
          if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        disabled={disabled || loading}
      >
        <GradientView
          colors={disabled ? ['#2A3B4C', '#22303F'] : stops}
          radius={Radius.full}
          style={[styles.body, { height, borderRadius: Radius.full }]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.bgDark} />
          ) : (
            <>
              {icon ? <Ionicons name={icon} size={size === 'lg' ? 20 : 18} color={Colors.bgDark} /> : null}
              <Text style={[styles.label, { fontSize: size === 'lg' ? FontSize.md : FontSize.base }]}>{label}</Text>
            </>
          )}
        </GradientView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    overflow: 'hidden',
  },
  label: {
    fontFamily: FontFamily.bold,
    color: Colors.bgDark,
    letterSpacing: 0.3,
  },
});
