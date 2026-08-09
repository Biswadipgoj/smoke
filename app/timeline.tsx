// app/timeline.tsx — §25 screen 9.
//
// Chronological log, straight from local SQLite. Cigarettes and cravings on
// one thread, because separating them would hide the thing worth seeing: what
// happened just before, and whether it was waited out.

import { useMemo } from 'react';
import { View } from 'react-native';

import { Card } from '../src/components/ui/Card';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { useT, type TranslationKey } from '../src/i18n';
import { formatClock, formatDayHeading, isSameDay } from '../src/lib/dates';
import { useLogsStore } from '../src/store/useLogsStore';
import { useTheme } from '../src/theme/ThemeProvider';
import type { Trigger } from '../src/types';

interface Entry {
  id: string;
  timestampMs: number;
  kind: 'cigarette' | 'delayed' | 'smoked' | 'open';
  trigger: Trigger | null;
}

export default function Timeline() {
  const theme = useTheme();
  const t = useT();
  const { cigarettes, cravings } = useLogsStore();

  const days = useMemo(() => {
    const entries: Entry[] = [
      ...cigarettes.map((c) => ({
        id: c.id,
        timestampMs: c.timestampMs,
        kind: 'cigarette' as const,
        trigger: c.trigger,
      })),
      ...cravings.map((c) => ({
        id: c.id,
        timestampMs: c.timestampMs,
        kind:
          c.outcome === 'delayed'
            ? ('delayed' as const)
            : c.outcome === 'smoked'
              ? ('smoked' as const)
              : ('open' as const),
        trigger: c.trigger,
      })),
    ].sort((a, b) => b.timestampMs - a.timestampMs);

    const grouped: { day: number; entries: Entry[] }[] = [];
    for (const entry of entries) {
      const head = grouped[grouped.length - 1];
      if (head && isSameDay(head.day, entry.timestampMs)) head.entries.push(entry);
      else grouped.push({ day: entry.timestampMs, entries: [entry] });
    }
    return grouped;
  }, [cigarettes, cravings]);

  const labelFor = (kind: Entry['kind']) => {
    switch (kind) {
      case 'cigarette':
        return t('timeline.cigarette');
      case 'delayed':
        return t('timeline.cravingDelayed');
      case 'smoked':
        return t('timeline.cravingSmoked');
      default:
        return t('timeline.cravingOpen');
    }
  };

  return (
    <Screen title={t('timeline.title')}>
      {days.length === 0 ? (
        <Text variant="body" tone="muted">
          {t('timeline.empty')}
        </Text>
      ) : (
        days.map((group) => (
          <View key={group.day} style={{ gap: theme.spacing.sm }}>
            <Text variant="caption" tone="muted" weight="medium">
              {formatDayHeading(group.day, t)}
            </Text>
            <Card muted>
              {group.entries.map((entry, index) => (
                <View
                  key={entry.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderBottomWidth: index === group.entries.length - 1 ? 0 : 0.5,
                    borderBottomColor: theme.colors.border,
                  }}
                >
                  {/* Colour carries the outcome: growth for a delay, muted
                      terracotta for a cigarette. Never red (§10). */}
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        entry.kind === 'delayed'
                          ? theme.colors.growth
                          : entry.kind === 'open'
                            ? theme.colors.border
                            : theme.colors.gentleAlert,
                    }}
                  />
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text variant="bodySmall">{labelFor(entry.kind)}</Text>
                    {entry.trigger ? (
                      <Text variant="caption" tone="muted">
                        {t(`trigger.${entry.trigger}` as TranslationKey)}
                      </Text>
                    ) : null}
                  </View>
                  <Text variant="caption" tone="muted">
                    {formatClock(entry.timestampMs)}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}
