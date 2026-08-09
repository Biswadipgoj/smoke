// src/components/ui/Button.tsx
//
// §11-12 — one press animation (fast, scaled by motionScale) and one haptic
// (light impact), defined once. §10 — ember carries primary action.

import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import * as haptics from '../../services/haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'gentle';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Renders full-bleed rather than hugging its label. */
  block?: boolean;
  style?: ViewStyle;
  /** Suppress the haptic where §12 says there shouldn't be one. */
  silent?: boolean;
  accessibilityHint?: string;
  /**
   * Set on the hazy end of the palette (the craving flow). The theme's `text`
   * colour tracks the colour scheme, not the surface, so a secondary button on
   * dark navy in light mode would otherwise be near-black on near-black.
   */
  onHaze?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  block = true,
  style,
  silent = false,
  accessibilityHint,
  onHaze = false,
}: ButtonProps) {
  const theme = useTheme();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    // With Reduce Motion on, motionScale is 0 and this resolves instantly —
    // the state still changes, it just doesn't travel.
    transform: [{ scale: withTiming(1 - pressed.value * 0.02, { duration: theme.duration.fast }) }],
    opacity: withTiming(1 - pressed.value * 0.1, { duration: theme.duration.fast }),
  }));

  const surface: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: theme.colors.ember },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: onHaze ? theme.colors.onHazeMuted : theme.colors.border,
    },
    quiet: { backgroundColor: 'transparent' },
    gentle: { backgroundColor: theme.colors.surfaceMuted },
  };

  const tone =
    variant === 'primary'
      ? 'onAccent'
      : variant === 'quiet'
        ? onHaze
          ? 'onHazeMuted'
          : 'muted'
        : onHaze
          ? 'onHaze'
          : 'default';

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
      onPress={() => {
        if (!silent) haptics.tap();
        onPress();
      }}
      style={[
        styles.base,
        { borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.xl },
        surface[variant],
        block ? styles.block : styles.hug,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <View pointerEvents="none">
        <Text variant="body" weight="semiBold" tone={tone} center>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: { alignSelf: 'stretch' },
  hug: { alignSelf: 'flex-start' },
  disabled: { opacity: 0.4 },
});
