// src/constants/theme.ts
export const Colors = {
  // Primary - Calm Teal
  primary: '#2DD4BF',
  primaryDark: '#14B8A6',
  primaryLight: '#5EEAD4',
  primaryMuted: '#99F6E4',

  // Backgrounds
  bgDark: '#0D1F2D',
  bgDarkCard: '#132232',
  bgDarkElevated: '#1A2F42',
  bgLight: '#F8FFFE',
  bgLightCard: '#FFFFFF',
  bgLightElevated: '#F0FDFB',

  // Text
  textDark: '#E2F8F5',
  textDarkSecondary: '#94A9B8',
  textDarkMuted: '#546E7A',
  textLight: '#0D2137',
  textLightSecondary: '#4A6572',
  textLightMuted: '#8FA8B4',

  // Semantic
  success: '#10B981',
  successBg: '#D1FAE5',
  amber: '#F59E0B',
  amberBg: '#FEF3C7',
  error: '#EF4444',         // ONLY for security/account errors, NEVER relapse
  errorBg: '#FEE2E2',

  // Accent for Achievements
  gold: '#F59E0B',
  goldGlow: '#FCD34D',

  // Glassmorphism
  glassBg: 'rgba(13, 31, 45, 0.7)',
  glassBgLight: 'rgba(248, 255, 254, 0.85)',
  glassBorder: 'rgba(45, 212, 191, 0.2)',
  glassBorderLight: 'rgba(45, 212, 191, 0.3)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Tab Bar
  tabBarActive: '#2DD4BF',
  tabBarInactive: '#546E7A',
  tabBarBgDark: '#0A1929',
  tabBarBgLight: '#FFFFFF',

  // Gradients (used as array pairs)
  gradientPrimary: ['#0D2F3F', '#0D1F2D'] as const,
  gradientCard: ['#132232', '#0D1F2D'] as const,
  gradientTeal: ['#2DD4BF', '#14B8A6'] as const,
  gradientGold: ['#F59E0B', '#D97706'] as const,
};

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
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
};

export const FontFamily = {
  regular: 'NotoSans_400Regular',
  medium: 'NotoSans_500Medium',
  semiBold: 'NotoSans_600SemiBold',
  bold: 'NotoSans_700Bold',
};

export const Shadow = {
  sm: {
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const Duration = {
  fast: 150,
  normal: 300,
  slow: 500,
  breath: 4000,
};
