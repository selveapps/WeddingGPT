import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { FittingForm } from '../../../src/features/attire';
import { useFittingScheduler } from '../../../src/features/attire/hooks';

export default function NewFittingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { items, save } = useFittingScheduler();
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Schedule fitting' }} />
      <FittingForm
        initial={{ attireItemId: params.attireItemId || '' }}
        items={items}
        onCancel={() => router.back()}
        onSubmit={(values) => {
          save(values);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F5' },
});
