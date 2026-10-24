import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { upcomingFittings, fittingLabel } from './lib/attireSelectors';

export default function FittingTimeline({ fittings = [], itemsById = {}, limit = 8 }) {
  const list = upcomingFittings(fittings, limit);
  if (!list.length) {
    return <Text style={styles.empty}>No upcoming fittings</Text>;
  }
  return (
    <View style={styles.wrap}>
      {list.map((f, idx) => {
        const outfit = itemsById[f.attireItemId];
        return (
          <View key={f.id} style={styles.row}>
            <View style={styles.rail}>
              <View style={styles.dot} />
              {idx < list.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.body}>
              <Text style={styles.when}>{f.scheduledAt ? new Date(f.scheduledAt).toLocaleString() : 'TBD'}</Text>
              <Text style={styles.title}>{outfit?.title || 'Fitting'}</Text>
              <Text style={styles.sub}>{f.location || fittingLabel(f.status)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  empty: { color: '#8A7E7A', fontSize: 14, padding: 8 },
  row: { flexDirection: 'row', minHeight: 64 },
  rail: { width: 20, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C93862', marginTop: 4 },
  line: { flex: 1, width: 2, backgroundColor: '#F0EBE8', marginTop: 2 },
  body: { flex: 1, paddingBottom: 16 },
  when: { fontSize: 12, color: '#8A7E7A', fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginTop: 2 },
  sub: { fontSize: 13, color: '#6B5E5A', marginTop: 2 },
});
