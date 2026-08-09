// src/components/ui/Chip.tsx
//
// The selection primitive behind the trigger grid, intensity picker, language
// picker and coach-style list — one tap target, one selected state.

import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import * as haptics from '../../services/haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Second line, for options that need a word of explanation. */
  description?: string;
  style?: ViewStyle;
  /** Fill the row rather than hugging the label. */
  block?: boolean;
  /**
   * Set on the hazy end of the palette (the craving flow). Without it the
   * default text colour is near-black, which vanishes on dark navy in light
   * mode — the theme's `text` follows the colour scheme, not the surface it
   * happens to be sitting on.
   */
  onHaze?: boolean;
}

export function Chip({
  label,
  selected,
  onPress,
  description,
  style,
  block = false,
  onHaze = false,
}: ChipProps) {
  const theme = useTheme();
  const restingTone = onHaze ? 'onHaze' : 'default';
  const restingMuted = onHaze ? 'onHazeMuted' : 'muted';

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: description ? theme.radius.md : theme.radius.pill,
          paddingVertical: description ? theme.spacing.md : theme.spacing.sm + 2,
          paddingHorizontal: theme.spacing.lg,
          borderColor: selected
            ? theme.colors.ember
            : onHaze
              ? theme.colors.onHazeMuted
              : theme.colors.border,
          backgroundColor: selected ? theme.colors.ember : 'transparent',
          alignSelf: block ? 'stretch' : 'flex-start',
          gap: 2,
        },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Text
        variant={description ? 'body' : 'bodySmall'}
        weight="medium"
        tone={selected ? 'onAccent' : restingTone}
      >
        {label}
      </Text>
      {description ? (
        <Text variant="caption" tone={selected ? 'onAccent' : restingMuted}>
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** Wraps a set of chips onto as many lines as they need. */
export function ChipGroup({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.group, { gap: theme.spacing.sm }]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { borderWidth: 1 },
  group: { flexDirection: 'row', flexWrap: 'wrap' },
});
