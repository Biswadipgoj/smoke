// src/theme/ThemeProvider.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The one place tokens become a live theme (§26).
//
// Reduced Motion is not a settings toggle we ask the user to find — it's read
// from the OS accessibility setting at runtime and exposed as `motionScale`
// (§11). Every animation in the app multiplies its duration by motionScale, so
// "respect reduced motion" is the default behaviour of the codebase rather
// than something each screen has to remember.
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import type { Locale } from '../types';
import {
  ColorScheme,
  Palette,
  durations,
  fontFor,
  lineHeightMultiplier,
  palettes,
  radius,
  shadow,
  spacing,
  springs,
  type as typeScale,
} from './tokens';

export type Script = 'latin' | 'devanagari' | 'bengali';

const SCRIPT_BY_LOCALE: Record<Locale, Script> = {
  en: 'latin',
  hi: 'devanagari',
  bn: 'bengali',
};

export interface Theme {
  scheme: ColorScheme;
  isDark: boolean;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  type: typeof typeScale;
  springs: typeof springs;
  shadow: typeof shadow;
  script: Script;
  /** 0 when the OS asks for reduced motion, 1 otherwise. */
  motionScale: number;
  reduceMotion: boolean;
  /** Durations already multiplied by motionScale — use these, not the raw tokens. */
  motion: { fast: number; base: number; slow: number };
  font: (role: Parameters<typeof fontFor>[0]) => string;
  /** Line height for a given font size, corrected for the active script. */
  lineHeight: (fontSize: number) => number;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const preference = useAppStore((s) => s.profile?.themePreference ?? 'system');
  const locale = useAppStore((s) => s.profile?.locale ?? 'en');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => {
        // Older platforms can reject here; assuming "motion is fine" matches
        // the platform default and never removes information from a screen.
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) =>
      setReduceMotion(Boolean(enabled))
    );
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  const value = useMemo<Theme>(() => {
    const scheme: ColorScheme =
      preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;
    const script = SCRIPT_BY_LOCALE[locale];
    const motionScale = reduceMotion ? 0 : 1;
    return {
      scheme,
      isDark: scheme === 'dark',
      colors: palettes[scheme],
      spacing,
      radius,
      type: typeScale,
      springs,
      shadow,
      script,
      motionScale,
      reduceMotion,
      motion: {
        fast: durations.fast * motionScale,
        base: durations.base * motionScale,
        slow: durations.slow * motionScale,
      },
      font: (role) => fontFor(role, script),
      lineHeight: (fontSize) => Math.round(fontSize * lineHeightMultiplier[script]),
    };
  }, [preference, systemScheme, locale, reduceMotion]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme() called outside <ThemeProvider>');
  return theme;
}
