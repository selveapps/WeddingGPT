import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const POINTS = [
  'A backup is a file on this phone (or shared to Files / Drive).',
  'It includes your plan data — guests, budget, tasks, and more.',
  'It does not include account passwords or synced cloud-only state.',
  'Restore replaces the local plan; it does not merge.',
  'Always back up before restoring if you might need the current plan.',
];

export default function BackupExplainer() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>How backups work</Text>
      {POINTS.map((p, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.num}>{i + 1}</Text>
          <Text style={styles.text}>{p}</Text>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { backgroundColor: '#F2F9FC', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#A8D5E5', marginBottom: 16 },
  title: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  num: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#C93862', color: '#FFF', textAlign: 'center', fontSize: 12, fontWeight: '700', overflow: 'hidden', lineHeight: 22 },
  text: { flex: 1, fontSize: 13, color: '#1A1A1A', lineHeight: 18 },
});
