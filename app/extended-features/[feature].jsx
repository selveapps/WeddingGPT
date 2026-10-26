import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';

import { EXTENDED_FEATURES_BY_NAME } from '@/features';
import { Text, View } from '@/design-system/components';

export default function ExtendedFeatureRoute() {
  const { feature } = useLocalSearchParams();
  const featureName = Array.isArray(feature) ? feature[0] : feature;
  const featureModule = featureName ? EXTENDED_FEATURES_BY_NAME[featureName] : null;
  const FeatureScreen = featureModule?.MainScreen;

  if (!FeatureScreen) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Stack.Screen options={{ title: 'Tool not found' }} />
        <Text variant="body">This planning tool could not be found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: featureModule.FEATURE_NAME.replace(/([a-z])([A-Z])/g, '$1 $2') }} />
      <FeatureScreen />
    </>
  );
}
