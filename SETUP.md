# SmokeLess AI — setup and production checklist

A Biswodip Goj product. This document is the "how to run it"; the Master Build
Plan is the "why it is the way it is". Section references throughout (§8, §16,
…) point back at that plan.

---

## What you get with zero setup

Clone, `npm install`, `npx expo start` — and the app works. Fully.

- Craving flow end to end: trigger → intensity → intervention → countdown → outcome
- The adaptive delay algorithm (§8)
- Offline SQLite logging, timeline, calendar, analytics, money tracking
- The rule-based coach, which answers with no network and no API key
- en / hi / bn throughout

No account, no Supabase project and no Gemini key are needed for any of that.
That isn't a demo mode — §20-21 is explicit that an intervention tool which
stops working offline has failed at the moment it was built for.

**What needs setup:** account sync across devices (Supabase), and the AI coach
replacing the rule-based one (Supabase + Gemini).

---

## 1. Run it locally

```bash
npm install
npx expo start
```

Press `a` for an Android device or emulator. Expo Go can't host this build —
`expo-sqlite` and `expo-local-authentication` need a development build:

```bash
npx eas build --profile development --platform android
```

Install the resulting APK, then `npx expo start --dev-client`.

### Checks

```bash
npm run typecheck     # tsc, strict
npm run check:safety  # the two copies of the safety layer are in sync
npm run eval          # §30 prompt/safety eval harness
npm run check         # all three
```

---

## 2. Supabase (optional — enables accounts and sync)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, paste all of `supabase/schema.sql`, run it. That
   creates every table, turns on RLS with `auth.uid() = user_id` on all of
   them, adds the new-user trigger, and defines `delete_my_account()`.
3. **Project Settings → API**: copy the Project URL and the `anon public` key.
4. Create `.env` in the repo root:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

5. Restart with `npx expo start --clear`.

The anon key is designed to be public and is safe in the bundle — RLS is what
protects the data, and every table has it. **The Gemini key is not**, which is
what the edge function below exists for.

### Google sign-in

`supabase.auth.signInWithOAuth({ provider: 'google' })` is one call, but it
needs a Google Cloud OAuth client with your own redirect URIs, so it can't be
scaffolded here. Configure the client in Google Cloud, enable the provider in
Supabase → Authentication → Providers, then add the call to
`app/(auth)/sign-in.tsx`.

---

## 3. The AI coach (optional)

The app never calls Gemini directly. A key inside an APK is extractable by
anyone with a decompiler, and rotating it would mean shipping a new build to
every user. So calls go through a Supabase Edge Function that holds the key
server-side.

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set GEMINI_API_KEY=<key from aistudio.google.com>
supabase functions deploy ai-coach
```

That's it — the app picks it up automatically. Without it, `askCoach()` falls
through to the rule-based coach, which is a working answer rather than an
error.

**JWT verification stays on.** Without it the public anon key turns the
function into an open Gemini relay billed to you.

### If you change the safety rules

`src/services/ai/safety.ts` is canonical. `supabase/functions/ai-coach/safety.ts`
is a copy, because Deno can't import from the app's source tree at deploy time.
Change the app one, copy it across, and run `npm run check:safety`, which fails
if they've drifted.

---

## 4. Build an APK

```bash
npx eas build --profile preview --platform android      # installable APK
npx eas build --profile production --platform android   # AAB for Play
npx eas build --profile production-apk --platform android
```

Set the same environment variables as EAS environment variables — a local
`.env` is not uploaded with a build:

```bash
npx eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://... --environment production
npx eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJ... --environment production
```

CI is already wired: pushing to `main` builds a preview APK and publishes an
OTA update; pushing a `v*` tag builds both an AAB and an APK.

---

## Going to production — what is genuinely still needed

Honest list, not a formality.

**Native-speaker review of Hindi and Bengali.** The strings in `src/i18n/hi.ts`
and `bn.ts` are solid starting translations written to read as everyday spoken
language, not formal register. They have not been reviewed by native speakers.
Separately and more importantly: **AI-generated coaching** in those languages
is the highest-risk unknown in the whole product. Ship the hi/bn *UI* now; keep
hi/bn *coaching* behind a beta label until you've run §30's eval harness
against real conversations and are satisfied with tone and safety, not just
grammar.

**Field-level encryption for the free-text notes.** Flagged as a TODO in
`supabase/schema.sql` rather than half-implemented. In aggregate those notes
are an addiction-history journal; RLS stops another user reading them but not a
leaked service-role key. Two columns, two tables — the change is contained.

**A real privacy policy.** The app says your data is never sold, on the Privacy
screen. That needs to be a published policy before launch, not an internal
principle.

**Tests.** None ship. §28's priority order: the delay algorithm first (a pure
function, highest value per hour), then the safety filter with a proper
adversarial set, then offline/sync behaviour. `npm run eval` is the beginning
of the second of those, not the whole of it.

**App store assets and a signing identity.** Icon set, screenshots, listing
copy, a Play Console account.

**A device.** No amount of typechecking substitutes for running §31's checklist
against a real build: would you open this during an actual craving, or does the
flow feel like friction between you and relief?

---

## Where things live

```
app/                        24 routes (§25), one file per screen
  (onboarding)/             welcome, language, setup
  (auth)/sign-in            §18
  (tabs)/                   dashboard, coach, analytics, profile
  craving.tsx               §7 — the centrepiece flow
src/
  types/                    §24 — shape of record, mirrored by both schemas
  theme/                    §10, §26 — tokens and the provider
  i18n/                     §17 — en/hi/bn dictionaries
  components/
    Horizon.tsx             §10 — the signature visual
  features/
    behavior/analysis.ts    §3-6 Behaviour Analysis Engine
    cravings/               §8 delay algorithm, §3-6 intervention engine
    analytics/insights.ts   §14 narrative insights
    progress/               §13 horizon progression, achievements
    health/, money/         §16, §15
  services/
    db/localDb.ts           §20 offline SQLite
    ai/                     §5, §6, §29-30 — prompt, safety, offline coach
    sync/                   §20 sync queue
supabase/
  schema.sql                §19 — RLS on every table
  functions/ai-coach/       key-safe AI proxy
scripts/evalPrompts.ts      §30 eval harness
```
