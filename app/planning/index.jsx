import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { SummaryCard, EmptyState } from '../../src/features/planning';
export default function Screen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Planning' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>📋</Text>
        <Text style={styles.heading}>Planning</Text>
        <Text style={styles.sub}>Expanded feature module — wire to your existing store.</Text>
        <SummaryCard title="Planning" metric={0} metricLabel="items" />
        <EmptyState emoji="📋" />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F5' },
  content: { padding: 20, paddingBottom: 48 },
  emoji: { fontSize: 36, marginBottom: 8 },
  heading: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  sub: { fontSize: 15, color: '#6B5E5A', marginBottom: 20, lineHeight: 22 },
});
