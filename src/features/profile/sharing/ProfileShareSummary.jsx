import React from 'react';

import { Card, SectionHeader, Stack } from '@/design-system/components';
import { usePrivacySettings } from '../privacy/hooks/usePrivacySettings';
import { ShareSummaryButton } from './components/ShareSummaryButton';

export function ProfileShareSummary({ values }) {
  const { settings } = usePrivacySettings();
  return (
    <Stack gap="sm" testID="profile-share">
      <SectionHeader
        eyebrow="Share what you choose"
        title="Profile summary"
        subtitle="Create a short text summary to send to someone helping with your day."
      />
      <Card>
        <ShareSummaryButton values={values} privacy={settings} />
      </Card>
    </Stack>
  );
}

export default ProfileShareSummary;
