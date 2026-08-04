// app/urge.tsx — the urge flow. This IS the product (master doc §7.3).
// Name it → Rate it → Ride it → Watch it fall → Close it. Enterable from
// anywhere, full-screen takeover, one gesture exit only via Close. Motion
// never blocks: taps register even mid-transition.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDhruvStore } from '../src/store/useDhruvStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { TrackType, TRIGGER_CHIPS } from '../src/domain/types';
import { Tide } from '../src/components/motion/Tide';
import { Breath } from '../src/components/motion/Breath';
import { haptic } from '../src/lib/haptics';
import { averageUrgeDurationSeconds, formatDuration } from '../src/lib/urgeDecay';
import { tf } from '../src/constants/translations';

type Step = 'name' | 'rate' | 'ride' | 'close';
type Outcome = 'surfed' | 'alternative' | 'lapsed';

export default function UrgeScreen() {
  const params = useLocalSearchParams<{ track?: string }>();
  const { t } = useTranslation();
  const tracks = useDhruvStore((s) => s.tracks);
  const urges = useDhruvStore((s) => s.urges);
  const startUrge = useDhruvStore((s) => s.startUrge);
  const reRateUrge = useDhruvStore((s) => s.reRateUrge);
  const closeUrge = useDhruvStore((s) => s.closeUrge);

  const activeTracks = tracks.filter((tr) => tr.active).map((tr) => tr.type);
  const [step, setStep] = useState<Step>(activeTracks.length <= 1 ? 'rate' : 'name');
  const [track, setTrack] = useState<TrackType | null>((params.track as TrackType) ?? (activeTracks.length === 1 ? activeTracks[0] : null));
  const [trigger, setTrigger] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(5);
  const [urgeId, setUrgeId] = useState<string | null>(null);
  const [displayIntensity, setDisplayIntensity] = useState(5);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [breathingOn, setBreathingOn] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const startedAtRef = useRef<number>(0);
  const lastRateAtRef = useRef<number>(0);

  const pastUrges = useMemo(
    () => (track ? urges.filter((u) => u.track === track && u.endedAt) : []),
    [urges, track]
  );
  const avgSeconds = averageUrgeDurationSeconds(pastUrges);

  useEffect(() => {
    if (step !== 'ride') return;
    const interval = setInterval(() => {
      const secs = Math.round((Date.now() - startedAtRef.current) / 1000);
      setElapsedSec(secs);
      // Gentle drift: ~2% of scale per minute since the last explicit rating,
      // never below 1. Doc 01 §4.2.
      const minutesSinceRate = (Date.now() - lastRateAtRef.current) / 60000;
      const drifted = Math.max(1, intensity - minutesSinceRate * 0.2);
      setDisplayIntensity(drifted);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, intensity]);

  const chips = track ? TRIGGER_CHIPS[track] : [];

  const toggleTrigger = (chip: string) => {
    haptic('select');
    setTrigger((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));
  };

  const goToRate = (chosen: TrackType) => {
    setTrack(chosen);
    haptic('select');
    setStep('rate');
  };

  const beginRide = () => {
    if (!track) return;
    haptic('begin');
    const urge = startUrge(track, intensity, trigger);
    setUrgeId(urge.id);
    startedAtRef.current = Date.now();
    lastRateAtRef.current = Date.now();
    setDisplayIntensity(intensity);
    setElapsedSec(0);
    setStep('ride');
  };

  const reRate = (value: number) => {
    setIntensity(value);
    setDisplayIntensity(value);
    lastRateAtRef.current = Date.now();
    if (urgeId) reRateUrge(urgeId, value);
    haptic('select');
  };

  const goToClose = () => setStep('close');

  const finish = (chosenOutcome: Outcome) => {
    if (!urgeId) return;
    haptic('complete');
    closeUrge(urgeId, chosenOutcome, breathingOn);
    setOutcome(chosenOutcome);
    if (chosenOutcome === 'lapsed' && track) {
      router.replace({ pathname: '/lapse', params: { track, urgeId, trigger: trigger.join(',') } });
      return;
    }
    setTimeout(() => router.replace('/(tabs)'), 1100);
  };

  if (outcome && outcome !== 'lapsed') {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.resolvedText}>{t.urgeResolvedFactual}</Text>
        <Text style={styles.resolvedSub}>{formatDuration(elapsedSec)}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {step === 'name' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t.urgeNameIt}</Text>
          <View style={styles.trackRow}>
            {activeTracks.map((tr) => (
              <TouchableOpacity key={tr} style={styles.trackChip} onPress={() => goToRate(tr)}>
                <Text style={styles.trackChipText}>{trackLabel(t, tr)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {step === 'rate' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t.urgeRateIt}</Text>
          <IntensityNotches value={intensity} onChange={setIntensity} />

          {chips.length > 0 && (
            <View style={styles.chipWrap}>
              {chips.slice(0, 8).map((chip) => (
                <TouchableOpacity
                  key={chip}
                  onPress={() => toggleTrigger(chip)}
                  style={[styles.smallChip, trigger.includes(chip) && styles.smallChipActive]}
                >
                  <Text style={[styles.smallChipText, trigger.includes(chip) && styles.smallChipTextActive]}>
                    {chipLabel(t, chip)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.primaryAction} onPress={beginRide}>
            <Text style={styles.primaryActionText}>{t.next}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 'ride' && (
        <View style={styles.rideContainer}>
          <View style={styles.rideHeader}>
            <Text style={styles.rideLine}>{t.urgeRideIt}</Text>
            <Text style={styles.rideSub}>{t.urgeRideItSubtitle}</Text>
            <Text style={styles.timer}>
              {formatDuration(elapsedSec)} {t.urgeElapsed}
            </Text>
            {avgSeconds !== null && (
              <Text style={styles.decayStat}>
                {tf(t.urgeAverageStat, { avg: formatDuration(avgSeconds) })} {tf(t.urgeThisOneAt, { current: formatDuration(elapsedSec) })}
              </Text>
            )}
          </View>

          <View style={styles.tideWrap}>
            <Tide intensity={displayIntensity} height={280} />
          </View>

          {!breathingOn ? (
            <TouchableOpacity style={styles.breatheOffer} onPress={() => setBreathingOn(true)}>
              <Text style={styles.breatheOfferText}>{t.urgeBreatheOffer}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.breathWrap}>
              <Breath mode="paced" color={Colors.jal} size={140} />
            </View>
          )}

          <Text style={styles.reRateLabel}>{t.urgeReRatePrompt}</Text>
          <IntensityNotches value={Math.round(displayIntensity)} onChange={reRate} compact />

          <TouchableOpacity style={styles.primaryAction} onPress={goToClose}>
            <Text style={styles.primaryActionText}>{t.urgeWatchItFall}</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'close' && (
        <View style={styles.content}>
          <Text style={styles.title}>{t.urgeCloseTitle}</Text>
          <View style={styles.closeOptions}>
            <TouchableOpacity style={styles.closeOption} onPress={() => finish('surfed')}>
              <Text style={styles.closeOptionText}>{t.urgeCloseSurfed}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeOption} onPress={() => finish('alternative')}>
              <Text style={styles.closeOptionText}>{t.urgeCloseAlternative}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeOption} onPress={() => finish('lapsed')}>
              <Text style={styles.closeOptionText}>{t.urgeCloseLapsed}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function IntensityNotches({ value, onChange, compact = false }: { value: number; onChange: (v: number) => void; compact?: boolean }) {
  return (
    <View style={styles.notchRow}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => {
            haptic(n === 1 || n === 10 ? 'begin' : 'select');
            onChange(n);
          }}
          style={[
            styles.notch,
            { height: compact ? 24 + n * 3 : 32 + n * 5 },
            n <= value && styles.notchActive,
          ]}
        />
      ))}
    </View>
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
  content: { flexGrow: 1, padding: Spacing.lg, justifyContent: 'center' },
  title: { fontFamily: FontFamily.regular, fontSize: FontSize.xxl, color: Colors.bone, textAlign: 'center', marginBottom: Spacing.xl },

  trackRow: { gap: Spacing.md },
  trackChip: { backgroundColor: Colors.nil, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center' },
  trackChipText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.lg, color: Colors.bone },

  notchRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6, marginBottom: Spacing.xl },
  notch: { width: 18, borderRadius: 4, backgroundColor: Colors.nil },
  notchActive: { backgroundColor: Colors.jal },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.xl },
  smallChip: { borderWidth: 1, borderColor: Colors.hairline, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  smallChipActive: { borderColor: Colors.jal, backgroundColor: Colors.jalSoft },
  smallChipText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.boneSecondary },
  smallChipTextActive: { color: Colors.jal },

  primaryAction: { backgroundColor: Colors.jal, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.lg },
  primaryActionText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.nishith },

  rideContainer: { flex: 1, justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  rideHeader: { alignItems: 'center', gap: Spacing.xs },
  rideLine: { fontFamily: FontFamily.regular, fontSize: FontSize.xl, color: Colors.bone, textAlign: 'center' },
  rideSub: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.boneSecondary, textAlign: 'center' },
  timer: { fontFamily: FontFamily.mono, fontSize: FontSize.md, color: Colors.jal, marginTop: Spacing.sm },
  decayStat: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.boneMuted, textAlign: 'center', marginTop: Spacing.xs, paddingHorizontal: Spacing.lg },
  tideWrap: { borderRadius: Radius.xl, overflow: 'hidden' },
  breatheOffer: { alignItems: 'center', paddingVertical: Spacing.sm },
  breatheOfferText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.boneSecondary, textDecorationLine: 'underline' },
  breathWrap: { alignItems: 'center', justifyContent: 'center' },
  reRateLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.boneSecondary, textAlign: 'center', marginBottom: Spacing.sm },

  closeOptions: { gap: Spacing.md },
  closeOption: { backgroundColor: Colors.nil, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center' },
  closeOptionText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.bone },

  resolvedText: { fontFamily: FontFamily.regular, fontSize: FontSize.xxl, color: Colors.bone },
  resolvedSub: { fontFamily: FontFamily.mono, fontSize: FontSize.base, color: Colors.jal, marginTop: Spacing.sm },
});
