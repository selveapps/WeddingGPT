import React from 'react';
import { Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  Stack,
  Card,
  ScreenHeader,
  SectionHeader,
  ListRow,
  Text,
  useToast,
} from '@/design-system/components';
import { SETTINGS_COPY } from '../lib/settingsConstants';

const APP_VERSION = '1.0.0';
const BUILD = Platform.select({ ios: 'ios', android: 'android', default: 'web' });

const LINKS = [
  {
    id: 'privacy',
    title: SETTINGS_COPY.aboutPrivacy,
    url: 'https://example.com/privacy',
  },
  {
    id: 'terms',
    title: SETTINGS_COPY.aboutTerms,
    url: 'https://example.com/terms',
  },
  {
    id: 'licences',
    title: SETTINGS_COPY.aboutLicences,
    url: 'https://example.com/licences',
  },
  {
    id: 'support',
    title: SETTINGS_COPY.aboutSupport,
    url: 'mailto:support@example.com',
  },
];

export function AboutSection() {
  const router = useRouter();
  const toast = useToast();

  const open = async (url) => {
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        toast.info('Link is not available on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      toast.error('Could not open link');
    }
  };

  return (
    <Screen testID="settings-about" edges={['top', 'bottom']}>
      <ScreenHeader title="About" onBack={() => router.back()} />
      <Stack gap="lg" style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <Card>
          <Stack gap="sm">
            <Text variant="caption" color="muted">
              {SETTINGS_COPY.aboutVersion}
            </Text>
            <Text variant="title">{APP_VERSION}</Text>
            <Text variant="caption" color="muted">
              {SETTINGS_COPY.aboutBuild}: {BUILD}
            </Text>
          </Stack>
        </Card>
        <SectionHeader title="Legal & support" />
        <Card padding="none">
          {LINKS.map((link) => (
            <ListRow
              key={link.id}
              title={link.title}
              showChevron
              onPress={() => open(link.url)}
              testID={`settings-about-${link.id}`}
            />
          ))}
        </Card>
        <Text variant="caption" color="muted" style={{ textAlign: 'center' }}>
          WeddingGPT helps you plan with clarity. Made for couples.
        </Text>
      </Stack>
    </Screen>
  );
}

export default AboutSection;
