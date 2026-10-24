import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
import { validateFitting } from './lib/attireValidation';
import { FittingStatusMeta } from '../../models/attire';

export default function FittingForm({ initial = {}, items = [], onSubmit, onCancel }) {
  const [values, setValues] = useState({
    attireItemId: '', status: 'scheduled', scheduledAt: '', location: '', tailorName: '', notes: '',
    ...initial,
    scheduledAt: initial.scheduledAt ? String(initial.scheduledAt).slice(0, 16) : '',
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const save = () => {
    const payload = { ...values, scheduledAt: values.scheduledAt || null };
    const r = validateFitting(payload);
    setErrors(r.errors);
    if (!r.ok) return;
    onSubmit?.(payload);
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Outfit</Text>
      <ScrollView horizontal contentContainerStyle={styles.chips}>
        {items.map((it) => (
          <Pressable key={it.id} onPress={() => set('attireItemId', it.id)} style={[styles.chip, values.attireItemId === it.id && styles.chipOn]}>
            <Text style={[styles.chipText, values.attireItemId === it.id && styles.chipTextOn]}>{it.title || it.wearerName || it.id}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {errors.attireItemId ? <Text style={styles.err}>{errors.attireItemId}</Text> : null}

      <Text style={styles.label}>Status</Text>
      <ScrollView horizontal contentContainerStyle={styles.chips}>
        {Object.entries(FittingStatusMeta).map(([value, m]) => (
          <Pressable key={value} onPress={() => set('status', value)} style={[styles.chip, values.status === value && styles.chipOn]}>
            <Text style={[styles.chipText, values.status === value && styles.chipTextOn]}>{m.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>When (ISO / local input)</Text>
      <TextInput style={styles.input} value={values.scheduledAt} onChangeText={(t) => set('scheduledAt', t)} placeholder="2026-11-01T14:00" placeholderTextColor="#A8A29E" />
      {errors.scheduledAt ? <Text style={styles.err}>{errors.scheduledAt}</Text> : null}

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={values.location} onChangeText={(t) => set('location', t)} placeholderTextColor="#A8A29E" />
      <Text style={styles.label}>Tailor / contact</Text>
      <TextInput style={styles.input} value={values.tailorName} onChangeText={(t) => set('tailorName', t)} placeholderTextColor="#A8A29E" />
      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, { minHeight: 80 }]} multiline value={values.notes} onChangeText={(t) => set('notes', t)} placeholderTextColor="#A8A29E" />

      <View style={styles.actions}>
        {onCancel ? <Pressable onPress={onCancel} style={styles.ghost}><Text style={styles.ghostT}>Cancel</Text></Pressable> : null}
        <Pressable onPress={save} style={styles.btn}><Text style={styles.btnT}>Save fitting</Text></Pressable>
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
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1, backgroundColor: '#C93862', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnT: { color: '#FFF', fontWeight: '700' },
  ghost: { flex: 1, borderWidth: 1, borderColor: '#EDE6E3', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  ghostT: { color: '#6B5E5A', fontWeight: '600' },
  err: { color: '#B91C1C', fontSize: 12, marginTop: 4 },
});
