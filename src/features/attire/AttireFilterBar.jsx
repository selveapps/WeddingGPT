import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
import { roleOptions } from './lib/attireSelectors';
import { AttireStatusMeta } from '../../models/attire';

export default function AttireFilterBar({
  query, onQueryChange, role, onRoleChange, status, onStatusChange,
  rentalOnly, onRentalOnlyChange, needsFitting, onNeedsFittingChange,
}) {
  const roles = [{ value: 'all', label: 'All roles' }, ...roleOptions()];
  const statuses = [{ value: 'all', label: 'All status' }, ...Object.entries(AttireStatusMeta).map(([value, m]) => ({ value, label: m.label }))];
  return (
    <View style={styles.wrap}>
      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder="Search outfits…"
        placeholderTextColor="#A8A29E"
        style={styles.input}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {roles.slice(0, 8).map((r) => (
          <Pressable key={r.value} onPress={() => onRoleChange?.(r.value)}
            style={[styles.chip, role === r.value && styles.chipOn]}>
            <Text style={[styles.chipText, role === r.value && styles.chipTextOn]}>{r.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {statuses.map((s) => (
          <Pressable key={s.value} onPress={() => onStatusChange?.(s.value)}
            style={[styles.chip, status === s.value && styles.chipOn]}>
            <Text style={[styles.chipText, status === s.value && styles.chipTextOn]}>{s.label}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => onRentalOnlyChange?.(!rentalOnly)} style={[styles.chip, rentalOnly && styles.chipOn]}>
          <Text style={[styles.chipText, rentalOnly && styles.chipTextOn]}>Rentals</Text>
        </Pressable>
        <Pressable onPress={() => onNeedsFittingChange?.(!needsFitting)} style={[styles.chip, needsFitting && styles.chipOn]}>
          <Text style={[styles.chipText, needsFitting && styles.chipTextOn]}>Needs fitting</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16, gap: 10 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A' },
  chips: { gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3' },
  chipOn: { backgroundColor: '#C93862', borderColor: '#C93862' },
  chipText: { fontSize: 13, color: '#57534E', fontWeight: '500' },
  chipTextOn: { color: '#FFF' },
});
