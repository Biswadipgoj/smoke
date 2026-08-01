// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/theme';

export function useTheme() {
  const profile = useAppStore((s) => s.profile);
  const systemScheme = useColorScheme();
  const mode = profile?.themeMode ?? 'dark';

  const isDark =
    mode === 'dark' ? true : mode === 'light' ? false : systemScheme === 'dark';

  return {
    isDark,
    colors: isDark
      ? {
          bg: Colors.bgDark,
          bgCard: Colors.bgDarkCard,
          bgElevated: Colors.bgDarkElevated,
          text: Colors.textDark,
          textSecondary: Colors.textDarkSecondary,
          textMuted: Colors.textDarkMuted,
          glass: Colors.glassBg,
          glassBorder: Colors.glassBorder,
          tabBg: Colors.tabBarBgDark,
        }
      : {
          bg: Colors.bgLight,
          bgCard: Colors.bgLightCard,
          bgElevated: Colors.bgLightElevated,
          text: Colors.textLight,
          textSecondary: Colors.textLightSecondary,
          textMuted: Colors.textLightMuted,
          glass: Colors.glassBgLight,
          glassBorder: Colors.glassBorderLight,
          tabBg: Colors.tabBarBgLight,
        },
  };
}
