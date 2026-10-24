import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { fittingLabel } from './lib/attireSelectors';
import EmptyState from './EmptyState';

export default function FittingScheduler({ fittings = [], itemsById = {}, onPress, onAdd }) {
  if (!fittings.length) {
    return <EmptyState title="No fittings" description="Schedule fittings for ordered outfits." ctaLabel="Schedule fitting" onCta={onAdd} emoji="📅" />;
  }
  const data = fittings.slice().sort((a, b) => String(a.scheduledAt || '').localeCompare(String(b.scheduledAt || '')));
  return (
    <FlatList
      data={data}
      keyExtractor={(f) => f.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const outfit = itemsById[item.attireItemId];
        return (
          <Pressable onPress={() => onPress?.(item)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <Text style={styles.title}>{outfit?.title || 'Fitting'}</Text>
            <Text style={styles.sub}>{item.location || 'Location TBD'}</Text>
            <View style={styles.meta}>
              <Text style={styles.badge}>{fittingLabel(item.status)}</Text>
              <Text style={styles.when}>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'Unscheduled'}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#EDE6E3' },
  pressed: { backgroundColor: '#F8F4F2' },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  sub: { fontSize: 13, color: '#6B5E5A', marginTop: 4 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
  badge: { fontSize: 12, fontWeight: '600', color: '#92400E', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  when: { fontSize: 12, color: '#8A7E7A' },
});
