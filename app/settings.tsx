// app/settings.tsx — Screen 18: Settings
// Language, coach style, appearance, price, baseline, app lock, sync, sign out.
//
// The price editor writes a *new* price point rather than editing the old one
// (§15). That is the whole reason price_history exists: a price rise today
// must not retroactively change what last month's cigarettes cost, and the
// hint on the field says so, because otherwise the behaviour looks like a bug.

import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppText,
  Chip,
  ChipRow,
  Divider,
  Field,
  GhostButton,
  Notice,
  Row,
  Screen,
  SectionHeading,
} from '../src/components/ui';
import { LOCALES, localeLabels, useTranslation } from '../src/i18n';
import { useAsyncData } from '../src/hooks/useAsyncData';
import { countUnsynced, currentPrice, insertPricePoint } from '../src/services/db/localDb';
import { syncNow } from '../src/services/sync/syncQueue';
import { useAppStore } from '../src/store/useAppStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { COACH_STYLES, type CoachStyle } from '../src/types';

const STYLE_LABELS: Record<CoachStyle, 'styleCalm' | 'styleDirect' | 'styleScientific' | 'styleEncouraging' | 'styleMinimal'> = {
  calm: 'styleCalm',
  direct: 'styleDirect',
  scientific: 'styleScientific',
  encouraging: 'styleEncouraging',
  minimal: 'styleMinimal',
};

export default function Settings() {
  const router = useRouter();
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const setLocale = useAppStore((s) => s.setLocale);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);

  const [price, setPrice] = useState('');
  const [baseline, setBaseline] = useState(String(profile?.baselinePerDay ?? 10));
  const [message, setMessage] = useState<string | null>(null);

  const { data, reload } = useAsyncData(async () => {
    const [pending, current] = await Promise.all([countUnsynced(), currentPrice()]);
    return { pending, current };
  }, []);

  async function savePrice() {
    const value = Number(price);
    if (!Number.isFinite(value) || value < 0) return;
    await insertPricePoint(value, profile?.currency ?? '₹', session?.user.id ?? null);
    setPrice('');
    setMessage(t('settingsPriceSaved'));
    reload();
  }

  async function saveBaseline() {
    const value = Math.max(1, Math.round(Number(baseline) || 0));
    await updateProfile({ baselinePerDay: value });
  }

  async function sync() {
    const result = await syncNow(session?.user.id ?? null);
    setMessage(
      result.status === 'ok'
        ? t('settingsSyncDone')
        : result.status === 'failed'
          ? result.error
          : t('profileNotSignedIn')
    );
    reload();
  }

  return (
    <Screen>
      <AppText variant="title">{t('settingsTitle')}</AppText>

      <SectionHeading>{t('settingsLanguage')}</SectionHeading>
      <ChipRow>
        {LOCALES.map((code) => (
          <Chip
            key={code}
            label={localeLabels[code]}
            selected={locale === code}
            onPress={() => void setLocale(code)}
          />
        ))}
      </ChipRow>

      <SectionHeading>{t('settingsCoachStyle')}</SectionHeading>
      <ChipRow>
        {COACH_STYLES.map((style) => (
          <Chip
            key={style}
            label={t(STYLE_LABELS[style])}
            selected={profile?.coachStyle === style}
            onPress={() => void updateProfile({ coachStyle: style })}
          />
        ))}
      </ChipRow>

      <SectionHeading>{t('settingsAppearance')}</SectionHeading>
      <ChipRow>
        {(['system', 'light', 'dark'] as const).map((mode) => (
          <Chip
            key={mode}
            label={t(
              mode === 'system'
                ? 'settingsAppearanceSystem'
                : mode === 'light'
                  ? 'settingsAppearanceLight'
                  : 'settingsAppearanceDark'
            )}
            selected={profile?.themePreference === mode}
            onPress={() => void updateProfile({ themePreference: mode })}
          />
        ))}
      </ChipRow>

      <SectionHeading>{t('settingsPrice')}</SectionHeading>
      <Field
        label={`${t('settingsPrice')} (${data?.current?.currency ?? profile?.currency ?? '₹'}${
          data?.current?.pricePerCigarette ?? 0
        })`}
        hint={t('settingsPriceHint')}
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        onBlur={() => void (price.trim() && savePrice())}
      />

      <Field
        label={t('settingsBaseline')}
        value={baseline}
        onChangeText={setBaseline}
        keyboardType="number-pad"
        onBlur={() => void saveBaseline()}
      />

      <SectionHeading>{t('privacyTitle')}</SectionHeading>
      <View>
        <Row
          label={t('settingsAppLock')}
          detail={t('settingsAppLockHint')}
          right={
            <Switch
              value={profile?.appLockEnabled ?? false}
              onValueChange={(next) => void updateProfile({ appLockEnabled: next })}
              trackColor={{ true: theme.colors.ember, false: theme.colors.border }}
            />
          }
        />
        <Divider />
        <Row
          label={t('settingsSync')}
          detail={
            (data?.pending ?? 0) > 0 ? t('settingsSyncPending', { count: data?.pending ?? 0 }) : undefined
          }
          onPress={() => void sync()}
        />
        <Divider />
        <Row label={t('memoryTitle')} onPress={() => router.push('/ai-memory')} />
      </View>

      {message ? <Notice tone="secondary">{message}</Notice> : null}

      {session ? (
        <GhostButton
          label={t('settingsSignOut')}
          onPress={() => {
            void signOut();
            router.replace('/(auth)/sign-in');
          }}
        />
      ) : null}
    </Screen>
  );
}
