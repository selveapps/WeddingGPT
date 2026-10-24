import React from 'react';
import { SafeAreaView, StyleSheet, Pressable, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FittingScheduler, FittingTimeline } from '../../../src/features/attire';
import { useFittingScheduler } from '../../../src/features/attire/hooks';

export default function FittingsScreen() {
  const router = useRouter();
  const { fittings, itemsById } = useFittingScheduler();
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: 'Fittings',
          headerRight: () => (
            <Pressable onPress={() => router.push('/attire/fitting/new')} hitSlop={12}>
              <Text style={styles.add}>Add</Text>
            </Pressable>
          ),
        }}
      />
      <FittingTimeline fittings={fittings} itemsById={itemsById} />
      <FittingScheduler
        fittings={fittings}
        itemsById={itemsById}
        onAdd={() => router.push('/attire/fitting/new')}
        onPress={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F5' },
  add: { color: '#C93862', fontWeight: '600', marginRight: 8 },
});
