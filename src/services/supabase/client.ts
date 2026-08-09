// src/services/supabase/client.ts
//
// §18-19. The anon key is meant to be public and is safe to ship, because
// every table is protected by RLS with `auth.uid() = user_id` (see
// supabase/schema.sql). The Gemini key is a different matter entirely and
// never comes near this file — see src/services/ai/index.ts.
//
// Setup: create a project at supabase.com, then put its URL and anon key in a
// .env at the repo root (and in EAS environment variables for builds):
//
//   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
//
// Full walkthrough in SETUP.md.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * The app is fully usable with no backend at all, so every call site checks
 * this rather than assuming a project exists.
 */
export function hasSupabaseConfig(): boolean {
  return SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;
}

// No-op storage for static web export, where there is no device to persist to.
const memoryStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key-not-configured',
  {
    auth: {
      storage: (typeof window !== 'undefined' ? AsyncStorage : memoryStorage) as never,
      autoRefreshToken: true,
      persistSession: true,
      // Deep-link sessions are handled by the auth screen, not by URL parsing.
      detectSessionInUrl: false,
    },
  }
);
