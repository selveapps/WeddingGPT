import React from 'react';
import { useRouter } from 'expo-router';

import { Card, ListRow } from '@/design-system/components';
import { LabScreen } from '@/labs/shared/LabScreen';
import { LAB_FEATURES } from '@/labs/registry';

/**
 * The Labs hub: a plain list of every prototype under test. Not linked from
 * the app on purpose - open `/labs` directly.
 */
export default function LabsHubScreen() {
  const router = useRouter();

  return (
    <LabScreen
      title="Feature labs"
      intro="Prototypes being tested before they join the app. Each keeps its own data, and anything that would change your real plan asks first."
    >
      <Card padding="none">
        {LAB_FEATURES.map((feature) => (
          <ListRow
            key={feature.key}
            icon={feature.icon}
            title={feature.title}
            subtitle={feature.blurb}
            onPress={() => router.push(feature.route)}
          />
        ))}
      </Card>
    </LabScreen>
  );
}
