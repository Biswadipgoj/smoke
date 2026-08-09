// src/components/ui/index.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The design system's component layer (§26). Every screen builds from these,
// which is what keeps "no hardcoded colours in any screen file" true in
// practice rather than aspirationally.
//
// Typography rule from §10: Fraunces (the `display` variant) is for milestones
// and emotional moments only — the dashboard hero, a resisted craving, a
// health milestone. Everything else is Manrope. If a screen reaches for
// `display` for a section header, that is the tell that it is decorating.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { haptic } from '../../services/haptics';

// ── Screen ───────────────────────────────────────────────────────────────────

export function Screen({
  children,
  scroll = true,
  edges = ['top', 'bottom'],
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const padding = { padding: theme.spacing.xl, gap: theme.spacing.lg };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[padding, styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

// ── Text ─────────────────────────────────────────────────────────────────────

export type TextVariant =
  | 'display'
  | 'hero'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'small'
  | 'caption';

export type TextTone = 'default' | 'secondary' | 'muted' | 'ember' | 'growth' | 'alert' | 'onEmber';

export function AppText({
  children,
  variant = 'body',
  tone = 'default',
  style,
  numberOfLines,
  center,
}: {
  children: React.ReactNode;
  variant?: TextVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  center?: boolean;
}) {
  const theme = useTheme();

  const sizes: Record<TextVariant, number> = {
    display: theme.type.hero,
    hero: theme.type.hero,
    title: theme.type.title,
    heading: theme.type.heading,
    subheading: theme.type.subheading,
    body: theme.type.body,
    small: theme.type.small,
    caption: theme.type.caption,
  };

  const colors: Record<TextTone, string> = {
    default: theme.colors.text,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    ember: theme.colors.ember,
    growth: theme.colors.growth,
    alert: theme.colors.gentleAlert,
    onEmber: theme.colors.onEmber,
  };

  const fontRole =
    variant === 'display' || variant === 'hero'
      ? 'display'
      : variant === 'title' || variant === 'heading'
        ? 'semibold'
        : variant === 'subheading'
          ? 'medium'
          : 'body';

  const size = sizes[variant];

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          color: colors[tone],
          fontFamily: theme.font(fontRole),
          fontSize: size,
          lineHeight: theme.lineHeight(size),
          textAlign: center ? 'center' : 'auto',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
  raised,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  raised?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const content = (
    <View
      style={[
        {
          backgroundColor: raised ? theme.colors.surfaceRaised : theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          gap: theme.spacing.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {content}
    </Pressable>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────────

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  tone = 'ember',
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'ember' | 'growth' | 'alert';
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const background =
    tone === 'growth' ? theme.colors.growth : tone === 'alert' ? theme.colors.gentleAlert : theme.colors.ember;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      disabled={disabled || loading}
      onPress={() => {
        haptic('tap');
        onPress();
      }}
      style={({ pressed }) => [
        {
          backgroundColor: background,
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
          borderRadius: theme.radius.pill,
          paddingVertical: theme.spacing.lg,
          paddingHorizontal: theme.spacing.xl,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 52,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.onEmber} />
      ) : (
        <AppText variant="subheading" tone="onEmber">
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  tone = 'secondary',
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: TextTone;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptic('tap');
        onPress();
      }}
      style={({ pressed }) => [
        {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          alignItems: 'center',
          opacity: pressed ? 0.7 : 1,
          minHeight: 44,
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <AppText variant="body" tone={tone}>
        {label}
      </AppText>
    </Pressable>
  );
}

// ── Chip ─────────────────────────────────────────────────────────────────────

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={() => {
        haptic('tap');
        onPress();
      }}
      style={({ pressed }) => ({
        backgroundColor: selected ? theme.colors.ember : theme.colors.surface,
        borderColor: selected ? theme.colors.ember : theme.colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: theme.radius.pill,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        opacity: pressed ? 0.85 : 1,
        minHeight: 44,
        justifyContent: 'center',
      })}
    >
      <AppText variant="small" tone={selected ? 'onEmber' : 'secondary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>{children}</View>
  );
}

// ── Stat ─────────────────────────────────────────────────────────────────────

export function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: TextTone }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.xs, flex: 1 }}>
      <AppText variant="heading" tone={tone}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

// ── List row ─────────────────────────────────────────────────────────────────

export function Row({
  label,
  detail,
  onPress,
  right,
  tone = 'default',
}: {
  label: string;
  detail?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  tone?: TextTone;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={
        onPress
          ? () => {
              haptic('tap');
              onPress();
            }
          : undefined
      }
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        opacity: pressed && onPress ? 0.7 : 1,
        minHeight: 52,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="body" tone={tone}>
          {label}
        </AppText>
        {detail ? (
          <AppText variant="caption" tone="muted">
            {detail}
          </AppText>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border }} />;
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <AppText variant="caption" tone="muted" style={{ letterSpacing: 1, marginTop: theme.spacing.sm }}>
      {String(children).toUpperCase()}
    </AppText>
  );
}

// ── Field ────────────────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  style,
  ...props
}: TextInputProps & { label?: string; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {label ? (
        <AppText variant="small" tone="secondary">
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        {...props}
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.lg,
            color: theme.colors.text,
            fontFamily: theme.font('body'),
            fontSize: theme.type.body,
            minHeight: 52,
          },
          style,
        ]}
      />
      {hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

// ── Notice ───────────────────────────────────────────────────────────────────

/** A quiet inline note: offline state, beta labels, medical disclaimers. */
export function Notice({ children, tone = 'muted' }: { children: React.ReactNode; tone?: TextTone }) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
      }}
    >
      <AppText variant="caption" tone={tone}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
