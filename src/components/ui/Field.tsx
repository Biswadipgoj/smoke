// src/components/ui/Field.tsx

import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  multiline?: boolean;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize = 'none',
  multiline = false,
}: FieldProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="caption" tone="muted" weight="medium">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        multiline={multiline}
        style={[
          styles.input,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            color: theme.colors.text,
            fontFamily: theme.font.body,
            fontSize: theme.type.body.fontSize,
            minHeight: multiline ? 96 : 52,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
    </View>
  );
}

/**
 * A number the user nudges rather than types. Used wherever the value is a
 * count they roughly know — typing "10" on a numeric keyboard is more friction
 * than two taps, and this can't produce an empty or non-numeric state.
 */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 80,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const theme = useTheme();
  const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="caption" tone="muted" weight="medium">
        {label}
      </Text>
      <View style={[styles.stepperRow, { gap: theme.spacing.lg }]}>
        <StepperButton label="−" onPress={() => step(-1)} disabled={value <= min} />
        <View style={styles.stepperValue}>
          <Text variant="title" serif center>
            {value}
            {suffix ? ` ${suffix}` : ''}
          </Text>
        </View>
        <StepperButton label="+" onPress={() => step(1)} disabled={value >= max} />
      </View>
    </View>
  );
}

function StepperButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const theme = useTheme();
  return (
    <Text
      accessibilityRole="button"
      accessibilityLabel={label === '−' ? 'Decrease' : 'Increase'}
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      variant="title"
      tone={disabled ? 'muted' : 'accent'}
      style={[
        styles.stepperButton,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radius.pill,
          opacity: disabled ? 0.35 : 1,
        },
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1 },
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepperValue: { flex: 1 },
  stepperButton: {
    borderWidth: 1,
    width: 52,
    height: 52,
    lineHeight: 50,
    textAlign: 'center',
  },
});
