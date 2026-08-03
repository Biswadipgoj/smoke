// src/lib/supabase.ts
// Supabase client — the backend of record for the full account-based build.
// Credentials come from environment variables so nothing sensitive is
// hardcoded (master doc §15.3's "no API keys in the APK" applies to the
// anon key's *source*, not its presence — the anon key is meant to be
// public and is safe to ship as long as RLS is enforced on every table,
// which supabase/schema.sql does).
//
// HOW TO SET UP — see SETUP.md for the full walkthrough:
//   1. Create a project at https://supabase.com
//   2. Project Settings → API → copy "Project URL" and "anon public" key
//   3. Create a .env file in the project root:
//        EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
//        EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
//   4. Restart the dev server: npx expo start --clear
//   5. For EAS builds/updates, also set these as EAS environment variables
//      (see SETUP.md) — a local .env is not included in a build.

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True only once real project credentials have been provided. */
export const hasSupabaseConfig = (): boolean =>
  SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;

// SSR-safe storage for static web export — no-op reads/writes off-device.
const ssrStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

const storageAdapter = typeof window !== 'undefined' ? AsyncStorage : ssrStorage;

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: {
      storage: storageAdapter as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
