import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { readinessIssues } from './lib/attireSelectors';

export default function ReadinessIssues({ items = [], fittings = [], accessories = [], onPressItem }) {
  const issues = useMemo(() => readinessIssues(items, fittings, accessories), [items, fittings, accessories]);
  if (!issues.length) {
    return (
      <View style={styles.ok}>
        <Text style={styles.okText}>All clear — no readiness issues detected</Text>
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{issues.length} issue{issues.length === 1 ? '' : 's'}</Text>
      {issues.map((issue, idx) => (
        <Pressable key={idx} onPress={() => onPressItem?.(issue.itemId)} style={styles.row}>
          <Text style={styles.msg}>{issue.message}</Text>
          <Text style={styles.type}>{issue.type.replace(/_/g, ' ')}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  title: { fontSize: 15, fontWeight: '700', color: '#92400E', marginBottom: 10 },
  row: { backgroundColor: '#FFF9F2', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F5D0A9' },
  msg: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  type: { fontSize: 11, color: '#92400E', marginTop: 4, textTransform: 'uppercase' },
  ok: { padding: 16, backgroundColor: '#F4FBF8', borderRadius: 12, margin: 16 },
  okText: { color: '#065F46', fontWeight: '600', textAlign: 'center' },
});
