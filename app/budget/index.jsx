import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { SummaryCard, EmptyState } from '../../src/features/budget';

export default function BudgetScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Budget' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>💰</Text>
        <Text style={styles.heading}>Budget</Text>
        <Text style={styles.sub}>Expanded feature module — wire to your existing store.</Text>
        <SummaryCard title="Budget" metric={0} metricLabel="items" secondary={[{ value: '0', label: 'Ready' }]} />
        <EmptyState title="No data yet" description="Connect the store and replace this empty state." emoji="💰" />
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
