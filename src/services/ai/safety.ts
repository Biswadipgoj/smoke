// src/services/ai/safety.ts
// The app's handle on the Safety Layer (§5). The implementation is shared with
// the Edge Function so the client-side path (offline coach, development) and
// the production path apply exactly the same rules — see the header of the
// file below for why it lives where it does.

export {
  applySafetyFilter,
  detectCrisis,
  CRISIS_RESPONSE,
  SAFE_FALLBACK,
  type SafetyStatus,
  type SafetyVerdict,
} from '../../../supabase/functions/_shared/safety';
