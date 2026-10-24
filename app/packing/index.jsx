import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { SummaryCard, EmptyState } from '../../src/features/packing';
export default function Screen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Packing' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={{fontSize:36}}>🧳</Text>
        <Text style={{fontSize:26,fontWeight:'700',marginVertical:8}}>Packing</Text>
        <SummaryCard title="Packing" metric={0} metricLabel="items" />
        <EmptyState emoji="🧳" />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#FAF7F5'}, content:{padding:20} });
