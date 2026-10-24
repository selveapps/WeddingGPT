import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { previewFromCheck } from './lib/backupSelectors';
import CollectionCountList from './CollectionCountList';

export default function RestorePreview({ checked }) {
  const preview = previewFromCheck(checked);
  if (!preview) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Backup preview</Text>
      <View style={styles.grid}>
        <Cell label="Created" value={preview.createdAtLabel} />
        <Cell label="Records" value={String(preview.totalRecords)} />
        <Cell label="Collections" value={String(preview.collections)} />
        <Cell label="Version" value={String(preview.version ?? '—')} />
      </View>
      {preview.label ? <Text style={styles.extra}>Label: {preview.label}</Text> : null}
      {preview.deviceName ? <Text style={styles.extra}>Device: {preview.deviceName}</Text> : null}
      <Text style={styles.section}>Top collections</Text>
      <CollectionCountList counts={preview.top} />
      <View style={styles.warn}>
        <Text style={styles.warnText}>Restoring will replace the current plan on this phone. This cannot be undone unless you backed up first.</Text>
      </View>
    </View>
  );
}
function Cell({ label, value }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLab}>{label}</Text>
      <Text style={styles.cellVal}>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '47%', backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EDE6E3' },
  cellLab: { fontSize: 11, color: '#8A7E7A' },
  cellVal: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginTop: 4 },
  extra: { fontSize: 13, color: '#6B5E5A' },
  section: { fontSize: 13, fontWeight: '700', color: '#6B5E5A', textTransform: 'uppercase', marginTop: 12 },
  warn: { backgroundColor: '#FFF9F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F5D0A9', marginTop: 12 },
  warnText: { fontSize: 13, color: '#92400E', lineHeight: 18 },
});
