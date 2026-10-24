import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { formatBackupDate } from './lib/backupSelectors';

const INTERVALS = [1, 3, 7, 14, 30];

export default function AutoBackupSettings({
  enabled, onEnabledChange,
  intervalDays, onIntervalChange,
  lastAutoBackupAt,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.texts}>
          <Text style={styles.title}>Remind me to back up</Text>
          <Text style={styles.sub}>Local reminder only — backups still need your confirmation</Text>
        </View>
        <Switch value={!!enabled} onValueChange={onEnabledChange} trackColor={{ true: '#C93862' }} />
      </View>
      {enabled ? (
        <>
          <Text style={styles.label}>Every</Text>
          <View style={styles.chips}>
            {INTERVALS.map((d) => (
              <Pressable key={d} onPress={() => onIntervalChange?.(d)} style={[styles.chip, intervalDays === d && styles.chipOn]}>
                <Text style={[styles.chipText, intervalDays === d && styles.chipTextOn]}>{d}d</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.meta}>Last auto prompt: {formatBackupDate(lastAutoBackupAt)}</Text>
        </>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#EDE6E3', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  texts: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  sub: { fontSize: 12, color: '#6B5E5A', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B5E5A', marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#EDE6E3' },
  chipOn: { backgroundColor: '#C93862', borderColor: '#C93862' },
  chipText: { fontSize: 13, color: '#57534E', fontWeight: '600' },
  chipTextOn: { color: '#FFF' },
  meta: { fontSize: 12, color: '#8A7E7A', marginTop: 10 },
});
