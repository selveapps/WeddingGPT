import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { formatBackupDate, formatBytes } from './lib/backupSelectors';

export default function LastBackupCard({ entry, onPress }) {
  if (!entry) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No backup created on this phone yet</Text>
      </View>
    );
  }
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={styles.kicker}>Last backup</Text>
      <Text style={styles.title}>{entry.label || 'Manual backup'}</Text>
      <Text style={styles.meta}>{formatBackupDate(entry.createdAt)}</Text>
      <Text style={styles.meta}>{entry.recordCount || 0} records · {formatBytes(entry.byteSize)}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#F4FBF8', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#B8E0D2', marginBottom: 16 },
  kicker: { fontSize: 11, fontWeight: '700', color: '#065F46', textTransform: 'uppercase' },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginTop: 6 },
  meta: { fontSize: 13, color: '#6B5E5A', marginTop: 4 },
  empty: { padding: 16, backgroundColor: '#F5F5F4', borderRadius: 12, marginBottom: 16 },
  emptyText: { color: '#8A7E7A', textAlign: 'center' },
});
