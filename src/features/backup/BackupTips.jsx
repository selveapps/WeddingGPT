import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TIPS = [
  'Store backups off-device (Files, Drive, email to yourself).',
  'Create a backup before big imports or restore experiments.',
  'Checksum mismatches usually mean a truncated download.',
  'Personal settings (notifications) are not included in backups.',
];

export default function BackupTips() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Tips</Text>
      {TIPS.map((t, i) => (
        <Text key={i} style={styles.tip}>• {t}</Text>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 16 },
  title: { fontSize: 13, fontWeight: '700', color: '#6B5E5A', textTransform: 'uppercase', marginBottom: 8 },
  tip: { fontSize: 13, color: '#57534E', lineHeight: 20, marginBottom: 4 },
});
