// src/lib/supabase.ts
// ─────────────────────────────────────────────────────────────────────────────
// Supabase client — reads credentials from environment variables.
// HOW TO SET UP:
//   1. Create a project at https://supabase.com
//   2. Go to Project Settings → API
//   3. Copy the "Project URL" and "anon public" key
//   4. Create a file called .env in the root of this project (d:\smoke\.env)
//      and add:
//
//        EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
//        EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
//
//   5. Restart the dev server: npx expo start --clear
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Returns true only when real credentials have been provided
export const hasSupabaseConfig = (): boolean =>
  SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;

// SSR-safe storage for Web (EAS Hosting)
const ExpoSSRStorage = {
  getItem: (key: string) => { return null; },
  setItem: (key: string, value: string) => { },
  removeItem: (key: string) => { },
};

const storageAdapter = typeof window !== 'undefined' ? AsyncStorage : ExpoSSRStorage;

export const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder', {
  auth: {
    storage: storageAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
