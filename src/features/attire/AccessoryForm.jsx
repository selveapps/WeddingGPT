import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { validateAccessory } from './lib/attireValidation';
import { AccessoryCategoryMeta } from '../../models/attire';

export default function AccessoryForm({ initial = {}, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    name: '', category: 'other', notes: '', isMustHave: true, isPacked: false, cost: '',
    ...initial, cost: initial.cost != null ? String(initial.cost) : '',
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));
  const save = () => {
    const payload = { ...values, cost: values.cost === '' ? 0 : Number(values.cost) };
    const r = validateAccessory(payload);
    setErrors(r.errors);
    if (!r.ok) return;
    onSubmit?.(payload);
  };
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={values.name} onChangeText={(t) => set('name', t)} placeholderTextColor="#A8A29E" />
      {errors.name ? <Text style={styles.err}>{errors.name}</Text> : null}
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal contentContainerStyle={styles.chips}>
        {Object.entries(AccessoryCategoryMeta).map(([value, m]) => (
          <Pressable key={value} onPress={() => set('category', value)} style={[styles.chip, values.category === value && styles.chipOn]}>
            <Text style={[styles.chipText, values.category === value && styles.chipTextOn]}>{m.emoji} {m.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.label}>Cost</Text>
      <TextInput style={styles.input} value={values.cost} onChangeText={(t) => set('cost', t)} keyboardType="decimal-pad" placeholderTextColor="#A8A29E" />
      <View style={styles.switchRow}><Text>Must-have</Text><Switch value={values.isMustHave} onValueChange={(v) => set('isMustHave', v)} trackColor={{ true: '#C93862' }} /></View>
      <View style={styles.switchRow}><Text>Packed</Text><Switch value={values.isPacked} onValueChange={(v) => set('isPacked', v)} trackColor={{ true: '#C93862' }} /></View>
      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, { minHeight: 72 }]} multiline value={values.notes} onChangeText={(t) => set('notes', t)} placeholderTextColor="#A8A29E" />
      <View style={styles.actions}>
        {onCancel ? <Pressable onPress={onCancel} style={styles.ghost}><Text style={styles.ghostT}>Cancel</Text></Pressable> : null}
        <Pressable onPress={save} style={styles.btn}><Text style={styles.btnT}>Save</Text></Pressable>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B5E5A', marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A' },
  chips: { gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#EDE6E3', backgroundColor: '#FFF' },
  chipOn: { backgroundColor: '#C93862', borderColor: '#C93862' },
  chipText: { fontSize: 13, color: '#57534E' },
  chipTextOn: { color: '#FFF' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1, backgroundColor: '#C93862', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnT: { color: '#FFF', fontWeight: '700' },
  ghost: { flex: 1, borderWidth: 1, borderColor: '#EDE6E3', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  ghostT: { color: '#6B5E5A', fontWeight: '600' },
  err: { color: '#B91C1C', fontSize: 12 },
});
