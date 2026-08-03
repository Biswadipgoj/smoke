// app/auth.tsx — sign in / sign up. A full account-based backend means this
// screen is mandatory before onboarding or any tab: the server is the
// source of truth, so there is no local guest data to fall back to.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmail, signUpWithEmail, hydrateFromRemote } from '../src/lib/auth';
import { hasSupabaseConfig } from '../src/lib/supabase';
import { useDhruvStore } from '../src/store/useDhruvStore';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUpNotice, setSignedUpNotice] = useState(false);

  const submit = async () => {
    setError(null);
    if (!hasSupabaseConfig()) {
      setError('Backend not configured yet — see SETUP.md to connect Supabase.');
      return;
    }
    if (!email.includes('@') || password.length < 6) {
      setError('Enter a valid email and a password of at least 6 characters.');
      return;
    }
    setLoading(true);
    const result = mode === 'signin' ? await signInWithEmail(email, password) : await signUpWithEmail(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (!result.hasSession) {
      // Email confirmation is required and no session exists yet — show a
      // notice rather than silently failing to route forward.
      setSignedUpNotice(true);
      return;
    }
    await hydrateFromRemote();
    const onboardingComplete = useDhruvStore.getState().profile?.onboardingComplete;
    router.replace(onboardingComplete ? '/(tabs)' : '/onboarding');
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>
        <View style={styles.content}>
          <Text style={styles.brand}>Dhruv</Text>

          {signedUpNotice ? (
            <View>
              <Text style={styles.notice}>
                Check {email} for a confirmation link, then come back and sign in.
              </Text>
              <TouchableOpacity style={styles.submitBtn} onPress={() => { setSignedUpNotice(false); setMode('signin'); }}>
                <Text style={styles.submitBtnText}>Back to sign in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.subtitle}>{mode === 'signin' ? 'Sign in to continue' : 'Create an account'}</Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={Colors.boneMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={Colors.boneMuted}
                secureTextEntry
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.nishith} /> : (
                  <Text style={styles.submitBtnText}>{mode === 'signin' ? 'Sign in' : 'Sign up'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={styles.switchLink}>
                <Text style={styles.switchLinkText}>
                  {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nishith },
  content: { padding: Spacing.lg },
  brand: { fontFamily: FontFamily.regular, fontSize: FontSize.display, color: Colors.bhor, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.boneSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  input: { backgroundColor: Colors.nil, borderWidth: 1.5, borderColor: Colors.nilElevated, borderRadius: Radius.md, padding: Spacing.md, color: Colors.bone, fontFamily: FontFamily.regular, fontSize: FontSize.base, marginBottom: Spacing.md },
  error: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.bhor, marginBottom: Spacing.md, textAlign: 'center' },
  notice: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.bone, textAlign: 'center', lineHeight: FontSize.base * 1.5, marginBottom: Spacing.xl },
  submitBtn: { backgroundColor: Colors.bhor, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  submitBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.nishith },
  switchLink: { alignItems: 'center', marginTop: Spacing.lg },
  switchLinkText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.boneMuted },
});
