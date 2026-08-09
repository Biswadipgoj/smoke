// app/calendar.tsx — §25 screen 10.
//
// Month view of logs and cravings. The intensity of each cell is relative to
// the user's own baseline, not to an absolute scale: for someone on 30 a day,
// a 12-cigarette day is a light one and the grid should say so.

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '../src/components/ui/Card';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { useT } from '../src/i18n';
import { formatDate } from '../src/lib/dates';
import { useLogsStore } from '../src/store/useLogsStore';
import { useProfileStore } from '../src/store/useProfileStore';
import { useTheme } from '../src/theme/ThemeProvider';

function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function Calendar() {
  const theme = useTheme();
  const t = useT();
  const profile = useProfileStore((s) => s.profile);
  const { cigarettes, cravings } = useLogsStore();

  const [monthOffset, setMonthOffset] = useState(0);
  // The timestamp, not the day key: reconstructing a date from the key plus
  // whatever month is on screen goes wrong the moment the user pages back.
  const [selected, setSelected] = useState<number | null>(null);

  const anchor = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [monthOffset]);

  const byDay = useMemo(() => {
    const map = new Map<string, { cigarettes: number; delayed: number }>();
    const bump = (ms: number, field: 'cigarettes' | 'delayed') => {
      const key = dayKey(ms);
      const entry = map.get(key) ?? { cigarettes: 0, delayed: 0 };
      entry[field] += 1;
      map.set(key, entry);
    };
    for (const c of cigarettes) bump(c.timestampMs, 'cigarettes');
    for (const c of cravings) if (c.outcome === 'delayed') bump(c.timestampMs, 'delayed');
    return map;
  }, [cigarettes, cravings]);

  const cells = useMemo(() => {
    const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    // Leading blanks so the first of the month lands on the right weekday.
    const lead = anchor.getDay();
    const list: ({ day: number; key: string; ms: number } | null)[] = Array(lead).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(anchor.getFullYear(), anchor.getMonth(), day);
      list.push({ day, key: dayKey(date.getTime()), ms: date.getTime() });
    }
    return list;
  }, [anchor]);

  const selectedStats = selected === null ? undefined : byDay.get(dayKey(selected));

  return (
    <Screen title={t('calendar.title')}>
      <View style={styles.monthRow}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => setMonthOffset((v) => v - 1)}>
          <Text variant="body" tone="accent">
            ←
          </Text>
        </Pressable>
        <Text variant="body" weight="semiBold">
          {anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          disabled={monthOffset >= 0}
          onPress={() => setMonthOffset((v) => Math.min(0, v + 1))}
        >
          <Text variant="body" tone={monthOffset >= 0 ? 'muted' : 'accent'}>
            →
          </Text>
        </Pressable>
      </View>

      <Card>
        <View style={styles.grid}>
          {cells.map((cell, index) => {
            if (!cell) return <View key={`blank-${index}`} style={styles.cell} />;
            const stats = byDay.get(cell.key);
            const load = stats
              ? Math.min(1, stats.cigarettes / Math.max(1, profile.baselineCigarettesPerDay))
              : 0;
            const future = cell.ms > Date.now();
            return (
              <Pressable
                key={cell.key}
                accessibilityRole="button"
                accessibilityLabel={`${cell.day}: ${stats?.cigarettes ?? 0}`}
                onPress={() => setSelected(cell.ms)}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      borderRadius: theme.radius.sm,
                      borderColor: selected === cell.ms ? theme.colors.ember : 'transparent',
                      backgroundColor: future
                        ? 'transparent'
                        : stats
                          ? theme.colors.gentleAlert
                          : theme.colors.surfaceMuted,
                      opacity: future ? 0.3 : stats ? 0.3 + load * 0.7 : 1,
                    },
                  ]}
                >
                  <Text variant="caption" tone={stats ? 'default' : 'muted'}>
                    {cell.day}
                  </Text>
                </View>
                {stats?.delayed ? (
                  <View style={[styles.delayedPip, { backgroundColor: theme.colors.growth }]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card muted>
        {selected !== null ? (
          <>
            <Text variant="caption" tone="muted" weight="medium">
              {formatDate(selected)}
            </Text>
            {selectedStats ? (
              <Text variant="body">
                {t('calendar.legendCigarettes')}: {selectedStats.cigarettes} ·{' '}
                {t('calendar.legendDelayed')}: {selectedStats.delayed}
              </Text>
            ) : (
              <Text variant="body" tone="muted">
                {t('calendar.none')}
              </Text>
            )}
          </>
        ) : (
          <Text variant="bodySmall" tone="muted">
            {t('calendar.legendCigarettes')} · {t('calendar.legendDelayed')}
          </Text>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2, alignItems: 'center' },
  dot: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  delayedPip: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2 },
});
