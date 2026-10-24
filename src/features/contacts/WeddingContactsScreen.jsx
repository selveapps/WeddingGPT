import React from 'react';

import { Card, PageHeader, Screen, Stack, Text } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

export function WeddingContactsScreen() {
  const { spacing } = useTheme();

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <PageHeader eyebrow="Wedding tools" title="Important contacts" />
        <Card tone="sunken">
          <Text variant="body" color="muted">
            This contact list is not connected to a data source yet. Your guest list and vendor
            details remain available in their own sections.
          </Text>
        </Card>
      </Stack>
    </Screen>
  );
}

export default WeddingContactsScreen;
