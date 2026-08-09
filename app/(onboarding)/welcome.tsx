// app/(onboarding)/welcome.tsx — §25 screen 2.
//
// One screen, one value proposition, one CTA. The horizon does the explaining;
// the copy says what the app is for and stops.

import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Horizon } from '../../src/components/Horizon';
import { Button } from '../../src/components/ui/Button';
import { Text } from '../../src/components/ui/Text';
import { useT } from '../../src/i18n';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function Welcome() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgStart }]}>
      <View style={styles.art}>
        {/* Part-cleared, so the first thing anyone sees is the idea of the
            thing moving rather than a finished picture or an empty one. */}
        <Horizon clarity={0.35} tree="budding" height={260} />
      </View>

      <View
        style={[
          styles.copy,
          {
            padding: theme.spacing.xl,
            paddingBottom: Math.max(insets.bottom, theme.spacing.xl),
            gap: theme.spacing.lg,
          },
        ]}
      >
        <Text variant="title" serif tone="onHaze">
          {t('welcome.title')}
        </Text>
        <Text variant="body" tone="onHazeMuted">
          {t('welcome.body')}
        </Text>
        <Button label={t('welcome.cta')} onPress={() => router.push('/(onboarding)/language')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  art: { flex: 1, justifyContent: 'center' },
  copy: { width: '100%' },
});
