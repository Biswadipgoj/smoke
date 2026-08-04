// app/log.tsx — quick +1 logging (tracking doc §7, the 3-second rule).
// Retrospective-first: never prompt during consumption, this is for logging
// after the fact. Confirmation is a haptic tick and nothing else — no
// lecture, no warning, no sad animation (doc 03 §7 rules).
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDhruvStore } from '../src/store/useDhruvStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { TrackType, TRIGGER_CHIPS, TobaccoBaseline, AlcoholBaseline, TobaccoEvent, AlcoholEvent, PornEvent } from '../src/domain/types';
import { haptic } from '../src/lib/haptics';

export default function LogScreen() {
  const params = useLocalSearchParams<{ track?: string }>();
  const { t } = useTranslation();
  const tracks = useDhruvStore((s) => s.tracks);
  const logEvent = useDhruvStore((s) => s.logEvent);
  const activeTracks = tracks.filter((tr) => tr.active);

  const [track, setTrack] = useState<TrackType | null>((params.track as TrackType) ?? (activeTracks.length === 1 ? activeTracks[0].type : null));
  const [quantity, setQuantity] = useState(1);
  const [trigger, setTrigger] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const selectedTrack = tracks.find((tr) => tr.type === track);

  const chips = track ? TRIGGER_CHIPS[track] : [];

  const submit = () => {
    if (!selectedTrack || !track) return;
    const now = new Date().toISOString();
    const base = { id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, timestamp: now, loggedAt: now, trigger, track };

    if (track === 'tobacco') {
      const baseline = selectedTrack.baseline as TobaccoBaseline;
      const event: TobaccoEvent = { ...base, track: 'tobacco', quantity, unitCost: baseline.unitCost };
      logEvent(event);
    } else if (track === 'alcohol') {
      const baseline = selectedTrack.baseline as AlcoholBaseline;
      const perDrink = baseline.typicalDrinksPerOccasion > 0 ? baseline.typicalSpendPerOccasion / baseline.typicalDrinksPerOccasion : baseline.typicalSpendPerOccasion;
      const event: AlcoholEvent = { ...base, track: 'alcohol', spend: perDrink * quantity };
      logEvent(event);
    } else {
      const event: PornEvent = { ...base, track: 'porn' };
      logEvent(event);
    }

    haptic('tap');
    setSubmitted(true);
    setTimeout(() => router.back(), 900);
  };

  if (submitted) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.successText}>✓</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t.logTitle}</Text>

        {!track && (
          <View style={styles.chipColumn}>
            {activeTracks.map((tr) => (
              <TouchableOpacity key={tr.id} style={styles.trackOption} onPress={() => setTrack(tr.type)}>
                <Text style={styles.trackOptionText}>{trackLabel(t, tr.type)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {track && (
          <>
            <Text style={styles.fieldLabel}>{t.logQuantity}</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setQuantity((q) => q + 1)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>{t.logWhatTriggered}</Text>
            <View style={styles.chipWrap}>
              {chips.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  onPress={() => {
                    haptic('select');
                    setTrigger((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));
                  }}
                  style={[styles.smallChip, trigger.includes(chip) && styles.smallChipActive]}
                >
                  <Text style={[styles.smallChipText, trigger.includes(chip) && styles.smallChipTextActive]}>{chipLabel(t, chip)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={submit}>
              <Text style={styles.submitBtnText}>{t.logSubmit}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function trackLabel(t: any, track: TrackType): string {
  return track === 'tobacco' ? t.trackTobacco : track === 'alcohol' ? t.trackAlcohol : t.trackPorn;
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
  center: { alignItems: 'center', justifyContent: 'center' },
  successText: { fontSize: 56, color: Colors.jal },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xl, color: Colors.bone, marginBottom: Spacing.lg, textAlign: 'center' },
  chipColumn: { gap: Spacing.sm },
  trackOption: { backgroundColor: Colors.nil, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  trackOptionText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.bone },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.boneSecondary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  stepperBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.nil, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xl, color: Colors.bone },
  stepperValue: { fontFamily: FontFamily.mono, fontSize: FontSize.xxl, color: Colors.bone, minWidth: 40, textAlign: 'center' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  smallChip: { borderWidth: 1, borderColor: Colors.nilElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  smallChipActive: { borderColor: Colors.jal, backgroundColor: Colors.jalSoft },
  smallChipText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.boneSecondary },
  smallChipTextActive: { color: Colors.jal },
  submitBtn: { backgroundColor: Colors.bhor, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xl },
  submitBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.nishith },
});
