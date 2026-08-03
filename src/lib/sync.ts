// src/lib/sync.ts
// Push-on-write + pull-on-login sync between the local Zustand store and
// Supabase. The server is the source of truth: sign-in always pulls the
// remote dataset and replaces local state with it (local AsyncStorage is a
// read cache for offline access, not an independent copy of record). Every
// push is best-effort and silent on failure — a dropped network write is
// retried on the next mutation or the next login, never surfaced as an
// error in the urge/lapse flows, which must never block on the network.
import { supabase, hasSupabaseConfig } from './supabase';
import {
  Track, ConsumptionEvent, UrgeEvent, LapseEvent, CheckIn, ThreadBead,
  ImplementationIntention, Settings,
} from '../domain/types';

async function currentUserId(): Promise<string | null> {
  if (!hasSupabaseConfig()) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ── Push (upsert) ────────────────────────────────────────────────────────────

export async function pushProfile(settings: Settings, onboardingComplete: boolean): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await supabase.from('profiles').upsert({
      id: uid,
      onboarding_complete: onboardingComplete,
      locale: settings.locale,
      theme_mode: settings.themeMode,
      reduced_motion: settings.reducedMotion,
      haptics_mode: settings.hapticsMode,
      app_lock_enabled: settings.appLockEnabled,
      stealth_mode_enabled: settings.stealthModeEnabled,
      notifications_enabled: settings.notificationsEnabled,
      currency: settings.currency,
    });
  } catch {
    // Retried implicitly on the next settings change or next login pull.
  }
}

export async function pushTrack(track: Track): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await supabase.from('tracks').upsert({
      id: track.id, user_id: uid, type: track.type, started_at: track.startedAt,
      quit_date: track.quitDate, baseline: track.baseline, active: track.active,
    });
  } catch {}
}

export async function pushEvent(event: ConsumptionEvent): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  const { id, timestamp, loggedAt, track, trigger, locationContext, mood, note, ...rest } = event;
  try {
    await supabase.from('consumption_events').upsert({
      id, user_id: uid, track, timestamp, logged_at: loggedAt, trigger,
      location_context: locationContext ?? null, mood: mood ?? null, note: note ?? null,
      data: rest,
    });
  } catch {}
}

export async function pushUrge(urge: UrgeEvent): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await supabase.from('urges').upsert({
      id: urge.id, user_id: uid, track: urge.track, started_at: urge.startedAt,
      ended_at: urge.endedAt, initial_intensity: urge.initialIntensity,
      intensity_curve: urge.intensityCurve, trigger: urge.trigger,
      location_context: urge.locationContext ?? null, outcome: urge.outcome,
      used_breathing: urge.usedBreathing,
    });
  } catch {}
}

export async function pushLapse(lapse: LapseEvent): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await supabase.from('lapses').upsert({
      id: lapse.id, user_id: uid, track: lapse.track, timestamp: lapse.timestamp,
      trigger: lapse.trigger, note: lapse.note ?? null, linked_urge_id: lapse.linkedUrgeId ?? null,
    });
  } catch {}
}

export async function pushCheckIn(checkIn: CheckIn): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await supabase.from('check_ins').upsert({
      id: checkIn.id, user_id: uid, date: checkIn.date, mood: checkIn.mood ?? null,
      sleep_quality: checkIn.sleepQuality ?? null, halt_hungry: checkIn.halt.hungry,
      halt_angry: checkIn.halt.angry, halt_lonely: checkIn.halt.lonely, halt_tired: checkIn.halt.tired,
    }, { onConflict: 'user_id,date' });
  } catch {}
}

export async function pushBead(bead: ThreadBead): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await supabase.from('thread_beads').upsert({
      id: bead.id, user_id: uid, type: bead.type, track: bead.track, created_at: bead.createdAt,
    });
  } catch {}
}

export async function pushIntention(intention: ImplementationIntention): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await supabase.from('implementation_intentions').upsert({
      id: intention.id, user_id: uid, track: intention.track, cue_type: intention.cueType,
      cue: intention.cue, response: intention.response, created_at: intention.createdAt,
    });
  } catch {}
}

export async function deleteIntentionRemote(id: string): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    await supabase.from('implementation_intentions').delete().eq('id', id);
  } catch {}
}

// ── Pull (full hydrate on sign-in) ──────────────────────────────────────────

export interface RemoteSnapshot {
  profile: { onboardingComplete: boolean; settings: Settings } | null;
  tracks: Track[];
  events: ConsumptionEvent[];
  urges: UrgeEvent[];
  lapses: LapseEvent[];
  checkIns: CheckIn[];
  beads: ThreadBead[];
  intentions: ImplementationIntention[];
}

const EMPTY_SNAPSHOT: RemoteSnapshot = {
  profile: null, tracks: [], events: [], urges: [], lapses: [], checkIns: [], beads: [], intentions: [],
};

export async function pullAll(): Promise<RemoteSnapshot> {
  const uid = await currentUserId();
  if (!uid) return EMPTY_SNAPSHOT;

  const [profileRes, tracksRes, eventsRes, urgesRes, lapsesRes, checkInsRes, beadsRes, intentionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
    supabase.from('tracks').select('*').eq('user_id', uid),
    supabase.from('consumption_events').select('*').eq('user_id', uid),
    supabase.from('urges').select('*').eq('user_id', uid),
    supabase.from('lapses').select('*').eq('user_id', uid),
    supabase.from('check_ins').select('*').eq('user_id', uid),
    supabase.from('thread_beads').select('*').eq('user_id', uid),
    supabase.from('implementation_intentions').select('*').eq('user_id', uid),
  ]);

  const profile = profileRes.data
    ? {
        onboardingComplete: profileRes.data.onboarding_complete,
        settings: {
          locale: profileRes.data.locale, themeMode: profileRes.data.theme_mode,
          reducedMotion: profileRes.data.reduced_motion, hapticsMode: profileRes.data.haptics_mode,
          appLockEnabled: profileRes.data.app_lock_enabled, stealthModeEnabled: profileRes.data.stealth_mode_enabled,
          notificationsEnabled: profileRes.data.notifications_enabled, currency: profileRes.data.currency,
        } as Settings,
      }
    : null;

  const tracks: Track[] = (tracksRes.data ?? []).map((r: any) => ({
    id: r.id, type: r.type, startedAt: r.started_at, quitDate: r.quit_date, baseline: r.baseline, active: r.active,
  }));

  const events: ConsumptionEvent[] = (eventsRes.data ?? []).map((r: any) => ({
    id: r.id, timestamp: r.timestamp, loggedAt: r.logged_at, track: r.track, trigger: r.trigger ?? [],
    locationContext: r.location_context ?? undefined, mood: r.mood ?? undefined, note: r.note ?? undefined,
    ...(r.data ?? {}),
  }));

  const urges: UrgeEvent[] = (urgesRes.data ?? []).map((r: any) => ({
    id: r.id, track: r.track, startedAt: r.started_at, endedAt: r.ended_at, initialIntensity: r.initial_intensity,
    intensityCurve: r.intensity_curve ?? [], trigger: r.trigger ?? [], locationContext: r.location_context ?? undefined,
    outcome: r.outcome, usedBreathing: r.used_breathing,
  }));

  const lapses: LapseEvent[] = (lapsesRes.data ?? []).map((r: any) => ({
    id: r.id, track: r.track, timestamp: r.timestamp, trigger: r.trigger ?? [], note: r.note ?? undefined,
    linkedUrgeId: r.linked_urge_id ?? undefined,
  }));

  const checkIns: CheckIn[] = (checkInsRes.data ?? []).map((r: any) => ({
    id: r.id, date: r.date, mood: r.mood ?? undefined, sleepQuality: r.sleep_quality ?? undefined,
    halt: { hungry: r.halt_hungry, angry: r.halt_angry, lonely: r.halt_lonely, tired: r.halt_tired },
  }));

  const beads: ThreadBead[] = (beadsRes.data ?? [])
    .map((r: any) => ({ id: r.id, type: r.type, track: r.track, createdAt: r.created_at }))
    .sort((a: ThreadBead, b: ThreadBead) => a.createdAt.localeCompare(b.createdAt));

  const intentions: ImplementationIntention[] = (intentionsRes.data ?? []).map((r: any) => ({
    id: r.id, track: r.track, cueType: r.cue_type, cue: r.cue, response: r.response, createdAt: r.created_at,
  }));

  return { profile, tracks, events, urges, lapses, checkIns, beads, intentions };
}

/** DPDP erasure — clears all app-data rows for the signed-in user, keeps the account itself (see SETUP.md for full account deletion, which needs a service-role function). */
export async function deleteAllRemote(): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  const tables = ['consumption_events', 'urges', 'lapses', 'check_ins', 'thread_beads', 'implementation_intentions', 'tracks'];
  await Promise.allSettled(tables.map((table) => supabase.from(table).delete().eq('user_id', uid)));
  await supabase.from('profiles').update({
    onboarding_complete: false, locale: 'en', theme_mode: 'dark', reduced_motion: false,
    haptics_mode: 'full', app_lock_enabled: false, stealth_mode_enabled: false,
    notifications_enabled: true, currency: '₹',
  }).eq('id', uid);
}
