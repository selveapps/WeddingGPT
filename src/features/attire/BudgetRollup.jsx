import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { costByRole, formatMoney } from './lib/attireSelectors';
import { AttireRoleMeta } from '../../models/attire';

export default function BudgetRollup({ items = [], accessories = [], fittings = [], currency = 'USD' }) {
  const byRole = useMemo(() => costByRole(items), [items]);
  const accCost = accessories.reduce((s, a) => s + (a.cost || 0), 0);
  const fitCost = fittings.reduce((s, f) => s + (f.cost || 0), 0);
  const itemCost = items.reduce((s, i) => s + (i.cost || 0), 0);
  const total = itemCost + accCost + fitCost;
  const rows = Object.entries(byRole).sort((a, b) => b[1] - a[1]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.total}>{formatMoney(total, currency)}</Text>
      <Text style={styles.totalLab}>Total attire spend</Text>
      <View style={styles.breakdown}>
        <Row label="Outfits" value={formatMoney(itemCost, currency)} />
        <Row label="Accessories" value={formatMoney(accCost, currency)} />
        <Row label="Fittings / alterations" value={formatMoney(fitCost, currency)} />
      </View>
      <Text style={styles.section}>By role</Text>
      {rows.map(([role, amount]) => (
        <Row key={role} label={(AttireRoleMeta[role] || AttireRoleMeta.other).label} value={formatMoney(amount, currency)} />
      ))}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLab}>{label}</Text>
      <Text style={styles.rowVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  total: { fontSize: 32, fontWeight: '700', color: '#C93862' },
  totalLab: { fontSize: 13, color: '#6B5E5A', marginBottom: 16 },
  breakdown: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#EDE6E3', marginBottom: 16 },
  section: { fontSize: 13, fontWeight: '700', color: '#6B5E5A', textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0EBE8' },
  rowLab: { fontSize: 14, color: '#1A1A1A' },
  rowVal: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
});
