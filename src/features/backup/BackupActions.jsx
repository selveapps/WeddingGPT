import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function BackupActions({ onBackup, onRestore, onHistory, busy }) {
  return (
    <View style={styles.wrap}>
      <Pressable disabled={busy} onPress={onBackup} style={({ pressed }) => [styles.primary, (pressed || busy) && { opacity: 0.85 }]}>
        <Text style={styles.primaryText}>{busy ? 'Working…' : 'Create backup'}</Text>
      </Pressable>
      <Pressable disabled={busy} onPress={onRestore} style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryText}>Restore…</Text>
      </Pressable>
      {onHistory ? (
        <Pressable onPress={onHistory} style={styles.link}>
          <Text style={styles.linkText}>Backup history</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: 10 },
  primary: { backgroundColor: '#C93862', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  secondary: { backgroundColor: '#FFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EDE6E3' },
  secondaryText: { color: '#1A1A1A', fontWeight: '600', fontSize: 16 },
  link: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: '#C93862', fontWeight: '600', fontSize: 14 },
});
