/** ParkingValetBrief FeatureForm */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import useParkingValetBrief from '../hooks/useFeature';
import { STATUSES } from '../constants';
import { sanitize } from '../validators';
export default function FeatureForm({ initialValues, onSuccess, onCancel, mode = 'create' }) {
  const { addItem, updateItem, loading, error, clearError } = useParkingValetBrief();
  const [form, setForm] = useState({ name: '', description: '', status: 'pending', priority: 3, budget: '', notes: '', ...initialValues });
  const [localErr, setLocalErr] = useState(null);
  useEffect(() => { if (initialValues) setForm((p) => ({ ...p, ...initialValues })); }, [initialValues]);
  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setLocalErr(null); clearError?.(); };
  const submit = async () => { if (!form.name || form.name.trim().length < 2) { setLocalErr('Name required'); return; } const payload = sanitize({ ...form, budget: form.budget === '' ? undefined : Number(form.budget), priority: Number(form.priority) || 3 }); try { const r = mode === 'edit' && initialValues?.id ? await updateItem(initialValues.id, payload) : await addItem(payload); if (r) onSuccess?.(r); } catch (e) { setLocalErr(e.message || 'Failed'); } };
  return (
    <ScrollView style={s.wrap} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.h}>{mode === 'edit' ? 'Edit' : 'New'} ParkingValetBrief</Text>
      {(localErr || error) ? <Text style={s.err}>{localErr || error}</Text> : null}
      <Text style={s.label}>Name *</Text>
      <TextInput style={s.input} value={form.name} onChangeText={(v) => set('name', v)} placeholder="Name" placeholderTextColor="#9CA3AF" />
      <Text style={s.label}>Description</Text>
      <TextInput style={[s.input, s.area]} value={form.description} onChangeText={(v) => set('description', v)} placeholder="Description" placeholderTextColor="#9CA3AF" multiline />
      <Text style={s.label}>Status</Text>
      <View style={s.chips}>{STATUSES.map((x) => (<TouchableOpacity key={x.value} style={[s.chip, form.status === x.value && { backgroundColor: x.color, borderColor: x.color }]} onPress={() => set('status', x.value)}><Text style={[s.chipT, form.status === x.value && { color: '#fff' }]}>{x.label}</Text></TouchableOpacity>))}</View>
      <Text style={s.label}>Budget</Text>
      <TextInput style={s.input} value={String(form.budget ?? '')} onChangeText={(v) => set('budget', v.replace(/[^0-9.]/g, ''))} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor="#9CA3AF" />
      <Text style={s.label}>Notes</Text>
      <TextInput style={[s.input, s.area]} value={form.notes} onChangeText={(v) => set('notes', v)} placeholder="Notes" placeholderTextColor="#9CA3AF" multiline />
      <View style={s.actions}>
        <TouchableOpacity style={s.cancel} onPress={onCancel} disabled={loading}><Text style={s.cancelT}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={s.save} onPress={submit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={s.saveT}>{mode === 'edit' ? 'Update' : 'Create'}</Text>}</TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({ wrap: { flex: 1, backgroundColor: '#F9FAFB' }, content: { padding: 16, paddingBottom: 40 }, h: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 }, err: { color: '#EF4444', marginBottom: 10, fontSize: 13 }, label: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 10 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' }, area: { minHeight: 80, textAlignVertical: 'top' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' }, chipT: { fontSize: 11, color: '#4B5563', fontWeight: '500' }, actions: { flexDirection: 'row', marginTop: 20, gap: 10 }, cancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#fff' }, cancelT: { fontWeight: '600', color: '#6B7280' }, save: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#8B5CF6', alignItems: 'center' }, saveT: { fontWeight: '600', color: '#fff' } });
