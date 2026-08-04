// app/onboarding.tsx
// No account. No permissions upfront. Multi-select tracks, explicitly
// reversible. Quit date optional. Under 90 seconds to the first useful
// screen. The alcohol medical gate fires here if alcohol is selected
// (master doc §3.3, §15.6).
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useDhruvStore } from '../src/store/useDhruvStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../src/constants/theme';
import { localeLabels, Locale } from '../src/constants/translations';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';
import { Backdrop } from '../src/components/ui/Backdrop';
import {
  TrackType, TobaccoBaseline, AlcoholBaseline, PornBaseline, Baseline,
} from '../src/domain/types';
import { needsAlcoholMedicalGate } from '../src/lib/crisis';

type WizardStep = 'welcome' | 'lang' | 'tracks' | 'baseline' | 'gate' | 'done';
type QuitChoice = 'not_yet' | 'today' | 'a_while_ago';

interface TrackDraft {
  quitChoice: QuitChoice;
  daysAgo: string;
  // Tobacco
  form: TobaccoBaseline['form'];
  unitsPerDay: string;
  unitCost: string;
  // Alcohol
  daysPerWeek: string;
  spendPerOccasion: string;
  drinksPerOccasion: string;
  heavyDaily: boolean;
  withdrawal: boolean;
  // Porn
  sessionsPerWeek: string;
  sessionLength: string;
  minimalMode: boolean;
}

const DEFAULT_DRAFT: TrackDraft = {
  quitChoice: 'not_yet', daysAgo: '',
  form: 'cigarette', unitsPerDay: '10', unitCost: '12',
  daysPerWeek: '3', spendPerOccasion: '400', drinksPerOccasion: '4', heavyDaily: false, withdrawal: false,
  sessionsPerWeek: '3', sessionLength: '20', minimalMode: false,
};

export default function Onboarding() {
  const { t } = useTranslation();
  const setLocale = useDhruvStore((s) => s.setLocale);
  const addTrack = useDhruvStore((s) => s.addTrack);
  const completeOnboarding = useDhruvStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<WizardStep>('welcome');
  const [selectedLocale, setSelectedLocale] = useState<Locale>('en');
  const [selectedTracks, setSelectedTracks] = useState<TrackType[]>([]);
  const [baselineIndex, setBaselineIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<TrackType, TrackDraft>>({
    tobacco: { ...DEFAULT_DRAFT }, alcohol: { ...DEFAULT_DRAFT }, porn: { ...DEFAULT_DRAFT },
  });
  const [gateAcked, setGateAcked] = useState(false);

  const currentTrack = selectedTracks[baselineIndex];
  const draft = currentTrack ? drafts[currentTrack] : null;

  const needsGate = useMemo(() => {
    if (!selectedTracks.includes('alcohol')) return false;
    const d = drafts.alcohol;
    return needsAlcoholMedicalGate(d.heavyDaily, d.withdrawal);
  }, [selectedTracks, drafts]);

  function updateDraft(track: TrackType, patch: Partial<TrackDraft>) {
    setDrafts((prev) => ({ ...prev, [track]: { ...prev[track], ...patch } }));
  }

  function toggleTrack(tr: TrackType) {
    setSelectedTracks((prev) => (prev.includes(tr) ? prev.filter((x) => x !== tr) : [...prev, tr]));
  }

  function quitDateFor(d: TrackDraft): string | null {
    if (d.quitChoice === 'not_yet') return null;
    if (d.quitChoice === 'today') return new Date().toISOString();
    const days = Math.max(0, parseInt(d.daysAgo) || 0);
    return new Date(Date.now() - days * 86400000).toISOString();
  }

  function baselineFor(track: TrackType, d: TrackDraft): Baseline {
    if (track === 'tobacco') {
      const b: TobaccoBaseline = {
        track: 'tobacco', form: d.form,
        unitsPerDay: Math.max(0, parseInt(d.unitsPerDay) || 0),
        unitCost: Math.max(0, parseFloat(d.unitCost) || 0),
      };
      return b;
    }
    if (track === 'alcohol') {
      const b: AlcoholBaseline = {
        track: 'alcohol',
        drinkingDaysPerWeek: Math.max(0, Math.min(7, parseInt(d.daysPerWeek) || 0)),
        typicalSpendPerOccasion: Math.max(0, parseFloat(d.spendPerOccasion) || 0),
        typicalDrinksPerOccasion: Math.max(0, parseInt(d.drinksPerOccasion) || 0),
        heavyDailyDrinking: d.heavyDaily,
        withdrawalSymptoms: d.withdrawal,
        // The gate only appears when screening flags it; when it does, this
        // is only reachable after an explicit acknowledgement (§15.6).
        medicalGateAcknowledged: !needsGate || gateAcked,
      };
      return b;
    }
    const b: PornBaseline = {
      track: 'porn',
      sessionsPerWeek: Math.max(0, parseInt(d.sessionsPerWeek) || 0),
      typicalSessionLengthMinutes: Math.max(0, parseInt(d.sessionLength) || 0),
      minimalLoggingMode: d.minimalMode,
    };
    return b;
  }

  function goNextFromTracks() {
    if (selectedTracks.length === 0) return;
    setBaselineIndex(0);
    setStep('baseline');
  }

  function goNextFromBaseline() {
    if (baselineIndex < selectedTracks.length - 1) {
      setBaselineIndex((i) => i + 1);
      return;
    }
    if (needsGate) {
      setStep('gate');
      return;
    }
    finish();
  }

  function finish() {
    for (const track of selectedTracks) {
      const d = drafts[track];
      addTrack(track, baselineFor(track, d), quitDateFor(d));
    }
    completeOnboarding();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.root}>
      <Backdrop glow={false} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {step === 'welcome' && (
              <View>
                <Text style={styles.brand}>{t.onbWelcomeTitle}</Text>
                <Text style={styles.subtitle}>{t.onbWelcomeSubtitle}</Text>
                <View style={styles.featureList}>
                  {[t.onbFeatureRideWave, t.onbFeatureNeverReset, t.onbFeatureCompanion, t.onbFeatureLanguages].map((f, i) => (
                    <Text key={i} style={styles.featureText}>· {f}</Text>
                  ))}
                </View>
                <PrimaryButton label={t.next} onPress={() => setStep('lang')} size="lg" style={styles.fullWidthBtn} />
              </View>
            )}

            {step === 'lang' && (
              <View>
                <Text style={styles.title}>{t.onbLangTitle}</Text>
                <Text style={styles.subtitle}>{t.onbLangSubtitle}</Text>
                {(Object.keys(localeLabels) as Locale[]).map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.optionRow, selectedLocale === l && styles.optionRowActive]}
                    onPress={() => setSelectedLocale(l)}
                  >
                    <Text style={[styles.optionText, selectedLocale === l && styles.optionTextActive]}>{localeLabels[l]}</Text>
                  </TouchableOpacity>
                ))}
                <PrimaryButton
                  label={t.next}
                  onPress={() => { setLocale(selectedLocale); setStep('tracks'); }}
                  size="lg"
                  style={styles.fullWidthBtn}
                />
              </View>
            )}

            {step === 'tracks' && (
              <View>
                <Text style={styles.title}>{t.onbTracksTitle}</Text>
                <Text style={styles.subtitle}>{t.onbTracksSubtitle}</Text>
                {(['tobacco', 'alcohol', 'porn'] as TrackType[]).map((tr) => (
                  <TouchableOpacity
                    key={tr}
                    style={[styles.optionRow, selectedTracks.includes(tr) && styles.optionRowActive]}
                    onPress={() => toggleTrack(tr)}
                  >
                    <Text style={[styles.optionText, selectedTracks.includes(tr) && styles.optionTextActive]}>
                      {tr === 'tobacco' ? t.trackTobacco : tr === 'alcohol' ? t.trackAlcohol : t.trackPorn}
                    </Text>
                  </TouchableOpacity>
                ))}
                <PrimaryButton label={t.next} onPress={goNextFromTracks} disabled={selectedTracks.length === 0} size="lg" style={styles.fullWidthBtn} />
              </View>
            )}

            {step === 'baseline' && currentTrack && draft && (
              <View>
                <Text style={styles.title}>{t.onbBaselineTitle}</Text>
                <Text style={styles.subtitle}>{t.onbBaselineSubtitle}</Text>

                {currentTrack === 'tobacco' && (
                  <>
                    <FieldLabel label={t.baselineTobaccoForm} />
                    <View style={styles.chipRow}>
                      {(['cigarette', 'bidi', 'gutkha', 'paan_masala', 'khaini', 'vape'] as TobaccoBaseline['form'][]).map((f) => (
                        <TouchableOpacity key={f} style={[styles.chip, draft.form === f && styles.chipActive]} onPress={() => updateDraft('tobacco', { form: f })}>
                          <Text style={[styles.chipText, draft.form === f && styles.chipTextActive]}>{formLabel(t, f)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <LabeledInput label={t.baselineTobaccoUnitsPerDay} value={draft.unitsPerDay} onChangeText={(v) => updateDraft('tobacco', { unitsPerDay: v })} keyboardType="numeric" />
                    <LabeledInput label={t.baselineTobaccoUnitCost} hint={t.baselineTobaccoUnitCostHint} value={draft.unitCost} onChangeText={(v) => updateDraft('tobacco', { unitCost: v })} keyboardType="decimal-pad" />
                  </>
                )}

                {currentTrack === 'alcohol' && (
                  <>
                    <LabeledInput label={t.baselineAlcoholDaysPerWeek} value={draft.daysPerWeek} onChangeText={(v) => updateDraft('alcohol', { daysPerWeek: v })} keyboardType="numeric" />
                    <LabeledInput label={t.baselineAlcoholSpend} value={draft.spendPerOccasion} onChangeText={(v) => updateDraft('alcohol', { spendPerOccasion: v })} keyboardType="decimal-pad" />
                    <LabeledInput label={t.baselineAlcoholDrinks} value={draft.drinksPerOccasion} onChangeText={(v) => updateDraft('alcohol', { drinksPerOccasion: v })} keyboardType="numeric" />
                    <ToggleRow label={t.onbAlcoholGateQ1} value={draft.heavyDaily} onChange={(v) => updateDraft('alcohol', { heavyDaily: v })} />
                    <ToggleRow label={t.onbAlcoholGateQ2} value={draft.withdrawal} onChange={(v) => updateDraft('alcohol', { withdrawal: v })} />
                  </>
                )}

                {currentTrack === 'porn' && (
                  <>
                    <LabeledInput label={t.baselinePornSessionsPerWeek} value={draft.sessionsPerWeek} onChangeText={(v) => updateDraft('porn', { sessionsPerWeek: v })} keyboardType="numeric" />
                    <LabeledInput label={t.baselinePornSessionLength} value={draft.sessionLength} onChangeText={(v) => updateDraft('porn', { sessionLength: v })} keyboardType="numeric" />
                    <ToggleRow label={t.baselinePornMinimalMode} hint={t.baselinePornMinimalModeDesc} value={draft.minimalMode} onChange={(v) => updateDraft('porn', { minimalMode: v })} />
                  </>
                )}

                <FieldLabel label={t.onbQuitDateTitle} hint={t.onbQuitDateSubtitle} />
                <View style={styles.chipRow}>
                  <TouchableOpacity style={[styles.chip, draft.quitChoice === 'not_yet' && styles.chipActive]} onPress={() => updateDraft(currentTrack, { quitChoice: 'not_yet' })}>
                    <Text style={[styles.chipText, draft.quitChoice === 'not_yet' && styles.chipTextActive]}>{t.onbQuitDateHaveNotYet}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chip, draft.quitChoice === 'today' && styles.chipActive]} onPress={() => updateDraft(currentTrack, { quitChoice: 'today' })}>
                    <Text style={[styles.chipText, draft.quitChoice === 'today' && styles.chipTextActive]}>{t.onbQuitDateToday}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chip, draft.quitChoice === 'a_while_ago' && styles.chipActive]} onPress={() => updateDraft(currentTrack, { quitChoice: 'a_while_ago' })}>
                    <Text style={[styles.chipText, draft.quitChoice === 'a_while_ago' && styles.chipTextActive]}>{t.onbQuitDateSetDate}</Text>
                  </TouchableOpacity>
                </View>
                {draft.quitChoice === 'a_while_ago' && (
                  <LabeledInput label={t.onbQuitDateDaysAgo} value={draft.daysAgo} onChangeText={(v) => updateDraft(currentTrack, { daysAgo: v })} keyboardType="numeric" />
                )}

                <PrimaryButton label={t.next} onPress={goNextFromBaseline} size="lg" style={styles.fullWidthBtn} />
              </View>
            )}

            {step === 'gate' && (
              <View>
                <Text style={styles.title}>{t.onbAlcoholGateTitle}</Text>
                <Text style={styles.gateBody}>{t.onbAlcoholGateBody}</Text>
                <Text style={styles.gateWarning}>{t.onbAlcoholGateWarning}</Text>
                <TouchableOpacity style={[styles.ackRow, gateAcked && styles.ackRowActive]} onPress={() => setGateAcked((v) => !v)}>
                  <Text style={[styles.ackText, gateAcked && styles.ackTextActive]}>{t.onbAlcoholGateAck}</Text>
                </TouchableOpacity>
                <PrimaryButton label={t.onbDone} onPress={finish} disabled={!gateAcked} size="lg" style={styles.fullWidthBtn} />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function LabeledInput({ label, hint, value, onChangeText, keyboardType = 'default' }: {
  label: string; hint?: string; value: string; onChangeText: (v: string) => void; keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}) {
  return (
    <View style={styles.inputGroup}>
      <FieldLabel label={label} hint={hint} />
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholderTextColor={Colors.boneMuted} />
    </View>
  );
}

function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={() => onChange(!value)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      <View style={[styles.toggleTrack, value && styles.toggleTrackActive]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      </View>
    </TouchableOpacity>
  );
}

function formLabel(t: any, f: TobaccoBaseline['form']): string {
  const map: Record<TobaccoBaseline['form'], string> = {
    cigarette: t.formCigarette, bidi: t.formBidi, gutkha: t.formGutkha, paan_masala: t.formPaanMasala, khaini: t.formKhaini, vape: t.formVape,
  };
  return map[f];
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nishith },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl },
  brand: { fontFamily: FontFamily.regular, fontSize: FontSize.display, color: Colors.bhor, textAlign: 'center', marginBottom: Spacing.md },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xl, color: Colors.bone, marginBottom: Spacing.xs },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.boneSecondary, marginBottom: Spacing.lg, lineHeight: FontSize.base * 1.5 },
  featureList: { gap: Spacing.sm, marginBottom: Spacing.xxl },
  featureText: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.bone },
  fullWidthBtn: { width: '100%', marginTop: Spacing.md },

  optionRow: { borderWidth: 1.5, borderColor: Colors.nil, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, backgroundColor: Colors.nil },
  optionRowActive: { borderColor: Colors.bhor, backgroundColor: Colors.bhorSoft },
  optionText: { fontFamily: FontFamily.medium, fontSize: FontSize.md, color: Colors.bone },
  optionTextActive: { color: Colors.bhor },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  chip: { borderWidth: 1.5, borderColor: Colors.nil, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, backgroundColor: Colors.nil },
  chipActive: { borderColor: Colors.bhor, backgroundColor: Colors.bhorSoft },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.boneSecondary },
  chipTextActive: { color: Colors.bhor },

  fieldLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.boneSecondary, marginBottom: 2 },
  fieldHint: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.boneMuted, marginBottom: Spacing.xs, lineHeight: FontSize.xs * 1.4 },
  inputGroup: { marginBottom: Spacing.md },
  input: { backgroundColor: Colors.nil, borderWidth: 1.5, borderColor: Colors.nilElevated, borderRadius: Radius.md, padding: Spacing.md, color: Colors.bone, fontFamily: FontFamily.regular, fontSize: FontSize.base },

  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, marginBottom: Spacing.sm, gap: Spacing.md },
  toggleLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.bone },
  toggleTrack: { width: 44, height: 26, borderRadius: 13, backgroundColor: Colors.nilElevated, padding: 2, justifyContent: 'center' },
  toggleTrackActive: { backgroundColor: Colors.bhorSoft },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.boneMuted },
  toggleThumbActive: { backgroundColor: Colors.bhor, alignSelf: 'flex-end' },

  gateBody: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.bone, lineHeight: FontSize.base * 1.5, marginBottom: Spacing.md },
  gateWarning: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.bhor, lineHeight: FontSize.base * 1.5, marginBottom: Spacing.lg },
  ackRow: { borderWidth: 1.5, borderColor: Colors.nilElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  ackRowActive: { borderColor: Colors.bhor, backgroundColor: Colors.bhorSoft },
  ackText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.boneSecondary },
  ackTextActive: { color: Colors.bhor },
});
