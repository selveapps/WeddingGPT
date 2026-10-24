import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { formatBytes, formatBackupDate } from './lib/backupSelectors';
import EmptyState from './EmptyState';

export default function BackupHistoryList({ history = [], onPress, onDelete, onBackup }) {
  if (!history.length) {
    return <EmptyState onCta={onBackup} />;
  }
  return (
    <FlatList
      data={history}
      keyExtractor={(h) => h.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable onPress={() => onPress?.(item)} onLongPress={() => onDelete?.(item.id)} style={styles.row}>
          <View style={styles.body}>
            <Text style={styles.title}>{item.label || 'Backup'}</Text>
            <Text style={styles.sub}>
              {formatBackupDate(item.createdAt)} · {item.recordCount || 0} records · {formatBytes(item.byteSize)}
            </Text>
            {item.source ? <Text style={styles.tag}>{item.source}</Text> : null}
          </View>
        </Pressable>
      )}
    />
  );
}
const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
  row: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#EDE6E3' },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  sub: { fontSize: 13, color: '#6B5E5A', marginTop: 4 },
  tag: { fontSize: 11, color: '#8A7E7A', marginTop: 4, textTransform: 'uppercase' },
});
