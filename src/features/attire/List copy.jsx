import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { statusLabel, statusTone } from './lib/attireSelectors';

export default function List({ items = [], onPressItem, onLongPressItem, emptyMessage = 'No outfits yet.', style }) {
  const renderItem = useCallback(({ item }) => {
    const title = item.title || item.wearerName || 'Untitled';
    const subtitle = [item.wearerName && item.title ? item.wearerName : null, item.color, item.brand].filter(Boolean).join(' · ');
    const tone = statusTone(item.status);
    return (
      <Pressable onPress={() => onPressItem?.(item)} onLongPress={() => onLongPressItem?.(item)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={[styles.dot, styles[`dot_${tone}`] || styles.dot_neutral]} />
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <Text style={styles.badge}>{statusLabel(item.status)}</Text>
      </Pressable>
    );
  }, [onPressItem, onLongPressItem]);

  if (!items.length) {
    return <View style={[styles.empty, style]}><Text style={styles.emptyText}>{emptyMessage}</Text></View>;
  }
  return (
    <FlatList data={items} keyExtractor={(i) => i.id} renderItem={renderItem}
      contentContainerStyle={style} ItemSeparatorComponent={() => <View style={styles.sep} />} />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#FFF' },
  pressed: { backgroundColor: '#F8F4F2' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  dot_success: { backgroundColor: '#2D9F6F' },
  dot_warning: { backgroundColor: '#D97706' },
  dot_info: { backgroundColor: '#3B82F6' },
  dot_neutral: { backgroundColor: '#A8A29E' },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  sub: { fontSize: 13, color: '#6B5E5A', marginTop: 2 },
  badge: { fontSize: 12, color: '#6B5E5A', marginLeft: 8 },
  sep: { height: 1, backgroundColor: '#F0EBE8', marginLeft: 36 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#8A7E7A', textAlign: 'center' },
});
