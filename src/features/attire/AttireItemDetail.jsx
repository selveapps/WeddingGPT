import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import StatusPipeline from './StatusPipeline';
import { statusLabel, formatMoney } from './lib/attireSelectors';
import { AttireRoleMeta, GarmentTypeMeta } from '../../models/attire';

export default function AttireItemDetail({
  item, fittings = [], accessories = [],
  onEdit, onStatusChange, onAddFitting, onAddAccessory, onOpenFitting,
}) {
  if (!item) return null;
  const role = AttireRoleMeta[item.role] || AttireRoleMeta.other;
  const garment = GarmentTypeMeta[item.garmentType]?.label || item.garmentType;
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>{role.emoji}</Text>
        <Text style={styles.title}>{item.title || 'Untitled'}</Text>
        <Text style={styles.sub}>{item.wearerName || role.label} · {garment}</Text>
        {item.colorHex ? <View style={[styles.swatch, { backgroundColor: item.colorHex }]} /> : null}
      </View>

      <Text style={styles.section}>Status</Text>
      <StatusPipeline current={item.status} onSelect={onStatusChange} />
      <Text style={styles.statusHint}>{statusLabel(item.status)}</Text>

      <View style={styles.grid}>
        <Info label="Brand" value={item.brand} />
        <Info label="Size" value={item.size} />
        <Info label="Color" value={item.color} />
        <Info label="Cost" value={item.cost ? formatMoney(item.cost, item.currency) : null} />
        <Info label="Rental" value={item.rental ? 'Yes' : 'No'} />
        <Info label="Occasion" value={item.occasion} />
      </View>

      {item.notes ? <><Text style={styles.section}>Notes</Text><Text style={styles.notes}>{item.notes}</Text></> : null}

      <View style={styles.sectionRow}>
        <Text style={styles.section}>Fittings ({fittings.length})</Text>
        <Pressable onPress={onAddFitting}><Text style={styles.link}>Add</Text></Pressable>
      </View>
      {fittings.map((f) => (
        <Pressable key={f.id} onPress={() => onOpenFitting?.(f)} style={styles.row}>
          <Text style={styles.rowTitle}>{f.location || 'Fitting'}</Text>
          <Text style={styles.rowSub}>{f.scheduledAt ? new Date(f.scheduledAt).toLocaleString() : f.status}</Text>
        </Pressable>
      ))}

      <View style={styles.sectionRow}>
        <Text style={styles.section}>Accessories ({accessories.length})</Text>
        <Pressable onPress={onAddAccessory}><Text style={styles.link}>Add</Text></Pressable>
      </View>
      {accessories.map((a) => (
        <View key={a.id} style={styles.row}>
          <Text style={styles.rowTitle}>{a.name}</Text>
          <Text style={styles.rowSub}>{a.isPacked ? 'Packed' : 'Not packed'}</Text>
        </View>
      ))}

      {onEdit ? <Pressable onPress={onEdit} style={styles.editBtn}><Text style={styles.editText}>Edit outfit</Text></Pressable> : null}
    </ScrollView>
  );
}

function Info({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.info}>
      <Text style={styles.infoLab}>{label}</Text>
      <Text style={styles.infoVal}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 48 },
  hero: { alignItems: 'center', marginBottom: 20 },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  sub: { fontSize: 15, color: '#6B5E5A', marginTop: 4 },
  swatch: { width: 28, height: 28, borderRadius: 14, marginTop: 10, borderWidth: 1, borderColor: '#EDE6E3' },
  section: { fontSize: 13, fontWeight: '700', color: '#6B5E5A', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: '#C93862', fontWeight: '600', fontSize: 14, marginTop: 20 },
  statusHint: { fontSize: 13, color: '#8A7E7A', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  info: { width: '47%', backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EDE6E3' },
  infoLab: { fontSize: 11, color: '#8A7E7A', marginBottom: 4 },
  infoVal: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  notes: { fontSize: 15, color: '#1A1A1A', lineHeight: 22 },
  row: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#EDE6E3' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  rowSub: { fontSize: 13, color: '#6B5E5A', marginTop: 2 },
  editBtn: { marginTop: 28, backgroundColor: '#C93862', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  editText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
