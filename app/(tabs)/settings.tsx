// app/(tabs)/settings.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useTheme } from '../../src/hooks/useTheme';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { localeLabels, Locale } from '../../src/constants/translations';

function SettingRow({
  label,
  value,
  onPress,
  rightElement,
  danger,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.settingRow, { borderBottomColor: colors.glassBorder }]}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightElement}
    >
      <Text style={[styles.settingLabel, danger && styles.dangerLabel, { color: danger ? Colors.error : colors.text }]}>
        {label}
      </Text>
      <View style={styles.settingRight}>
        {value ? <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text> : null}
        {rightElement}
        {onPress && !rightElement && (
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const { profile, updateProfile, resetAll } = useAppStore();
  const [deleteStep, setDeleteStep] = useState(0);

  if (!profile) return null;

  const handleLanguage = (locale: Locale) => {
    updateProfile({ locale });
  };

  const handleTheme = (mode: 'dark' | 'light' | 'system') => {
    updateProfile({ themeMode: mode });
  };

  const handleDeleteAccount = () => {
    if (deleteStep === 0) {
      Alert.alert(
        t.settingsDelete,
        t.settingsDeleteConfirm,
        [
          { text: t.cancel, style: 'cancel' },
          { text: t.settingsDelete, style: 'destructive', onPress: () => setDeleteStep(1) },
        ]
      );
    } else {
      Alert.alert(
        'Final confirmation',
        t.settingsDeleteWarning,
        [
          { text: t.cancel, style: 'cancel', onPress: () => setDeleteStep(0) },
          {
            text: t.delete,
            style: 'destructive',
            onPress: () => {
              resetAll();
              router.replace('/onboarding');
            },
          },
        ]
      );
    }
  };

  const handleExport = () => {
    Alert.alert(
      t.settingsExport,
      'Your data has been prepared. In a full build, this would generate a JSON file download.',
      [{ text: 'OK' }]
    );
  };

  const themeOptions: Array<{ key: 'dark' | 'light' | 'system'; label: string }> = [
    { key: 'dark', label: t.settingsThemeDark },
    { key: 'light', label: t.settingsThemeLight },
    { key: 'system', label: t.settingsThemeSystem },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t.settingsTitle}</Text>

        {/* Language */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.settingsLanguage}</Text>
        <GlassCard style={styles.card}>
          {(Object.keys(localeLabels) as Locale[]).map((locale, i, arr) => (
            <TouchableOpacity
              key={locale}
              style={[
                styles.settingRow,
                { borderBottomColor: colors.glassBorder },
                i === arr.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => handleLanguage(locale)}
            >
              <Text style={[styles.settingLabel, { color: colors.text }]}>{localeLabels[locale]}</Text>
              {profile.locale === locale && (
                <Text style={styles.selectedCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </GlassCard>

        {/* Theme */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.settingsTheme}</Text>
        <GlassCard style={styles.card}>
          {themeOptions.map((opt, i) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.settingRow,
                { borderBottomColor: colors.glassBorder },
                i === themeOptions.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => handleTheme(opt.key)}
            >
              <Text style={[styles.settingLabel, { color: colors.text }]}>{opt.label}</Text>
              {profile.themeMode === opt.key && (
                <Text style={styles.selectedCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </GlassCard>

        {/* Notifications */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.settingsNotifications}</Text>
        <GlassCard style={styles.card}>
          <SettingRow
            label={t.settingsNotifications}
            rightElement={
              <Switch
                value={profile.notificationsEnabled}
                onValueChange={(v) => updateProfile({ notificationsEnabled: v })}
                trackColor={{ false: Colors.bgDarkElevated, true: Colors.primaryMuted }}
                thumbColor={profile.notificationsEnabled ? Colors.primary : Colors.textDarkMuted}
              />
            }
          />
        </GlassCard>

        {/* Account */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.settingsAccount}</Text>
        <GlassCard style={styles.card}>
          <SettingRow
            label={profile.isGuest ? 'Guest account' : (profile.email ?? 'Account')}
            value={profile.isGuest ? 'Sign in to save data' : undefined}
            onPress={profile.isGuest ? () => Alert.alert('Sign in', 'Full auth with Supabase requires your project URL and anon key. See SETUP.md.') : undefined}
          />
          <SettingRow label={t.settingsExport} onPress={handleExport} />
        </GlassCard>

        {/* Crisis resources */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.settingsCrisis}</Text>
        <GlassCard style={styles.card}>
          <SettingRow
            label="iCall India"
            value="9152987821"
            onPress={() => Linking.openURL('tel:9152987821')}
          />
          <SettingRow
            label="Vandrevala Foundation"
            value="1860-2662-345"
            onPress={() => Linking.openURL('tel:18602662345')}
          />
          <SettingRow
            label="Tobacco Quitline India"
            value="1800-11-2356"
            onPress={() => Linking.openURL('tel:18001112356')}
          />
        </GlassCard>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.settingsAbout}</Text>
        <GlassCard style={styles.card}>
          <SettingRow label={t.settingsVersion} value="1.0.0" />
          <SettingRow
            label="View source / contribute"
            onPress={() => Alert.alert('GitHub', 'Link your repository here.')}
          />
        </GlassCard>

        {/* Danger zone */}
        <GlassCard style={[styles.card, styles.dangerCard]}>
          <SettingRow
            label={t.settingsDelete}
            onPress={handleDeleteAccount}
            danger
          />
        </GlassCard>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  pageTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, marginBottom: Spacing.lg },
  sectionTitle: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  card: { marginBottom: Spacing.xs, padding: 0, overflow: 'hidden' },
  dangerCard: { borderColor: `${Colors.error}44` },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
  },
  settingLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, flex: 1 },
  dangerLabel: { color: Colors.error },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  settingValue: { fontFamily: FontFamily.regular, fontSize: FontSize.sm },
  chevron: { fontSize: FontSize.lg, fontFamily: FontFamily.regular },
  selectedCheck: { color: Colors.primary, fontFamily: FontFamily.bold, fontSize: FontSize.md },
});
