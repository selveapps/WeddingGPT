import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { validateSwatch, normalizeHex } from './lib/attireValidation';
import EmptyState from './EmptyState';

export default function PaletteBuilder({ palette, onAddSwatch, onRemoveSwatch, onCreatePalette }) {
  const [name, setName] = useState('');
  const [hex, setHex] = useState('');
  const [err, setErr] = useState('');

  if (!palette) {
    return <EmptyState title="No palette" description="Create a color palette for the wedding party." ctaLabel="Create palette" onCta={() => onCreatePalette?.({ name: 'Wedding Palette', colors: [] })} emoji="🎨" />;
  }

  const add = () => {
    const r = validateSwatch({ hex });
    if (!r.ok) { setErr(r.errors.hex); return; }
    setErr('');
    onAddSwatch?.(palette.id, { name: name || normalizeHex(hex), hex: normalizeHex(hex) });
    setName('');
    setHex('');
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>{palette.name}</Text>
      <View style={styles.swatches}>
        {(palette.colors || []).map((c) => (
          <Pressable key={c.id} onLongPress={() => onRemoveSwatch?.(palette.id, c.id)} style={styles.swatchWrap}>
            <View style={[styles.swatch, { backgroundColor: c.hex }]} />
            <Text style={styles.swatchName} numberOfLines={1}>{c.name || c.hex}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>Long-press a swatch to remove</Text>
      <Text style={styles.label}>New swatch name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Blush" placeholderTextColor="#A8A29E" />
      <Text style={styles.label}>Hex</Text>
      <TextInput style={styles.input} value={hex} onChangeText={setHex} placeholder="#E8B4B8" autoCapitalize="characters" placeholderTextColor="#A8A29E" />
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <Pressable onPress={add} style={styles.btn}><Text style={styles.btnT}>Add color</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatchWrap: { width: 72, alignItems: 'center' },
  swatch: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#EDE6E3' },
  swatchName: { fontSize: 11, color: '#6B5E5A', marginTop: 4, textAlign: 'center' },
  hint: { fontSize: 12, color: '#8A7E7A', marginTop: 12, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B5E5A', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A' },
  btn: { marginTop: 20, backgroundColor: '#C93862', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnT: { color: '#FFF', fontWeight: '700' },
  err: { color: '#B91C1C', fontSize: 12, marginTop: 4 },
});
