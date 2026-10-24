import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BackupSizeEstimate({ bytes, label }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Estimated size</Text>
      <Text style={styles.value}>{label || '—'}</Text>
      {bytes != null ? <Text style={styles.bytes}>{bytes} characters</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EDE6E3', marginBottom: 12 },
  label: { fontSize: 12, color: '#8A7E7A', fontWeight: '600', textTransform: 'uppercase' },
  value: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
  bytes: { fontSize: 12, color: '#8A7E7A', marginTop: 2 },
});
