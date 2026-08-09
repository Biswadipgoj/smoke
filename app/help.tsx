// app/help.tsx — Screen 22: Help
// The five questions people actually ask about an app like this. The first
// one — "does anything break if I smoke?" — is the one worth answering first,
// because the honest answer is the product's whole position (§1).

import React from 'react';
import { AppText, Card, Screen } from '../src/components/ui';
import { useTranslation } from '../src/i18n';
import { useTheme } from '../src/theme/ThemeProvider';

const FAQ = [
  { q: 'helpQ1', a: 'helpA1' },
  { q: 'helpQ2', a: 'helpA2' },
  { q: 'helpQ3', a: 'helpA3' },
  { q: 'helpQ4', a: 'helpA4' },
  { q: 'helpQ5', a: 'helpA5' },
] as const;

export default function Help() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Screen>
      <AppText variant="title">{t('helpTitle')}</AppText>
      {FAQ.map((item) => (
        <Card key={item.q}>
          <AppText variant="subheading">{t(item.q)}</AppText>
          <AppText variant="small" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
            {t(item.a)}
          </AppText>
        </Card>
      ))}
    </Screen>
  );
}
