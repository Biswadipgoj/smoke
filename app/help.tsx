// app/help.tsx — §25 screen 22.

import { Linking } from 'react-native';

import { Card } from '../src/components/ui/Card';
import { Row } from '../src/components/ui/Row';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { useT } from '../src/i18n';

const SUPPORT_EMAIL = 'support@smokeless.ai';

export default function Help() {
  const t = useT();

  const faqs = [
    { q: t('help.q1'), a: t('help.a1') },
    { q: t('help.q2'), a: t('help.a2') },
    { q: t('help.q3'), a: t('help.a3') },
    { q: t('help.q4'), a: t('help.a4') },
  ];

  return (
    <Screen title={t('help.title')}>
      {faqs.map((faq) => (
        <Card key={faq.q}>
          <Text variant="body" weight="semiBold">
            {faq.q}
          </Text>
          <Text variant="bodySmall" tone="muted">
            {faq.a}
          </Text>
        </Card>
      ))}

      <Card muted>
        <Row
          label={t('help.contact')}
          value={SUPPORT_EMAIL}
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          last
        />
      </Card>
    </Screen>
  );
}
