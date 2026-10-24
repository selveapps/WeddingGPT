import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function BackupLabelInput({ value, onChange, placeholder = 'e.g. Before vendor deposits' }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Label (optional)</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#A8A29E"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B5E5A', marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A' },
});
