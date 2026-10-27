/** GarlandInstallerGuide FeatureDetail */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { formatStatus, statusColor, formatCurrency, relativeTime } from '../helpers';

export default function FeatureDetail({ item, onEdit, onDelete, onBack }) {
  if (!item) return <View style={s.center}><Text style={s.muted}>Not found</Text></View>;
  const c = statusColor(item.status);
  return (
    <ScrollView style={s.wrap} contentContainerStyle={s.content}>
      <Text style={s.name}>{item.name}</Text>
      <View style={[s.badge, { backgroundColor: c + '22' }]}><Text style={[s.badgeT, { color: c }]}>{formatStatus(item.status)}</Text></View>
      {item.description ? <View style={s.box}><Text style={s.boxH}>Description</Text><Text style={s.body}>{item.description}</Text></View> : null}
      <View style={s.box}>
        <Text style={s.boxH}>Details</Text>
        <View style={s.row}><Text style={s.k}>Budget</Text><Text style={s.v}>{item.budget != null ? formatCurrency(item.budget) : '—'}</Text></View>
        <View style={s.row}><Text style={s.k}>Created</Text><Text style={s.v}>{relativeTime(item.createdAt)}</Text></View>
        <View style={s.row}><Text style={s.k}>Updated</Text><Text style={s.v}>{relativeTime(item.updatedAt)}</Text></View>
      </View>
      {item.notes ? <View style={s.box}><Text style={s.boxH}>Notes</Text><Text style={s.body}>{item.notes}</Text></View> : null}
      <View style={s.actions}>
        <TouchableOpacity style={s.edit} onPress={() => onEdit?.(item)}><Text style={s.editT}>Edit</Text></TouchableOpacity>
        <TouchableOpacity style={s.del} onPress={() => onDelete?.(item)}><Text style={s.delT}>Delete</Text></TouchableOpacity>
      </View>
      {onBack ? <TouchableOpacity style={s.back} onPress={onBack}><Text style={s.backT}>← Back</Text></TouchableOpacity> : null}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#F9FAFB' }, content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, muted: { color: '#6B7280' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 14 },
  badgeT: { fontSize: 12, fontWeight: '600' },
  box: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  boxH: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' },
  body: { fontSize: 14, color: '#374151', lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  k: { fontSize: 13, color: '#6B7280' }, v: { fontSize: 13, fontWeight: '500', color: '#111827' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  edit: { flex: 1, backgroundColor: '#8B5CF6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  editT: { color: '#fff', fontWeight: '600' },
  del: { flex: 1, backgroundColor: '#FEE2E2', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  delT: { color: '#DC2626', fontWeight: '600' },
  back: { marginTop: 14, alignItems: 'center', padding: 10 },
  backT: { color: '#8B5CF6', fontWeight: '500' },
});
