// app/backup.tsx — §25 screen 21.
//
// §23 — "export is a straightforward select-everything-where-user-is-me job".
// It writes a JSON file to the cache directory and hands it to the system
// share sheet, so the file leaves the app only where the user sends it.
//
// Cache rather than documents on purpose: this is a copy the user is taking
// somewhere else, and leaving a second full history sitting in app storage
// would be a liability for exactly the data §5 flags as sensitive.

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';

import { Button } from '../src/components/ui/Button';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { useT } from '../src/i18n';
import { countAllRecords, exportEverything } from '../src/services/db/localDb';
import * as haptics from '../src/services/haptics';

export default function Backup() {
  const t = useT();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function exportData() {
    setBusy(true);
    setStatus(null);
    try {
      const payload = await exportEverything();
      const count = await countAllRecords();

      const file = new File(Paths.cache, `smokeless-export-${Date.now()}.json`);
      file.create({ overwrite: true });
      file.write(JSON.stringify(payload, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: t('backup.title'),
        });
      }
      haptics.tap();
      setStatus(t('backup.exported', { n: count }));
    } catch {
      haptics.error();
      setStatus(t('error.generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title={t('backup.title')}
      footer={<Button label={t('backup.export')} disabled={busy} onPress={() => void exportData()} />}
    >
      <Text variant="body" tone="muted">
        {t('backup.body')}
      </Text>
      {status ? <Text variant="bodySmall">{status}</Text> : null}
    </Screen>
  );
}
