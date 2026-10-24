import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { statusSteps } from './lib/statusMachine';

export default function StatusPipeline({ current, onSelect, readonly = false }) {
  const steps = statusSteps();
  const currentIdx = steps.findIndex((s) => s.id === current);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {steps.map((step, idx) => {
        const active = step.id === current;
        const done = idx < currentIdx;
        return (
          <Pressable key={step.id} disabled={readonly} onPress={() => onSelect?.(step.id)}
            style={[styles.step, active && styles.stepActive, done && styles.stepDone]}>
            <Text style={[styles.stepText, active && styles.stepTextActive]}>{step.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  step: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F5F5F4', borderWidth: 1, borderColor: '#E7E5E4' },
  stepActive: { backgroundColor: '#C93862', borderColor: '#C93862' },
  stepDone: { backgroundColor: '#FCE7EF', borderColor: '#F5C6D4' },
  stepText: { fontSize: 12, fontWeight: '600', color: '#57534E' },
  stepTextActive: { color: '#FFF' },
});
