// src/services/supabase/client.ts
// ─────────────────────────────────────────────────────────────────────────────
// Supabase client (§18-19).
//
// The anon key is *meant* to be public and is safe in the app bundle, because
// every table has RLS with `auth.uid() = user_id` (supabase/schema.sql). The
// Gemini key is not, which is why it lives in an Edge Function instead — see
// supabase/functions/ai-coach/index.ts.
//
// Setup (full walkthrough in SETUP.md):
//   1. Create a project at https://supabase.com
//   2. Project Settings → API → copy the Project URL and the anon public key
//   3. Put them in .env at the repo root:
//        EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//        EXPO_PUBLIC_SUPABASE_ANON_KEY=...
//   4. npx expo start --clear
// Without them the app runs fully, local-only: accounts and sync are off and
// every screen says so rather than failing.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True only once real project credentials are present. */
export function hasSupabaseConfig(): boolean {
  return SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;
}

// Static web export runs this module without a window; AsyncStorage would
// throw there, and a no-op store is the correct behaviour off-device.
const ssrStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key-not-configured',
  {
    auth: {
      storage: (typeof window !== 'undefined' ? AsyncStorage : ssrStorage) as never,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
