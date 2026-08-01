// app/auth.tsx — Sign-in / Sign-up screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { signInWithEmail, signUpWithEmail, sendMagicLink } from '../src/lib/auth';
import { hasSupabaseConfig } from '../src/lib/supabase';
import { useTranslation } from '../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';

type AuthMode = 'login' | 'signup' | 'magic';

export default function AuthScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const noConfig = !hasSupabaseConfig();

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);

    try {
      if (mode === 'magic') {
        const res = await sendMagicLink(email.trim());
        if (res.success) {
          setMagicSent(true);
        } else {
          Alert.alert('Error', res.error);
        }
      } else if (mode === 'login') {
        const res = await signInWithEmail(email.trim(), password);
        if (res.success) {
          router.replace('/(tabs)');
        } else {
          Alert.alert('Sign in failed', res.error);
        }
      } else {
        const res = await signUpWithEmail(email.trim(), password);
        if (res.success) {
          Alert.alert(
            'Account created!',
            'Check your email to confirm your address, then sign in.',
            [{ text: 'OK', onPress: () => setMode('login') }]
          );
        } else {
          Alert.alert('Sign up failed', res.error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.logo}>🌿</Text>
          <Text style={styles.title}>
            {mode === 'login' ? t.authLoginTitle : mode === 'signup' ? t.authSignup : t.authMagicLink}
          </Text>

          {/* No-config warning */}
          {noConfig && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                ⚠️  Supabase is not configured yet.{'\n'}
                Add your credentials to the <Text style={styles.warningCode}>.env</Text> file at the project root.{'\n\n'}
                <Text style={styles.warningCode}>
                  EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co{'\n'}
                  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
                </Text>
              </Text>
            </View>
          )}

          {magicSent ? (
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>📧</Text>
              <Text style={styles.successTitle}>{t.authEmailSent}</Text>
            </View>
          ) : (
            <>
              {/* Email */}
              <Text style={styles.label}>{t.authEmail}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textDarkMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Password (login + signup only) */}
              {mode !== 'magic' && (
                <>
                  <Text style={styles.label}>{t.authPassword}</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textDarkMuted}
                    secureTextEntry
                  />
                </>
              )}

              <PrimaryButton
                label={
                  mode === 'login' ? t.authLogin
                  : mode === 'signup' ? t.authSignup
                  : t.authMagicLink
                }
                onPress={handleSubmit}
                loading={loading}
                disabled={!email.trim() || (mode !== 'magic' && !password)}
                style={styles.submitBtn}
                size="lg"
              />

              {/* Mode switchers */}
              <View style={styles.switchRow}>
                {mode === 'login' && (
                  <>
                    <TouchableOpacity onPress={() => setMode('signup')}>
                      <Text style={styles.switchText}>{t.authNoAccount} <Text style={styles.switchLink}>{t.authSignup}</Text></Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMode('magic')} style={{ marginTop: Spacing.sm }}>
                      <Text style={styles.switchText}>Or use <Text style={styles.switchLink}>Magic Link</Text> (no password)</Text>
                    </TouchableOpacity>
                  </>
                )}
                {mode === 'signup' && (
                  <TouchableOpacity onPress={() => setMode('login')}>
                    <Text style={styles.switchText}>{t.authHaveAccount} <Text style={styles.switchLink}>{t.authLogin}</Text></Text>
                  </TouchableOpacity>
                )}
                {mode === 'magic' && (
                  <TouchableOpacity onPress={() => setMode('login')}>
                    <Text style={styles.switchText}>Back to <Text style={styles.switchLink}>Password sign-in</Text></Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Guest note */}
              <Text style={styles.guestNote}>{t.authGuestNote}</Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },

  backBtn: { marginBottom: Spacing.lg },
  backText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textDarkSecondary },

  logo: { fontSize: 52, textAlign: 'center', marginBottom: Spacing.md },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textDark, textAlign: 'center', marginBottom: Spacing.xl },

  warningCard: {
    backgroundColor: `${Colors.amber}18`,
    borderWidth: 1.5,
    borderColor: Colors.amber,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  warningText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.amber, lineHeight: FontSize.sm * 1.7 },
  warningCode: { fontFamily: FontFamily.bold, color: Colors.gold },

  label: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textDarkSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    backgroundColor: Colors.bgDarkCard,
    borderWidth: 1.5,
    borderColor: Colors.bgDarkElevated,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.textDark,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    marginBottom: Spacing.sm,
  },
  submitBtn: { marginTop: Spacing.md, width: '100%' },

  switchRow: { marginTop: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  switchText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textDarkSecondary, textAlign: 'center' },
  switchLink: { fontFamily: FontFamily.semiBold, color: Colors.primary },

  guestNote: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textDarkMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: FontSize.xs * 1.7,
  },

  successCard: { alignItems: 'center', paddingVertical: Spacing.xxl },
  successEmoji: { fontSize: 56, marginBottom: Spacing.lg },
  successTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textDark, textAlign: 'center', lineHeight: FontSize.lg * 1.5 },
});
