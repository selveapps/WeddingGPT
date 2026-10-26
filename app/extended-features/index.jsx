import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { EXTENDED_FEATURES } from '@/features';
import { Card, ListRow, Screen, Stack as LayoutStack, Text } from '@/design-system/components';

function formatFeatureName(name) {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export default function ExtendedFeaturesScreen() {
  const router = useRouter();

  return (
    <Screen scroll={false}>
      <Stack.Screen options={{ title: 'More planning tools' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <LayoutStack gap="sm">
          <View>
            <Text variant="h2" heading>
              More planning tools
            </Text>
            <Text variant="bodySm" color="muted">
              Browse {EXTENDED_FEATURES.length} additional tools. Your entries are stored on this
              device.
            </Text>
          </View>
          <Card padding="none">
            {EXTENDED_FEATURES.map((feature) => {
              const name = feature.FEATURE_NAME;
              return (
                <ListRow
                  key={name}
                  icon="sparkle"
                  title={formatFeatureName(name)}
                  subtitle="Open tool"
                  showChevron
                  onPress={() => router.push(`/extended-features/${name}`)}
                />
              );
            })}
          </Card>
        </LayoutStack>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
});
