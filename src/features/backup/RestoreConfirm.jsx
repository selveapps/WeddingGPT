import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { confirmPhrase, validateConfirmPhrase } from './lib/backupValidation';

export default function RestoreConfirm({ onConfirm, onCancel, busy }) {
  const [phrase, setPhrase] = useState('');
  const ok = validateConfirmPhrase(phrase);
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Confirm replace</Text>
      <Text style={styles.body}>
        Type {confirmPhrase()} to replace this phone's plan with the backup.
      </Text>
      <TextInput
        style={styles.input}
        value={phrase}
        onChangeText={setPhrase}
        autoCapitalize="characters"
        placeholder={confirmPhrase()}
        placeholderTextColor="#A8A29E"
      />
      <Pressable disabled={!ok || busy} onPress={onConfirm} style={[styles.danger, (!ok || busy) && styles.disabled]}>
        <Text style={styles.dangerText}>{busy ? 'Restoring…' : 'Replace my plan'}</Text>
      </Pressable>
      <Pressable onPress={onCancel} style={styles.cancel}>
        <Text style={styles.cancelText}>Back</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  body: { fontSize: 14, color: '#6B5E5A', lineHeight: 20 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#1A1A1A', letterSpacing: 2 },
  danger: { backgroundColor: '#B91C1C', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  dangerText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.4 },
  cancel: { alignItems: 'center', padding: 8 },
  cancelText: { color: '#6B5E5A', fontWeight: '600' },
});
