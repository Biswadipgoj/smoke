# SmokeLess AI

A quiet companion for smoking less, built on one idea: understanding a craving
beats fighting it.

Track → Understand → Intervene → Delay → Reward → Learn → Reduce → Quit.

A **Biswodip Goj** product.

---

## What it does

- **Logs a craving in two taps** — trigger, intensity — then offers an
  intervention and an adaptive wait, and records the outcome neutrally whether
  you waited it out or smoked.
- **Adapts the ask to you.** The wait is a fraction of your own average gap
  between cigarettes, adjusted by trigger, intensity and how the last few went.
  A bad week makes the next ask *easier*, not harder.
- **Works with no signal.** Logging, the timer, the suggestions and the
  coach's fallback all run on the phone. The AI is a language layer over
  rule-based engines, not a replacement for them.
- **Shows a horizon, not a score.** Progress is one picture — a dawn clearing,
  a tree filling out — and it advances only on real behaviour. Never on opening
  the app.
- **English, हिन्दी and বাংলা** throughout.

## What it deliberately doesn't do

No streaks to break. No red failure states. No confetti. No mascot, no coins,
no points. Nothing calls a cigarette a relapse — a logged cigarette is a data
point, and the coach is filtered so it can't say otherwise even if you ask it
to.

---

## Getting started

```bash
npm install
npx expo start
```

Everything above works with no account, no backend and no API key. Accounts,
cross-device sync and the Gemini-backed coach are optional extras —
**[SETUP.md](SETUP.md)** has the full walkthrough, plus an honest list of what
is still needed before a public release.

```bash
npm run check   # typecheck + safety-layer parity + prompt evals
```

## Built with

Expo SDK 57 (React Native, TypeScript), expo-router, Reanimated,
react-native-svg, expo-sqlite, Zustand, Supabase (Postgres + RLS + Edge
Functions), Gemini.

## Licence

MIT — see [LICENSE](LICENSE).
