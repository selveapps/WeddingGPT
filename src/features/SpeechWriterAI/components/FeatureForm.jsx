/**
 * SpeechWriterAI FeatureForm
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import useSpeechWriterAI from '../hooks/useFeature';
import { SPEECHWRITERAI_STATUSES, SPEECHWRITERAI_PRIORITIES, SPEECHWRITERAI_CATEGORIES } from '../constants';
import { sanitizeSpeechWriterAIInput } from '../validators';

export default function FeatureForm({ initialValues, onSuccess, onCancel, mode = 'create' }) {
  const { addItem, updateItem, loading, error, clearError } = useSpeechWriterAI();
  const [form, setForm] = useState({ name: '', description: '', status: 'pending', priority: 3, budget: '', notes: '', category: 'General', ...initialValues });
  const [localError, setLocalError] = useState(null);
  useEffect(() => { if (initialValues) setForm((p) => ({ ...p, ...initialValues })); }, [initialValues]);
  const updateField = (key, value) => { setForm((p) => ({ ...p, [key]: value })); setLocalError(null); clearError(); };
  const handleSubmit = async () => {
    if (!form.name || form.name.trim().length < 2) { setLocalError('Name required (min 2 chars)'); return; }
    const payload = sanitizeSpeechWriterAIInput({ ...form, budget: form.budget === '' ? undefined : Number(form.budget), priority: Number(form.priority) || 3 });
    try {
      let result;
      if (mode === 'edit' && initialValues?.id) result = await updateItem(initialValues.id, payload);
      else result = await addItem(payload);
      if (result) onSuccess?.(result);
    } catch (e) { setLocalError(e.message || 'Save failed'); }
  };
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>{mode === 'edit' ? 'Edit' : 'New'} SpeechWriterAI</Text>
      {(localError || error) ? <Text style={styles.error}>{localError || error}</Text> : null}
      <Text style={styles.label}>Name *</Text>
      <TextInput style={styles.input} value={form.name} onChangeText={(v) => updateField('name', v)} placeholder="Enter name" placeholderTextColor="#9CA3AF" />
      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textarea]} value={form.description} onChangeText={(v) => updateField('description', v)} placeholder="Description..." placeholderTextColor="#9CA3AF" multiline numberOfLines={4} />
      <Text style={styles.label}>Status</Text>
      <View style={styles.chipRow}>
        {SPEECHWRITERAI_STATUSES.map((s) => (
          <TouchableOpacity key={s.value} style={[styles.chip, form.status === s.value && { backgroundColor: s.color, borderColor: s.color }]} onPress={() => updateField('status', s.value)}>
            <Text style={[styles.chipText, form.status === s.value && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Priority</Text>
      <View style={styles.chipRow}>
        {SPEECHWRITERAI_PRIORITIES.map((p) => (
          <TouchableOpacity key={p.value} style={[styles.chip, form.priority === p.value && { backgroundColor: p.color, borderColor: p.color }]} onPress={() => updateField('priority', p.value)}>
            <Text style={[styles.chipText, form.priority === p.value && styles.chipTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Budget</Text>
      <TextInput style={styles.input} value={String(form.budget ?? '')} onChangeText={(v) => updateField('budget', v.replace(/[^0-9.]/g, ''))} placeholder="0.00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.textarea]} value={form.notes} onChangeText={(v) => updateField('notes', v)} placeholder="Notes..." placeholderTextColor="#9CA3AF" multiline numberOfLines={3} />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{mode === 'edit' ? 'Update' : 'Create'}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' }, content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 }, error: { color: '#EF4444', marginBottom: 12, fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  textarea: { minHeight: 90, textAlignVertical: 'top' }, chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  chipText: { fontSize: 12, color: '#4B5563', fontWeight: '500' }, chipTextActive: { color: '#fff' },
  actions: { flexDirection: 'row', marginTop: 24, gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#fff' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#8B5CF6', alignItems: 'center' },
  submitText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
