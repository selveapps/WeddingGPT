import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { ExtendedSummaryCard, ExtendedEmptyState } from '../../src/features/daily/extendedIndex';
/** Additive route preview for Daily. Existing routes are untouched. */
export default function Screen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Daily (extended)' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>📅</Text>
        <Text style={styles.h}>Daily</Text>
        <Text style={styles.sub}>Additive feature pack — existing files were not deleted or overwritten.</Text>
        <ExtendedSummaryCard title="Daily" metric={0} metricLabel="items" />
        <ExtendedEmptyState emoji="📅" />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F5' },
  content: { padding: 20, paddingBottom: 48 },
  emoji: { fontSize: 36, marginBottom: 8 },
  h: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  sub: { fontSize: 14, color: '#6B5E5A', marginBottom: 16, lineHeight: 20 },
});
