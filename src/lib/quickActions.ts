// src/lib/quickActions.ts
// App shortcut (long-press launcher) → straight into the urge state, per
// master doc §3.2's "reachable in under three seconds from anywhere."
// Requires a native build (EAS build / dev client) — a no-op under Expo Go,
// wrapped defensively so it never throws during startup.
import { router } from 'expo-router';

let registered = false;

export async function registerUrgeQuickAction(label: string) {
  if (registered) return;
  registered = true;
  try {
    const QuickActions = await import('expo-quick-actions');
    await QuickActions.setItems([
      { id: 'urge', title: label, icon: 'urge', params: { href: '/urge' } },
    ]);
    QuickActions.addListener((action) => {
      if (action?.params?.href) router.push(action.params.href as any);
    });
  } catch {
    // expo-quick-actions needs a native module — silently skip in Expo Go
    // or on unsupported platforms. The widget/QS-tile equivalents are a
    // documented follow-up (see summary), not a regression here.
  }
}
