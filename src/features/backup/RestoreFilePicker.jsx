import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';

/**
 * Paste JSON or trigger external file pick via onPickFile.
 */
export default function RestoreFilePicker({ text, onTextChange, onPickFile }) {
  return (
    <View style={styles.wrap}>
      {onPickFile ? (
        <Pressable onPress={onPickFile} style={styles.pick}>
          <Text style={styles.pickText}>Choose backup file…</Text>
        </Pressable>
      ) : null}
      <Text style={styles.label}>Or paste backup JSON</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={onTextChange}
        multiline
        placeholder='{"format":"weddinggpt-backup",...}'
        placeholderTextColor="#A8A29E"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: 10 },
  pick: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  pickText: { fontWeight: '600', color: '#C93862' },
  label: { fontSize: 13, fontWeight: '600', color: '#6B5E5A' },
  input: {
    minHeight: 120, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3', borderRadius: 12,
    padding: 12, fontSize: 12, fontFamily: 'monospace', color: '#1A1A1A', textAlignVertical: 'top',
  },
});
