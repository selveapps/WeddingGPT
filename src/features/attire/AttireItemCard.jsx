import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { statusLabel, statusTone } from './lib/attireSelectors';
import { AttireRoleMeta } from '../../models/attire';

export default function AttireItemCard({ item, onPress, onLongPress }) {
  const role = AttireRoleMeta[item.role] || AttireRoleMeta.other;
  const tone = statusTone(item.status);
  return (
    <Pressable onPress={() => onPress?.(item)} onLongPress={() => onLongPress?.(item)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        <Text style={styles.emoji}>{role.emoji}</Text>
        <View style={styles.topText}>
          <Text style={styles.title} numberOfLines={1}>{item.title || 'Untitled'}</Text>
          <Text style={styles.sub} numberOfLines={1}>{item.wearerName || role.label}</Text>
        </View>
        {item.colorHex ? <View style={[styles.swatch, { backgroundColor: item.colorHex }]} /> : null}
      </View>
      <View style={styles.meta}>
        <Text style={[styles.badge, styles[`badge_${tone}`]]}>{statusLabel(item.status)}</Text>
        {item.rental ? <Text style={styles.tag}>Rental</Text> : null}
        {item.cost ? <Text style={styles.cost}>${Math.round(item.cost)}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EDE6E3' },
  pressed: { backgroundColor: '#F8F4F2' },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  emoji: { fontSize: 22, marginRight: 10 },
  topText: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  sub: { fontSize: 13, color: '#6B5E5A', marginTop: 2 },
  swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#EDE6E3' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  badge_success: { backgroundColor: '#D1FAE5', color: '#065F46' },
  badge_warning: { backgroundColor: '#FEF3C7', color: '#92400E' },
  badge_info: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
  badge_neutral: { backgroundColor: '#F5F5F4', color: '#57534E' },
  tag: { fontSize: 12, color: '#6B5E5A' },
  cost: { marginLeft: 'auto', fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
});
