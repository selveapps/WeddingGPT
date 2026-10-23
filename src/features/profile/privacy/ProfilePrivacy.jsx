import React from 'react';

import { Card, SectionHeader, Stack, Text } from '@/design-system/components';
import { PRIVACY_NOTICE, PRIVACY_OPTIONS } from './lib/privacyConstants';
import { countEnabledPrivacySettings } from './lib/privacyHelpers';
import { usePrivacySettings } from './hooks/usePrivacySettings';
import { PrivacyToggleRow } from './components/PrivacyToggleRow';

export function ProfilePrivacy() {
  const { settings, setSetting, hasWorkspace } = usePrivacySettings();
  const enabledCount = countEnabledPrivacySettings(settings);

  return (
    <Stack gap="sm" testID="profile-privacy">
      <SectionHeader
        eyebrow="Your boundaries"
        title="Privacy preferences"
        subtitle={`${enabledCount} of ${PRIVACY_OPTIONS.length} summary details included`}
      />
      <Stack gap="sm">
        {PRIVACY_OPTIONS.map((option) => (
          <PrivacyToggleRow
            key={option.key}
            title={option.title}
            description={option.description}
            value={settings[option.key]}
            onChange={(next) => setSetting(option.key, next)}
            testID={`privacy-${option.key}`}
          />
        ))}
      </Stack>
      <Card tone="muted" padding="md">
        <Text variant="caption" color="muted">
          {hasWorkspace ? PRIVACY_NOTICE : 'Create a wedding workspace before saving profile preferences.'}
        </Text>
      </Card>
    </Stack>
  );
}

export default ProfilePrivacy;
