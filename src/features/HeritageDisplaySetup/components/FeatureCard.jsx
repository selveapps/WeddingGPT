/** HeritageDisplaySetup FeatureCard */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatStatus, statusColor, formatCurrency, relativeTime, truncate } from '../helpers';
export default function FeatureCard({ item, onPress }) {
  if (!item) return null; const c = statusColor(item.status);
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <View style={s.row}><View style={[s.dot, { backgroundColor: c }]} /><Text style={s.name} numberOfLines={1}>{item.name}</Text></View>
      {item.description ? <Text style={s.desc} numberOfLines={2}>{truncate(item.description, 100)}</Text> : null}
      <View style={s.meta}><Text style={[s.badge, { backgroundColor: c + '22', color: c }]}>{formatStatus(item.status)}</Text>{item.budget != null ? <Text style={s.budget}>{formatCurrency(item.budget)}</Text> : null}<Text style={s.time}>{relativeTime(item.updatedAt || item.createdAt)}</Text></View>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({ card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 }, row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 }, dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 }, name: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' }, desc: { fontSize: 12, color: '#6B7280', marginBottom: 8 }, meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }, badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }, budget: { fontSize: 12, color: '#059669', fontWeight: '600' }, time: { fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' } });
