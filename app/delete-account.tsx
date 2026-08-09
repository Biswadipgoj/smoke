// app/delete-account.tsx — Screen 24: Account deletion
// Types-to-confirm, then a real delete: local SQLite, the stored profile, the
// AI memory, and every remote row for the account.
//
// The remote side cascades from auth.users in supabase/schema.sql, but this
// deletes the rows explicitly first so a user without a session — or with a
// backend that is unreachable — still gets everything wiped from the device
// they are holding, which is the part they can actually verify.

import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Field, GhostButton, Notice, PrimaryButton, Screen } from '../src/components/ui';
import { useTranslation } from '../src/i18n';
import { deleteMemory } from '../src/services/ai/memory';
import { clearLocalData } from '../src/services/db/localDb';
import { deleteRemoteData } from '../src/services/sync/syncQueue';
import { useAppStore } from '../src/store/useAppStore';
import { useAuthStore } from '../src/store/useAuthStore';

export default function DeleteAccount() {
  const router = useRouter();
  const { t } = useTranslation();
  const clearProfile = useAppStore((s) => s.clearProfile);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);

  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const armed = confirmation.trim().toUpperCase() === t('deleteConfirmWord');

  async function wipe() {
    setBusy(true);
    setMessage(null);
    try {
      const userId = session?.user.id ?? null;
      if (userId) await deleteRemoteData(userId);
      await deleteMemory(userId);
      await clearLocalData();
      await clearProfile();
      await signOut();
      router.replace('/(onboarding)/welcome');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('authGeneric'));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <AppText variant="title" tone="alert">
        {t('deleteTitle')}
      </AppText>
      <AppText variant="body" tone="secondary">
        {t('deleteBody')}
      </AppText>

      <Field
        label={t('deleteTypeToConfirm')}
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      {message ? <Notice tone="alert">{message}</Notice> : null}

      <View style={{ flex: 1 }} />
      <PrimaryButton
        label={t('deleteButton')}
        tone="alert"
        disabled={!armed}
        loading={busy}
        onPress={() => void wipe()}
      />
      <GhostButton label={t('cancel')} onPress={() => router.back()} />
    </Screen>
  );
}
