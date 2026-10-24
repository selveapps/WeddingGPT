import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { AccessoryCategoryMeta } from '../../models/attire';
import EmptyState from './EmptyState';

export default function AccessoryChecklist({ accessories = [], onTogglePacked, onAdd, onPress }) {
  if (!accessories.length) {
    return <EmptyState title="No accessories" description="Add veil, shoes, jewelry, and more." ctaLabel="Add accessory" onCta={onAdd} emoji="💎" />;
  }
  return (
    <FlatList
      data={accessories}
      keyExtractor={(a) => a.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const cat = AccessoryCategoryMeta[item.category] || AccessoryCategoryMeta.other;
        return (
          <Pressable onPress={() => onPress?.(item)} style={styles.row}>
            <Pressable onPress={() => onTogglePacked?.(item.id)} style={[styles.check, item.isPacked && styles.checkOn]}>
              <Text style={styles.checkMark}>{item.isPacked ? '✓' : ''}</Text>
            </Pressable>
            <View style={styles.body}>
              <Text style={[styles.title, item.isPacked && styles.done]}>{item.name}</Text>
              <Text style={styles.sub}>{cat.emoji} {cat.label}{item.isMustHave ? ' · must-have' : ''}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#EDE6E3' },
  check: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: '#D6D3D1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkOn: { backgroundColor: '#C93862', borderColor: '#C93862' },
  checkMark: { color: '#FFF', fontWeight: '700' },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  done: { textDecorationLine: 'line-through', color: '#8A7E7A' },
  sub: { fontSize: 12, color: '#6B5E5A', marginTop: 2 },
});
