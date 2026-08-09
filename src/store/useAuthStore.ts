// src/store/useAuthStore.ts
// Session state (§18). An account is optional in this app: without one every
// feature still works and the data simply never leaves the phone. That means
// nothing in the UI may block on `session` being non-null.

import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { hasSupabaseConfig, supabase } from '../services/supabase/client';

interface AuthState {
  /** False until the first session check finishes — the splash gate waits on this. */
  checked: boolean;
  session: Session | null;
  init: () => Promise<void>;
  setSession: (session: Session | null) => void;
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
      supabase.auth.onAuthStateChange((_event, session) => set({ session }));
    } catch {
      // Offline at cold start is normal; a stored session refreshes later.
      set({ checked: true });
    }
  },

  setSession: (session) => set({ session }),

  signOut: async () => {
    if (hasSupabaseConfig()) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Clearing local session state matters more than the round trip.
      }
    }
    set({ session: null });
  },
}));

export function userId(): string | null {
  return useAuthStore.getState().session?.user.id ?? null;
}
