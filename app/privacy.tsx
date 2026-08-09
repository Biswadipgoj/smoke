// app/privacy.tsx — §25 screen 20.
//
// The data-handling explainer, plus the export and delete entry points. §23 is
// blunt that "never sell personal data" has to be a real line in a real
// privacy policy before launch, not an internal principle — this screen is
// where that line lives in the product, and SETUP.md flags the published
// policy as still outstanding.

import { useRouter } from 'expo-router';

import { Card } from '../src/components/ui/Card';
import { Row } from '../src/components/ui/Row';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { useT } from '../src/i18n';

export default function Privacy() {
  const t = useT();
  const router = useRouter();

  const sections = [
    { title: t('privacy.stored'), body: t('privacy.storedBody') },
    { title: t('privacy.notStored'), body: t('privacy.notStoredBody') },
    { title: t('privacy.keys'), body: t('privacy.keysBody') },
    { title: t('privacy.rights'), body: t('privacy.rightsBody') },
  ];

  return (
    <Screen title={t('privacy.title')}>
      {sections.map((section) => (
        <Card key={section.title}>
          <Text variant="body" weight="semiBold">
            {section.title}
          </Text>
          <Text variant="bodySmall" tone="muted">
            {section.body}
          </Text>
        </Card>
      ))}

      <Card muted>
        <Row label={t('settings.aiMemory')} onPress={() => router.push('/ai-memory')} />
        <Row label={t('settings.backup')} onPress={() => router.push('/backup')} />
        <Row
          label={t('settings.deleteAccount')}
          destructive
          onPress={() => router.push('/delete-account')}
          last
        />
      </Card>
    </Screen>
  );
}
