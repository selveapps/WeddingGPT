import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { DayOfPackList } from '../../../src/features/attire';
import { useAttireStore } from '../../../src/store/attireStore';

export default function PackScreen() {
  const packList = useAttireStore((s) => s.listPackList());
  const rebuild = useAttireStore((s) => s.rebuildPackList);
  const toggle = useAttireStore((s) => s.togglePackItem);

  useEffect(() => {
    if (!packList.length) rebuild();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Day-of pack list' }} />
      <DayOfPackList items={packList} onToggle={toggle} onRebuild={() => rebuild()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F5' },
});
