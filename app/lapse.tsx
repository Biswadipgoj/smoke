// app/lapse.tsx — the lapse protocol (master doc §7.6). A designed, dignified
// flow, not an error state. This is the flow that determines whether the
// product works, so it was designed first.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useDhruvStore } from '../src/store/useDhruvStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { TrackType, TRIGGER_CHIPS } from '../src/domain/types';
import { Ember } from '../src/components/motion/Ember';
import { haptic } from '../src/lib/haptics';

type Phase = 'ember' | 'capture' | 'reframe';

export default function LapseScreen() {
  const params = useLocalSearchParams<{ track: TrackType; urgeId?: string; trigger?: string }>();
  const { t } = useTranslation();
  const recordLapse = useDhruvStore((s) => s.recordLapse);
  const [phase, setPhase] = useState<Phase>('ember');
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  const track = (params.track as TrackType) ?? 'tobacco';
  const captureChips = TRIGGER_CHIPS[track].slice(0, 3);

  const onEmberSettled = async () => {
    await haptic('land'); // the lapse haptic — a hand on a shoulder, not a buzzer
    setPhase('capture');
  };

  const proceedToReframe = () => {
    const trigger = selectedChip ? [selectedChip] : [];
    recordLapse(track, trigger, undefined, params.urgeId);
    scheduleFollowUp();
    setPhase('reframe');
  };

  const scheduleFollowUp = async () => {
    // A single warm message in 24h — not a check-in demand (master doc §7.6.5).
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;
      await Notifications.scheduleNotificationAsync({
        content: { title: undefined, body: t.lapseFollowUp24h, sound: false },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 24 * 60 * 60,
          repeats: false,
        },
      });
    } catch {
      // Silent — the in-app experience doesn't depend on this notification firing.
    }
  };

  const done = () => router.replace('/(tabs)');

  return (
    <View style={styles.root}>
      {phase === 'ember' && <Ember line={t.lapseAcknowledge} onSettled={onEmberSettled} />}

      {phase !== 'ember' && (
        <SafeAreaView style={styles.content}>
          {phase === 'capture' && (
            <>
              <Text style={styles.prompt}>{t.lapseCaptureQuestion}</Text>
              <View style={styles.chipColumn}>
                {captureChips.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={[styles.chip, selectedChip === chip && styles.chipActive]}
                    onPress={() => {
                      haptic('select');
                      setSelectedChip(chip);
                    }}
                  >
                    <Text style={[styles.chipText, selectedChip === chip && styles.chipTextActive]}>{chipLabel(t, chip)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.primaryAction} onPress={proceedToReframe}>
                <Text style={styles.primaryActionText}>{t.next}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={proceedToReframe} style={styles.skipLink}>
                <Text style={styles.skipText}>{t.lapseCaptureSkip}</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'reframe' && (
            <>
              <Text style={styles.reframeText}>{t.lapseReframe}</Text>
              <TouchableOpacity style={styles.primaryAction} onPress={done}>
                <Text style={styles.primaryActionText}>{t.lapseDone}</Text>
              </TouchableOpacity>
            </>
          )}
        </SafeAreaView>
      )}
    </View>
  );
}

const CHIP_KEY_MAP: Record<string, string> = {
  after_meal: 'triggerAfterMeal', first_of_day: 'triggerFirstOfDay', toilet: 'triggerToilet', with_chai_coffee: 'triggerWithChaiCoffee',
  with_alcohol: 'triggerWithAlcohol', work_break: 'triggerWorkBreak', commute: 'triggerCommute', stress: 'triggerStress', boredom: 'triggerBoredom',
  on_phone: 'triggerOnPhone', offered: 'triggerOffered', after_argument: 'triggerAfterArgument', before_bed: 'triggerBeforeBed', after_sex: 'triggerAfterSex',
  social_pressure: 'triggerSocialPressure', celebration: 'triggerCelebration', loneliness: 'triggerLoneliness', with_food: 'triggerWithFood',
  habit_time: 'triggerHabitTime', to_sleep: 'triggerToSleep', anger: 'triggerAnger', work_event: 'triggerWorkEvent', others_drinking: 'triggerOthersDrinking',
  bed_at_night: 'triggerBedAtNight', alone_at_home: 'triggerAloneAtHome', phone_scrolling: 'triggerPhoneScrolling', cant_sleep: 'triggerCantSleep',
  woke_early: 'triggerWokeEarly', procrastinating: 'triggerProcrastinating', after_drinking: 'triggerAfterDrinking',
};

function chipLabel(t: any, chip: string): string {
  const key = CHIP_KEY_MAP[chip];
  return key ? t[key] : chip;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nishith },
  content: { flex: 1, padding: Spacing.lg, justifyContent: 'center' },
  prompt: { fontFamily: FontFamily.regular, fontSize: FontSize.xl, color: Colors.bone, textAlign: 'center', marginBottom: Spacing.xl },
  chipColumn: { gap: Spacing.md, marginBottom: Spacing.xl },
  chip: { backgroundColor: Colors.nil, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  chipActive: { backgroundColor: Colors.chhaiSoft, borderWidth: 1, borderColor: Colors.chhai },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.bone },
  chipTextActive: { color: Colors.bone },
  primaryAction: { backgroundColor: Colors.bhor, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  primaryActionText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.nishith },
  skipLink: { alignItems: 'center', marginTop: Spacing.md },
  skipText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.boneMuted },
  reframeText: { fontFamily: FontFamily.regular, fontSize: FontSize.lg, color: Colors.bone, textAlign: 'center', lineHeight: FontSize.lg * 1.5, marginBottom: Spacing.xl },
});
