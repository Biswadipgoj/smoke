// app/timeline.tsx — Screen 9: Smoking Timeline
// Chronological log of both cigarettes and cravings, straight from local
// SQLite. The two are interleaved on purpose: a day with four cigarettes and
// six cravings let pass is a different day from one with four cigarettes, and
// a timeline that only shows what went wrong tells the wrong story.

import React from 'react';
import { View } from 'react-native';
import { AppText, Card, Notice, Screen } from '../src/components/ui';
import { triggerLabel } from '../src/features/cravings/interventionEngine';
import { useTranslation } from '../src/i18n';
import { useAsyncData } from '../src/hooks/useAsyncData';
import { listCigaretteLogs, listCravingLogs } from '../src/services/db/localDb';
import { useTheme } from '../src/theme/ThemeProvider';
import type { CigaretteLog, CravingLog } from '../src/types';

type Entry =
  | { kind: 'cigarette'; at: number; row: CigaretteLog }
  | { kind: 'craving'; at: number; row: CravingLog };

export default function Timeline() {
  const theme = useTheme();
  const { t } = useTranslation();

  const { data } = useAsyncData(async () => {
    const [cigarettes, cravings] = await Promise.all([
      listCigaretteLogs(300),
      listCravingLogs(300),
    ]);
    const entries: Entry[] = [
      ...cigarettes.map((row) => ({ kind: 'cigarette' as const, at: row.timestampMs, row })),
      ...cravings.map((row) => ({ kind: 'craving' as const, at: row.timestampMs, row })),
    ];
    return entries.sort((a, b) => b.at - a.at);
  }, []);

  const entries = data ?? [];

  return (
    <Screen>
      <AppText variant="title">{t('timelineTitle')}</AppText>

      {entries.length === 0 ? <Notice>{t('timelineEmpty')}</Notice> : null}

      {entries.map((entry) => {
        const when = new Date(entry.at);
        const stamp = `${when.toLocaleDateString()} · ${when.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`;

        if (entry.kind === 'cigarette') {
          return (
            <Card key={`c-${entry.row.id}`}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="body">
                  {entry.row.count > 1
                    ? `${entry.row.count} ${t('timelineCigarettes')}`
                    : t('timelineCigarette')}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {stamp}
                </AppText>
              </View>
              {entry.row.trigger ? (
                <AppText variant="small" tone="secondary">
                  {triggerLabel(entry.row.trigger, t)}
                </AppText>
              ) : null}
              {entry.row.note ? (
                <AppText variant="small" tone="muted">
                  {entry.row.note}
                </AppText>
              ) : null}
            </Card>
          );
        }

        const outcomeKey =
          entry.row.outcome === 'delayed'
            ? 'timelineCravingDelayed'
            : entry.row.outcome === 'smoked'
              ? 'timelineCravingSmoked'
              : 'timelineCravingAbandoned';

        return (
          <Card key={`v-${entry.row.id}`} raised>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="body" tone={entry.row.outcome === 'delayed' ? 'growth' : 'default'}>
                {t(outcomeKey)}
              </AppText>
              <AppText variant="caption" tone="muted">
                {stamp}
              </AppText>
            </View>
            <AppText variant="small" tone="secondary">
              {triggerLabel(entry.row.trigger, t)} · {entry.row.intensity}/5 ·{' '}
              {t('timelineWaited', { minutes: entry.row.actualDelayMinutes })}
            </AppText>
            {entry.row.note ? (
              <AppText variant="small" tone="muted" style={{ marginTop: theme.spacing.xs }}>
                {entry.row.note}
              </AppText>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}
