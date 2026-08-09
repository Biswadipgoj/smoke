// app/(auth)/sign-in.tsx — Screen 5: Authentication
// Email/password and magic link, both via Supabase Auth (§18).
//
// An account is optional here, and that is a product decision rather than a
// missing feature: the person most likely to bounce off a sign-up wall is the
// person who opened this app because they are having a craving right now.
// Everything works without one; signing in adds backup and a second device.
//
// Google OAuth is one call — supabase.auth.signInWithOAuth({ provider:
// 'google' }) — but it needs a Google Cloud OAuth client that only the app's
// owner can create, so it is documented in SETUP.md rather than stubbed here
// with credentials that cannot exist.

import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Field, GhostButton, Notice, PrimaryButton, Screen } from '../../src/components/ui';
import { useTranslation } from '../../src/i18n';
import { hasSupabaseConfig, supabase } from '../../src/services/supabase/client';
import { syncNow } from '../../src/services/sync/syncQueue';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function SignIn() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const configured = hasSupabaseConfig();

  function enterApp() {
    router.replace('/(tabs)/dashboard');
  }

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'sign-up') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        // With email confirmation on (the Supabase default) there is no
        // session yet; with it off there is one immediately. Handle both.
        if (data.session) {
          await syncNow(data.session.user.id);
          enterApp();
          return;
        }
        setMessage(t('authSignUpDone'));
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        await syncNow(data.session?.user.id ?? null);
        enterApp();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('authGeneric'));
    } finally {
      setBusy(false);
    }
  }

  async function magicLink() {
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (error) throw error;
      setMessage(t('authMagicSent'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('authGeneric'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="title">{t('authTitle')}</AppText>
        <AppText variant="body" tone="secondary">
          {t('authSubtitle')}
        </AppText>
      </View>

      {!configured ? <Notice>{t('authNoBackend')}</Notice> : null}

      <Field
        label={t('authEmail')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        editable={configured}
      />
      <Field
        label={t('authPassword')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        editable={configured}
      />

      {message ? <Notice tone="secondary">{message}</Notice> : null}

      <PrimaryButton
        label={mode === 'sign-up' ? t('authSignUp') : t('authSignIn')}
        loading={busy}
        disabled={!configured || email.length < 3 || password.length < 6}
        onPress={() => void submit()}
      />

      <GhostButton
        label={t('authMagicLink')}
        onPress={() => void magicLink()}
      />
      <GhostButton
        label={mode === 'sign-in' ? t('authNeedAccount') : t('authHaveAccount')}
        onPress={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
      />

      <View style={{ flex: 1 }} />
      <GhostButton label={t('authContinueLocal')} tone="ember" onPress={enterApp} />
    </Screen>
  );
}
