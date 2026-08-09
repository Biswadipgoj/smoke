// src/theme/ThemeProvider.tsx
//
// §26 — the only way a screen gets a colour. §11 — Reduced Motion is read from
// the OS accessibility setting at runtime, not offered as an in-app toggle we
// then have to keep in sync with the system one.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import { useLanguage } from '../i18n';
import type { Language } from '../types';
import { colorSchemes, duration, fonts, radius, spacing, type, type ColorScheme } from './tokens';

export interface Theme {
  colors: ColorScheme;
  spacing: typeof spacing;
  radius: typeof radius;
  type: typeof type;
  /**
   * §11 — multiply any animation duration by this. 1 normally, 0 when the OS
   * reports Reduce Motion, which makes every transition resolve instantly
   * rather than being skipped by a branch in each component.
   */
  motionScale: number;
  /** Convenience: durations already scaled. */
  duration: { fast: number; base: number; slow: number };
  isDark: boolean;
  /** Script-correct font stack for the active language. */
  font: {
    serif: string;
    body: string;
    medium: string;
    semiBold: string;
  };
}

/**
 * Fraunces and Manrope cover Latin only. Rendering Devanagari or Bengali in
 * them silently falls back to a system face and loses the whole type identity,
 * so each language names its own stack explicitly.
 */
function fontsFor(language: Language): Theme['font'] {
  switch (language) {
    case 'hi':
      return {
        serif: fonts.devanagariSemiBold,
        body: fonts.devanagari,
        medium: fonts.devanagariMedium,
        semiBold: fonts.devanagariSemiBold,
      };
    case 'bn':
      return {
        serif: fonts.bengaliSemiBold,
        body: fonts.bengali,
        medium: fonts.bengaliMedium,
        semiBold: fonts.bengaliSemiBold,
      };
    default:
      return {
        serif: fonts.serif,
        body: fonts.sans,
        medium: fonts.sansMedium,
        semiBold: fonts.sansSemiBold,
      };
  }
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const language = useLanguage();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  const value = useMemo<Theme>(() => {
    const isDark = scheme !== 'light';
    const motionScale = reduceMotion ? 0 : 1;
    return {
      colors: isDark ? colorSchemes.dark : colorSchemes.light,
      spacing,
      radius,
      type,
      motionScale,
      duration: {
        fast: duration.fast * motionScale,
        base: duration.base * motionScale,
        slow: duration.slow * motionScale,
      },
      isDark,
      font: fontsFor(language),
    };
  }, [scheme, reduceMotion, language]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside <ThemeProvider>');
  return theme;
}
