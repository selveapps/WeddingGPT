/**
 * CulturalTraditionGuide FeatureCard
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatCulturalTraditionGuideStatus, getCulturalTraditionGuideStatusColor, formatCurrency, formatRelativeTime, truncate } from '../utils/helpers';

export default function FeatureCard({ item, onPress }) {
  if (!item) return null;
  const statusColor = getCulturalTraditionGuideStatusColor(item.status);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}><View style={[styles.statusDot, { backgroundColor: statusColor }]} /><Text style={styles.name} numberOfLines={1}>{item.name}</Text></View>
      {item.description ? <Text style={styles.desc} numberOfLines={2}>{truncate(item.description, 120)}</Text> : null}
      <View style={styles.meta}>
        <Text style={[styles.badge, { backgroundColor: statusColor + '22', color: statusColor }]}>{formatCulturalTraditionGuideStatus(item.status)}</Text>
        {item.budget != null ? <Text style={styles.budget}>{formatCurrency(item.budget)}</Text> : null}
        <Text style={styles.time}>{formatRelativeTime(item.updatedAt || item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 }, statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' }, desc: { fontSize: 13, color: '#6B7280', marginBottom: 8, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  budget: { fontSize: 12, color: '#059669', fontWeight: '600' }, time: { fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' },
});
