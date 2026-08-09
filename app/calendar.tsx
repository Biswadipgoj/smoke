// app/calendar.tsx — Screen 10: Calendar
// A month grid of cigarettes and cravings.
//
// Colour is the day's count measured against the user's own baseline, not
// against zero — so a heavy smoker's first good week is visibly a good week,
// which it would not be on an absolute scale. A day with nothing logged is
// simply empty; it is never marked as a failure to log.

import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Card, Screen } from '../src/components/ui';
import { useTranslation } from '../src/i18n';
import { useAsyncData } from '../src/hooks/useAsyncData';
import { countsByDay } from '../src/services/db/localDb';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { dayKey } from '../src/utils/format';

export default function CalendarScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const anchor = new Date();
  anchor.setDate(1);
  anchor.setMonth(anchor.getMonth() + monthOffset);
  anchor.setHours(0, 0, 0, 0);

  const monthStart = anchor.getTime();
  const nextMonth = new Date(anchor);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const { data } = useAsyncData(
    () => countsByDay(monthStart, nextMonth.getTime()),
    [monthStart]
  );

  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const leadingBlanks = new Date(anchor.getFullYear(), anchor.getMonth(), 1).getDay();
  const baseline = Math.max(1, profile?.baselinePerDay ?? 1);

  const cells: Array<{ key: string; day: number | null }> = [
    ...Array.from({ length: leadingBlanks }, (_, i) => ({ key: `blank-${i}`, day: null })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ key: `day-${i + 1}`, day: i + 1 })),
  ];

  const selectedCounts = selected ? data?.[selected] : undefined;

  return (
    <Screen>
      <AppText variant="title">{t('calendarTitle')}</AppText>
      <AppText variant="small" tone="secondary">
        {t('calendarSubtitle')}
      </AppText>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => setMonthOffset(monthOffset - 1)} hitSlop={12}>
          <AppText variant="subheading" tone="ember">
            ‹
          </AppText>
        </Pressable>
        <AppText variant="subheading">
          {anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </AppText>
        <Pressable
          onPress={() => setMonthOffset(Math.min(0, monthOffset + 1))}
          hitSlop={12}
          disabled={monthOffset >= 0}
        >
          <AppText variant="subheading" tone={monthOffset >= 0 ? 'muted' : 'ember'}>
            ›
          </AppText>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((cell) => {
          if (cell.day === null) return <View key={cell.key} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;

          const date = new Date(anchor);
          date.setDate(cell.day);
          const key = dayKey(date.getTime());
          const counts = data?.[key];
          const intensity = counts ? Math.min(1, counts.cigarettes / baseline) : 0;

          return (
            <Pressable
              key={cell.key}
              onPress={() => setSelected(key)}
              style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: theme.radius.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: counts
                    ? intensity <= 0.5
                      ? theme.colors.growth
                      : theme.colors.ember
                    : theme.colors.surface,
                  opacity: counts ? 0.35 + intensity * 0.65 : 1,
                  borderWidth: selected === key ? 2 : 0,
                  borderColor: theme.colors.text,
                }}
              >
                <AppText variant="caption" tone={counts ? 'onEmber' : 'muted'}>
                  {cell.day}
                </AppText>
                {counts && counts.delayed > 0 ? (
                  <AppText variant="caption" tone="onEmber">
                    ·
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Card>
        {selected ? (
          selectedCounts ? (
            <>
              <AppText variant="subheading">{selected}</AppText>
              <AppText variant="small" tone="secondary">
                {t('homeStatSmoked')}: {selectedCounts.cigarettes} · {t('homeStatCravings')}:{' '}
                {selectedCounts.cravings} · {t('homeStatDelayed')}: {selectedCounts.delayed}
              </AppText>
            </>
          ) : (
            <AppText variant="small" tone="muted">
              {t('calendarDayEmpty')}
            </AppText>
          )
        ) : (
          <AppText variant="small" tone="muted">
            {t('calendarLegendNone')} · {t('calendarLegendSome')} · {t('calendarLegendMore')}
          </AppText>
        )}
      </Card>
    </Screen>
  );
}
