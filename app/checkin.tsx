// app/checkin.tsx — daily check-in (mood, sleep, HALT). Cross-track, once
// daily, optional. Master doc §5.1.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDhruvStore } from '../src/store/useDhruvStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { CheckIn } from '../src/domain/types';
import { haptic } from '../src/lib/haptics';
import { localDateKey } from '../src/lib/dates';

type Mood = NonNullable<CheckIn['mood']>;
type Sleep = NonNullable<CheckIn['sleepQuality']>;

const HALT_LABEL_KEY = {
  hungry: 'haltHungry', angry: 'haltAngry', lonely: 'haltLonely', tired: 'haltTired',
} as const;

export default function CheckinScreen() {
  const { t } = useTranslation();
  const recordCheckIn = useDhruvStore((s) => s.recordCheckIn);
  const [mood, setMood] = useState<Mood | null>(null);
  const [sleep, setSleep] = useState<Sleep | null>(null);
  const [halt, setHalt] = useState({ hungry: false, angry: false, lonely: false, tired: false });

  const moods: { key: Mood; label: string }[] = [
    { key: 'good', label: t.moodGood }, { key: 'okay', label: t.moodOkay }, { key: 'low', label: t.moodLow }, { key: 'rough', label: t.moodRough },
  ];
  const sleeps: { key: Sleep; label: string }[] = [
    { key: 'good', label: t.sleepGood }, { key: 'okay', label: t.sleepOkay }, { key: 'poor', label: t.sleepPoor },
  ];

  const submit = () => {
    recordCheckIn({
      date: localDateKey(),
      mood: mood ?? undefined,
      sleepQuality: sleep ?? undefined,
      halt,
    });
    haptic('complete');
    router.back();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.handle} />
      <View style={styles.content}>
        <Text style={styles.title}>{t.checkinTitle}</Text>

        <Text style={styles.fieldLabel}>{t.checkinMood}</Text>
        <View style={styles.row}>
          {moods.map((m) => (
            <TouchableOpacity key={m.key} style={[styles.chip, mood === m.key && styles.chipActive]} onPress={() => setMood(m.key)}>
              <Text style={[styles.chipText, mood === m.key && styles.chipTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>{t.checkinSleep}</Text>
        <View style={styles.row}>
          {sleeps.map((s) => (
            <TouchableOpacity key={s.key} style={[styles.chip, sleep === s.key && styles.chipActive]} onPress={() => setSleep(s.key)}>
              <Text style={[styles.chipText, sleep === s.key && styles.chipTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>{t.checkinHalt}</Text>
        <View style={styles.row}>
          {(['hungry', 'angry', 'lonely', 'tired'] as const).map((k) => (
            <TouchableOpacity
              key={k}
              style={[styles.chip, halt[k] && styles.chipActive]}
              onPress={() => setHalt((h) => ({ ...h, [k]: !h[k] }))}
            >
              <Text style={[styles.chipText, halt[k] && styles.chipTextActive]}>{HALT_LABEL_KEY[k] ? t[HALT_LABEL_KEY[k]] : k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={submit}>
          <Text style={styles.submitBtnText}>{t.done}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nishith, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.nilElevated, alignSelf: 'center', marginTop: Spacing.sm },
  content: { padding: Spacing.lg },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xl, color: Colors.bone, marginBottom: Spacing.lg, textAlign: 'center' },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.boneSecondary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { borderWidth: 1, borderColor: Colors.nilElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
  chipActive: { borderColor: Colors.bhor, backgroundColor: Colors.bhorSoft },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.boneSecondary },
  chipTextActive: { color: Colors.bhor },
  submitBtn: { backgroundColor: Colors.bhor, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xl },
  submitBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.nishith },
});
