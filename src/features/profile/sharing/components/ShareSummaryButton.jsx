import React, { useState } from 'react';

import { Button, Stack, Text, useToast } from '@/design-system/components';
import { exportTextFile } from '@/services/files';
import { buildShareableProfile, shareSummaryFilename } from '../lib/shareSummary';

export function ShareSummaryButton({ values, privacy }) {
  const toast = useToast();
  const [sharing, setSharing] = useState(false);

  const share = async () => {
    const summary = buildShareableProfile(values, privacy);
    if (!summary || summary.trim() === 'Our wedding') {
      toast.info('Add a few profile details before creating a summary.');
      return;
    }

    setSharing(true);
    try {
      const result = await exportTextFile({
        filename: shareSummaryFilename(),
        mimeType: 'text/plain',
        title: 'Wedding profile summary',
        text: summary,
      });
      if (result === 'failed') {
        toast.error('Could not open sharing. Please try again.');
      } else if (result === 'downloaded') {
        toast.success('Profile summary downloaded.');
      } else {
        toast.success('Profile summary is ready to share.');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <Stack gap="xs">
      <Button
        label="Share profile summary"
        iconLeft="send"
        variant="secondary"
        onPress={share}
        loading={sharing}
        testID="profile-share-summary"
      />
      <Text variant="caption" color="subtle">
        Location, guest estimate, and contact details follow your privacy preferences.
      </Text>
    </Stack>
  );
}

export default ShareSummaryButton;
