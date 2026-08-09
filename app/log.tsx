// app/log.tsx — logging a cigarette
// Reachable from the dashboard and from the end of the craving flow.
//
// The whole screen is built to be uneventful. One light haptic on save, the
// number on the dashboard changes, nothing animates, nothing turns red, and
// the copy says out loud that this is how the numbers stay honest (§11, §12).

import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppText,
  Chip,
  ChipRow,
  Field,
  GhostButton,
  PrimaryButton,
  Screen,
} from '../src/components/ui';
import { triggerLabel } from '../src/features/cravings/interventionEngine';
import { useTranslation } from '../src/i18n';
import { haptic } from '../src/services/haptics';
import { insertCigaretteLog } from '../src/services/db/localDb';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { TRIGGERS, type Trigger } from '../src/types';

const COUNTS = [1, 2, 3, 4, 5];

export default function LogCigarette() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);

  const [count, setCount] = useState(1);
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await insertCigaretteLog({
      userId: session?.user.id ?? null,
      count,
      trigger,
      note: note.trim() || null,
    });
    haptic('cigarette-logged');
    router.back();
  }

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="title">{t('logTitle')}</AppText>
        <AppText variant="body" tone="secondary">
          {t('logSubtitle')}
        </AppText>
      </View>

      <AppText variant="small" tone="secondary">
        {t('logCount')}
      </AppText>
      <ChipRow>
        {COUNTS.map((value) => (
          <Chip
            key={value}
            label={String(value)}
            selected={count === value}
            onPress={() => setCount(value)}
          />
        ))}
      </ChipRow>

      <AppText variant="small" tone="secondary">
        {t('logTrigger')}
      </AppText>
      <ChipRow>
        {TRIGGERS.map((option) => (
          <Chip
            key={option}
            label={triggerLabel(option, t)}
            selected={trigger === option}
            onPress={() => setTrigger(trigger === option ? null : option)}
          />
        ))}
      </ChipRow>

      <Field label={t('logNote')} value={note} onChangeText={setNote} multiline />

      <View style={{ flex: 1 }} />
      <PrimaryButton label={t('logSubmit')} loading={saving} onPress={() => void save()} />
      <GhostButton label={t('cancel')} onPress={() => router.back()} />
    </Screen>
  );
}
