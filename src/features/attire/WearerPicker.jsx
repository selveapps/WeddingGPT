import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable } from 'react-native';

/**
 * Pick a wearer from guests or free-text name.
 * guests: [{ id, name }]
 */
export default function WearerPicker({ guests = [], valueGuestId, valueName, onChange }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((g) => String(g.name || '').toLowerCase().includes(q));
  }, [guests, query]);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={valueGuestId ? (guests.find((g) => g.id === valueGuestId)?.name || query) : (valueName || query)}
        onChangeText={(t) => { setQuery(t); onChange?.({ guestId: null, name: t }); }}
        placeholder="Search guests or type a name"
        placeholderTextColor="#A8A29E"
      />
      <FlatList
        data={filtered.slice(0, 20)}
        keyExtractor={(g) => g.id}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onChange?.({ guestId: item.id, name: item.name })}
            style={[styles.row, valueGuestId === item.id && styles.rowOn]}
          >
            <Text style={styles.rowText}>{item.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No guests match — use typed name</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A' },
  list: { maxHeight: 180, marginTop: 8 },
  row: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F0EBE8' },
  rowOn: { backgroundColor: '#FCE7EF' },
  rowText: { fontSize: 15, color: '#1A1A1A' },
  empty: { padding: 12, color: '#8A7E7A', fontSize: 13 },
});
