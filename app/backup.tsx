// app/backup.tsx — Screen 21: Backup
// Writes everything on the device to a single JSON file and hands it to the
// system share sheet (§23).
//
// Export is deliberately a plain, readable file rather than a proprietary
// blob: the user's own logs should be theirs to keep, open and move somewhere
// else, including away from this app.

import React, { useState } from 'react';
import { View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AppText, Notice, PrimaryButton, Screen } from '../src/components/ui';
import { useTranslation } from '../src/i18n';
import { useAsyncData } from '../src/hooks/useAsyncData';
import { exportAll } from '../src/services/db/localDb';
import { useAppStore } from '../src/store/useAppStore';
import { dayKey } from '../src/utils/format';

export default function Backup() {
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const memory = useAppStore((s) => s.aiMemory);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data } = useAsyncData(() => exportAll(), []);

  async function exportBackup() {
    setBusy(true);
    setMessage(null);
    try {
      const payload = await exportAll();
      const file = new File(Paths.cache, `smokeless-backup-${dayKey(Date.now())}.json`);
      file.create({ overwrite: true });
      file.write(
        JSON.stringify(
          { exportedAt: new Date().toISOString(), profile, memory, ...payload },
          null,
          2
        )
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
      }
      setMessage(t('backupDone'));
    } catch {
      setMessage(t('backupFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <AppText variant="title">{t('backupTitle')}</AppText>
      <AppText variant="body" tone="secondary">
        {t('backupBody')}
      </AppText>

      <Notice>
        {t('backupCounts', {
          cigarettes: data?.cigarettes.length ?? 0,
          cravings: data?.cravings.length ?? 0,
        })}
      </Notice>

      {message ? <Notice tone="secondary">{message}</Notice> : null}

      <View style={{ flex: 1 }} />
      <PrimaryButton label={t('backupExport')} loading={busy} onPress={() => void exportBackup()} />
    </Screen>
  );
}
