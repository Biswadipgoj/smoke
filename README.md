# SmokeLess AI

An Expo (React Native + TypeScript) app that helps people smoke less by making
cravings survivable: understand the trigger, delay a little, log honestly
either way.

Built from the SmokeLess AI Master Build Plan. A Biswodip Goj product.

---

## The core loop

Track → Understand → Intervene → Delay → Reward → Learn → Reduce → Quit.

Two rules hold everywhere in the codebase, and both are easy to break by
accident:

1. **A logged cigarette is a neutral data point, never a moral event.** There
   are no streaks, nothing resets to zero, and no screen turns red. The
   strongest "something happened" colour in the palette is a muted terracotta.
2. **Everything below the AI layer works offline.** The craving flow, the delay
   algorithm, the intervention engine and the whole history are local SQLite
   and pure functions. The model adds language on top of decisions the app can
   already make — it does not make them.

## What's here

```
app/                        24 screens, expo-router file routes
  (onboarding)/             welcome · language · setup
  (auth)/sign-in            email + magic link, optional
  (tabs)/                   dashboard · analytics · coach · profile
  craving.tsx               the centrepiece flow
  timeline · calendar · goals · health · rewards · achievements
  notifications · settings · ai-memory · privacy · backup · help · about
  delete-account

src/
  types/                    one shape definition for all three data layers
  theme/                    tokens + ThemeProvider (motionScale, script fonts)
  i18n/                     en / hi / bn, typed off the English dictionary
  services/db/localDb.ts    SQLite + the Behavior Analysis Engine
  services/ai/              prompt · safety · client · offline coach · memory
  services/sync/            the sync queue
  features/cravings/        delayAlgorithm · interventionEngine
  features/analytics/       insights (template-narrative generator)
  features/health/          verified milestone data
  features/rewards/         the horizon/tree progression
  components/Horizon.tsx    the signature visual, in SVG

supabase/
  schema.sql                every table, RLS on all of them
  functions/ai-coach/       the Gemini endpoint (the API key lives here)
  functions/_shared/        prompt + safety, shared with the app

scripts/
  evalPrompts.ts            safety/prompt eval harness
  testEngines.ts            delay algorithm + engine invariants
```

## Running it

```bash
npm install
cp .env.example .env     # optional — the app runs fully without a backend
npx expo start
```

Without Supabase credentials the app is local-only: every feature works, data
stays on the phone, and the coach answers from the offline rule engines. See
[SETUP.md](./SETUP.md) to wire up accounts, sync and the AI coach.

## Checks

```bash
npm run typecheck     # tsc --noEmit
npm run test          # safety eval + engine invariants
```

`npm run test` is worth reading as documentation: every assertion in
`scripts/testEngines.ts` is a design commitment that would look reasonable
inverted in a diff ("harder cravings get a harder ask" is wrong, and the test
says so).

## Before a public release

- **Native-speaker review of the Hindi and Bengali coaching output.** The UI
  strings are solid starting translations; AI-generated behavioural coaching in
  those languages is the highest-risk unknown in the whole product, which is
  why the coach screen carries a beta label in hi/bn until this is done.
- **Field-level encryption for the free-text `note` columns.** RLS stops one
  user reading another's rows; it does not protect those rows from a leaked
  service-role key, and those notes are an addiction-history journal. Flagged
  as a TODO at the top of `supabase/schema.sql` rather than half-implemented.
- **A real privacy policy** carrying the "never sold" line the app already
  states on its Privacy screen.
- Your own Supabase project, Gemini key, store assets and signing identity.
