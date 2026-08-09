// app/delete-account.tsx — §25 screen 24.
//
// §23 — confirmation flow into a cascading delete. Two separate actions on
// purpose: a signed-in user deleting their account also wipes this device, but
// somebody who never made an account still needs a way to clear their history,
// and hiding that behind "delete account" would strand them.
//
// The typed confirmation is the one piece of friction in the app that earns
// its place.

import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Field } from '../src/components/ui/Field';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { useT } from '../src/i18n';
import * as haptics from '../src/services/haptics';
import { deleteRemoteAccount } from '../src/services/sync';
import { useAuthStore } from '../src/store/useAuthStore';
import { useLogsStore } from '../src/store/useLogsStore';
import { useProfileStore } from '../src/store/useProfileStore';

export default function DeleteAccount() {
  const t = useT();
  const router = useRouter();

  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const clearEverything = useLogsStore((s) => s.clearEverything);
  const resetProfile = useProfileStore((s) => s.reset);

  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const confirmWord = t('delete.confirmWord');
  const confirmed = typed.trim().toUpperCase() === confirmWord.toUpperCase();

  async function wipe(includeRemote: boolean) {
    setBusy(true);
    // Remote first: if the server delete fails there is still a local copy to
    // retry from, whereas the reverse loses the ability to try again.
    if (includeRemote && session) {
      await deleteRemoteAccount();
      await signOut();
    }
    await clearEverything();
    await resetProfile();
    haptics.tap();
    router.replace('/(onboarding)/welcome');
  }

  return (
    <Screen title={t('delete.title')}>
      <Card>
        <Text variant="body" tone="alert">
          {t('delete.warning')}
        </Text>
      </Card>

      <Field
        label={t('delete.confirmPrompt')}
        value={typed}
        onChangeText={setTyped}
        autoCapitalize="none"
        placeholder={confirmWord}
      />

      {session ? (
        <Button
          label={t('delete.cta')}
          disabled={!confirmed || busy}
          onPress={() => void wipe(true)}
        />
      ) : null}

      <Button
        variant="secondary"
        label={t('delete.localOnly')}
        disabled={!confirmed || busy}
        onPress={() => void wipe(false)}
      />

      <Button variant="quiet" label={t('common.cancel')} onPress={() => router.back()} />
    </Screen>
  );
}
