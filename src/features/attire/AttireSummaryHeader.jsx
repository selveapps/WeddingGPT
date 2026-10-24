import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatMoney, progressPercent } from './lib/attireSelectors';

export default function AttireSummaryHeader({ stats, currency = 'USD' }) {
  const pct = progressPercent(stats);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.block}>
          <Text style={styles.value}>{stats?.itemCount ?? 0}</Text>
          <Text style={styles.label}>Outfits</Text>
        </View>
        <View style={styles.block}>
          <Text style={styles.value}>{pct}%</Text>
          <Text style={styles.label}>Ready</Text>
        </View>
        <View style={styles.block}>
          <Text style={styles.value}>{stats?.fittingsScheduled ?? 0}</Text>
          <Text style={styles.label}>Fittings</Text>
        </View>
        <View style={styles.block}>
          <Text style={styles.value}>{formatMoney(stats?.totalCost, currency)}</Text>
          <Text style={styles.label}>Spent</Text>
        </View>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  block: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EDE6E3', alignItems: 'center' },
  value: { fontSize: 16, fontWeight: '700', color: '#C93862' },
  label: { fontSize: 11, color: '#8A7E7A', marginTop: 2 },
  barTrack: { height: 6, backgroundColor: '#F0EBE8', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: '#C93862', borderRadius: 3 },
});
