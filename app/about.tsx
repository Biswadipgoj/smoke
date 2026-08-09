// app/about.tsx — §25 screen 23.
//
// Attribution: the app is a Biswodip Goj product.

import Constants from 'expo-constants';

import { Card } from '../src/components/ui/Card';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { COACH_PROMPT_VERSION } from '../src/services/ai/prompt';
import { useT } from '../src/i18n';

export default function About() {
  const t = useT();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen title={t('about.title')}>
      <Card>
        <Text variant="title" serif>
          SmokeLess AI
        </Text>
        <Text variant="body" tone="muted">
          {t('about.body')}
        </Text>
      </Card>

      <Card muted>
        <Text variant="body" weight="semiBold">
          {t('about.credit')}
        </Text>
        <Text variant="caption" tone="muted">
          {t('about.version', { v: version })} · coach prompt {COACH_PROMPT_VERSION}
        </Text>
      </Card>

      <Text variant="caption" tone="muted">
        {t('coach.disclaimer')} {t('health.disclaimer')}
      </Text>
    </Screen>
  );
}
