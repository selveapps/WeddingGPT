import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { nextStatus, prevStatus } from './lib/statusMachine';
import { statusLabel } from './lib/attireSelectors';

export default function QuickStatusActions({ status, onChange }) {
  const next = nextStatus(status);
  const prev = prevStatus(status);
  return (
    <View style={styles.row}>
      <Pressable disabled={!prev} onPress={() => prev && onChange?.(prev)} style={[styles.btn, !prev && styles.disabled]}>
        <Text style={styles.btnText}>← {prev ? statusLabel(prev) : '—'}</Text>
      </Pressable>
      <Pressable disabled={!next} onPress={() => next && onChange?.(next)} style={[styles.btnPrimary, !next && styles.disabled]}>
        <Text style={styles.btnPrimaryText}>{next ? statusLabel(next) : 'Done'} →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EDE6E3', alignItems: 'center', backgroundColor: '#FFF' },
  btnPrimary: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#C93862' },
  btnText: { fontSize: 13, fontWeight: '600', color: '#57534E' },
  btnPrimaryText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  disabled: { opacity: 0.4 },
});
