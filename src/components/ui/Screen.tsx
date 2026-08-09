// src/components/ui/Screen.tsx
//
// Page chrome: safe areas, background, and the back-and-title header used by
// every pushed screen. §26 — restraint: typography and whitespace carry the
// hierarchy, so the header is a title and a back affordance, nothing else.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '../../i18n';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export interface ScreenProps {
  children: ReactNode;
  /** Renders the header row. Omit for full-bleed screens like the dashboard. */
  title?: string;
  /** Shows a back chevron. Defaults to true whenever a title is given. */
  back?: boolean;
  scroll?: boolean;
  /** Use the hazy end of the palette instead of the clearing end. */
  haze?: boolean;
  contentStyle?: ViewStyle;
  footer?: ReactNode;
}

export function Screen({
  children,
  title,
  back,
  scroll = true,
  haze = false,
  contentStyle,
  footer,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const showBack = back ?? Boolean(title);
  // The chevron has no visible text, so it needs a spoken one — and it must
  // not be the screen title: "Settings, button" announced on a back chevron is
  // worse than no label at all.
  const backLabel = t('common.back');

  const background = haze ? theme.colors.bgStart : theme.colors.bg;

  const header = title ? (
    <View style={[styles.header, { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }]}>
      {showBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          hitSlop={12}
          // §12 — navigation gets no haptic.
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={haze ? theme.colors.onHaze : theme.colors.text}
          />
        </Pressable>
      )}
      <Text variant="heading" weight="semiBold" tone={haze ? 'onHaze' : 'default'}>
        {title}
      </Text>
    </View>
  ) : null;

  const body = (
    <View
      style={[
        { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: theme.spacing.lg },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: background, paddingTop: insets.top }]}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingTop: theme.spacing.md }}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { paddingTop: theme.spacing.md }]}>{body}</View>
      )}
      {footer ? (
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
            paddingTop: theme.spacing.md,
            gap: theme.spacing.sm,
          }}
        >
          {footer}
        </View>
      ) : (
        <View style={{ height: insets.bottom }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
});
