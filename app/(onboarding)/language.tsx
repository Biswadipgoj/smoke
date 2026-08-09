// app/(onboarding)/language.tsx — §25 screen 3.
//
// Sets the locale before anything else renders. Each option is written in its
// own script: someone who needs Bengali should not have to read English to
// find it.

import { useRouter } from 'expo-router';

import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import { Screen } from '../../src/components/ui/Screen';
import { Text } from '../../src/components/ui/Text';
import { LANGUAGE_NAMES, useT } from '../../src/i18n';
import { useProfileStore } from '../../src/store/useProfileStore';
import { LANGUAGES } from '../../src/types';

export default function LanguagePicker() {
  const t = useT();
  const router = useRouter();
  const language = useProfileStore((s) => s.profile.language);
  const update = useProfileStore((s) => s.update);

  return (
    <Screen
      title={t('language.title')}
      footer={
        <Button label={t('common.continue')} onPress={() => router.push('/(onboarding)/setup')} />
      }
    >
      <Text variant="body" tone="muted">
        {t('language.body')}
      </Text>
      {LANGUAGES.map((code) => (
        <Chip
          key={code}
          block
          label={LANGUAGE_NAMES[code]}
          selected={language === code}
          onPress={() => void update({ language: code })}
        />
      ))}
    </Screen>
  );
}
