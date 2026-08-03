// src/store/useAuthStore.ts
// Tracks the Supabase session so routing (app/index.tsx) can decide between
// /auth, /onboarding, and the tabs. Centralized here so both the root layout
// and the router only need one subscription, and so a sign-out anywhere in
// the app (e.g. from Settings) is reflected everywhere immediately.
import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { hydrateFromRemote, clearLocalState } from '../lib/auth';

interface AuthState {
  checked: boolean;
  session: Session | null;
  init: () => void;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  checked: false,
  session: null,

  init: () => {
    if (initialized) return;
    initialized = true;

    if (!hasSupabaseConfig()) {
      // No backend configured — treat as "checked, signed out" so the app
      // still boots and shows the auth screen with a clear setup message,
      // instead of hanging on a splash screen forever.
      set({ checked: true, session: null });
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) await hydrateFromRemote();
      set({ checked: true, session: data.session });
    });

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await hydrateFromRemote();
        set({ session, checked: true });
      } else if (event === 'SIGNED_OUT') {
        clearLocalState();
        set({ session: null, checked: true });
      } else {
        set({ session, checked: true });
      }
    });
  },
}));
