// app/settings.tsx — §25 screen 18.
//
// Language, coach style, price, app lock, and the routes out. §25 notes the
// price editor was missing from the earlier build; it's here, and it appends
// a new price point rather than editing the old one, so history stays honest
// (§15).

import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Chip, ChipGroup } from '../src/components/ui/Chip';
import { Field, Stepper } from '../src/components/ui/Field';
import { Row } from '../src/components/ui/Row';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { DEFAULT_CURRENCY, formatMoney, priceAt } from '../src/features/money/cost';
import { LANGUAGE_NAMES, useT, type TranslationKey } from '../src/i18n';
import { setDailyReminder } from '../src/services/notifications';
import { useAuthStore } from '../src/store/useAuthStore';
import { useLogsStore } from '../src/store/useLogsStore';
import { useProfileStore } from '../src/store/useProfileStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { COACH_STYLES, LANGUAGES } from '../src/types';

export default function Settings() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();

  const profile = useProfileStore((s) => s.profile);
  const update = useProfileStore((s) => s.update);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const prices = useLogsStore((s) => s.prices);
  const savePrice = useLogsStore((s) => s.savePrice);

  const currentPrice = priceAt(prices, Date.now());
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState(String(currentPrice?.pricePerPack ?? ''));
  const [perPack, setPerPack] = useState(currentPrice?.cigarettesPerPack ?? 20);

  async function commitPrice() {
    const value = Number.parseFloat(priceDraft);
    if (Number.isFinite(value) && value > 0) {
      // §15 — a new point, not an edit. Everything logged before today keeps
      // the price it was actually bought at.
      await savePrice({
        pricePerPack: value,
        cigarettesPerPack: perPack,
        currency: currentPrice?.currency ?? DEFAULT_CURRENCY,
      });
    }
    setEditingPrice(false);
  }

  return (
    <Screen title={t('settings.title')}>
      <Card>
        <Text variant="caption" tone="muted" weight="medium">
          {t('settings.language')}
        </Text>
        <ChipGroup>
          {LANGUAGES.map((code) => (
            <Chip
              key={code}
              label={LANGUAGE_NAMES[code]}
              selected={profile.language === code}
              onPress={() => {
                void update({ language: code });
                // The reminder's title and body are baked in at schedule time,
                // so a language change has to reschedule it.
                if (profile.reminderHour !== null) {
                  void setDailyReminder(profile.reminderHour, code);
                }
              }}
            />
          ))}
        </ChipGroup>
      </Card>

      <Card>
        <Text variant="caption" tone="muted" weight="medium">
          {t('settings.coachStyle')}
        </Text>
        <ChipGroup>
          {COACH_STYLES.map((style) => (
            <Chip
              key={style}
              label={t(`style.${style}` as TranslationKey)}
              selected={profile.coachStyle === style}
              onPress={() => void update({ coachStyle: style })}
            />
          ))}
        </ChipGroup>
      </Card>

      <Card>
        {editingPrice ? (
          <View style={{ gap: theme.spacing.md }}>
            <Field
              label={t('onboarding.price.pricePerPack')}
              value={priceDraft}
              onChangeText={setPriceDraft}
              keyboardType="decimal-pad"
            />
            <Stepper
              label={t('onboarding.price.perPack')}
              value={perPack}
              onChange={setPerPack}
              min={1}
              max={50}
            />
            <Button label={t('common.save')} onPress={() => void commitPrice()} />
          </View>
        ) : (
          <Row
            label={t('settings.price')}
            value={
              currentPrice
                ? `${formatMoney(currentPrice.pricePerPack, currentPrice.currency)} / ${currentPrice.cigarettesPerPack}`
                : '—'
            }
            onPress={() => setEditingPrice(true)}
            last
          />
        )}
      </Card>

      <Card muted>
        <Row
          label={t('settings.appLock')}
          description={t('settings.appLockBody')}
          toggle={{
            value: profile.appLockEnabled,
            onValueChange: (value) => void update({ appLockEnabled: value }),
          }}
        />
        <Row
          label={t('settings.notifications')}
          value={
            profile.reminderHour === null
              ? t('common.notNow')
              : `${profile.reminderHour.toString().padStart(2, '0')}:00`
          }
          onPress={() => router.push('/notifications')}
        />
        <Row label={t('settings.goals')} onPress={() => router.push('/goals')} />
        <Row label={t('settings.health')} onPress={() => router.push('/health')} last />
      </Card>

      <Card muted>
        <Row label={t('settings.aiMemory')} onPress={() => router.push('/ai-memory')} />
        <Row label={t('settings.privacy')} onPress={() => router.push('/privacy')} />
        <Row label={t('settings.backup')} onPress={() => router.push('/backup')} />
        <Row label={t('settings.help')} onPress={() => router.push('/help')} />
        <Row label={t('settings.about')} onPress={() => router.push('/about')} last />
      </Card>

      <Card muted>
        {session ? (
          <Row
            label={t('settings.signOut')}
            value={session.user.email ?? undefined}
            onPress={() => void signOut()}
          />
        ) : null}
        <Row
          label={t('settings.deleteAccount')}
          destructive
          onPress={() => router.push('/delete-account')}
          last
        />
      </Card>

      <Text variant="caption" tone="muted">
        {t('settings.version', { v: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
    </Screen>
  );
}
