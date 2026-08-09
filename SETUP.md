# Setting up SmokeLess AI

Everything below is optional. The app installs and runs with no backend at
all — logging, the craving flow, the delay algorithm, history, insights,
milestones and the offline coach are all local. What the backend adds is:
an account, sync across devices, and the AI coach's written replies.

Work through the steps in order; each one is independently useful.

---

## 1. Run it locally

```bash
npm install
npx expo start
```

Press `a` for an Android emulator, `i` for an iOS simulator, or scan the QR
code with Expo Go. Nothing else is required at this point.

---

## 2. Create a Supabase project

1. Sign up at <https://supabase.com> and create a project.
2. **Project Settings → API**. Copy two values:
   - **Project URL** (`https://<id>.supabase.co`)
   - **anon public** key
3. Create `.env` in the repo root (copy `.env.example`):

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```

4. Restart with a clean cache: `npx expo start --clear`

The anon key is *meant* to be public and is safe inside the app, because every
table has Row Level Security with `auth.uid() = user_id`. The next step is what
makes that true.

---

## 3. Create the database schema

Open **SQL Editor** in the Supabase dashboard, paste the whole of
[`supabase/schema.sql`](./supabase/schema.sql), and run it. It is idempotent —
re-running it is safe.

That creates `profiles`, `cigarette_logs`, `craving_logs`, `price_history`,
`goals` and `ai_memory`, turns on RLS for all of them, and adds the
`export_my_data()` helper.

Verify: **Authentication → Policies** should show a policy on every table. If
any table shows "RLS disabled", stop and re-run the file — an unprotected table
here is a table anyone with the anon key can read.

Sign-in should now work in the app. Email/password and magic link are both
wired up; magic-link redirects need the app scheme (`smokelessai://`) added
under **Authentication → URL Configuration → Redirect URLs**.

### Google sign-in (optional)

The code is one call — `supabase.auth.signInWithOAuth({ provider: 'google' })` —
but it needs credentials only you can create:

1. Google Cloud Console → **APIs & Services → Credentials → OAuth client ID**.
2. Add the Supabase callback URL as an authorised redirect URI (Supabase shows
   it under **Authentication → Providers → Google**).
3. Paste the client ID and secret into that Supabase provider page.
4. Add a button in `app/(auth)/sign-in.tsx` calling `signInWithOAuth`.

---

## 4. Deploy the AI coach

This is the step that keeps your Gemini API key out of the installed app. The
app never talks to Gemini; it calls your Edge Function, which holds the key
server-side.

```bash
npm install -g supabase          # or: brew install supabase/tap/supabase
supabase login
supabase link --project-ref <your-project-ref>

supabase secrets set GEMINI_API_KEY=your-key-from-ai-studio
# optional, defaults to gemini-2.5-flash:
supabase secrets set GEMINI_MODEL=gemini-2.5-flash

supabase functions deploy ai-coach
```

Get the key from <https://aistudio.google.com/apikey>.

Check it:

```bash
curl -i -X POST "https://<project-ref>.supabase.co/functions/v1/ai-coach" \
  -H "Authorization: Bearer <anon key>" \
  -H "Content-Type: application/json" \
  -d '{"message":"I want a cigarette","style":"calm","locale":"en"}'
```

You should get a short reply, a `status`, and the `promptVersion` it was
generated with.

**If this step is skipped**, the coach still answers — from the rule-based
offline coach, labelled as such in the UI. That is by design, not a fallback
you should feel bad about shipping.

---

## 5. Builds

EAS Build produces installable artifacts without you installing Android Studio.

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview      # APK, internal testing
eas build --platform android --profile production   # AAB, Play Store
eas build --platform android --profile production-apk
```

The `.env` file is **not** uploaded with a build. Set the same two variables as
EAS environment variables so builds get them:

```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://... --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value ... --environment production
```

Repeat for the `preview` environment if you want signed-in preview builds.

`.github/workflows/eas-build.yml` runs the preview build on push and both
release artifacts on a `v*` tag; it needs an `EXPO_TOKEN` repository secret.

---

## 6. Over-the-air updates

`app.json` is already configured for EAS Update with `runtimeVersion.policy:
"appVersion"`. JavaScript-only changes ship without a store review:

```bash
eas update --branch production --message "Reword the craving screen"
```

Anything that adds or changes a native module (a new `expo-*` package with
native code) needs a fresh build, not an update.

---

## 7. Verifying the safety layer

The coach's guardrails are testable without a device:

```bash
npm run eval:prompts
```

That runs shame/diagnosis/pressure/crisis cases — English, Hindi and Bengali —
through the same `applySafetyFilter` and `detectCrisis` the Edge Function uses.
It checks both directions: banned language is caught, and ordinary coaching
language is not (a filter that eats good replies is a filter that gets turned
off).

Treat it as a smoke test, not a safety guarantee. It cannot tell you whether a
grammatically perfect Bengali reply lands as warm or as a translated form
letter. Extend the case list from your production `safety filter fired` logs,
and get native-speaker review before trusting the coach in Hindi or Bengali.

---

## Troubleshooting

**"No backend is configured yet" on the sign-in screen.** `.env` is missing,
mis-named, or the dev server was not restarted with `--clear`. The variables
must start with `EXPO_PUBLIC_` to reach the app at all.

**Sign-in succeeds but nothing syncs.** Check step 3 — RLS policies that were
never created will reject every write. Settings → Sync now surfaces the actual
error string rather than swallowing it.

**The coach always says it is offline.** Either the function is not deployed,
or `GEMINI_API_KEY` is unset (the function returns 503 and the app falls back).
`supabase functions logs ai-coach` will tell you which.

**Fonts look wrong in Hindi or Bengali.** Fraunces and Manrope have no
Devanagari or Bengali coverage; the theme swaps in Noto Sans for those scripts.
If text renders in a system fallback, the Noto packages failed to load — check
the `useFonts` call in `app/_layout.tsx`.
