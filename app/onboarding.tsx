// app/onboarding.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore, Motivation, GoalType, UserProfile } from '../src/store/useAppStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { translations, localeLabels, Locale } from '../src/constants/translations';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 4;

export default function Onboarding() {
  const { t } = useTranslation();
  const { profile, setProfile, updateProfile } = useAppStore();
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Step 0 — Welcome
  // Step 1 — Language
  // Step 2 — Baseline
  // Step 3 — Motivation + Goal

  const [selectedLocale, setSelectedLocale] = useState<Locale>(profile?.locale ?? 'en');
  const [dailyCount, setDailyCount] = useState(String(profile?.dailyBaseline ?? '10'));
  const [costPerPack, setCostPerPack] = useState(String(profile?.costPerPack ?? '250'));
  const [cigsPerPack, setCigsPerPack] = useState(String(profile?.cigsPerPack ?? '20'));
  const [currency, setCurrency] = useState(profile?.currency ?? '₹');
  const [selectedMotivations, setSelectedMotivations] = useState<Motivation[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalType>('reduce');

  const currentT = translations[selectedLocale];

  const animateNext = () => {
    Animated.timing(slideAnim, {
      toValue: -1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      slideAnim.setValue(1);
      setStep((s) => s + 1);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    if (step === 1) {
      updateProfile({ locale: selectedLocale });
    }
    if (step === 2) {
      updateProfile({
        dailyBaseline: Math.min(100, Math.max(1, parseInt(dailyCount) || 10)),
        costPerPack: parseFloat(costPerPack) || 250,
        cigsPerPack: Math.min(40, Math.max(1, parseInt(cigsPerPack) || 20)),
        currency,
      });
    }
    if (step < TOTAL_STEPS - 1) {
      animateNext();
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    const newProfile: UserProfile = {
      ...(profile ?? {
        id: `user_${Date.now()}`,
        isGuest: true,
        startDate: new Date().toISOString(),
        themeMode: 'dark',
        notificationsEnabled: true,
        email: undefined,
        name: undefined,
      }),
      locale: selectedLocale,
      dailyBaseline: Math.min(100, Math.max(1, parseInt(dailyCount) || 10)),
      costPerPack: parseFloat(costPerPack) || 250,
      cigsPerPack: Math.min(40, Math.max(1, parseInt(cigsPerPack) || 20)),
      currency,
      motivations: selectedMotivations,
      goalType: selectedGoal,
      onboardingComplete: true,
    };
    setProfile(newProfile);
    router.replace('/(tabs)');
  };

  const toggleMotivation = (m: Motivation) => {
    setSelectedMotivations((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const slideX = slideAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-width * 0.3, 0, width * 0.3],
  });

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i <= step && styles.dotActive]}
            />
          ))}
        </View>

        <Animated.View
          style={[styles.content, { transform: [{ translateX: slideX }], opacity: slideAnim.interpolate({ inputRange: [-1, -0.5, 0, 0.5, 1], outputRange: [0, 0, 1, 0, 0] }).interpolate ? undefined : undefined }]}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 0 && <StepWelcome t={currentT} />}
            {step === 1 && (
              <StepLanguage
                t={currentT}
                selected={selectedLocale}
                onSelect={setSelectedLocale}
              />
            )}
            {step === 2 && (
              <StepBaseline
                t={currentT}
                dailyCount={dailyCount}
                setDailyCount={setDailyCount}
                costPerPack={costPerPack}
                setCostPerPack={setCostPerPack}
                cigsPerPack={cigsPerPack}
                setCigsPerPack={setCigsPerPack}
                currency={currency}
                setCurrency={setCurrency}
              />
            )}
            {step === 3 && (
              <StepGoal
                t={currentT}
                motivations={selectedMotivations}
                onToggleMotivation={toggleMotivation}
                goal={selectedGoal}
                onSelectGoal={setSelectedGoal}
              />
            )}
          </ScrollView>
        </Animated.View>

        {/* Bottom actions */}
        <View style={styles.actions}>
          {step > 0 && (
            <TouchableOpacity
              onPress={() => setStep((s) => s - 1)}
              style={styles.backBtn}
            >
              <Text style={styles.backText}>← {currentT.back}</Text>
            </TouchableOpacity>
          )}
          <PrimaryButton
            label={step === TOTAL_STEPS - 1 ? currentT.onboardingDone : currentT.next}
            onPress={handleNext}
            style={styles.nextBtn}
            size="lg"
          />
          {step > 0 && (
            <TouchableOpacity onPress={handleComplete} style={styles.skipBtn}>
              <Text style={styles.skipText}>{currentT.skip}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepWelcome({ t }: { t: typeof translations.en }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.bigEmoji}>🌿</Text>
      <Text style={styles.stepTitle}>{t.onboardingWelcomeTitle}</Text>
      <Text style={styles.stepSubtitle}>{t.onboardingWelcomeSubtitle}</Text>
      <View style={styles.featureList}>
        {[
          { icon: '⏱️', text: 'Guided craving delay sessions' },
          { icon: '🤝', text: 'Non-judgmental AI coaching' },
          { icon: '📊', text: 'Honest progress tracking' },
          { icon: '🌍', text: 'English · हिंदी · বাংলা' },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StepLanguage({
  t,
  selected,
  onSelect,
}: {
  t: typeof translations.en;
  selected: Locale;
  onSelect: (l: Locale) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.bigEmoji}>🌐</Text>
      <Text style={styles.stepTitle}>{t.onboardingLangTitle}</Text>
      <Text style={styles.stepSubtitle}>{t.onboardingLangSubtitle}</Text>
      {(Object.keys(localeLabels) as Locale[]).map((l) => (
        <TouchableOpacity
          key={l}
          style={[styles.langOption, selected === l && styles.langOptionSelected]}
          onPress={() => onSelect(l)}
        >
          <Text style={[styles.langLabel, selected === l && styles.langLabelSelected]}>
            {localeLabels[l]}
          </Text>
          {selected === l && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function StepBaseline({
  t,
  dailyCount, setDailyCount,
  costPerPack, setCostPerPack,
  cigsPerPack, setCigsPerPack,
  currency, setCurrency,
}: {
  t: typeof translations.en;
  dailyCount: string; setDailyCount: (v: string) => void;
  costPerPack: string; setCostPerPack: (v: string) => void;
  cigsPerPack: string; setCigsPerPack: (v: string) => void;
  currency: string; setCurrency: (v: string) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.bigEmoji}>📋</Text>
      <Text style={styles.stepTitle}>{t.onboardingBaselineTitle}</Text>
      <Text style={styles.stepSubtitle}>{t.onboardingBaselineSubtitle}</Text>
      <LabeledInput label={t.onboardingDailyCount} value={dailyCount} onChangeText={setDailyCount} keyboardType="numeric" placeholder={t.onboardingDailyCountPlaceholder} />
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          <LabeledInput label={t.onboardingCostPerPack} value={costPerPack} onChangeText={setCostPerPack} keyboardType="decimal-pad" placeholder={t.onboardingCostPlaceholder} />
        </View>
        <View style={{ width: 80 }}>
          <LabeledInput label={t.onboardingCurrency} value={currency} onChangeText={setCurrency} placeholder="₹" />
        </View>
      </View>
      <LabeledInput label={t.onboardingCigsPerPack} value={cigsPerPack} onChangeText={setCigsPerPack} keyboardType="numeric" placeholder="20" />
    </View>
  );
}

function LabeledInput({ label, value, onChangeText, keyboardType = 'default', placeholder }: {
  label: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad'; placeholder?: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={Colors.textDarkMuted}
        placeholder={placeholder}
      />
    </View>
  );
}

function StepGoal({
  t,
  motivations,
  onToggleMotivation,
  goal,
  onSelectGoal,
}: {
  t: typeof translations.en;
  motivations: Motivation[];
  onToggleMotivation: (m: Motivation) => void;
  goal: GoalType;
  onSelectGoal: (g: GoalType) => void;
}) {
  const motivMap: { key: Motivation; label: string }[] = [
    { key: 'family', label: t.onboardingMotivFamily },
    { key: 'health', label: t.onboardingMotivHealth },
    { key: 'money', label: t.onboardingMotivMoney },
    { key: 'feel', label: t.onboardingMotivFeel },
    { key: 'other', label: t.onboardingMotivOther },
  ];
  const goals: { key: GoalType; label: string; desc: string }[] = [
    { key: 'quit', label: t.onboardingGoalQuit, desc: t.onboardingGoalQuitDesc },
    { key: 'reduce', label: t.onboardingGoalReduce, desc: t.onboardingGoalReduceDesc },
    { key: 'track', label: t.onboardingGoalTrack, desc: t.onboardingGoalTrackDesc },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.bigEmoji}>💪</Text>
      <Text style={styles.stepTitle}>{t.onboardingMotivationTitle}</Text>
      <Text style={styles.stepSubtitle}>{t.onboardingMotivationSubtitle}</Text>
      <View style={styles.chipRow}>
        {motivMap.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.chip, motivations.includes(m.key) && styles.chipSelected]}
            onPress={() => onToggleMotivation(m.key)}
          >
            <Text style={[styles.chipText, motivations.includes(m.key) && styles.chipTextSelected]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.stepTitle, { marginTop: Spacing.xl, fontSize: FontSize.lg }]}>
        {t.onboardingGoalTitle}
      </Text>
      <Text style={styles.stepSubtitle}>{t.onboardingGoalSubtitle}</Text>

      {goals.map((g) => (
        <TouchableOpacity
          key={g.key}
          style={[styles.goalOption, goal === g.key && styles.goalOptionSelected]}
          onPress={() => onSelectGoal(g.key)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.goalLabel, goal === g.key && styles.goalLabelSelected]}>
              {g.label}
            </Text>
            <Text style={styles.goalDesc}>{g.desc}</Text>
          </View>
          {goal === g.key && (
            <View style={styles.goalCheck}>
              <Text style={{ color: Colors.bgDark, fontFamily: FontFamily.bold }}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.textDarkMuted,
  },
  dotActive: { backgroundColor: Colors.primary, width: 20 },
  content: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  stepContainer: { paddingTop: Spacing.xl },
  bigEmoji: { fontSize: 56, textAlign: 'center', marginBottom: Spacing.lg },
  stepTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: FontSize.xxl * 1.3,
  },
  stepSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textDarkSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: FontSize.base * 1.6,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  nextBtn: { width: '100%' },
  backBtn: { alignSelf: 'center' },
  backText: { fontFamily: FontFamily.medium, color: Colors.textDarkSecondary, fontSize: FontSize.base },
  skipBtn: { alignSelf: 'center', paddingVertical: Spacing.xs },
  skipText: { fontFamily: FontFamily.regular, color: Colors.textDarkMuted, fontSize: FontSize.sm },

  // Feature list
  featureList: { gap: Spacing.md, marginTop: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  featureText: { fontFamily: FontFamily.regular, color: Colors.textDark, fontSize: FontSize.base, flex: 1 },

  // Language options
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.bgDarkElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.bgDarkCard,
  },
  langOptionSelected: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}18` },
  langLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.md, color: Colors.textDark },
  langLabelSelected: { color: Colors.primary },
  checkmark: { color: Colors.primary, fontFamily: FontFamily.bold, fontSize: FontSize.md },

  // Baseline inputs
  row: { flexDirection: 'row' },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textDarkSecondary, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.bgDarkCard,
    borderWidth: 1.5,
    borderColor: Colors.bgDarkElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textDark,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
  },

  // Motivation chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    borderWidth: 1.5,
    borderColor: Colors.bgDarkElevated,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.bgDarkCard,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}22` },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textDarkSecondary },
  chipTextSelected: { color: Colors.primary },

  // Goal options
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.bgDarkElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.bgDarkCard,
  },
  goalOptionSelected: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}18` },
  goalLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textDark, marginBottom: 2 },
  goalLabelSelected: { color: Colors.primary },
  goalDesc: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textDarkSecondary, lineHeight: FontSize.sm * 1.5 },
  goalCheck: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});
