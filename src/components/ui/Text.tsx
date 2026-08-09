// src/components/ui/Text.tsx
//
// §26 — the only Text in the app. Screens pick a role from the type scale,
// never a font size, and the script-correct family comes from the theme so
// switching to Hindi or Bengali doesn't silently fall back to a system face.

import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

export type TextVariant =
  | 'hero'
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodySmall'
  | 'caption';

export type TextTone = 'default' | 'muted' | 'accent' | 'growth' | 'alert' | 'onHaze' | 'onHazeMuted' | 'onAccent';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** §10 — Fraunces for milestones and emotional moments, Manrope elsewhere. */
  serif?: boolean;
  weight?: 'regular' | 'medium' | 'semiBold';
  center?: boolean;
}

export function Text({
  variant = 'body',
  tone = 'default',
  serif = false,
  weight = 'regular',
  center = false,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();

  const toneColor: Record<TextTone, string> = {
    default: theme.colors.text,
    muted: theme.colors.textMuted,
    accent: theme.colors.ember,
    growth: theme.colors.growth,
    alert: theme.colors.gentleAlert,
    onHaze: theme.colors.onHaze,
    onHazeMuted: theme.colors.onHazeMuted,
    onAccent: theme.colors.onAccent,
  };

  const family = serif
    ? theme.font.serif
    : weight === 'semiBold'
      ? theme.font.semiBold
      : weight === 'medium'
        ? theme.font.medium
        : theme.font.body;

  const base: TextStyle = {
    ...theme.type[variant],
    color: toneColor[tone],
    fontFamily: family,
    textAlign: center ? 'center' : undefined,
  };

  return <RNText {...rest} style={[base, style]} />;
}
