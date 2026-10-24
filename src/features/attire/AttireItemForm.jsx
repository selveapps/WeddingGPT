import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { validateAttireItem, normalizeHex } from './lib/attireValidation';
import { roleOptions } from './lib/attireSelectors';
import { GarmentTypeMeta, AttireStatus } from '../../models/attire';
import StatusPipeline from './StatusPipeline';

const DEFAULTS = {
  title: '', wearerName: '', role: 'other', garmentType: 'other',
  color: '', colorHex: '', brand: '', size: '', cost: '', notes: '',
  rental: false, status: AttireStatus.IDEA, isPrimary: true, occasion: 'ceremony',
};

export default function AttireItemForm({ initial = {}, onSubmit, onCancel, submitLabel = 'Save' }) {
  const [values, setValues] = useState({ ...DEFAULTS, ...initial, cost: initial.cost != null ? String(initial.cost) : '' });
  const [errors, setErrors] = useState({});
  const roles = useMemo(() => roleOptions(), []);
  const garments = useMemo(() => Object.entries(GarmentTypeMeta).map(([value, m]) => ({ value, label: m.label })), []);

  const set = (key, val) => setValues((v) => ({ ...v, [key]: val }));

  const handleSubmit = () => {
    const payload = {
      ...values,
      cost: values.cost === '' ? 0 : Number(values.cost),
      colorHex: normalizeHex(values.colorHex) || values.colorHex || null,
    };
    const result = validateAttireItem(payload);
    setErrors(result.errors);
    if (!result.ok) return;
    onSubmit?.(payload);
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={values.title} onChangeText={(t) => set('title', t)} placeholder="Ceremony gown" placeholderTextColor="#A8A29E" />
      {errors.title ? <Text style={styles.err}>{errors.title}</Text> : null}

      <Text style={styles.label}>Wearer</Text>
      <TextInput style={styles.input} value={values.wearerName} onChangeText={(t) => set('wearerName', t)} placeholder="Name" placeholderTextColor="#A8A29E" />

      <Text style={styles.label}>Role</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {roles.map((r) => (
          <Pressable key={r.value} onPress={() => set('role', r.value)} style={[styles.chip, values.role === r.value && styles.chipOn]}>
            <Text style={[styles.chipText, values.role === r.value && styles.chipTextOn]}>{r.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>Garment</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {garments.map((g) => (
          <Pressable key={g.value} onPress={() => set('garmentType', g.value)} style={[styles.chip, values.garmentType === g.value && styles.chipOn]}>
            <Text style={[styles.chipText, values.garmentType === g.value && styles.chipTextOn]}>{g.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>Status</Text>
      <StatusPipeline current={values.status} onSelect={(s) => set('status', s)} />

      <View style={styles.row2}>
        <View style={styles.col}>
          <Text style={styles.label}>Color</Text>
          <TextInput style={styles.input} value={values.color} onChangeText={(t) => set('color', t)} placeholder="Ivory" placeholderTextColor="#A8A29E" />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Hex</Text>
          <TextInput style={styles.input} value={values.colorHex} onChangeText={(t) => set('colorHex', t)} placeholder="#FFFFF0" placeholderTextColor="#A8A29E" autoCapitalize="characters" />
        </View>
      </View>

      <View style={styles.row2}>
        <View style={styles.col}>
          <Text style={styles.label}>Brand</Text>
          <TextInput style={styles.input} value={values.brand} onChangeText={(t) => set('brand', t)} placeholderTextColor="#A8A29E" />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Size</Text>
          <TextInput style={styles.input} value={values.size} onChangeText={(t) => set('size', t)} placeholderTextColor="#A8A29E" />
        </View>
      </View>

      <Text style={styles.label}>Cost</Text>
      <TextInput style={styles.input} value={values.cost} onChangeText={(t) => set('cost', t)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#A8A29E" />
      {errors.cost ? <Text style={styles.err}>{errors.cost}</Text> : null}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Rental</Text>
        <Switch value={!!values.rental} onValueChange={(v) => set('rental', v)} trackColor={{ true: '#C93862' }} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Primary look</Text>
        <Switch value={!!values.isPrimary} onValueChange={(v) => set('isPrimary', v)} trackColor={{ true: '#C93862' }} />
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.notes]} value={values.notes} onChangeText={(t) => set('notes', t)} multiline placeholderTextColor="#A8A29E" />

      <View style={styles.actions}>
        {onCancel ? <Pressable onPress={onCancel} style={styles.btnGhost}><Text style={styles.btnGhostText}>Cancel</Text></Pressable> : null}
        <Pressable onPress={handleSubmit} style={styles.btn}><Text style={styles.btnText}>{submitLabel}</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B5E5A', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A' },
  notes: { minHeight: 88, textAlignVertical: 'top' },
  chips: { gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3' },
  chipOn: { backgroundColor: '#C93862', borderColor: '#C93862' },
  chipText: { fontSize: 13, color: '#57534E' },
  chipTextOn: { color: '#FFF' },
  row2: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  switchLabel: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  btn: { flex: 1, backgroundColor: '#C93862', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  btnGhost: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EDE6E3' },
  btnGhostText: { color: '#6B5E5A', fontWeight: '600', fontSize: 16 },
  err: { color: '#B91C1C', fontSize: 12, marginTop: 4 },
});
