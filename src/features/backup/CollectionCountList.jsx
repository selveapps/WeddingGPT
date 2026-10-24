import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { labelForCollection } from './lib/collectionLabels';

export default function CollectionCountList({ counts = [] }) {
  if (!counts.length) return <Text style={styles.empty}>No data</Text>;
  return (
    <View style={styles.wrap}>
      {counts.map((c) => (
        <View key={c.collection} style={styles.row}>
          <Text style={styles.name}>{labelForCollection(c.collection)}</Text>
          <Text style={styles.count}>{c.count}</Text>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#EDE6E3', overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#F0EBE8' },
  name: { fontSize: 14, color: '#1A1A1A' },
  count: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  empty: { color: '#8A7E7A', fontSize: 13 },
});
