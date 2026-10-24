import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { jobLabel } from './lib/backupSelectors';

export default function BackupProgress({ job }) {
  if (!job || job.status === 'idle' || job.status === 'done') return null;
  const pct = Math.round((job.progress || 0) * 100);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{jobLabel(job.status)}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.pct}>{pct}%</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { marginVertical: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  track: { height: 8, backgroundColor: '#F0EBE8', borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#C93862' },
  pct: { fontSize: 12, color: '#8A7E7A', marginTop: 4, textAlign: 'right' },
});
