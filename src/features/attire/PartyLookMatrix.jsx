import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AttireRoleMeta, groupAttireByRole } from '../../models/attire';
import { statusLabel } from './lib/attireSelectors';

export default function PartyLookMatrix({ items = [] }) {
  const groups = useMemo(() => groupAttireByRole(items), [items]);
  const roles = Object.keys(groups);
  if (!roles.length) return <Text style={styles.empty}>Add party outfits to see the matrix</Text>;
  return (
    <ScrollView horizontal contentContainerStyle={styles.wrap}>
      {roles.map((role) => {
        const meta = AttireRoleMeta[role] || AttireRoleMeta.other;
        const list = groups[role] || [];
        return (
          <View key={role} style={styles.col}>
            <Text style={styles.colTitle}>{meta.emoji} {meta.label}</Text>
            {list.map((item) => (
              <View key={item.id} style={styles.cell}>
                <Text style={styles.cellTitle} numberOfLines={2}>{item.title || 'Look'}</Text>
                <Text style={styles.cellSub}>{statusLabel(item.status)}</Text>
                {item.colorHex ? <View style={[styles.dot, { backgroundColor: item.colorHex }]} /> : null}
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  empty: { padding: 16, color: '#8A7E7A' },
  col: { width: 160, backgroundColor: '#FFF', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#EDE6E3' },
  colTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  cell: { backgroundColor: '#FAF7F5', borderRadius: 10, padding: 10, marginBottom: 8 },
  cellTitle: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  cellSub: { fontSize: 11, color: '#6B5E5A', marginTop: 4 },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 6, borderWidth: 1, borderColor: '#EDE6E3' },
});
