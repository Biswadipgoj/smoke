// app/settings.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDhruvStore } from '../src/store/useDhruvStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { localeLabels, Locale } from '../src/constants/translations';
import { ThemeMode, Settings } from '../src/domain/types';
import { signOut, clearLocalState } from '../src/lib/auth';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const profile = useDhruvStore((s) => s.profile);
  const updateSettings = useDhruvStore((s) => s.updateSettings);
  const deleteEverything = useDhruvStore((s) => s.deleteEverything);
  const settings = profile?.settings;
  if (!settings) return null;

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'You can sign back in any time — your data stays on the server.', [
      { text: t.cancel, style: 'cancel' },
      {
        text: 'Sign out', onPress: async () => {
          await signOut();
          clearLocalState();
          router.replace('/auth');
        },
      },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(t.settingsDeleteAll, t.settingsDeleteConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirm, style: 'destructive', onPress: async () => {
          await deleteEverything();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t.youSettingsTitle}</Text>

        <Section label={t.settingsLanguage}>
          <Row>
            {(Object.keys(localeLabels) as Locale[]).map((l) => (
              <Choice key={l} label={localeLabels[l]} active={settings.locale === l} onPress={() => updateSettings({ locale: l })} />
            ))}
          </Row>
        </Section>

        <Section label={t.settingsTheme}>
          <Row>
            <Choice label={t.settingsThemeDark} active={settings.themeMode === 'dark'} onPress={() => updateSettings({ themeMode: 'dark' as ThemeMode })} />
            <Choice label={t.settingsThemeOled} active={settings.themeMode === 'oled'} onPress={() => updateSettings({ themeMode: 'oled' as ThemeMode })} />
            <Choice label={t.settingsThemeLight} active={settings.themeMode === 'light'} onPress={() => updateSettings({ themeMode: 'light' as ThemeMode })} />
            <Choice label={t.settingsThemeSystem} active={settings.themeMode === 'system'} onPress={() => updateSettings({ themeMode: 'system' as ThemeMode })} />
          </Row>
        </Section>

        <Section label={t.settingsHaptics}>
          <Row>
            <Choice label={t.settingsHapticsFull} active={settings.hapticsMode === 'full'} onPress={() => updateSettings({ hapticsMode: 'full' })} />
            <Choice label={t.settingsHapticsEssential} active={settings.hapticsMode === 'essential'} onPress={() => updateSettings({ hapticsMode: 'essential' })} />
            <Choice label={t.settingsHapticsOff} active={settings.hapticsMode === 'off'} onPress={() => updateSettings({ hapticsMode: 'off' })} />
          </Row>
        </Section>

        <ToggleRow label={t.settingsAppLock} value={settings.appLockEnabled} onChange={(v) => updateSettings({ appLockEnabled: v })} />
        <ToggleRow label={t.settingsStealthMode} value={settings.stealthModeEnabled} onChange={(v) => updateSettings({ stealthModeEnabled: v })} />
        <ToggleRow label={t.settingsNotifications} value={settings.notificationsEnabled} onChange={(v) => updateSettings({ notificationsEnabled: v })} />
        <ToggleRow label="Reduce motion" value={settings.reducedMotion} onChange={(v) => updateSettings({ reducedMotion: v })} />

        <Section label={t.settingsCurrency}>
          <Row>
            {(['₹', '৳', '$'] as Settings['currency'][]).map((c) => (
              <Choice key={c} label={c} active={settings.currency === c} onPress={() => updateSettings({ currency: c })} />
            ))}
          </Row>
        </Section>

        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/crisis')}>
          <Text style={styles.linkText}>{t.settingsCrisisResources}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Account</Text>
        <TouchableOpacity style={styles.linkRow} onPress={confirmSignOut}>
          <Text style={styles.linkText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>{t.settingsData}</Text>
        <TouchableOpacity style={styles.destructiveRow} onPress={confirmDelete}>
          <Text style={styles.destructiveText}>{t.settingsDeleteAll}</Text>
        </TouchableOpacity>
        <Text style={styles.aboutText}>
          This clears your tracks, events, and history on the server and this device but keeps your
          account signed in. To delete the account itself, contact support — client apps can't remove
          an auth account directly (see SETUP.md).
        </Text>

        <Text style={styles.aboutText}>
          {t.settingsAbout} — Dhruv was created by{' '}
          <Text style={styles.aboutLink} onPress={() => Linking.openURL('https://biswadip.in')}>
            Biswodip Goj (biswadip.in)
          </Text>
          . The urge and lapse flows work fully offline and sync when you're back online; the
          companion's open conversation uses a language model from Google when you're online, with
          a fully offline guided fallback.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.choice, active && styles.choiceActive]} onPress={onPress}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={() => onChange(!value)}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggleTrack, value && styles.toggleTrackActive]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nishith },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xl, color: Colors.bone, marginBottom: Spacing.lg },
  sectionLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.boneSecondary, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  choice: { borderWidth: 1, borderColor: Colors.nilElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
  choiceActive: { borderColor: Colors.bhor, backgroundColor: Colors.bhorSoft },
  choiceText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.boneSecondary },
  choiceTextActive: { color: Colors.bhor },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.hairline },
  toggleLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.bone },
  toggleTrack: { width: 44, height: 26, borderRadius: 13, backgroundColor: Colors.nilElevated, padding: 2, justifyContent: 'center' },
  toggleTrackActive: { backgroundColor: Colors.bhorSoft },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.boneMuted },
  toggleThumbActive: { backgroundColor: Colors.bhor, alignSelf: 'flex-end' },
  linkRow: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.hairline },
  linkText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.bone },
  destructiveRow: { backgroundColor: Colors.chhaiSoft, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  destructiveText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.bone },
  aboutText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.boneMuted, marginTop: Spacing.xxl, lineHeight: FontSize.xs * 1.6 },
  aboutLink: { color: Colors.bhor, textDecorationLine: 'underline' },
});
