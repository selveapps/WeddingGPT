import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import EmptyState from './EmptyState';

export default function DayOfPackList({ items = [], onToggle, onRebuild }) {
  const packed = items.filter((i) => i.isPacked).length;
  const total = items.length;
  if (!total) {
    return <EmptyState title="Pack list empty" description="Rebuild from outfits and accessories." ctaLabel="Build pack list" onCta={onRebuild} emoji="🧳" />;
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.progress}>{packed} / {total} packed</Text>
      <View style={styles.barTrack}><View style={[styles.barFill, { width: `${total ? (packed / total) * 100 : 0}%` }]} /></View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => onToggle?.(item.id)} style={styles.row}>
            <View style={[styles.check, item.isPacked && styles.checkOn]}>
              <Text style={styles.mark}>{item.isPacked ? '✓' : ''}</Text>
            </View>
            <Text style={[styles.label, item.isPacked && styles.done]}>{item.label}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  progress: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  barTrack: { height: 8, backgroundColor: '#F0EBE8', borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: '#2D9F6F' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0EBE8' },
  check: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: '#D6D3D1', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: '#2D9F6F', borderColor: '#2D9F6F' },
  mark: { color: '#FFF', fontWeight: '700' },
  label: { fontSize: 15, color: '#1A1A1A', flex: 1 },
  done: { textDecorationLine: 'line-through', color: '#8A7E7A' },
});
