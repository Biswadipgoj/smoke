// src/lib/auth.ts
// Auth helpers — wraps Supabase auth with app-level store wiring.

import { supabase, hasSupabaseConfig } from './supabase';
import { pullFromSupabase, pushLocalDataToSupabase } from './sync';
import { useAppStore } from '../store/useAppStore';

export type AuthResult = { success: true } | { success: false; error: string };

// Sign up with email + password
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!hasSupabaseConfig()) return { success: false, error: 'Supabase not configured. Add credentials to .env file.' };
  try {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };
    // Push local guest data up immediately
    await pushLocalDataToSupabase();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Sign up failed' };
  }
}

// Sign in with email + password
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!hasSupabaseConfig()) return { success: false, error: 'Supabase not configured. Add credentials to .env file.' };
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    await handlePostSignIn();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Sign in failed' };
  }
}

// Magic link (email OTP)
export async function sendMagicLink(email: string): Promise<AuthResult> {
  if (!hasSupabaseConfig()) return { success: false, error: 'Supabase not configured.' };
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'smokeless://auth/callback' },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Failed to send link' };
  }
}

// Sign out
export async function signOut(): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    await supabase.auth.signOut();
    const { updateProfile } = useAppStore.getState();
    updateProfile({ isGuest: true, email: undefined, name: undefined });
  } catch {}
}

// Called after any successful sign-in to merge remote data
async function handlePostSignIn(): Promise<void> {
  const { setProfile, profile, logs: localLogs, delaySessions: localSessions } = useAppStore.getState();

  // First push any local guest data to Supabase
  await pushLocalDataToSupabase();

  // Then pull the full remote dataset (remote wins for profile, merge logs)
  const remote = await pullFromSupabase();
  if (remote.profile) {
    // Merge: take remote profile but keep highest log count
    const mergedLogs = [...localLogs];
    remote.logs.forEach((rl) => {
      if (!mergedLogs.find((ll) => ll.id === rl.id)) mergedLogs.push(rl);
    });
    setProfile(remote.profile);
    useAppStore.setState({
      logs: mergedLogs,
      delaySessions: remote.delaySessions.length > localSessions.length
        ? remote.delaySessions
        : localSessions,
      earnedAchievements: remote.achievements,
    });
  }
}

// Listen to auth state changes — call once in root layout
export function subscribeToAuthChanges(): () => void {
  if (!hasSupabaseConfig()) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      await handlePostSignIn();
    }
  });
  return () => subscription.unsubscribe();
}
