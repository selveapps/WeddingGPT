import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function ChecksumDisplay({ checksum, onCopy }) {
  if (!checksum) return null;
  return (
    <Pressable onPress={() => onCopy?.(checksum)} style={styles.wrap}>
      <Text style={styles.label}>Checksum</Text>
      <Text style={styles.hash}>{checksum}</Text>
      <Text style={styles.hint}>Tap to copy · detects file damage, not tampering</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  wrap: { backgroundColor: '#F5F5F4', borderRadius: 12, padding: 12, marginVertical: 8 },
  label: { fontSize: 11, fontWeight: '700', color: '#8A7E7A', textTransform: 'uppercase' },
  hash: { fontSize: 16, fontFamily: 'monospace', color: '#1A1A1A', marginTop: 4, letterSpacing: 1 },
  hint: { fontSize: 11, color: '#8A7E7A', marginTop: 4 },
});
