// src/theme/tokens.ts
//
// Master build plan §10 and §26 — "The Clearing".
//
// The whole visual identity is one idea: a personal dawn horizon. Hazy
// grey-navy when things are hard, clearing toward warm light as the user
// delays and reduces. Everything here serves that; no screen file hardcodes a
// colour.
//
// The named palette below is taken verbatim from §10. The supporting neutrals
// (text, surface, border) are derived from it rather than invented, so the
// whole system stays in one family.

export const palette = {
  light: {
    /** §10 "the haze tone" — the top of every gradient. */
    bgStart: '#1B2430',
    /** §10 "the clearing tone" — what the haze resolves into. */
    bgClear: '#FFF8EC',
    /** §10 primary action, warmth. */
    ember: '#E8A33D',
    /** §10 delay success, reduction. */
    growth: '#7FA98E',
    /** §10 relapse logging — muted terracotta, deliberately never red. */
    gentleAlert: '#C97B63',
  },
  dark: {
    bgStart: '#0F1520',
    bgClear: '#2A2115',
    ember: '#F2B25C',
    growth: '#93C1A6',
    gentleAlert: '#D89482',
  },
} as const;

/**
 * The full set a screen can reach for. Declared as an interface rather than
 * inferred from the light scheme so both schemes are checked against the same
 * shape — otherwise the literal hex values become the type and dark mode won't
 * assign to light mode's.
 */
export interface ColorScheme {
  bgStart: string;
  bgClear: string;
  ember: string;
  growth: string;
  gentleAlert: string;
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  onAccent: string;
  onHaze: string;
  onHazeMuted: string;
  shadow: string;
}

/**
 * Surfaces and text. The app's chrome sits on the "clearing" end of the
 * gradient, so light mode reads as warm cream and dark mode as warm near-black
 * — never the generic slate-grey that a default dark theme lands on.
 */
const lightScheme: ColorScheme = {
  ...palette.light,
  /** Page background beneath the horizon. */
  bg: '#FFF8EC',
  surface: '#FFFFFF',
  /** Cards that need to recede rather than pop. */
  surfaceMuted: '#F6EEE0',
  border: '#E6DACA',
  text: '#241D14',
  textMuted: '#6B5D4C',
  /** Text on ember / growth fills. */
  onAccent: '#1B1206',
  /** Text on the hazy end of the horizon. */
  onHaze: '#F4EFE6',
  onHazeMuted: '#B9BFC9',
  shadow: '#241D14',
};

const darkScheme: ColorScheme = {
  ...palette.dark,
  bg: '#0F1520',
  surface: '#182130',
  surfaceMuted: '#141C29',
  border: '#28323F',
  text: '#F2EDE4',
  textMuted: '#9AA4B2',
  onAccent: '#12190A',
  onHaze: '#F2EDE4',
  onHazeMuted: '#9AA4B2',
  shadow: '#000000',
};

export const colorSchemes: Record<'light' | 'dark', ColorScheme> = {
  light: lightScheme,
  dark: darkScheme,
};

/** §26 — 4px grid. Nothing in the app uses a magic pixel value. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/**
 * §10 type — Fraunces (serif) carries milestones and emotional moments,
 * Manrope (sans) carries everything else. Hindi and Bengali fall back to Noto
 * Sans in the matching script, since neither display face covers those.
 */
export const fonts = {
  serif: 'Fraunces_600SemiBold',
  sans: 'Manrope_400Regular',
  sansMedium: 'Manrope_500Medium',
  sansSemiBold: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold',
  devanagari: 'NotoSansDevanagari_400Regular',
  devanagariMedium: 'NotoSansDevanagari_500Medium',
  devanagariSemiBold: 'NotoSansDevanagari_600SemiBold',
  bengali: 'NotoSansBengali_400Regular',
  bengaliMedium: 'NotoSansBengali_500Medium',
  bengaliSemiBold: 'NotoSansBengali_600SemiBold',
} as const;

/** §26 type scale. `lineHeight` is baked in so no screen has to guess. */
export const type = {
  display: { fontSize: 40, lineHeight: 46 },
  title: { fontSize: 28, lineHeight: 34 },
  heading: { fontSize: 20, lineHeight: 27 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 21 },
  caption: { fontSize: 12, lineHeight: 17 },
  /** The hero number on the dashboard. */
  hero: { fontSize: 56, lineHeight: 60 },
} as const;

/**
 * §11 motion. Three durations, no more. Multiply every one of them by the
 * theme's `motionScale` before use so Reduced Motion collapses them to zero
 * without any screen needing its own conditional.
 */
export const duration = {
  fast: 150,
  base: 260,
  slow: 420,
} as const;
