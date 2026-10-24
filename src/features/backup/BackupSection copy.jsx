import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import BackupStatusBanner from './BackupStatusBanner';
import { useBackupStore } from '../../store/backupStore';
import { formatBackupDate } from './lib/backupSelectors';

/**
 * Compact section for Account / Settings – mirrors original BackupSection API.
 */
export default function BackupSection({ onBackup, onRestore, lastJob }) {
  const stats = useBackupStore((s) => s.getStats());
  return (
    <View style={styles.wrap}>
      <Text style={styles.header}>Backup</Text>
      <Text style={styles.sub}>Everything you have planned, in one file.</Text>
      {lastJob ? <BackupStatusBanner job={lastJob} /> : null}
      <Pressable onPress={onBackup} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Text style={styles.rowTitle}>Back up this phone's plan</Text>
        <Text style={styles.rowSub}>Download a backup file</Text>
      </Pressable>
      <Pressable onPress={onRestore} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Text style={styles.rowTitle}>Restore from a backup</Text>
        <Text style={styles.rowSub}>Replace this phone's plan with a backup</Text>
      </Pressable>
      {stats.lastBackupAt ? (
        <Text style={styles.meta}>Last backup: {formatBackupDate(stats.lastBackupAt)}</Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  header: { fontSize: 13, fontWeight: '700', color: '#6B5E5A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  sub: { fontSize: 14, color: '#6B5E5A', marginBottom: 12 },
  row: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#EDE6E3' },
  pressed: { backgroundColor: '#F8F4F2' },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  rowSub: { fontSize: 13, color: '#6B5E5A', marginTop: 2 },
  meta: { fontSize: 12, color: '#8A7E7A', marginTop: 4 },
});
