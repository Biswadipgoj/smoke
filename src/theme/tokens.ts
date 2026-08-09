// src/theme/tokens.ts
// ─────────────────────────────────────────────────────────────────────────────
// "The Clearing" design system (Master Build Plan §10, §26).
//
// The signature idea is a personal dawn horizon: hazy grey-navy when things
// are hard, clearing toward warm light as the user delays and reduces. The
// five named tokens below are the spec's core palette; everything else is
// derived surface/text tone in the same family.
//
// No screen file may hardcode a color. If you need a color that isn't here,
// add it here first — that constraint is what keeps light mode, dark mode and
// the horizon visual from drifting apart.
// ─────────────────────────────────────────────────────────────────────────────

export type ColorScheme = 'light' | 'dark';

export interface Palette {
  /** The "haze" tone — where the horizon gradient starts. */
  bgStart: string;
  /** The "clearing" tone — where the horizon gradient resolves. */
  bgClear: string;
  /** Primary action, warmth. */
  ember: string;
  /** Delay success, reduction. */
  growth: string;
  /** Relapse logging — muted terracotta, deliberately never red. */
  gentleAlert: string;

  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  /** Foreground for text/icons sitting on `ember`. */
  onEmber: string;
  scrim: string;
}

// Red does not appear in this palette, at any weight, for any state. Logging
// a cigarette is a neutral data point (§1); the strongest "something happened"
// tone in the system is gentleAlert, a muted terracotta.
export const palettes: Record<ColorScheme, Palette> = {
  light: {
    bgStart: '#1B2430',
    bgClear: '#FFF8EC',
    ember: '#E8A33D',
    growth: '#7FA98E',
    gentleAlert: '#C97B63',

    background: '#FBF5E9',
    surface: '#FFFFFF',
    surfaceRaised: '#FFF8EC',
    border: 'rgba(27, 36, 48, 0.12)',
    text: '#1B2430',
    textSecondary: '#4C5A69',
    textMuted: '#78838F',
    onEmber: '#221703',
    scrim: 'rgba(27, 36, 48, 0.45)',
  },
  dark: {
    bgStart: '#0F1520',
    bgClear: '#2A2115',
    ember: '#F2B25C',
    growth: '#93C1A6',
    gentleAlert: '#D89482',

    background: '#0F1520',
    surface: '#18202E',
    surfaceRaised: '#212B3B',
    border: 'rgba(236, 239, 243, 0.10)',
    text: '#ECEFF3',
    textSecondary: '#A9B4C0',
    textMuted: '#71808F',
    onEmber: '#141A12',
    scrim: 'rgba(4, 7, 12, 0.62)',
  },
};

/** 4px grid (§26). Use these names, never raw numbers, in screen styles. */
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
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

/**
 * Fraunces (serif) is reserved for milestones and emotional moments — the
 * dashboard hero, a resisted craving, a health milestone. Manrope carries
 * everything else. Devanagari and Bengali have no Fraunces/Manrope coverage,
 * so `fontForLocale()` swaps in Noto Sans for those scripts; without that,
 * hi/bn text silently falls back to a system face and loses the type identity.
 */
export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayLight: 'Fraunces_400Regular',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',

  devanagari: 'NotoSansDevanagari_400Regular',
  devanagariMedium: 'NotoSansDevanagari_500Medium',
  devanagariSemiBold: 'NotoSansDevanagari_600SemiBold',
  bengali: 'NotoSansBengali_400Regular',
  bengaliMedium: 'NotoSansBengali_500Medium',
  bengaliSemiBold: 'NotoSansBengali_600SemiBold',
} as const;

export type FontRole = 'display' | 'body' | 'medium' | 'semibold' | 'bold';

/**
 * Devanagari and Bengali also need materially more line height than Latin at
 * the same point size — matras and conjunct stacks collide otherwise.
 */
export const lineHeightMultiplier: Record<'latin' | 'devanagari' | 'bengali', number> = {
  latin: 1.35,
  devanagari: 1.6,
  bengali: 1.6,
};

export function fontFor(role: FontRole, script: 'latin' | 'devanagari' | 'bengali'): string {
  if (script === 'devanagari') {
    if (role === 'body') return fonts.devanagari;
    if (role === 'medium') return fonts.devanagariMedium;
    return fonts.devanagariSemiBold;
  }
  if (script === 'bengali') {
    if (role === 'body') return fonts.bengali;
    if (role === 'medium') return fonts.bengaliMedium;
    return fonts.bengaliSemiBold;
  }
  switch (role) {
    case 'display':
      return fonts.display;
    case 'body':
      return fonts.body;
    case 'medium':
      return fonts.bodyMedium;
    case 'semibold':
      return fonts.bodySemiBold;
    case 'bold':
      return fonts.bodyBold;
  }
}

export const type = {
  hero: 44,
  title: 30,
  heading: 22,
  subheading: 18,
  body: 16,
  small: 14,
  caption: 12,
} as const;

/**
 * Motion (§11). Fast for taps, base for transitions, slow for the single
 * transformation that earns it: a resisted craving.
 *
 * These are the *unscaled* values — read durations off `useTheme().motion`,
 * which multiplies them by `motionScale` (0 when the OS reports Reduce Motion).
 */
export const durations = {
  fast: 150,
  base: 260,
  slow: 420,
} as const;

export const springs = {
  /** No overshoot — the default for anything that moves in this app. */
  gentle: { damping: 20, stiffness: 220, mass: 1 },
  /** Cards and sheets arriving. */
  settle: { damping: 22, stiffness: 300, mass: 1 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
} as const;
