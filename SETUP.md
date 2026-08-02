# SmokeLess AI — Setup Guide

## Quick Start

### 1. Install Expo Go on your Android device
Download **Expo Go** from the Google Play Store.

### 2. Run the development server
```bash
cd d:\smoke
npm run android    # Opens on Android emulator (requires Android Studio)
# or
npx expo start     # Shows Q
R code to scan with Expo Go
```

### 3. Scan the QR code
Open **Expo Go** on your Android device, tap **Scan QR code**, and point it at the QR code in the terminal.

---

## Connect Real Supabase (Optional)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **anon key**
3. Create a `.env` file in the project root:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Install the Supabase client:
   ```bash
   npx expo install @supabase/supabase-js
   ```
5. Replace the `AsyncStorage` adapter in `src/store/useAppStore.ts` with Supabase calls.

### Supabase Schema (run in SQL Editor)
```sql
-- Users are managed by Supabase Auth

create table profiles (
  id uuid references auth.users primary key,
  locale text default 'en',
  daily_baseline int default 10,
  cost_per_pack numeric default 250,
  cigs_per_pack int default 20,
  currency text default '₹',
  goal_type text default 'reduce',
  motivations text[] default '{}',
  start_date timestamptz default now(),
  theme_mode text default 'dark',
  notifications_enabled boolean default true,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

create table smoking_logs (
  id text primary key,
  user_id uuid references auth.users not null,
  timestamp timestamptz not null,
  type text not null check (type in ('cigarette', 'craving')),
  context_tag text,
  note text,
  created_at timestamptz default now()
);

create table delay_sessions (
  id text primary key,
  user_id uuid references auth.users not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  duration_seconds int not null,
  intensity int check (intensity between 1 and 5),
  context_tag text,
  outcome text not null check (outcome in ('delayed', 'smoked', 'incomplete')),
  created_at timestamptz default now()
);

create table achievements (
  id text not null,
  user_id uuid references auth.users not null,
  earned_at timestamptz default now(),
  primary key (id, user_id)
);

-- Row Level Security
alter table profiles enable row level security;
alter table smoking_logs enable row level security;
alter table delay_sessions enable row level security;
alter table achievements enable row level security;

create policy "Users own their data" on profiles for all using (auth.uid() = id);
create policy "Users own their logs" on smoking_logs for all using (auth.uid() = user_id);
create policy "Users own their sessions" on delay_sessions for all using (auth.uid() = user_id);
create policy "Users own their achievements" on achievements for all using (auth.uid() = user_id);
```

---

## Build an APK (Android)

### Using Expo EAS (recommended)
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```
This produces a downloadable APK from Expo's build servers — no Android Studio needed.

### Local build (requires Android Studio)
```bash
npx expo run:android
```

---

## Project Structure

```
d:\smoke\
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout (fonts, store init)
│   ├── index.tsx           # Entry router
│   ├── onboarding.tsx      # 4-step onboarding
│   ├── delay.tsx           # Craving delay session
│   ├── log.tsx             # Log cigarette modal
│   └── (tabs)/
│       ├── _layout.tsx     # Tab bar layout
│       ├── index.tsx       # Home / Today
│       ├── coach.tsx       # AI coaching chat
│       ├── progress.tsx    # Health timeline + money
│       ├── achievements.tsx# Milestones + streaks
│       └── settings.tsx    # Settings
├── src/
│   ├── constants/
│   │   ├── theme.ts        # Design tokens (colors, spacing, fonts)
│   │   └── translations.ts # English + Hindi + Bengali strings
│   ├── store/
│   │   └── useAppStore.ts  # Zustand store + computed metrics
│   ├── hooks/
│   │   ├── useTranslation.ts
│   │   └── useTheme.ts
│   └── components/ui/
│       ├── GlassCard.tsx
│       ├── PrimaryButton.tsx
│       └── BreathingPacer.tsx
└── SETUP.md
```

---

## Build an installable APK (not AAB)

The `eas.json` profiles are set to `android.buildType: "apk"`, so every profile
produces a directly-installable **APK**.

```bash
npm install -g eas-cli      # once
eas login                   # once

# Fast internal test APK:
eas build --platform android --profile preview

# Release APK:
eas build --platform android --profile production
```

When the build finishes, EAS prints a URL to download the `.apk`.

## EAS Update (over-the-air updates)

The app is wired for OTA updates:

- `app.json` → `updates.url` + `runtimeVersion` (`appVersion` policy)
- `eas.json` profiles each declare a `channel` (`preview` / `production`)
- `app/_layout.tsx` checks for and applies the newest bundle on cold start

Publish a JS/asset update (no rebuild needed) to the channel your installed
APK uses:

```bash
eas update --channel preview  --message "what changed"   # for preview APKs
eas update --channel production --message "what changed"  # for release APKs
```

`.github/workflows/eas-update.yml` also publishes to the `preview` channel on
every push to `main`. **Native or config changes** (new native module, icon,
permissions, SDK bump) still require a fresh APK build.

## Gemini AI Coach — make it work in a build

The coach reads `EXPO_PUBLIC_GEMINI_API_KEY`. A local `.env` only works for
`expo start`; **EAS builds and updates need the key stored on EAS** so it is
inlined into the bundle:

```bash
eas env:create --name EXPO_PUBLIC_GEMINI_API_KEY --value "YOUR_KEY" \
  --visibility sensitive --environment preview
eas env:create --name EXPO_PUBLIC_GEMINI_API_KEY --value "YOUR_KEY" \
  --visibility sensitive --environment production
```

Then rebuild (or `eas update`) so the key ships with the app. The model used is
`gemini-flash-latest`; responses are tuned to sound like a real person (plain
sentences, the user's language, no markdown or "as an AI" disclaimers).
