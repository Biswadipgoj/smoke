// app/(onboarding)/setup.tsx — §25 screen 4, the rest of onboarding.
//
// Five questions: baseline, goal, target, price, coach style. One per view so
// nothing is a wall of form, and every one of them has a usable default —
// somebody who taps straight through still ends up with a working app.

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import { Field, Stepper } from '../../src/components/ui/Field';
import { Screen } from '../../src/components/ui/Screen';
import { Text } from '../../src/components/ui/Text';
import { DEFAULT_CURRENCY } from '../../src/features/money/cost';
import { useT, type TranslationKey } from '../../src/i18n';
import * as haptics from '../../src/services/haptics';
import { useLogsStore } from '../../src/store/useLogsStore';
import { useProfileStore } from '../../src/store/useProfileStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { COACH_STYLES, type CoachStyle, type GoalType } from '../../src/types';

type Step = 'baseline' | 'goal' | 'target' | 'quitDate' | 'price' | 'style' | 'done';

const ORDER: Step[] = ['baseline', 'goal', 'target', 'quitDate', 'price', 'style', 'done'];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Relative choices rather than a calendar. Picking a quit date is a decision
 * about how much runway you want, not about a particular Tuesday, and a date
 * picker turns a two-second answer into a scrolling exercise. It stays
 * changeable from Goals afterwards.
 */
const QUIT_DATE_OPTIONS = [
  { key: 'quitDate.today' as const, offsetDays: 0 },
  { key: 'quitDate.week' as const, offsetDays: 7 },
  { key: 'quitDate.month' as const, offsetDays: 30 },
  { key: 'quitDate.later' as const, offsetDays: null },
];

export default function Setup() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const update = useProfileStore((s) => s.update);
  const savePrice = useLogsStore((s) => s.savePrice);

  const [step, setStep] = useState<Step>('baseline');
  const [baseline, setBaseline] = useState(profile.baselineCigarettesPerDay);
  const [goalType, setGoalType] = useState<GoalType>(profile.goalType);
  const [target, setTarget] = useState(profile.targetCigarettesPerDay);
  const [quitDateMs, setQuitDateMs] = useState<number | null>(profile.quitDateMs);
  const [pricePerPack, setPricePerPack] = useState('');
  const [perPack, setPerPack] = useState(20);
  const [style, setStyle] = useState<CoachStyle>(profile.coachStyle);

  /** The two goal-specific steps are mutually exclusive; skip the wrong one. */
  const skips = (candidate: Step): boolean =>
    (candidate === 'target' && goalType === 'quit') ||
    (candidate === 'quitDate' && goalType === 'reduce');

  const advance = () => {
    let index = ORDER.indexOf(step) + 1;
    while (index < ORDER.length && skips(ORDER[index])) index += 1;
    setStep(ORDER[index] ?? 'done');
  };

  const finish = async () => {
    const price = Number.parseFloat(pricePerPack);
    if (Number.isFinite(price) && price > 0) {
      await savePrice({
        pricePerPack: price,
        cigarettesPerPack: perPack,
        currency: DEFAULT_CURRENCY,
      });
    }
    await update({
      baselineCigarettesPerDay: baseline,
      goalType,
      // A quit goal keeps a target of 0 so every "vs target" figure elsewhere
      // reads correctly without special-casing the goal type.
      targetCigarettesPerDay: goalType === 'quit' ? 0 : Math.min(target, baseline),
      quitDateMs: goalType === 'quit' ? quitDateMs : null,
      coachStyle: style,
      onboardingCompleted: true,
    });
    haptics.milestone();
    router.replace('/(auth)/sign-in');
  };

  if (step === 'baseline') {
    return (
      <Screen
        title={t('onboarding.baseline.title')}
        footer={<Button label={t('common.continue')} onPress={advance} />}
      >
        <Text variant="body" tone="muted">
          {t('onboarding.baseline.body')}
        </Text>
        <Stepper
          label={t('analytics.perDay')}
          value={baseline}
          onChange={setBaseline}
          min={1}
          max={80}
        />
      </Screen>
    );
  }

  if (step === 'goal') {
    return (
      <Screen title={t('onboarding.goal.title')}>
        <Chip
          block
          label={t('onboarding.goal.reduce')}
          description={t('onboarding.goal.reduceBody')}
          selected={goalType === 'reduce'}
          onPress={() => {
            setGoalType('reduce');
            advance();
          }}
        />
        <Chip
          block
          label={t('onboarding.goal.quit')}
          description={t('onboarding.goal.quitBody')}
          selected={goalType === 'quit'}
          onPress={() => {
            setGoalType('quit');
            setStep('quitDate');
          }}
        />
      </Screen>
    );
  }

  if (step === 'target') {
    return (
      <Screen
        title={t('onboarding.target.title')}
        footer={<Button label={t('common.continue')} onPress={advance} />}
      >
        <Text variant="body" tone="muted">
          {t('onboarding.target.body')}
        </Text>
        <Stepper
          label={t('goals.target')}
          value={Math.min(target, baseline)}
          onChange={setTarget}
          min={0}
          max={baseline}
        />
      </Screen>
    );
  }

  if (step === 'quitDate') {
    return (
      <Screen title={t('onboarding.quitDate.title')}>
        <Text variant="body" tone="muted">
          {t('onboarding.quitDate.body')}
        </Text>
        {QUIT_DATE_OPTIONS.map((option) => (
          <Chip
            key={option.key}
            block
            label={t(option.key)}
            selected={
              option.offsetDays === null
                ? quitDateMs === null
                : quitDateMs !== null &&
                  Math.abs(quitDateMs - (Date.now() + option.offsetDays * DAY_MS)) < DAY_MS / 2
            }
            onPress={() => {
              setQuitDateMs(
                option.offsetDays === null ? null : Date.now() + option.offsetDays * DAY_MS
              );
              advance();
            }}
          />
        ))}
      </Screen>
    );
  }

  if (step === 'price') {
    return (
      <Screen
        title={t('onboarding.price.title')}
        footer={
          <View style={{ gap: theme.spacing.sm }}>
            <Button label={t('common.continue')} onPress={advance} />
            <Button variant="quiet" label={t('common.skip')} onPress={advance} />
          </View>
        }
      >
        <Text variant="body" tone="muted">
          {t('onboarding.price.body')}
        </Text>
        <Field
          label={t('onboarding.price.pricePerPack')}
          value={pricePerPack}
          onChangeText={setPricePerPack}
          keyboardType="decimal-pad"
          placeholder="350"
        />
        <Stepper
          label={t('onboarding.price.perPack')}
          value={perPack}
          onChange={setPerPack}
          min={1}
          max={50}
        />
      </Screen>
    );
  }

  if (step === 'style') {
    return (
      <Screen
        title={t('onboarding.style.title')}
        footer={<Button label={t('common.continue')} onPress={advance} />}
      >
        <Text variant="body" tone="muted">
          {t('onboarding.style.body')}
        </Text>
        {COACH_STYLES.map((option) => (
          <Chip
            key={option}
            block
            label={t(`style.${option}` as TranslationKey)}
            description={t(`style.${option}.desc` as TranslationKey)}
            selected={style === option}
            onPress={() => setStyle(option)}
          />
        ))}
      </Screen>
    );
  }

  return (
    <Screen
      title={t('onboarding.finish.title')}
      back={false}
      footer={<Button label={t('common.continue')} onPress={() => void finish()} />}
    >
      <Text variant="body" tone="muted">
        {t('onboarding.finish.body')}
      </Text>
    </Screen>
  );
}
