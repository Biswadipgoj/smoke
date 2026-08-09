// src/services/ai/prompt.ts
// Versioned prompt definitions (§29-30), shared with the Edge Function that
// actually sends them. The app imports COACH_PROMPT_VERSION so a reply can be
// attributed to the prompt that produced it, and STYLE_INSTRUCTIONS so the
// settings screen can describe each style from the same source the model gets.

export {
  COACH_PROMPT_VERSION,
  STYLE_INSTRUCTIONS,
  buildSystemPrompt,
  type CoachContext,
} from '../../../supabase/functions/_shared/prompt';
