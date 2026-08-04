// app/add-track.tsx — add a track after onboarding. Reversible, no penalty
// for adding or pausing a track later (master doc §3.3). The alcohol medical
// gate applies here too, not just at first onboarding.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDhruvStore } from '../src/store/useDhruvStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { TrackType, TobaccoBaseline, AlcoholBaseline, PornBaseline } from '../src/domain/types';
import { needsAlcoholMedicalGate } from '../src/lib/crisis';

export default function AddTrackScreen() {
  const { t } = useTranslation();
  const tracks = useDhruvStore((s) => s.tracks);
  const addTrack = useDhruvStore((s) => s.addTrack);

  const existingTypes = new Set(tracks.filter((tr) => tr.active).map((tr) => tr.type));
  const available = (['tobacco', 'alcohol', 'porn'] as TrackType[]).filter((tr) => !existingTypes.has(tr));

  const [track, setTrack] = useState<TrackType | null>(null);
  const [unitsPerDay, setUnitsPerDay] = useState('10');
  const [unitCost, setUnitCost] = useState('12');
  const [daysPerWeek, setDaysPerWeek] = useState('3');
  const [spend, setSpend] = useState('400');
  const [drinks, setDrinks] = useState('4');
  const [heavyDaily, setHeavyDaily] = useState(false);
  const [withdrawal, setWithdrawal] = useState(false);
  const [sessionsPerWeek, setSessionsPerWeek] = useState('3');
  const [sessionLength, setSessionLength] = useState('20');
  const [showGate, setShowGate] = useState(false);
  const [gateAcked, setGateAcked] = useState(false);

  const submit = () => {
    if (!track) return;
    if (track === 'alcohol' && needsAlcoholMedicalGate(heavyDaily, withdrawal) && !showGate) {
      setShowGate(true);
      return;
    }
    let baseline: TobaccoBaseline | AlcoholBaseline | PornBaseline;
    if (track === 'tobacco') {
      baseline = { track: 'tobacco', form: 'cigarette', unitsPerDay: parseInt(unitsPerDay) || 0, unitCost: parseFloat(unitCost) || 0 };
    } else if (track === 'alcohol') {
      baseline = {
        track: 'alcohol', drinkingDaysPerWeek: parseInt(daysPerWeek) || 0, typicalSpendPerOccasion: parseFloat(spend) || 0,
        typicalDrinksPerOccasion: parseInt(drinks) || 0, heavyDailyDrinking: heavyDaily, withdrawalSymptoms: withdrawal, medicalGateAcknowledged: true,
      };
    } else {
      baseline = { track: 'porn', sessionsPerWeek: parseInt(sessionsPerWeek) || 0, typicalSessionLengthMinutes: parseInt(sessionLength) || 0, minimalLoggingMode: false };
    }
    addTrack(track, baseline, null);
    router.back();
  };

  if (showGate) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.content}>
          <Text style={styles.title}>{t.onbAlcoholGateTitle}</Text>
          <Text style={styles.gateBody}>{t.onbAlcoholGateBody}</Text>
          <Text style={styles.gateWarning}>{t.onbAlcoholGateWarning}</Text>
          <TouchableOpacity style={[styles.ackRow, gateAcked && styles.ackRowActive]} onPress={() => setGateAcked((v) => !v)}>
            <Text style={styles.ackText}>{t.onbAlcoholGateAck}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitBtn, !gateAcked && styles.disabled]} disabled={!gateAcked} onPress={submit}>
            <Text style={styles.submitBtnText}>{t.onbDone}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t.youAddTrack}</Text>

        {!track && (
          <View style={{ gap: Spacing.sm }}>
            {available.map((tr) => (
              <TouchableOpacity key={tr} style={styles.option} onPress={() => setTrack(tr)}>
                <Text style={styles.optionText}>{tr === 'tobacco' ? t.trackTobacco : tr === 'alcohol' ? t.trackAlcohol : t.trackPorn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {track === 'tobacco' && (
          <>
            <Field label={t.baselineTobaccoUnitsPerDay} value={unitsPerDay} onChangeText={setUnitsPerDay} />
            <Field label={t.baselineTobaccoUnitCost} value={unitCost} onChangeText={setUnitCost} />
          </>
        )}
        {track === 'alcohol' && (
          <>
            <Field label={t.baselineAlcoholDaysPerWeek} value={daysPerWeek} onChangeText={setDaysPerWeek} />
            <Field label={t.baselineAlcoholSpend} value={spend} onChangeText={setSpend} />
            <Field label={t.baselineAlcoholDrinks} value={drinks} onChangeText={setDrinks} />
            <ToggleField label={t.onbAlcoholGateQ1} value={heavyDaily} onChange={setHeavyDaily} />
            <ToggleField label={t.onbAlcoholGateQ2} value={withdrawal} onChange={setWithdrawal} />
          </>
        )}
        {track === 'porn' && (
          <>
            <Field label={t.baselinePornSessionsPerWeek} value={sessionsPerWeek} onChangeText={setSessionsPerWeek} />
            <Field label={t.baselinePornSessionLength} value={sessionLength} onChangeText={setSessionLength} />
          </>
        )}

        {track && (
          <TouchableOpacity style={styles.submitBtn} onPress={submit}>
            <Text style={styles.submitBtnText}>{t.save}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType="numeric" placeholderTextColor={Colors.boneMuted} />
    </View>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={() => onChange(!value)}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggleTrack, value && styles.toggleTrackActive]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nishith },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xl, color: Colors.bone, marginBottom: Spacing.lg },
  option: { backgroundColor: Colors.nil, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  optionText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.bone },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.boneSecondary, marginBottom: Spacing.xs },
  input: { backgroundColor: Colors.nil, borderWidth: 1.5, borderColor: Colors.nilElevated, borderRadius: Radius.md, padding: Spacing.md, color: Colors.bone, fontFamily: FontFamily.regular, fontSize: FontSize.base },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
  toggleLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.bone, flex: 1, marginRight: Spacing.md },
  toggleTrack: { width: 44, height: 26, borderRadius: 13, backgroundColor: Colors.nilElevated, padding: 2, justifyContent: 'center' },
  toggleTrackActive: { backgroundColor: Colors.bhorSoft },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.boneMuted },
  toggleThumbActive: { backgroundColor: Colors.bhor, alignSelf: 'flex-end' },
  submitBtn: { backgroundColor: Colors.bhor, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xl },
  submitBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.nishith },
  disabled: { opacity: 0.45 },
  gateBody: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.bone, lineHeight: FontSize.base * 1.5, marginBottom: Spacing.md },
  gateWarning: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.bhor, lineHeight: FontSize.base * 1.5, marginBottom: Spacing.lg },
  ackRow: { borderWidth: 1.5, borderColor: Colors.nilElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  ackRowActive: { borderColor: Colors.bhor, backgroundColor: Colors.bhorSoft },
  ackText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.boneSecondary },
});
