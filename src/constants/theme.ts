// src/constants/theme.ts
// ─────────────────────────────────────────────────────────────────────────────
// Dhruv design tokens. Dark-first, no red anywhere, numbers de-emphasized.
// See doc 01 (Motion & Design System) §2 and master doc §2.4–2.5.
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // Surfaces
  nishith: '#101426', // nightfall — base surface, never pure black
  nil: '#1C2340', // indigo — elevated surfaces, cards, sheets
  nilElevated: '#242C52',

  // Accents — used with discipline, never mixed for "success/error" semantics
  bhor: '#F0C070', // dawn — presence & progress only
  bhorSoft: 'rgba(240, 192, 112, 0.16)',
  jal: '#54A3A8', // water — urge mode, breathing, active coping
  jalSoft: 'rgba(84, 163, 168, 0.16)',
  chhai: '#8C90A6', // ash — lapse beads, neutral, destructive confirmations
  chhaiSoft: 'rgba(140, 144, 166, 0.16)',

  // Text
  bone: '#E8EAF2', // primary text (dark surfaces)
  boneSecondary: '#A6ACC4',
  boneMuted: '#6E7390',

  // Light theme mirror (dark is the design intent, light ships as alternate)
  lightBg: '#FAF8F4',
  lightCard: '#FFFFFF',
  lightElevated: '#F1EEE6',
  lightText: '#20233A',
  lightTextSecondary: '#4E5270',
  lightTextMuted: '#8A8DA6',

  // OLED true-black option
  trueBlack: '#000000',

  // Borders / overlays
  hairline: 'rgba(232, 234, 242, 0.10)',
  hairlineLight: 'rgba(32, 35, 58, 0.10)',
  scrim: 'rgba(8, 10, 20, 0.55)',

  // Tab / chrome
  tabActive: '#F0C070',
  tabInactive: '#6E7390',
} as const;

// Red does not exist in this product. Not for errors, not for lapses,
// not for destructive actions. If you're reaching for a color to signal
// "wrong" or "bad," reach for `chhai` + an explicit label instead.

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 22,
  xl: 26,
  xxl: 32,
  xxxl: 40,
  display: 48,
};

// Devanagari and Bengali need materially more line-height than Latin at the
// same point size (matras and conjunct stacks collide otherwise). Multiply
// FontSize by the value for the active script when setting lineHeight.
export const LineHeightMultiplier: Record<'latin' | 'devanagari' | 'bengali', number> = {
  latin: 1.35,
  devanagari: 1.6,
  bengali: 1.6,
};

export const FontFamily = {
  // Body & UI — humanist faces designed for these scripts
  regular: 'NotoSans_400Regular',
  medium: 'NotoSans_500Medium',
  semiBold: 'NotoSans_600SemiBold',
  bold: 'NotoSans_700Bold',
  bodyDevanagari: 'NotoSansDevanagari_400Regular',
  bodyDevanagariMedium: 'NotoSansDevanagari_500Medium',
  bodyDevanagariSemiBold: 'NotoSansDevanagari_600SemiBold',
  bodyBengali: 'NotoSansBengali_400Regular',
  bodyBengaliMedium: 'NotoSansBengali_500Medium',
  bodyBengaliSemiBold: 'NotoSansBengali_600SemiBold',

  // Display — one-line emotional statements only, never UI chrome
  displayLatin: 'TiroDevanagariHindi_400Regular', // placeholder metrics; Latin falls back to system serif feel via regular weight below if unavailable
  displayDevanagari: 'TiroDevanagariHindi_400Regular',
  displayBengali: 'TiroBangla_400Regular',

  // Utility — timers and durations only
  mono: 'IBMPlexMono_500Medium',
  monoRegular: 'IBMPlexMono_400Regular',
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
};

// ── Motion tokens — Motion & Design System doc §2 ────────────────────────────
// Wrap every duration/easing reference behind these tokens so an upstream
// (Reanimated/M3) API change is a one-file edit.

export const MotionDuration = {
  instant: 50,
  quick: 150,
  brisk: 250,
  settled: 400, // default screen transition
  deliberate: 600, // entering urge mode, lapse acknowledgement
  ceremonial: 900, // milestone, thread growth, exiting urge mode
  ambient: 4000, // breath cycle, tide drift, background
} as const;

// Spring configs shaped for react-native-reanimated's withSpring.
// damping/stiffness translated to reanimated's mass/damping/stiffness model.
export const MotionSpring = {
  gentle: { damping: 18, stiffness: 200, mass: 1 }, // default — no overshoot
  settle: { damping: 20, stiffness: 300, mass: 1 }, // sheets, cards arriving
  bead: { damping: 12, stiffness: 260, mass: 1 }, // Thread bead landing — the only bounce
} as const;

// ── Time-of-day is used only for locale/crisis-hour logic, never for palette
// drift (Dhruv is dark-first year round; no "living background" mood engine).
export type DayPhase = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';

export function getDayPhase(date: Date = new Date()): DayPhase {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}
