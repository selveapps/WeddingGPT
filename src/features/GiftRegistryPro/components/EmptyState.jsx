/**
 * EmptyState for GiftRegistryPro
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
export default function EmptyState({ title, message, onAction, actionLabel = 'Add' }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}><Text style={styles.icon}>📋</Text></View>
      <Text style={styles.title}>{title || 'Nothing here yet'}</Text>
      <Text style={styles.message}>{message || 'Get started by adding your first GiftRegistryPro item.'}</Text>
      {onAction ? <TouchableOpacity style={styles.button} onPress={onAction}><Text style={styles.buttonText}>{actionLabel}</Text></TouchableOpacity> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  icon: { fontSize: 32 }, title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  message: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  button: { backgroundColor: '#8B5CF6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
