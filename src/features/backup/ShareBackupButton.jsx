import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

export default function ShareBackupButton({ onPress, disabled, label = 'Share / save file' }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.btn, (pressed || disabled) && { opacity: 0.7 }]}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  btn: { backgroundColor: '#1A1A1A', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  text: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
