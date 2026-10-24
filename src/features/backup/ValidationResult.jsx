import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ValidationResult({ checked }) {
  if (!checked) return null;
  if (!checked.ok) {
    return (
      <View style={styles.err}>
        <Text style={styles.errTitle}>Invalid backup</Text>
        <Text style={styles.errBody}>{checked.error || 'Could not read this file.'}</Text>
      </View>
    );
  }
  return (
    <View style={styles.ok}>
      <Text style={styles.okTitle}>Valid WeddingGPT backup</Text>
      <Text style={styles.okBody}>{checked.totalRecords ?? 0} records ready to restore</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  err: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA', marginTop: 12 },
  errTitle: { fontWeight: '700', color: '#B91C1C', marginBottom: 4 },
  errBody: { color: '#7F1D1D', fontSize: 13 },
  ok: { backgroundColor: '#F4FBF8', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#B8E0D2', marginTop: 12 },
  okTitle: { fontWeight: '700', color: '#065F46', marginBottom: 4 },
  okBody: { color: '#047857', fontSize: 13 },
});
