// src/lib/sync.ts
// Bidirectional sync between the local Zustand store and Supabase.
// Strategy: local-first — every mutation writes locally first,
// then syncs to Supabase in the background. On app start we pull
// the remote data and merge it with local (remote wins for conflicts).

import { supabase, hasSupabaseConfig } from './supabase';
import { useAppStore, SmokingLog, DelaySession, Achievement, UserProfile } from '../store/useAppStore';

// ─── Push helpers ─────────────────────────────────────────────────────────────

export async function syncProfileToSupabase(profile: UserProfile): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({
      id: user.id,
      locale: profile.locale,
      daily_baseline: profile.dailyBaseline,
      cost_per_pack: profile.costPerPack,
      cigs_per_pack: profile.cigsPerPack,
      currency: profile.currency,
      goal_type: profile.goalType,
      motivations: profile.motivations,
      start_date: profile.startDate,
      theme_mode: profile.themeMode,
      notifications_enabled: profile.notificationsEnabled,
      onboarding_complete: profile.onboardingComplete,
      name: profile.name ?? null,
    }, { onConflict: 'id' });
  } catch {
    // Silent — local data is always safe
  }
}

export async function syncLogToSupabase(log: SmokingLog): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('smoking_logs').upsert({
      id: log.id,
      user_id: user.id,
      timestamp: log.timestamp,
      type: log.type,
      context_tag: log.contextTag ?? null,
      note: log.note ?? null,
    }, { onConflict: 'id' });
  } catch {}
}

export async function syncSessionToSupabase(session: DelaySession): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('delay_sessions').upsert({
      id: session.id,
      user_id: user.id,
      started_at: session.startedAt,
      completed_at: session.completedAt ?? null,
      duration_seconds: session.durationSeconds,
      intensity: session.intensity ?? null,
      context_tag: session.contextTag ?? null,
      outcome: session.outcome,
    }, { onConflict: 'id' });
  } catch {}
}

export async function syncAchievementToSupabase(achievement: Achievement): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('achievements').upsert({
      id: achievement.id,
      user_id: user.id,
      earned_at: achievement.earnedAt ?? new Date().toISOString(),
    }, { onConflict: 'id,user_id' });
  } catch {}
}

// ─── Pull (full initial sync) ─────────────────────────────────────────────────

export async function pullFromSupabase(): Promise<{
  profile: UserProfile | null;
  logs: SmokingLog[];
  delaySessions: DelaySession[];
  achievements: Achievement[];
}> {
  const empty = { profile: null, logs: [], delaySessions: [], achievements: [] };
  if (!hasSupabaseConfig()) return empty;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const [profileRes, logsRes, sessionsRes, achievementsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('smoking_logs').select('*').eq('user_id', user.id).order('timestamp', { ascending: true }),
      supabase.from('delay_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: true }),
      supabase.from('achievements').select('*').eq('user_id', user.id),
    ]);

    const remoteProfile = profileRes.data
      ? ({
          id: user.id,
          email: user.email,
          name: profileRes.data.name ?? undefined,
          locale: profileRes.data.locale,
          dailyBaseline: profileRes.data.daily_baseline,
          costPerPack: profileRes.data.cost_per_pack,
          cigsPerPack: profileRes.data.cigs_per_pack,
          currency: profileRes.data.currency,
          goalType: profileRes.data.goal_type,
          motivations: profileRes.data.motivations ?? [],
          startDate: profileRes.data.start_date,
          themeMode: profileRes.data.theme_mode,
          notificationsEnabled: profileRes.data.notifications_enabled,
          onboardingComplete: profileRes.data.onboarding_complete,
          isGuest: false,
        } as UserProfile)
      : null;

    const remoteLogs: SmokingLog[] = (logsRes.data ?? []).map((r: any) => ({
      id: r.id,
      timestamp: r.timestamp,
      type: r.type,
      contextTag: r.context_tag ?? undefined,
      note: r.note ?? undefined,
    }));

    const remoteSessions: DelaySession[] = (sessionsRes.data ?? []).map((r: any) => ({
      id: r.id,
      startedAt: r.started_at,
      completedAt: r.completed_at ?? undefined,
      durationSeconds: r.duration_seconds,
      intensity: r.intensity ?? undefined,
      contextTag: r.context_tag ?? undefined,
      outcome: r.outcome,
    }));

    const remoteAchievements: Achievement[] = (achievementsRes.data ?? []).map((r: any) => ({
      id: r.id,
      earnedAt: r.earned_at,
    }));

    return {
      profile: remoteProfile,
      logs: remoteLogs,
      delaySessions: remoteSessions,
      achievements: remoteAchievements,
    };
  } catch {
    return empty;
  }
}

// ─── Push all local data after sign-in ───────────────────────────────────────

export async function pushLocalDataToSupabase(): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    const store = useAppStore.getState();
    const { profile, logs, delaySessions, earnedAchievements } = store;
    if (!profile) return;

    await syncProfileToSupabase(profile);
    await Promise.all(logs.map(syncLogToSupabase));
    await Promise.all(delaySessions.map(syncSessionToSupabase));
    await Promise.all(earnedAchievements.map(syncAchievementToSupabase));
  } catch {}
}
