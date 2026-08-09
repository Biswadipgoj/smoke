// app/(auth)/sign-in.tsx — §25 screen 5.
//
// §18 — email/password and magic link. Google OAuth is one call
// (`supabase.auth.signInWithOAuth({ provider: 'google' })`) once a Google
// Cloud OAuth client exists; it isn't scaffolded here because it can't work
// without the project owner's own credentials.
//
// Signing in is optional. "Continue without an account" is a first-class exit,
// not a link buried at the bottom — the app is fully functional offline and
// gating it behind a signup would contradict that.

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '../../src/components/ui/Button';
import { Field } from '../../src/components/ui/Field';
import { Screen } from '../../src/components/ui/Screen';
import { Text } from '../../src/components/ui/Text';
import { useT } from '../../src/i18n';
import * as haptics from '../../src/services/haptics';
import { hasSupabaseConfig } from '../../src/services/supabase/client';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function SignIn() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const { signIn, signUp, sendMagicLink } = useAuthStore();

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const configured = hasSupabaseConfig();
  const toDashboard = () => router.replace('/(tabs)/dashboard');

  async function run(action: () => Promise<string | null>, onSuccess: () => void) {
    setBusy(true);
    setMessage(null);
    const error = await action();
    setBusy(false);
    if (error) {
      haptics.error();
      setMessage(error);
      return;
    }
    onSuccess();
  }

  return (
    <Screen
      title={t('auth.title')}
      back={false}
      footer={
        <Button variant="quiet" label={t('auth.continueOffline')} onPress={toDashboard} />
      }
    >
      <Text variant="body" tone="muted">
        {t('auth.body')}
      </Text>

      {!configured ? (
        <Text variant="bodySmall" tone="muted">
          {t('auth.notConfigured')}
        </Text>
      ) : (
        <View style={{ gap: theme.spacing.lg }}>
          <Field
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Field
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {message ? (
            <Text variant="bodySmall" tone="alert">
              {message}
            </Text>
          ) : null}

          <Button
            label={mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
            disabled={busy || email.length === 0 || password.length < 6}
            onPress={() =>
              void run(
                () => (mode === 'signIn' ? signIn(email, password) : signUp(email, password)),
                toDashboard
              )
            }
          />

          <Button
            variant="secondary"
            label={t('auth.magicLink')}
            disabled={busy || email.length === 0}
            onPress={() =>
              void run(
                () => sendMagicLink(email),
                () => setMessage(t('auth.magicLinkSent'))
              )
            }
          />

          <Button
            variant="quiet"
            label={mode === 'signIn' ? t('auth.needAccount') : t('auth.haveAccount')}
            onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          />
        </View>
      )}
    </Screen>
  );
}
