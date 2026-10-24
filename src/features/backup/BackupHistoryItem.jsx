import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { formatBytes, formatBackupDate } from './lib/backupSelectors';

export default function BackupHistoryItem({ entry, onPress, onDelete }) {
  if (!entry) return null;
  return (
    <Pressable onPress={() => onPress?.(entry)} style={styles.card}>
      <Text style={styles.title}>{entry.label || 'Backup'}</Text>
      <Text style={styles.meta}>{formatBackupDate(entry.createdAt)}</Text>
      <Text style={styles.meta}>{entry.recordCount || 0} records · {formatBytes(entry.byteSize)}</Text>
      {entry.checksum ? <Text style={styles.hash}>∑ {entry.checksum}</Text> : null}
      {onDelete ? (
        <Pressable onPress={() => onDelete(entry.id)} style={styles.del}>
          <Text style={styles.delText}>Remove from history</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#EDE6E3' },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  meta: { fontSize: 14, color: '#6B5E5A', marginTop: 6 },
  hash: { fontSize: 12, color: '#8A7E7A', marginTop: 8, fontFamily: 'monospace' },
  del: { marginTop: 16 },
  delText: { color: '#B91C1C', fontWeight: '600' },
});
