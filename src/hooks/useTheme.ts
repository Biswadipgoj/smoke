// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { useDhruvStore } from '../store/useDhruvStore';
import { Colors } from '../constants/theme';

export function useTheme() {
  const profile = useDhruvStore((s) => s.profile);
  const systemScheme = useColorScheme();
  const mode = profile?.settings.themeMode ?? 'dark';

  const isDark = mode === 'light' ? false : mode === 'system' ? systemScheme === 'dark' : true;
  const isOled = mode === 'oled';

  return {
    isDark,
    isOled,
    colors: isDark
      ? {
          bg: isOled ? Colors.trueBlack : Colors.nishith,
          bgCard: Colors.nil,
          bgElevated: Colors.nilElevated,
          text: Colors.bone,
          textSecondary: Colors.boneSecondary,
          textMuted: Colors.boneMuted,
          hairline: Colors.hairline,
          accent: Colors.bhor,
          jal: Colors.jal,
          chhai: Colors.chhai,
        }
      : {
          bg: Colors.lightBg,
          bgCard: Colors.lightCard,
          bgElevated: Colors.lightElevated,
          text: Colors.lightText,
          textSecondary: Colors.lightTextSecondary,
          textMuted: Colors.lightTextMuted,
          hairline: Colors.hairlineLight,
          accent: Colors.bhor,
          jal: Colors.jal,
          chhai: Colors.chhai,
        },
  };
}
