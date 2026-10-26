/**
 * ReceptionFlowDesigner FeatureDetail
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { formatReceptionFlowDesignerStatus, getReceptionFlowDesignerStatusColor, formatReceptionFlowDesignerPriority, getReceptionFlowDesignerPriorityColor, formatCurrency, formatDate, formatRelativeTime } from '../utils/helpers';

export default function FeatureDetail({ item, onEdit, onDelete, onBack }) {
  if (!item) return (<View style={styles.centered}><Text style={styles.empty}>Item not found</Text></View>);
  const statusColor = getReceptionFlowDesignerStatusColor(item.status);
  const priorityColor = getReceptionFlowDesignerPriorityColor(item.priority);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}><Text style={[styles.badgeText, { color: statusColor }]}>{formatReceptionFlowDesignerStatus(item.status)}</Text></View>
          {item.priority ? <View style={[styles.badge, { backgroundColor: priorityColor + '22' }]}><Text style={[styles.badgeText, { color: priorityColor }]}>{formatReceptionFlowDesignerPriority(item.priority)}</Text></View> : null}
        </View>
      </View>
      {item.description ? <View style={styles.section}><Text style={styles.sectionTitle}>Description</Text><Text style={styles.body}>{item.description}</Text></View> : null}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.row}><Text style={styles.label}>Budget</Text><Text style={styles.value}>{item.budget != null ? formatCurrency(item.budget) : '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Category</Text><Text style={styles.value}>{item.category || '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Created</Text><Text style={styles.value}>{formatRelativeTime(item.createdAt)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Updated</Text><Text style={styles.value}>{formatRelativeTime(item.updatedAt)}</Text></View>
      </View>
      {item.notes ? <View style={styles.section}><Text style={styles.sectionTitle}>Notes</Text><Text style={styles.body}>{item.notes}</Text></View> : null}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit?.(item)}><Text style={styles.editText}>Edit</Text></TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete?.(item)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
      </View>
      {onBack ? <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backText}>← Back</Text></TouchableOpacity> : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' }, content: { padding: 16, paddingBottom: 40 }, centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#6B7280', fontSize: 16 }, header: { marginBottom: 20 }, name: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 10 },
  badges: { flexDirection: 'row', gap: 8 }, badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }, badgeText: { fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { fontSize: 15, color: '#374151', lineHeight: 22 }, row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 14, color: '#6B7280' }, value: { fontSize: 14, fontWeight: '500', color: '#111827' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  editBtn: { flex: 1, backgroundColor: '#8B5CF6', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }, editText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  deleteBtn: { flex: 1, backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }, deleteText: { color: '#DC2626', fontWeight: '600', fontSize: 15 },
  backBtn: { marginTop: 16, alignItems: 'center', padding: 12 }, backText: { color: '#8B5CF6', fontSize: 15, fontWeight: '500' },
});
