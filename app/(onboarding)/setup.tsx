// app/(onboarding)/setup.tsx — Screen 4: Onboarding (the rest)
// Baseline count and price, the goal, and the coaching style — three steps in
// one screen because they are one decision the user is making about how this
// will work, and three separate screens would make it feel like a form.
//
// The baseline number is load-bearing: it seeds the delay algorithm and every
// "money saved" and "under baseline" figure afterwards. Which is why the copy
// asks for a rough number and says so — an accurate-feeling number the user
// invented is worse than an honest approximation.

import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppText,
  Card,
  Chip,
  ChipRow,
  Field,
  GhostButton,
  PrimaryButton,
  Screen,
} from '../../src/components/ui';
import { useTranslation } from '../../src/i18n';
import { insertGoal, insertPricePoint } from '../../src/services/db/localDb';
import { useAppStore } from '../../src/store/useAppStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { COACH_STYLES, type CoachStyle } from '../../src/types';

const STYLE_COPY: Record<CoachStyle, { title: 'styleCalm' | 'styleDirect' | 'styleScientific' | 'styleEncouraging' | 'styleMinimal'; hint: 'styleCalmHint' | 'styleDirectHint' | 'styleScientificHint' | 'styleEncouragingHint' | 'styleMinimalHint' }> = {
  calm: { title: 'styleCalm', hint: 'styleCalmHint' },
  direct: { title: 'styleDirect', hint: 'styleDirectHint' },
  scientific: { title: 'styleScientific', hint: 'styleScientificHint' },
  encouraging: { title: 'styleEncouraging', hint: 'styleEncouragingHint' },
  minimal: { title: 'styleMinimal', hint: 'styleMinimalHint' },
};

export default function Setup() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const session = useAuthStore((s) => s.session);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [perDay, setPerDay] = useState('10');
  const [price, setPrice] = useState('12');
  const [goalKind, setGoalKind] = useState<'reduce' | 'quit'>('reduce');
  const [target, setTarget] = useState('5');
  const [style, setStyle] = useState<CoachStyle>(profile?.coachStyle ?? 'calm');
  const [saving, setSaving] = useState(false);

  const baseline = Math.max(1, Math.round(Number(perDay) || 0));
  const pricePerCigarette = Math.max(0, Number(price) || 0);
  const targetPerDay = goalKind === 'quit' ? 0 : Math.max(0, Math.round(Number(target) || 0));

  async function finish() {
    setSaving(true);
    const userId = session?.user.id ?? null;
    await insertPricePoint(pricePerCigarette, profile?.currency ?? '₹', userId, Date.now());
    await insertGoal(targetPerDay, userId);
    await updateProfile({
      baselinePerDay: baseline,
      coachStyle: style,
      onboardingComplete: true,
      startedAtMs: Date.now(),
    });
    router.replace('/(auth)/sign-in');
  }

  return (
    <Screen>
      {step === 0 ? (
        <>
          <View style={{ gap: theme.spacing.sm }}>
            <AppText variant="title">{t('obBaselineTitle')}</AppText>
            <AppText variant="body" tone="secondary">
              {t('obBaselineSubtitle')}
            </AppText>
          </View>
          <Field
            label={t('obPerDayLabel')}
            value={perDay}
            onChangeText={setPerDay}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Field
            label={t('obPriceLabel')}
            hint={t('obPriceHint')}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            maxLength={7}
          />
          <View style={{ flex: 1 }} />
          <PrimaryButton label={t('continue')} onPress={() => setStep(1)} />
          <GhostButton label={t('back')} onPress={() => router.back()} />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <View style={{ gap: theme.spacing.sm }}>
            <AppText variant="title">{t('obGoalTitle')}</AppText>
            <AppText variant="body" tone="secondary">
              {t('obGoalSubtitle')}
            </AppText>
          </View>

          <Card onPress={() => setGoalKind('reduce')} raised={goalKind === 'reduce'}>
            <AppText variant="subheading" tone={goalKind === 'reduce' ? 'ember' : 'default'}>
              {t('obGoalReduce')}
            </AppText>
            <AppText variant="small" tone="secondary">
              {t('obGoalReduceHint')}
            </AppText>
          </Card>

          <Card onPress={() => setGoalKind('quit')} raised={goalKind === 'quit'}>
            <AppText variant="subheading" tone={goalKind === 'quit' ? 'ember' : 'default'}>
              {t('obGoalQuit')}
            </AppText>
            <AppText variant="small" tone="secondary">
              {t('obGoalQuitHint')}
            </AppText>
          </Card>

          {goalKind === 'reduce' ? (
            <Field
              label={t('obGoalTargetLabel')}
              value={target}
              onChangeText={setTarget}
              keyboardType="number-pad"
              maxLength={3}
            />
          ) : null}

          <View style={{ flex: 1 }} />
          <PrimaryButton label={t('continue')} onPress={() => setStep(2)} />
          <GhostButton label={t('back')} onPress={() => setStep(0)} />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <View style={{ gap: theme.spacing.sm }}>
            <AppText variant="title">{t('obStyleTitle')}</AppText>
            <AppText variant="body" tone="secondary">
              {t('obStyleSubtitle')}
            </AppText>
          </View>

          <ChipRow>
            {COACH_STYLES.map((option) => (
              <Chip
                key={option}
                label={t(STYLE_COPY[option].title)}
                selected={style === option}
                onPress={() => setStyle(option)}
              />
            ))}
          </ChipRow>

          <Card>
            <AppText variant="subheading">{t(STYLE_COPY[style].title)}</AppText>
            <AppText variant="small" tone="secondary">
              {t(STYLE_COPY[style].hint)}
            </AppText>
          </Card>

          <View style={{ flex: 1 }} />
          <PrimaryButton label={t('obFinish')} loading={saving} onPress={() => void finish()} />
          <GhostButton label={t('back')} onPress={() => setStep(1)} />
        </>
      ) : null}
    </Screen>
  );
}
