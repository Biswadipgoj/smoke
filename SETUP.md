# Dhruv — Setup Guide

Dhruv is local-first: everything except a future AI companion (Phase 2,
not built yet) works fully offline, with no account and no server.

## Quick start

```bash
npm install
npx expo start
```

`expo-quick-actions` and `expo-local-authentication` are native config
plugins, so **the app will not run in plain Expo Go** — build a dev client
once, then iterate normally:

```bash
npx expo install expo-dev-client   # already implied by the plugins above
eas build --profile development --platform android
# or, with Android Studio installed:
npx expo run:android
```

## Build an installable APK

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview   # or: production
```

`eas.json` profiles are set to `android.buildType: "apk"`, so every profile
produces a directly-installable APK (not an AAB).

## OTA updates

```bash
eas update --channel preview    --message "what changed"
eas update --channel production --message "what changed"
```

`.github/workflows/eas-update.yml` publishes to the `preview` channel on
every push to `main`. Native or config changes (new native module, icon,
permission, SDK bump) still require a fresh build, not just an update.

## Project structure

```
app/                       Expo Router screens
  _layout.tsx               root layout — fonts, store hydration, app lock
  index.tsx                 splash / onboarding-or-tabs router
  onboarding.tsx             multi-track select, baseline capture, alcohol gate
  urge.tsx                   the urge flow (name it → rate it → ride it → close it)
  lapse.tsx                  the lapse protocol (Ember)
  log.tsx                    quick +1 consumption logging
  checkin.tsx                 daily mood/sleep/HALT check-in
  crisis.tsx                  locale- and time-aware crisis resources
  settings.tsx / add-track.tsx
  (tabs)/                    Today · Companion (Offline Coach) · You

src/
  domain/types.ts            Track, Baseline, events, Thread beads, Settings
  store/useDhruvStore.ts      local Zustand store, AsyncStorage-backed
  constants/theme.ts           palette, spacing, motion tokens
  constants/translations.ts    en / hi / bn copy
  components/motion/           Breath, Tide, Thread, Ember
  components/AppLockGate.tsx    biometric/device-credential lock screen
  lib/
    reclaim.ts                 money/hours/sleep reclaim engine
    urgeDecay.ts                personal urge-decay stat
    offlineCoach.ts              scripted intervention library
    crisis.ts                    helpline resolution
    milestones.ts                 health/financial milestones
    haptics.ts                    semantic haptic wrapper
    quickActions.ts                long-press launcher shortcut
```

## Known gaps versus the full blueprint

These are deliberate scope cuts for a managed-Expo build, not oversights:

- **Home-screen widget & Quick Settings tile** are not implemented. Both
  need real native code (Glance/AppWidget, TileService) that isn't exposed
  by any current managed-Expo package without a custom native module. The
  long-press launcher shortcut (`expo-quick-actions`) is implemented instead
  as the fastest available "reach the urge screen from outside the app" path.
- **SQLCipher-grade database encryption** isn't available in the managed
  workflow; storage is AsyncStorage plus `expo-secure-store`/Keystore for
  small secrets. Journal/lapse-context text isn't separately encrypted at
  rest beyond the OS-level storage sandbox.
- **`VibrationEffect.Composition` haptic primitives** aren't exposed by
  `expo-haptics`; the semantic haptic wrapper (`src/lib/haptics.ts`) maps
  onto the iOS-style impact/notification/selection API instead.
- **AI companion (doc 02)** is intentionally not built — V1 ships only the
  scripted Offline Coach, exactly as the blueprint's own roadmap specifies.
- **hi/bn copy** is a best-effort draft, not reviewed by a native speaker.
  Treat especially the crisis and alcohol-gate strings as provisional.
