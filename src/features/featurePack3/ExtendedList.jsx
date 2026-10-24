import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
export default function List({ items = [], onPressItem, emptyMessage = 'Nothing here yet.', style }) {
  const renderItem = useCallback(({ item }) => {
    const title = item.title || item.name || item.label || 'Untitled';
    const subtitle = item.subtitle || item.description || item.notes || '';
    return (
      <Pressable onPress={() => onPressItem?.(item)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.sub} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
      </Pressable>
    );
  }, [onPressItem]);
  if (!items.length) return <View style={[styles.empty, style]}><Text style={styles.emptyText}>{emptyMessage}</Text></View>;
  return (
    <FlatList data={items} keyExtractor={(i) => i.id || String(i)} renderItem={renderItem}
      contentContainerStyle={style} ItemSeparatorComponent={() => <View style={styles.sep} />} />
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#FFF' },
  pressed: { backgroundColor: '#F8F4F2' },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  sub: { fontSize: 13, color: '#6B5E5A', marginTop: 2 },
  sep: { height: 1, backgroundColor: '#F0EBE8', marginLeft: 16 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#8A7E7A', textAlign: 'center' },
});
