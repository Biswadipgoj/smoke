// src/components/ui/Row.tsx
//
// The settings/profile list row. One component for the whole app so the
// tap targets, chevrons and switches don't drift screen to screen.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import * as haptics from '../../services/haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export interface RowProps {
  label: string;
  description?: string;
  /** Right-hand text, e.g. the current value. */
  value?: string;
  onPress?: () => void;
  /** Renders a switch instead of a chevron. */
  toggle?: { value: boolean; onValueChange: (value: boolean) => void };
  destructive?: boolean;
  last?: boolean;
}

export function Row({
  label,
  description,
  value,
  onPress,
  toggle,
  destructive = false,
  last = false,
}: RowProps) {
  const theme = useTheme();

  const content = (
    <View
      style={[
        styles.row,
        {
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.labels}>
        <Text variant="body" tone={destructive ? 'alert' : 'default'}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {toggle ? (
        <Switch
          accessibilityLabel={label}
          value={toggle.value}
          onValueChange={(next) => {
            haptics.tap();
            toggle.onValueChange(next);
          }}
          trackColor={{ true: theme.colors.growth, false: theme.colors.border }}
          thumbColor={theme.colors.surface}
        />
      ) : (
        <View style={[styles.trailing, { gap: theme.spacing.xs }]}>
          {value ? (
            <Text variant="bodySmall" tone="muted">
              {value}
            </Text>
          ) : null}
          {onPress ? (
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          ) : null}
        </View>
      )}
    </View>
  );

  if (!onPress || toggle) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      // §12 — no haptic on plain navigation.
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  labels: { flex: 1, gap: 2 },
  trailing: { flexDirection: 'row', alignItems: 'center' },
});
