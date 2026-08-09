// app/craving.tsx — §25 screen 7, and §7-8. The centrepiece.
//
// trigger → intensity → intervention with a countdown → outcome, logged
// neutrally either way.
//
// §31 asks: would you open this during an actual craving, or does the flow
// feel like friction between you and relief? Hence two taps to a running
// timer, no scrolling on the steps that matter, and an outcome screen that
// ends rather than upsells.

import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Chip, ChipGroup } from '../src/components/ui/Chip';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import {
  explainRecommendation,
  recommendDelay,
  type DelayRecommendation,
} from '../src/features/cravings/delayAlgorithm';
import { selectIntervention } from '../src/features/cravings/interventionEngine';
import { useT, type TranslationKey } from '../src/i18n';
import * as haptics from '../src/services/haptics';
import { useLogsStore } from '../src/store/useLogsStore';
import { useProfileStore } from '../src/store/useProfileStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { TRIGGERS, type CravingOutcome, type Intensity, type Trigger } from '../src/types';

type Step = 'trigger' | 'intensity' | 'plan' | 'timer' | 'outcome';

const INTENSITIES: Intensity[] = [1, 2, 3, 4, 5];

export default function Craving() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();

  const profile = useProfileStore((s) => s.profile);
  const behavior = useLogsStore((s) => s.behavior);
  const recentlyOffered = useLogsStore((s) => s.recentlyOffered);
  const startCraving = useLogsStore((s) => s.startCraving);
  const resolveCraving = useLogsStore((s) => s.resolveCraving);

  const [step, setStep] = useState<Step>('trigger');
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [intensity, setIntensity] = useState<Intensity | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [cravingId, setCravingId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<CravingOutcome | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  const intervention = useMemo(() => {
    if (!trigger || !intensity) return null;
    return selectIntervention({ trigger, intensity, behavior, recentlyOffered });
  }, [trigger, intensity, behavior, recentlyOffered]);

  const recommendation: DelayRecommendation | null = useMemo(() => {
    if (!trigger || !intensity) return null;
    return recommendDelay({ profile, behavior, trigger, intensity });
  }, [profile, behavior, trigger, intensity]);

  // Countdown. Driven off wall-clock rather than accumulated ticks so a
  // backgrounded app comes back with the right number instead of a paused one.
  useEffect(() => {
    if (step !== 'timer' || !recommendation || startedAtRef.current === null) return;
    const endsAt = startedAtRef.current + recommendation.minutes * 60_000;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) finish('delayed');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // `finish` is stable for the life of this screen's state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, recommendation]);

  async function begin() {
    if (!trigger || !intensity || !intervention || !recommendation) return;
    const craving = await startCraving({
      trigger,
      intensity,
      interventionId: intervention.id,
      delayAskedMinutes: recommendation.minutes,
    });
    setCravingId(craving.id);
    startedAtRef.current = Date.now();
    setStep('timer');
  }

  function finish(result: CravingOutcome) {
    if (outcome) return; // The timer and a button press can land together.
    const elapsedMinutes =
      startedAtRef.current === null ? 0 : (Date.now() - startedAtRef.current) / 60_000;
    setOutcome(result);
    setStep('outcome');

    if (result === 'delayed') haptics.cravingResisted();
    else haptics.cigaretteLogged();

    if (cravingId) {
      void resolveCraving(cravingId, result, Math.round(elapsedMinutes * 10) / 10, profile);
    }
  }

  // ---- Step 1: trigger -----------------------------------------------------
  if (step === 'trigger') {
    return (
      <Screen title={t('craving.trigger.title')} back={false} haze>
        <Text variant="body" tone="onHazeMuted">
          {t('craving.trigger.body')}
        </Text>
        <ChipGroup>
          {TRIGGERS.map((option) => (
            <Chip
              key={option}
              onHaze
              label={t(`trigger.${option}` as TranslationKey)}
              selected={trigger === option}
              onPress={() => {
                setTrigger(option);
                setStep('intensity');
              }}
            />
          ))}
        </ChipGroup>
        <Button variant="quiet" onHaze label={t('common.cancel')} onPress={() => router.back()} />
      </Screen>
    );
  }

  // ---- Step 2: intensity ---------------------------------------------------
  if (step === 'intensity') {
    return (
      <Screen title={t('craving.intensity.title')} haze>
        {INTENSITIES.map((level) => (
          <Chip
            key={level}
            block
            onHaze
            label={t(`craving.intensity.${level}` as TranslationKey)}
            selected={intensity === level}
            onPress={() => {
              setIntensity(level);
              setStep('plan');
            }}
          />
        ))}
      </Screen>
    );
  }

  // ---- Step 3: the plan ----------------------------------------------------
  if (step === 'plan' && intervention && recommendation) {
    return (
      <Screen
        title={t('craving.plan.title')}
        haze
        footer={<Button label={t('craving.plan.start')} onPress={() => void begin()} />}
      >
        <Card>
          <Text variant="heading" serif>
            {t(intervention.titleKey)}
          </Text>
          <Text variant="body" tone="muted">
            {t(intervention.bodyKey)}
          </Text>
        </Card>

        <Card muted>
          <Text variant="title" serif tone="accent">
            {t('craving.plan.ask', { n: recommendation.minutes })}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setShowWhy((v) => !v)}>
            <Text variant="bodySmall" tone="accent">
              {t('craving.plan.why')}
            </Text>
          </Pressable>
          {showWhy && (
            <Animated.View entering={FadeIn.duration(theme.duration.base)} style={{ gap: 6 }}>
              {explainRecommendation(recommendation).map((line) => (
                <Text key={line} variant="bodySmall" tone="muted">
                  {line}
                </Text>
              ))}
            </Animated.View>
          )}
        </Card>
      </Screen>
    );
  }

  // ---- Step 4: the timer ---------------------------------------------------
  if (step === 'timer' && intervention) {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return (
      <Screen
        title={t(intervention.titleKey)}
        back={false}
        haze
        footer={
          <View style={{ gap: theme.spacing.sm }}>
            <Button label={t('craving.madeIt')} onPress={() => finish('delayed')} />
            {/* §1 — "I smoked" is an ordinary button in an ordinary colour.
                Making it small or red would be the shame mechanic by design. */}
            <Button
              variant="secondary"
              onHaze
              label={t('craving.smoked')}
              silent
              onPress={() => finish('smoked')}
            />
          </View>
        }
      >
        <View style={styles.timer}>
          <Text variant="hero" serif tone="onHaze" center>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </Text>
          <Text variant="caption" tone="onHazeMuted" center>
            {t('craving.timer.remaining')}
          </Text>
        </View>
        <Text variant="body" tone="onHazeMuted" center>
          {t(intervention.bodyKey)}
        </Text>
        <Text variant="bodySmall" tone="onHazeMuted" center>
          {t('craving.timer.body')}
        </Text>
      </Screen>
    );
  }

  // ---- Step 5: outcome -----------------------------------------------------
  const delayed = outcome === 'delayed';
  return (
    <Screen
      title=""
      back={false}
      haze
      footer={<Button label={t('craving.finish')} onPress={() => router.back()} />}
    >
      {/* §11 — the resist transformation is a fade, not a sequence. */}
      <Animated.View
        entering={FadeIn.duration(theme.duration.slow)}
        style={{ gap: theme.spacing.md, paddingTop: theme.spacing.xxl }}
      >
        <Text variant="title" serif tone={delayed ? 'growth' : 'onHaze'}>
          {delayed ? t('craving.outcome.delayed.title') : t('craving.outcome.smoked.title')}
        </Text>
        <Text variant="body" tone="onHazeMuted">
          {delayed ? t('craving.outcome.delayed.body') : t('craving.outcome.smoked.body')}
        </Text>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timer: { paddingVertical: 32, gap: 4 },
});
