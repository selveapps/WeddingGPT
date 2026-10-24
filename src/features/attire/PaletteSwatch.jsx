import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function PaletteSwatch({ color, size = 40, onPress, selected }) {
  return (
    <Pressable onPress={onPress} style={[styles.wrap, selected && styles.selected]}>
      <View style={[styles.swatch, { width: size, height: size, borderRadius: size / 3, backgroundColor: color?.hex || '#CCC' }]} />
      {color?.name ? <Text style={styles.name} numberOfLines={1}>{color.name}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: 4 },
  selected: { backgroundColor: '#FCE7EF', borderRadius: 12 },
  swatch: { borderWidth: 1, borderColor: '#EDE6E3' },
  name: { fontSize: 11, color: '#6B5E5A', marginTop: 4, maxWidth: 56, textAlign: 'center' },
});
