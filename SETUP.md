# Dhruv — Production Setup Guide

Dhruv is a full account-based app: Supabase is the backend of record (auth +
Postgres), and every device syncs to it. Local storage is a read cache for
offline use, not an independent copy of the data. This guide takes you from
zero to a Play Store release.

---

## 0. Prerequisites

- Node.js 20.x and npm
- A [Supabase](https://supabase.com) account (free tier is enough to start)
- A [Google Play Console](https://play.google.com/console) developer account
  (one-time $25 registration fee)
- An [Expo](https://expo.dev) account, for EAS Build/Update

```bash
npm install -g eas-cli
eas login
```

---

## 1. Create the Supabase project

1. [supabase.com](https://supabase.com) → **New project**. Pick a region
   close to your primary user base (India/Bangladesh → Singapore or Mumbai
   if offered).
2. Wait for provisioning (~2 minutes), then open **Project Settings → API**
   and copy:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public** key

## 2. Run the database schema

Open **SQL Editor** in the Supabase dashboard, paste the entire contents of
[`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates:

- `profiles`, `tracks`, `consumption_events`, `urges`, `lapses`, `check_ins`,
  `thread_beads`, `implementation_intentions`
- Row Level Security on every table, scoped to `auth.uid()` — a user can only
  ever read or write their own rows
- A trigger that auto-creates a `profiles` row when someone signs up

Prefer the CLI/migrations workflow instead of pasting SQL by hand once you
have more than one environment:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push   # applies supabase/schema.sql as a migration
```

**Verify RLS is actually on** before going further: Table Editor → each
table → the shield icon should read "RLS enabled." If any table shows RLS
off, re-run the relevant `alter table ... enable row level security;` line
from the schema — a table without RLS is readable by any anon-key holder,
which is a real data breach in this app (journal-adjacent lapse notes).

## 3. Configure Auth

**Authentication → Providers → Email** is enabled by default. Two settings
matter for a production launch:

- **Confirm email** (Authentication → Settings): ON is the safer default —
  the app already handles the "check your email" state (`app/auth.tsx`).
  Turning it OFF means `signUp` returns a session immediately; the app
  handles that path too.
- **Site URL / Redirect URLs** (Authentication → URL Configuration): add
  your `app.json` scheme, e.g. `dhruv://`, so password-reset and
  email-confirmation links can deep-link back into the app. (Building that
  deep-link screen — a "reset password" flow — isn't done in this pass; the
  confirmation-link path works today because Supabase's default confirmation
  page is web-based.)

For a mental-health-adjacent product, also set a **sensible rate limit** on
email sign-ups (Authentication → Rate Limits) to blunt abuse, and consider
enabling **CAPTCHA** (Authentication → Bot and Abuse Protection) before
public launch.

## 4. Local development environment

Create `.env` in the project root (never commit this file):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
```

`EXPO_PUBLIC_GEMINI_API_KEY` is optional — get one free at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey). Without
it, the Companion tab still works: the guided offline paths are always
there, and free-text chat shows the "can't reach the network" fallback
instead of a live reply. See the "AI companion key exposure" note under
**Known gaps** below before shipping this publicly — it's a real tradeoff,
not an oversight.

```bash
npm install
npx expo start --clear
```

`expo-quick-actions` and `expo-local-authentication` are native config
plugins, so **this will not run in plain Expo Go** — build a dev client
once:

```bash
eas build --profile development --platform android
# or, with Android Studio installed:
npx expo run:android
```

## 5. EAS environment variables (required for builds/updates)

A local `.env` only affects `expo start`. EAS builds and OTA updates need
the same variables stored on EAS so they're inlined into the bundle — do
this once per environment (`development`, `preview`, `production`):

```bash
for env in development preview production; do
  eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project-id.supabase.co" \
    --visibility plaintext --environment $env
  eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key-here" \
    --visibility plaintext --environment $env
  eas env:create --name EXPO_PUBLIC_GEMINI_API_KEY --value "your-gemini-api-key-here" \
    --visibility sensitive --environment $env
done
```

The Supabase anon key is meant to be public (it has no privileges beyond
what RLS grants), so `plaintext` is fine — it is **not** a secret in the way
a service-role key would be. Never put a Supabase **service role** key in
`EXPO_PUBLIC_*` or anywhere in the client app; it bypasses RLS entirely.

The Gemini key is a different story: `EXPO_PUBLIC_*` vars are inlined into
the client bundle, so this key **is extractable from the APK**. `sensitive`
visibility only hides it from the EAS dashboard/logs, not from the shipped
app. Restrict it in [Google AI Studio](https://aistudio.google.com/apikey)
(set a daily quota, and an app/package restriction if offered) and treat a
leak as a "rotate it" event, not a "we got breached" event. See **Known
gaps** at the bottom of this file for the proper long-term fix (a proxy).

## 6. Google service account key — fixes the non-interactive build failure

If a CI/`--non-interactive` build dies with:

```
Looking up credentials configuration for com.smokeless.ai...
Google Service Account Keys cannot be set up in --non-interactive mode.
Error: build:internal command failed.
```

…it means EAS wants a Google **service account key** that hasn't been stored
on your EAS project yet, and `--non-interactive` forbids it from prompting
you to create one mid-build. **The one-time setup below is the fix, and only
the account owner can do it** — it needs your Firebase/Play Console access,
so it can't be done from a PR.

There are two *different* Google service account keys in an Android Expo
project, and it's worth knowing which one you're being asked for:

| Key | Needed for | Set up under |
|---|---|---|
| **FCM V1** | Android notifications via `expo-notifications` | Firebase project → service account |
| **Play submissions** | `eas submit` uploading to the Play Store | Play Console → API access |

**The likely culprit here is the FCM V1 key**, because this project depends
on `expo-notifications` and EAS resolves Android push credentials during the
build's credential step — which is exactly where the log above stops, right
after the keystore was resolved successfully. Worth knowing: Dhruv only ever
sends **local** notifications (the single 24h post-lapse follow-up), so it
does not functionally need push — but EAS's credential check keys off the
package being present, not off how you use it.

Rather than guess, confirm which one is missing in one command:

```bash
eas credentials
# → Android → production → inspect "Push Notifications (FCM V1)"
#   and "Google Service Account" entries
```

### Setting up the FCM V1 key (Android notifications)

1. Create/open a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   and add an Android app with package name `com.smokeless.ai`.
2. Firebase **Project settings → Service accounts → Generate new private
   key** → downloads a `.json`. **Never commit it.**
3. `eas credentials` → **Android** → **production** → **Push Notifications
   (FCM V1)** → **Set up a Google Service Account Key** → point it at that
   file. It's then stored on EAS and every future non-interactive build
   resolves it automatically.

### Setting up the Play submissions key (only needed for `eas submit`)

1. **Play Console → Setup → API access → Choose a project to link** (or
   create one), linking a Google Cloud project to your Play Console account.
2. In that Google Cloud project: **IAM & Admin → Service Accounts → Create
   service account** (e.g. `eas-release`).
3. Back in Play Console **API access**, find it under **Service accounts** →
   **Grant access** → at least **Release manager**.
4. Google Cloud → the service account → **Keys → Add key → Create new key →
   JSON**. **Never commit it.**
5. Upload it to EAS as a file-type env var — this is what `eas.json`'s
   `submit.production.android.serviceAccountKeyPath: "$GOOGLE_SERVICE_ACCOUNT_KEY"`
   resolves:

   ```bash
   eas env:create --name GOOGLE_SERVICE_ACCOUNT_KEY --type file \
     --value ./path/to/play-service-account.json \
     --visibility secret --environment production
   ```

> If you don't intend to use `eas submit` at all (uploading the AAB through
> the Play Console UI by hand instead), you can delete the `submit` block
> from `eas.json` entirely and skip this second key.

## 7. Build

`eas.json` has four profiles. The two `production*` profiles share the same
channel and version (`production-apk` `extends` `production`), so a release
always exists in both formats:

| Profile | Distribution | Android output | Use for |
|---|---|---|---|
| `development` | internal | APK | dev client for local iteration |
| `preview` | internal | APK | install directly on a test device, no store needed |
| `production` | store | **AAB (app bundle)** | Play Store submission — Google requires AAB for new apps |
| `production-apk` | internal | **APK** | side-loadable release build, direct install/distribution outside the Play Store |

Build a release in both formats:

```bash
eas build --platform android --profile production       # AAB for the Play Store
eas build --platform android --profile production-apk   # APK, same version, for direct install
```

`eas build` takes one profile per invocation, so run them back-to-back (or
in parallel in two terminals) rather than in a single command.
`.github/workflows/eas-build.yml` runs both automatically — pushing a `v*`
tag (or running the workflow manually via **Actions → EAS Build Android →
Run workflow**) builds both `production` and `production-apk` in parallel;
a plain push to `main` still just builds the fast `preview` APK.

EAS prints a download URL when each build finishes. `preview` gives you a
`.apk` you can install directly; `production` gives you a `.aab` for the
next step.

### App signing

EAS manages your upload keystore by default — on first build it asks to
generate one and stores it encrypted on Expo's servers. You don't need
Android Studio or `keytool` for this. To inspect or rotate it later:

```bash
eas credentials
```

If you already have an existing keystore (e.g. migrating an app that's
live under a different pipeline), choose "Use an existing keystore" in that
same command instead of letting EAS generate a new one — **the signing key
must never change for an app already on the Play Store**, or updates will
be rejected.

## 8. Play Console setup

1. [play.google.com/console](https://play.google.com/console) → **Create app**.
   Use the package name already set in `app.json` (`com.smokeless.ai`) —
   rename it there first if you want a different one; it cannot be changed
   after the first upload.
2. **App content** section — fill in, honestly, before your first release:
   - **Data safety form**: this app collects account email, and (once a
     user opts into a track) health-adjacent behavioral data. Declare it
     accurately — under-declaring here is a common cause of takedowns, and
     the porn track specifically raises this app's risk profile.
   - **Content rating** questionnaire: answer per the actual tracks
     (tobacco/alcohol/porn references) — expect an 18+/Mature rating.
   - **Target audience**: not for children; set accordingly, since the
     porn and alcohol tracks are 18+ only (master doc §15.4).
   - **Privacy policy URL**: required. Write one that matches what's
     actually collected (see the data-safety bullet above) and where it's
     stored (Supabase, region chosen in step 1).
3. **Testing → Internal testing**: create a release, upload the `.aab`
   from the `production` EAS build, add tester emails, roll out. This is
   the fastest path to a real device without a public listing.
4. Once internal testing looks good, promote through **Closed testing**
   (optional but recommended — this is where the blueprint's own 20–30
   person alpha, master doc §8, belongs) and then **Production**.

### Submitting via EAS instead of the console UI

```bash
eas submit --platform android --latest
```

The first run asks for a Google **service account JSON key** (Play Console
→ Setup → API access → create a service account with "Release manager"
permissions, download its key). Store its path in `eas.json` under
`submit.production.android.serviceAccountKeyPath`, or pass it interactively
each time — don't commit the key file to the repo.

## 9. OTA updates after launch

```bash
eas update --channel preview    --message "what changed"
eas update --channel production --message "what changed"
```

`.github/workflows/eas-update.yml` already publishes to `preview` on every
push to `main`. **Native or config changes** (new native module, permission,
icon, SDK bump, or anything in `app.json`'s `plugins`) still need a fresh
build via step 6 — an OTA update can't ship those.

---

## Project structure

```
app/                       Expo Router screens
  _layout.tsx                root layout — fonts, auth init, store hydration, app lock
  auth.tsx                    sign in / sign up
  index.tsx                   session-aware entry router
  onboarding.tsx               multi-track select, baseline capture, alcohol gate
  urge.tsx                     the urge flow (name it → rate it → ride it → close it)
  lapse.tsx                    the lapse protocol (Ember)
  log.tsx                      quick +1 consumption logging
  checkin.tsx                   daily mood/sleep/HALT check-in
  crisis.tsx                    locale- and time-aware crisis resources
  settings.tsx / add-track.tsx
  (tabs)/                      Today · Companion (AI chat + Offline Coach) · You

src/
  domain/types.ts             Track, Baseline, events, Thread beads, Settings
  store/useDhruvStore.ts       local cache — every mutation pushes to Supabase
  store/useAuthStore.ts        session tracking + pull-on-login orchestration
  lib/supabase.ts              Supabase client
  lib/auth.ts                  sign up / sign in / sign out / hydrate
  lib/sync.ts                  per-entity push (upsert) + full pull
  lib/geminiCompanion.ts       AI chat + deterministic attribution/crisis filters
  lib/dates.ts                 local (not UTC) day keys — see the note inside
  lib/notifications.ts         contextual permission + the 24h lapse follow-up
  constants/theme.ts           palette, spacing, motion tokens
  constants/translations.ts    en / hi / bn copy
  components/motion/           Breath, Tide, Thread, Ember
  components/AppLockGate.tsx   biometric/device-credential lock screen
  lib/reclaim.ts | urgeDecay.ts | offlineCoach.ts | crisis.ts | milestones.ts | haptics.ts | quickActions.ts

supabase/schema.sql          the full production schema — tables, RLS, triggers
```

## Known gaps versus the full blueprint

- **Home-screen widget & Quick Settings tile** are not implemented. Both
  need real native code (Glance/AppWidget, TileService) not exposed by any
  current managed-Expo package. The long-press launcher shortcut
  (`expo-quick-actions`) substitutes as the fastest available path.
- **Full account deletion** (removing the `auth.users` row itself, not just
  the app data) needs a Supabase **service-role** call — the anon client
  can't do it. Settings → "Delete everything" clears all app data and
  resets the profile but keeps the account signed in. To offer true
  self-service account deletion, add a Supabase Edge Function that calls
  `supabase.auth.admin.deleteUser(uid)` with the service-role key (never
  ship that key in the app) and have Settings call that function instead.
- **Password reset UI** isn't built — Supabase's hosted confirmation page
  handles the email-confirmation link today, but a dedicated in-app
  "forgot password" screen and deep-link handler are not yet implemented.
- **SQLCipher-grade local encryption** isn't available in the managed
  workflow; the local cache uses AsyncStorage plus `expo-secure-store`/
  Keystore for small secrets, not full-database encryption at rest.
- **`VibrationEffect.Composition` haptic primitives** aren't exposed by
  `expo-haptics`; `src/lib/haptics.ts` maps onto the iOS-style
  impact/notification/selection API instead.
- **AI companion key exposure.** The Companion tab's open-conversation mode
  (`src/lib/geminiCompanion.ts`) calls the Gemini API directly from the
  client using `EXPO_PUBLIC_GEMINI_API_KEY`. The blueprint (master doc
  §18.4, doc 02 §11) explicitly calls for routing LLM calls through your
  own stateless proxy (rate limiting, safety pre/post filter, key never in
  the APK) instead — that proxy isn't built here. What *is* built matches
  doc 02 §6.1's floor regardless of the proxy: the deterministic client-side
  pre-filter (attribution, crisis, withdrawal signals) runs before any
  network call and never depends on the model. Before a public launch,
  either accept the key-extraction risk with a tightly quota-restricted key
  (see §5 above) or build the proxy and swap the one `fetch` call in
  `geminiCompanion.ts` to point at it.
- **Companion safety eval suite (doc 02 §9)** — the 100-scenario golden set
  and red-team regression the blueprint gates every companion release on
  isn't built. The three deterministic pre-filters (attribution/crisis/
  withdrawal) exist, but there's no automated suite verifying the model's
  *generated* replies stay in-bounds (brevity, no unsolicited advice, no
  shame markers) before a release ships.
- **hi/bn copy** is a best-effort draft, not reviewed by a native speaker.
  Treat the crisis and alcohol-gate strings as provisional until reviewed.
- **Real-time multi-device sync** isn't wired up (Supabase Realtime
  subscriptions) — data syncs on app open/sign-in and on each write, but a
  second device open at the same time won't see a live update mid-session.
