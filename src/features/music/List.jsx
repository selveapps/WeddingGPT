import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';

/**
 * Generic list for feature entities.
 * Expects items with id, title/name, and optional subtitle/status.
 */
export default function List({
  items = [],
  onPressItem,
  onLongPressItem,
  keyExtractor,
  emptyMessage = 'Nothing here yet.',
  renderRight,
  style,
}) {
  const renderItem = useCallback(
    ({ item }) => {
      const title = item.title || item.name || item.label || 'Untitled';
      const subtitle = item.subtitle || item.description || item.notes || '';
      return (
        <Pressable
          onPress={() => onPressItem?.(item)}
          onLongPress={() => onLongPressItem?.(item)}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.rowSubtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {renderRight ? renderRight(item) : null}
        </Pressable>
      );
    },
    [onPressItem, onLongPressItem, renderRight]
  );

  if (!items.length) {
    return (
      <View style={[styles.empty, style]}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor || ((item) => item.id)}
      renderItem={renderItem}
      contentContainerStyle={[styles.listContent, style]}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  rowPressed: { backgroundColor: '#F8F4F2' },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  rowSubtitle: { fontSize: 13, color: '#6B5E5A', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#F0EBE8', marginLeft: 16 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#8A7E7A', textAlign: 'center' },
});
