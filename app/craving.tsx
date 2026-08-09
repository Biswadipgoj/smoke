// app/craving.tsx — Screen 7: Craving Moment
// The centrepiece (§7). Trigger → intensity → recommended intervention with a
// countdown → outcome, logged neutrally either way.
//
// Three things this flow refuses to do:
//   · It never asks the user to type before it starts helping. Two taps and
//     the clock is running.
//   · It never treats "I smoked" as an exit that needs justifying: it is a
//     button of equal weight, and pressing it logs a data point (§1).
//   · It never celebrates loudly. A resisted craving gets one warm sentence
//     and a soft transition (§11), not a confetti cannon.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  AppText,
  Card,
  Chip,
  ChipRow,
  Field,
  GhostButton,
  PrimaryButton,
  Screen,
} from '../src/components/ui';
import { recommendDelay } from '../src/features/cravings/delayAlgorithm';
import { chooseIntervention, interventionCopy, triggerLabel } from '../src/features/cravings/interventionEngine';
import { useTranslation } from '../src/i18n';
import { haptic } from '../src/services/haptics';
import {
  activeGoal,
  getBehaviorStats,
  insertCigaretteLog,
  insertCravingLog,
  setCravingNote,
} from '../src/services/db/localDb';
import { useAppStore } from '../src/store/useAppStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { TRIGGERS, type BehaviorStats, type Intensity, type Trigger } from '../src/types';
import { clock } from '../src/utils/format';

type Step = 'trigger' | 'intensity' | 'wait' | 'won' | 'smoked';

const INTENSITIES: Intensity[] = [1, 2, 3, 4, 5];

export default function Craving() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);

  const [step, setStep] = useState<Step>('trigger');
  const [trigger, setTrigger] = useState<Trigger>('stress');
  const [intensity, setIntensity] = useState<Intensity>(3);
  const [stats, setStats] = useState<BehaviorStats | null>(null);
  const [targetPerDay, setTargetPerDay] = useState<number | null>(null);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [note, setNote] = useState('');
  const [waitedMinutes, setWaitedMinutes] = useState(0);
  const [cravingId, setCravingId] = useState<string | null>(null);

  useEffect(() => {
    void getBehaviorStats().then(setStats);
    void activeGoal().then((goal) => setTargetPerDay(goal?.targetPerDay ?? null));
  }, []);

  const recommendation = useMemo(() => {
    if (!stats) return null;
    return recommendDelay({
      stats,
      trigger,
      intensity,
      baselinePerDay: profile?.baselinePerDay ?? 10,
      targetPerDay,
    });
  }, [stats, trigger, intensity, profile?.baselinePerDay, targetPerDay]);

  const choice = useMemo(
    () => (stats ? chooseIntervention(trigger, intensity, stats) : null),
    [stats, trigger, intensity]
  );

  // The countdown. It keeps running while the screen is open; leaving the
  // screen ends the craving as 'abandoned' rather than pretending it resolved.
  useEffect(() => {
    if (step !== 'wait' || startedAtMs === null || !recommendation) return;
    const total = recommendation.minutes * 60;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
      setSecondsLeft(Math.max(0, total - elapsed));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step, startedAtMs, recommendation]);

  const finish = useCallback(
    async (outcome: 'delayed' | 'smoked' | 'abandoned') => {
      if (!recommendation) return;
      const started = startedAtMs ?? Date.now();
      const minutes = Math.max(0, Math.round((Date.now() - started) / 60_000));
      setWaitedMinutes(minutes);

      const userId = session?.user.id ?? null;
      const craving = await insertCravingLog({
        userId,
        timestampMs: started,
        trigger,
        intensity,
        askedDelayMinutes: recommendation.minutes,
        actualDelayMinutes: minutes,
        intervention: choice?.intervention ?? null,
        outcome,
        note: null,
      });
      setCravingId(craving.id);

      if (outcome === 'smoked') {
        await insertCigaretteLog({ userId, trigger, fromCraving: true });
        haptic('cigarette-logged');
        setStep('smoked');
      } else if (outcome === 'delayed') {
        haptic('craving-resisted');
        setStep('won');
      } else {
        router.back();
      }
    },
    [recommendation, startedAtMs, session?.user.id, trigger, intensity, choice, router]
  );

  const interventionText = choice ? interventionCopy(choice.intervention, t) : null;

  return (
    <Screen>
      {step === 'trigger' ? (
        <>
          <View style={{ gap: theme.spacing.sm }}>
            <AppText variant="title">{t('cravingTriggerTitle')}</AppText>
            <AppText variant="body" tone="secondary">
              {t('cravingTriggerSubtitle')}
            </AppText>
          </View>
          <ChipRow>
            {TRIGGERS.map((option) => (
              <Chip
                key={option}
                label={triggerLabel(option, t)}
                selected={trigger === option}
                onPress={() => {
                  setTrigger(option);
                  setStep('intensity');
                }}
              />
            ))}
          </ChipRow>
          <View style={{ flex: 1 }} />
          <GhostButton label={t('cravingLeave')} onPress={() => router.back()} />
        </>
      ) : null}

      {step === 'intensity' ? (
        <>
          <View style={{ gap: theme.spacing.sm }}>
            <AppText variant="title">{t('cravingIntensityTitle')}</AppText>
            <AppText variant="caption" tone="muted">
              {t('cravingIntensityLow')} → {t('cravingIntensityHigh')}
            </AppText>
          </View>
          <ChipRow>
            {INTENSITIES.map((value) => (
              <Chip
                key={value}
                label={String(value)}
                selected={intensity === value}
                onPress={() => {
                  setIntensity(value);
                  setStartedAtMs(Date.now());
                  setStep('wait');
                }}
              />
            ))}
          </ChipRow>
          <View style={{ flex: 1 }} />
          <GhostButton label={t('back')} onPress={() => setStep('trigger')} />
        </>
      ) : null}

      {step === 'wait' && recommendation && interventionText ? (
        <>
          <View style={{ gap: theme.spacing.sm }}>
            <AppText variant="caption" tone="muted">
              {t('cravingPlanTitle')} {recommendation.minutes} {t('minutes')}
            </AppText>
            <AppText variant="hero">{clock(secondsLeft)}</AppText>
            <AppText variant="caption" tone="muted">
              {t('cravingRemaining')}
            </AppText>
          </View>

          <Card raised>
            <AppText variant="heading">{interventionText.title}</AppText>
            <AppText variant="body" tone="secondary">
              {interventionText.body}
            </AppText>
          </Card>

          <AppText variant="small" tone="muted">
            {t('cravingPlanSubtitle')}
          </AppText>

          <View style={{ flex: 1 }} />
          <PrimaryButton
            label={t('cravingMadeIt')}
            tone="growth"
            onPress={() => void finish('delayed')}
          />
          <GhostButton label={t('cravingSmoked')} onPress={() => void finish('smoked')} />
          <GhostButton label={t('cravingLeave')} tone="muted" onPress={() => void finish('abandoned')} />
        </>
      ) : null}

      {step === 'won' ? (
        // The only slow (420ms) transition in the app, and the only place a
        // transformation is earned (§11).
        <Animated.View
          entering={FadeIn.duration(theme.motion.slow)}
          style={{ flex: 1, gap: theme.spacing.lg }}
        >
          <AppText variant="title" tone="growth">
            {t('cravingWinTitle')}
          </AppText>
          <AppText variant="body" tone="secondary">
            {t('cravingWinBody', { minutes: waitedMinutes })}
          </AppText>
          <View style={{ flex: 1 }} />
          <PrimaryButton label={t('cravingBackHome')} onPress={() => router.back()} />
        </Animated.View>
      ) : null}

      {step === 'smoked' ? (
        // No animation at all on this branch. A visual event here would read
        // either as punishment or as a game trigger; both are wrong (§11).
        <>
          <AppText variant="title">{t('cravingLoggedTitle')}</AppText>
          <AppText variant="body" tone="secondary">
            {t('cravingLoggedBody')}
          </AppText>
          <Field
            placeholder={t('cravingNotePlaceholder')}
            value={note}
            onChangeText={setNote}
            multiline
          />
          <View style={{ flex: 1 }} />
          <PrimaryButton
            label={t('cravingBackHome')}
            onPress={() => {
              // The note is saved on the way out rather than on every
              // keystroke: the row already exists, and nothing here should
              // make the user feel watched while they type.
              const text = note.trim();
              if (cravingId && text) void setCravingNote(cravingId, text);
              router.back();
            }}
          />
        </>
      ) : null}
    </Screen>
  );
}
