import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';

const OPTIONS = [
  { value: 'ceremony', label: 'Ceremony' },
  { value: 'reception', label: 'Reception' },
  { value: 'both', label: 'Both' },
  { value: 'rehearsal', label: 'Rehearsal' },
  { value: 'other', label: 'Other' },
];

export default function OccasionChips({ value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {OPTIONS.map((o) => (
        <Pressable key={o.value} onPress={() => onChange?.(o.value)} style={[styles.chip, value === o.value && styles.on]}>
          <Text style={[styles.text, value === o.value && styles.textOn]}>{o.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#EDE6E3', backgroundColor: '#FFF' },
  on: { backgroundColor: '#C93862', borderColor: '#C93862' },
  text: { fontSize: 13, color: '#57534E' },
  textOn: { color: '#FFF' },
});
