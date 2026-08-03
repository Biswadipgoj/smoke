// src/lib/auth.ts
// Auth helpers wrapping Supabase auth, plus the post-sign-in hydrate step.
// This is a full account-based backend: there is no anonymous/guest mode —
// a session is required before onboarding or any tab is reachable (see
// app/index.tsx and app/_layout.tsx).
import { supabase, hasSupabaseConfig } from './supabase';
import { pullAll } from './sync';
import { useDhruvStore } from '../store/useDhruvStore';

export type AuthResult = { success: true; hasSession: boolean } | { success: false; error: string };

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!hasSupabaseConfig()) return { success: false, error: 'Backend not configured. See SETUP.md.' };
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };
    // With email confirmation ON (the Supabase default), signUp succeeds but
    // returns no session until the user clicks the confirmation link. With
    // it OFF, a session comes back immediately — handle both.
    return { success: true, hasSession: !!data.session };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Sign up failed' };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!hasSupabaseConfig()) return { success: false, error: 'Backend not configured. See SETUP.md.' };
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, hasSession: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Sign in failed' };
  }
}

export async function signOut(): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // Local state is cleared by the caller regardless.
  }
}

/** Pulls the full remote dataset and replaces local state with it — the server is authoritative. */
export async function hydrateFromRemote(): Promise<void> {
  const snapshot = await pullAll();
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return;

  useDhruvStore.setState({
    profile: {
      id: uid,
      createdAt: new Date().toISOString(),
      onboardingComplete: snapshot.profile?.onboardingComplete ?? false,
      settings: snapshot.profile?.settings ?? useDhruvStore.getState().profile?.settings ?? {
        locale: 'en', themeMode: 'dark', reducedMotion: false, hapticsMode: 'full',
        appLockEnabled: false, stealthModeEnabled: false, notificationsEnabled: true, currency: '₹',
      },
    },
    tracks: snapshot.tracks,
    events: snapshot.events,
    urges: snapshot.urges,
    lapses: snapshot.lapses,
    checkIns: snapshot.checkIns,
    beads: snapshot.beads,
    intentions: snapshot.intentions,
  });
  await useDhruvStore.getState().saveToStorage();
}

/** Clears local state on sign-out — nothing from the previous account should linger on a shared device. */
export function clearLocalState(): void {
  useDhruvStore.setState({
    profile: null, tracks: [], events: [], urges: [], lapses: [], checkIns: [], beads: [], intentions: [],
  });
}
