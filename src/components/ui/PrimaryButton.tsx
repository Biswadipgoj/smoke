// src/components/ui/PrimaryButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radius, FontFamily, FontSize, Spacing } from '../../constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  // 'destructive' uses chhai + an explicit label — red does not exist in this product (master doc §2.4)
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PrimaryButton({
  label,
  onPress,
  style,
  labelStyle,
  variant = 'primary',
  loading = false,
  disabled = false,
  size = 'md',
}: PrimaryButtonProps) {
  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
    labelStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={containerStyle}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? Colors.nishith : Colors.bhor} />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: { backgroundColor: Colors.bhor },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.bhor },
  ghost: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: Colors.chhai },
  disabled: { opacity: 0.45 },
  size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, minHeight: 36 },
  size_md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, minHeight: 48 },
  size_lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md - 2, minHeight: 56 },

  label: { fontFamily: FontFamily.semiBold },
  label_primary: { color: Colors.nishith },
  label_secondary: { color: Colors.bhor },
  label_ghost: { color: Colors.bhor },
  label_destructive: { color: Colors.bone },
  labelSize_sm: { fontSize: FontSize.sm },
  labelSize_md: { fontSize: FontSize.base },
  labelSize_lg: { fontSize: FontSize.md },
});
