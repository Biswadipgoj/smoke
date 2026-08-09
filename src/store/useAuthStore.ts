// src/store/useAuthStore.ts
//
// §18 — Supabase Auth: email/password and magic link. Google OAuth is one call
// (`supabase.auth.signInWithOAuth`) once a Google Cloud OAuth client exists,
// which can't be scaffolded without the project owner's own credentials — see
// SETUP.md.
//
// Signing in is optional throughout. `checked` means "we know whether there's
// a session", not "there is one".

import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { hasSupabaseConfig, supabase } from '../services/supabase/client';
import { syncNow } from '../services/sync';

interface AuthState {
  checked: boolean;
  session: Session | null;
  /** True when the user explicitly chose to carry on without an account. */
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  sendMagicLink: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  checked: false,
  session: null,

  init: async () => {
    if (!hasSupabaseConfig()) {
      set({ checked: true, session: null });
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      set({ session: data.session, checked: true });
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session });
        if (session) void syncNow();
      });
      if (data.session) void syncNow();
    } catch {
      // A backend that can't be reached at launch must not stop the app: the
      // whole point of §20 is that everything works without one.
      set({ checked: true, session: null });
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  },

  sendMagicLink: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return error?.message ?? null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));
